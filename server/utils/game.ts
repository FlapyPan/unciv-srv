import type { H3Event } from 'h3'
import zlib from 'node:zlib'

const GAME_ID_REGEX = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}(_Preview)?$/

export const getGameId = (event: H3Event) => {
  const gameId = getRouterParam(event, 'gameId') ?? ''
  if (!GAME_ID_REGEX.test(gameId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid game id',
    })
  }
  if (gameId.endsWith('_Preview')) {
    return { gameId: gameId.slice(0, -8), preview: true }
  }
  return { gameId, preview: false }
}

export const decodeFile = async (gameBase64: string | undefined | null) => {
  if (!gameBase64) return null
  try {
    const buffer = Buffer.from(gameBase64, 'base64')
    return new Promise<any>((resolve, reject) => {
      zlib.unzip(buffer, (err, buffer) => {
        if (err) return reject(err)
        resolve(JSON.parse(buffer.toString('utf-8')))
      })
    })
  } catch (err) {
    console.error(err)
    return null
  }
}

export const encodeFile = async (file: any) => {
  if (!file) return null
  try {
    const data = JSON.stringify(file)
    return new Promise<string>((resolve, reject) => {
      zlib.gzip(data, (err, buffer) => {
        if (err) return reject(err)
        resolve(buffer.toString('base64'))
      })
    })
  } catch (err) {
    console.error(err)
    return null
  }
}

export const getHumanPlayers = (game: any): string[] => {
  const players = game?.gameParameters?.players
    ?.filter((p: any) => p.playerType === 'Human')
    ?.map((p: any) => p.playerId)
  return players ?? []
}
