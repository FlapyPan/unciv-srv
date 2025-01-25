import prisma from '~/lib/prisma'

export default eventHandler(async (event) => {
  const { gameId } = getGameId(event)
  const game = await prisma.game.delete({ where: { id: gameId } })
  return game.id
})
