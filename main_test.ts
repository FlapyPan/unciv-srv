import { assertEquals } from '@std/assert'
import { Database } from '@db/sqlite'
import { app } from './main.ts'

Deno.test('Database CRUD', () => {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    )`)
  const gameId = '00000000-0000-0000-0000-000000000001'
  db.prepare('INSERT OR REPLACE INTO files (id, data) VALUES (?, ?)').value(
    gameId,
    'test data',
  )
  const result = db.prepare('SELECT data FROM files WHERE id = ?').value<
    string[]
  >(gameId)
  assertEquals(result?.[0], 'test data')
  db.prepare('DELETE FROM files WHERE id = ?').value(gameId)
  const result2 = db.prepare('SELECT data FROM files WHERE id = ?').value(
    gameId,
  )
  assertEquals(result2, undefined)
})

Deno.test('GET / should return memory info', async () => {
  const request = new Request('http://localhost:3000/')
  const response = await app.handle(request)
  const body = await response?.json()
  assertEquals(typeof body.systemMemoryInfo.total, 'string')
})

Deno.test('GET /isalive should return true', async () => {
  const request = new Request('http://localhost:3000/isalive')
  const response = await app.handle(request)
  const body = await response?.text()
  assertEquals(body, 'true')
})

Deno.test('GET /files/:gameId should return 400 if user agent is invalid', async () => {
  const gameId = '00000000-0000-0000-0000-000000000000'
  const request = new Request(`http://localhost:3000/files/${gameId}`)
  request.headers.set('user-agent', 'not-unciv')
  const response = await app.handle(request)
  const body = await response?.json()
  assertEquals(body.message, 'Invalid user agent')
})

Deno.test('POST /files/:gameId should insert file data', async () => {
  const gameId = '00000000-0000-0000-0000-000000000000'
  const request = new Request(`http://localhost:3000/files/${gameId}`, {
    method: 'POST',
    headers: { 'user-agent': 'Unciv', 'Content-Type': 'text/plain' },
    body: 'test data',
  })
  const response = await app.handle(request)
  const body = await response?.text()
  assertEquals(response?.status, 200)
  assertEquals(body, 'test data')
})

Deno.test('GET /files/:gameId should return file data', async () => {
  const gameId = '00000000-0000-0000-0000-000000000000'
  const request = new Request(`http://localhost:3000/files/${gameId}`)
  request.headers.set('user-agent', 'Unciv')
  const response = await app.handle(request)
  const body = await response?.text()
  assertEquals(typeof body, 'string')
})

Deno.test('DELETE /files/:gameId should delete file data', async () => {
  const gameId = '00000000-0000-0000-0000-000000000000'
  const request = new Request(`http://localhost:3000/files/${gameId}`, {
    method: 'DELETE',
  })
  request.headers.set('user-agent', 'Unciv')
  const response = await app.handle(request)
  assertEquals(response?.status, 200)
})
