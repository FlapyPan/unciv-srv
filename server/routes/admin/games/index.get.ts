import prisma from '~/lib/prisma'

export default eventHandler(async (event) => {
  const { skip, take, where } = buildPageQuery(event)
  const [list, total] = await Promise.all([
    prisma.game.findMany({
      skip,
      take,
      where,
      select: { id: true, creatorId: true, updatedAt: true, createdAt: true },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.game.count({ where }),
  ])
  return { list, total }
})
