declare module 'h3' {
  interface H3EventContext {
    gameId: string
    preview: boolean
  }
}

export default eventHandler(async (event) => {
  const path = event.path
  if (path.startsWith('/files/')) {
    const { playerId, password } = await extractPassword(event)
    const status = await checkAuth(playerId, password)
    if (status !== AuthStatus.Valid) throw authError()
    event.context.playerId = playerId
  }
})
