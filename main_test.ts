import { assertEquals } from '@std/assert'
import { app } from './main.ts'

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
    body: 'test data 123',
  })
  const response = await app.handle(request)
  assertEquals(response?.status, 200)
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
