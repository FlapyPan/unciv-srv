import prisma from '~/lib/prisma'
import { LogOp } from '@prisma/client'

export default eventHandler(async (event) => {
  const { ip, ua, playerId } = event.context
  const { gameId, preview } = getGameId(event)
  const file = await readBody(event).then(decodeFile)
  const game = await prisma.game.upsert({
    where: { id: gameId },
    update: preview ? { preview: file } : { file },
    create: {
      id: gameId,
      file: preview ? null : file,
      preview: preview ? file : null,
      creator: {
        connect: { id: playerId },
      },
    },
  })
  if (!preview) {
    prisma.log.create({ data: { playerId, gameId, ip, ua, op: LogOp.SAVE } }).catch(console.error)
  }
  return game.id
})
