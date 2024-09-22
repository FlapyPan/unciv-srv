export default eventHandler(async (event) => {
  const gameId = getRouterParam(event, `gameId`)
  const file = await readRawBody(event, `utf-8`)
  const storage = useStorage(`files`)
  await storage.setItem(`files:${gameId}`, file)
  return gameId
})
