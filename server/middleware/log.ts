declare module 'h3' {
  interface H3EventContext {
    ip: string
    ua: string
  }
}

export default eventHandler(async (event) => {
  event.context.ip = getIP(event).join(',')
  event.context.ua = getHeader(event, 'User-Agent') ?? ''
  console.log(event.method, event.path)
})
