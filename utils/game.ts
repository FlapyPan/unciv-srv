import type { EventHandlerRequest, H3Event } from 'h3'

const GAME_ID_REGEX = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}(_Preview)?$/

export const getGameId = (event: H3Event<EventHandlerRequest>) => {
  const gameId = getRouterParam(event, `gameId`)
  if (!GAME_ID_REGEX.test(gameId)) {
    throw createError({ status: 400, message: `Invalid game id` })
  }
  return gameId
}
