export default eventHandler(async (event) => {
  const gameId = getRouterParam(event, `gameId`)
  consola.info(`Save file, gameId:`, gameId)
  const file = await readRawBody(event, `utf-8`)
  if (!file) {
    consola.warn(`File not found, gameId:`, gameId)
  }
  consola.debug(file)
  const storage = useStorage(`files`)
  await storage.setItem(`files:${gameId}`, file)
  return gameId
})
