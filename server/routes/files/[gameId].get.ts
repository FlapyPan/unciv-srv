import prisma from '~/lib/prisma'
import { LogOp } from '@prisma/client'

export default eventHandler(async (event) => {
  const { ip, ua, playerId } = event.context
  const { gameId, preview } = getGameId(event)
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { file: !preview, preview: preview },
  })
  if (!game) throw createError({ statusCode: 404, statusMessage: 'Game not found' })
  if (preview) {
    return encodeFile(game.preview)
  }
  prisma.log.create({ data: { playerId, gameId, ip, ua, op: LogOp.READ } }).catch(console.error)
  return encodeFile(game.file)
})
