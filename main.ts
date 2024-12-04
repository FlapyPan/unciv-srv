import { Application, Router } from '@oak/oak'
import { type levellike, Logger } from '@libs/logger'

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

const router = new Router()

router.get('/', (ctx) => {
  ctx.response.body = `<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Unciv Srv</title>
  </head>
  <body>
    <p>Unciv Srv 正在运行中</p>
    <p><a href="/status" target="_blank">服务器状态</a></p>
    <p><a href="https://github.com/FlapyPan/unciv-srv" target="_blank">项目地址</a></p>
  </body>
</html>`
})

router.get('/status', (ctx) => {
  const loadAvg = Deno.loadavg()
  const memoryUsage = Deno.memoryUsage()
  const version = Deno.version
  ctx.response.body = {
    version,
    loadAverages: {
      one: loadAvg[0].toFixed(2),
      five: loadAvg[1].toFixed(2),
      fifteen: loadAvg[2].toFixed(2),
    },
    memoryUsage: {
      external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    },
  }
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
  Deno.addSignalListener('SIGINT', () => {
    log.info('Shutting down...')
    Deno.exit()
  })
  app.listen({ port: PORT })
  log.info(`Data store path: ${DATA_PATH}`)
  log.info(`Listening on port: ${PORT}`)
}
