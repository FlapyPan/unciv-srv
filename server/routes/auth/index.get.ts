import prisma from '~/lib/prisma'

export default eventHandler(async (event) => {
  const { playerId, password } = await extractPassword(event)
  const status = await checkAuth(playerId, password)
  if (status === AuthStatus.Valid) return playerId
  if (status === AuthStatus.Invalid) throw authError()
  const hashedPassword = await hashPassword(password)
  const player = await prisma.player.create({ data: { id: playerId, password: hashedPassword } })
  return { playerId: player.id }
})
