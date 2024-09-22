export default eventHandler(async (event) => {
  const gameId = getGameId(event)
  const storage = useStorage(`files`)
  await storage.removeItem(`files:${gameId}`)
  return gameId
})
