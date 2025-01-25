import prisma from '~/lib/prisma'

export default eventHandler(async (event) => {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)
  const [todayActive, weekActive] = await Promise.all([
    prisma.game.count({
      where: { updatedAt: { gte: todayStart } },
    }),
    prisma.game.count({
      where: { updatedAt: { gte: weekStart } },
    }),
  ])
  return { todayActive, weekActive }
})
