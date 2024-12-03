import { Database } from '@db/sqlite'
import { Application, Router } from '@oak/oak'
import { type levellike, Logger } from '@libs/logger'

const GAME_ID_REGEX = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}(_Preview)?$/

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
const dbPath = `${DATA_PATH}/db.sqlite`
const db = new Database(dbPath)
db.exec(`
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL
)`)

const router = new Router()

router.get('/', (ctx) => {
  const memoryInfo = Deno.systemMemoryInfo()
  const loadAvg = Deno.loadavg()
  const memoryUsage = Deno.memoryUsage()
  ctx.response.body = {
    systemMemoryInfo: {
      total: `${(memoryInfo.total / 1024 / 1024).toFixed(2)} MB`,
      free: `${(memoryInfo.free / 1024 / 1024).toFixed(2)} MB`,
      available: `${(memoryInfo.available / 1024 / 1024).toFixed(2)} MB`,
      buffers: `${(memoryInfo.buffers / 1024 / 1024).toFixed(2)} MB`,
      cached: `${(memoryInfo.cached / 1024 / 1024).toFixed(2)} MB`,
      swapTotal: `${(memoryInfo.swapTotal / 1024 / 1024).toFixed(2)} MB`,
      swapFree: `${(memoryInfo.swapFree / 1024 / 1024).toFixed(2)} MB`,
    },
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

router.get('/files/:gameId', (ctx) => {
  const gameId = ctx.params.gameId
  const result = db.prepare('SELECT data FROM files WHERE id = ?').get<{ data: string }>(gameId)
  if (!result?.data) {
    ctx.response.status = 404
    ctx.response.body = { message: 'Not found' }
    return
  }
  ctx.response.body = result.data
})

router.delete('/files/:gameId', (ctx) => {
  const gameId = ctx.params.gameId
  db.prepare('DELETE FROM files WHERE id = ?').run(gameId)
  ctx.response.body = gameId
})

router.all('/files/:gameId', async (ctx) => {
  const gameId = ctx.params.gameId
  const body = await ctx.request.body.text()
  if (!body) {
    ctx.response.status = 400
    ctx.response.body = { message: 'Invalid body' }
    return
  }
  db.prepare('INSERT OR REPLACE INTO files (id, data) VALUES (?, ?)').run(gameId, body)
  ctx.response.body = body
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
  app.listen({ port: PORT })
  log.info(`Data store path: ${DATA_PATH}`)
  log.info(`Listening on port: ${PORT}`)
}
