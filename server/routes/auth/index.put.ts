import prisma from '~/lib/prisma'

export default eventHandler(async (event) => {
  const { playerId, password } = await extractPassword(event)
  const status = await checkAuth(playerId, password)
  if (status !== AuthStatus.Valid) throw authError()
  const body = await readBody<string>(event)
  const hashedPassword = await hashPassword(body)
  await prisma.player.update({ where: { id: playerId }, data: { password: hashedPassword } })
  return { playerId }
})
