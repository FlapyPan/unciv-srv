export default eventHandler(async (event) => {
  const gameId = getRouterParam(event, `gameId`)
  const storage = useStorage(`files`)
  await storage.removeItem(`files:${gameId}`)
  consola.info(`Delete file, gameId:`, gameId)
  return gameId
})
