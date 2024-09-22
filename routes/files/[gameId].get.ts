export default eventHandler(async (event) => {
  const gameId = getRouterParam(event, `gameId`)
  const storage = useStorage(`files`)
  const file = await storage.getItem(`files:${gameId}`)
  if (!file) {
    throw createError({ status: 404 })
  }
  return file
})
