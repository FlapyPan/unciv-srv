import type { H3Event } from 'h3'

const IP_HEADERS = [
  'X-Forwarded-For',
  'Proxy-Client-IP',
  'WL-Proxy-Client-IP',
  'HTTP_CLIENT_IP',
  'HTTP_X_FORWARDED_FOR',
]

export const getIP = (event: H3Event) => {
  const ipList: string[] = []
  for (const header of IP_HEADERS) {
    const ip = getHeader(event, header)
    if (ip) ipList.push(ip)
  }
  const reqIp = getRequestIP(event)
  if (reqIp) ipList.push(reqIp)
  return ipList
}

export const buildPageQuery = (event: H3Event) => {
  const query = getQuery(event)
  const { skip: _skip, take: _take, ...rest } = query
  const where: any = { AND: [] }
  Object.entries(rest).forEach(([key, value]) => {
    if (value) where.AND.push({ [key]: { contains: value } })
  })
  const skip = Number(_skip) || 0
  const take = Math.min(Number(_take), 100) || 10
  return { skip, take, where }
}
