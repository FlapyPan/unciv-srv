export default eventHandler(async (event) => {
  const gameId = getRouterParam(event, `gameId`)
  consola.info(`Load file, gameId:`, gameId)
  const storage = useStorage(`files`)
  const file = await storage.getItem(`files:${gameId}`)
  if (!file) {
    consola.warn(`File not found, gameId:`, gameId)
    throw createError({ status: 404 })
  }
  consola.debug(file)
  return file
})
