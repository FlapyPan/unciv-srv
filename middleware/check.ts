export default eventHandler((event) => {
  const { method } = event
  const { pathname } = getRequestURL(event)
  consola.info(method, pathname)
  if (!pathname.startsWith(`/files/`)) {
    return
  }
  if (!getHeader(event, `User-Agent`)?.startsWith(`Unciv`)) {
    throw createError({ status: 401, message: `Please use the game client to access` })
  }
})
