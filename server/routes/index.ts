export default eventHandler((event) => {
  return sendRedirect(event, useAppConfig(event).repo)
})
