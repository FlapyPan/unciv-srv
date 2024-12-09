import { Application, Router } from '@oak/oak'
import { type levellike, Logger } from '@libs/logger'
import { decodeBase64 } from '@std/encoding/base64'

const GAME_ID_REGEX = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}(_Preview)?$/
const MAX_BODY_SIZE = 5 * 1024 * 1024

const PORT = +(Deno.env.get('PORT') || 11451)
const LOG_LEVEL = ['disabled', 'error', 'warn', 'info', 'log', 'debug'].includes(
    Deno.env.get('LOG_LEVEL') || '',
  )
  ? Deno.env.get('LOG_LEVEL') as levellike
  : 'info'

const log = new Logger({
  level: LOG_LEVEL,
  date: true,
  time: true,
  delta: true,
  caller: true,
})

const DATA_PATH = Deno.env.get('DATA_PATH') || './data'
try {
  Deno.statSync(DATA_PATH)
} catch {
  Deno.mkdirSync(DATA_PATH, { recursive: true })
}

const indexPrefix = `<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Unciv Srv</title>
    <style>
      tr td {
        padding: 6px;
      }
    </style>
  </head>
  <body>
  <h2>Unciv Srv 服务器状态</h2>`
const indexAppend = `
  <p><a href="https://github.com/FlapyPan/unciv-srv" target="_blank">项目地址</a></p>
  </body>
</html>`

let indexCache = `${indexPrefix}${indexAppend}`
let latestGamePreview: string | undefined

const getFileCount = async () => {
  let count = 0
  for await (const dirEntry of Deno.readDir(DATA_PATH)) {
    if (dirEntry.isFile && dirEntry.name.endsWith('_Preview')) {
      count += 1
    }
  }
  return count
}

const decodeFile = async (gameId: string | undefined) => {
  if (!gameId) return null
  try {
    const file = await Deno.readTextFile(`${DATA_PATH}/${gameId}`)
    const stream = new Blob([decodeBase64(file)]).stream().pipeThrough(new DecompressionStream('gzip'))
    const response = new Response(stream)
    return await response.json()
  } catch (err) {
    log.error(err)
    return null
  }
}

const flushStatus = async () => {
  const latestGame = await decodeFile(latestGamePreview)
  indexCache = `${indexPrefix}
    <table border="1" cellpadding="0" cellspacing="0">
      <tbody>
        <tr>
          <td>存档数量</td>
          <td colspan="2">${await getFileCount()}</td>
        </tr>
        <tr>
          <td rowspan="4">
            最新存档
            <br>
            ${new Date(latestGame?.currentTurnStartTime).toLocaleString()}
          </td>
          <td>游戏回合</td>
          <td>${latestGame?.turns ?? 0}/${latestGame?.gameParameters?.maxTurns ?? 0}</td>
        </tr>
        <tr>
          <td>基本规则集</td>
          <td>${latestGame?.gameParameters?.baseRuleset ?? '无'}</td>
        </tr>
        <tr>
          <td>游戏难度</td>
          <td>${latestGame?.difficulty ?? '无'}</td>
        </tr>
        <tr>
          <td>胜利方式</td>
          <td>${latestGame?.gameParameters?.victoryTypes?.join('<br>') ?? '无'}</td>
        </tr>
      </tbody>
    </table>
  ${indexAppend}`
}

const router = new Router()

router.get('/', (ctx) => {
  ctx.response.body = indexCache
})

router.all('/isalive', (ctx) => {
  ctx.response.body = 'true'
})

router.get('/files/:gameId', async (ctx) => {
  const gameId = ctx.params.gameId
  const filePath = `${DATA_PATH}/${gameId}`
  try {
    const file = await Deno.readFile(filePath)
    ctx.response.body = file
  } catch {
    ctx.response.status = 404
    ctx.response.body = { message: 'File not found' }
  }
})

router.delete('/files/:gameId', async (ctx) => {
  const gameId = ctx.params.gameId
  const filePath = `${DATA_PATH}/${gameId}`
  try {
    await Deno.remove(filePath)
  } finally {
    ctx.response.body = { message: 'File deleted successfully' }
  }
})

router.all('/files/:gameId', async (ctx) => {
  const gameId = ctx.params.gameId
  const body = await ctx.request.body.arrayBuffer()
  if (!body.byteLength || body.byteLength > MAX_BODY_SIZE) {
    ctx.response.status = 400
    ctx.response.body = { message: 'Invalid body' }
    return
  }
  const filePath = `${DATA_PATH}/${gameId}`
  const content = new Uint8Array(body)
  if (gameId.endsWith('_Preview')) {
    latestGamePreview = gameId
  }
  await Deno.writeFile(filePath, content, { mode: 0o600 })
  ctx.response.body = content
})

export const app = new Application()

app.use(async (ctx, next) => {
  try {
    await next()
    log.info(ctx.request.method, ctx.request.url.pathname, ctx.response.status)
    log.debug(ctx.request.body, ctx.response.body)
    // deno-lint-ignore no-explicit-any
  } catch (err: any) {
    log.error(err)
    ctx.response.status = err.status || 500
    ctx.response.body = { message: err.message || 'Internal Server Error' }
  }
})

app.use((ctx, next) => {
  const path = ctx.request.url.pathname
  if (!path.startsWith('/files/')) {
    return next()
  }
  const ua = ctx.request.headers.get('user-agent')
  if (!ua?.startsWith('Unciv')) {
    ctx.response.status = 400
    ctx.response.body = { message: 'Invalid user agent' }
    return
  }
  return next()
})

app.use((ctx, next) => {
  const path = ctx.request.url.pathname
  if (!path.startsWith('/files/')) {
    return next()
  }
  const gameId = path.match(/^\/files\/([^\/]+)/)?.[1]
  if (!gameId || !GAME_ID_REGEX.test(gameId)) {
    ctx.response.status = 400
    ctx.response.body = { message: 'Invalid game id' }
    return
  }
  return next()
})

app.use(router.routes())
app.use(router.allowedMethods())

if (import.meta.main) {
  const flushStatusInterval = setInterval(flushStatus, 5000)
  Deno.addSignalListener('SIGINT', () => {
    log.info('Shutting down...')
    clearInterval(flushStatusInterval)
    Deno.exit()
  })
  app.listen({ port: PORT })
  log.info(`Data store path: ${DATA_PATH}`)
  log.info(`Listening on port: ${PORT}`)
}
