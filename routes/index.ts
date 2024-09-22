import { format } from 'bytes'

export default eventHandler((event) => {
  const cpuUsage = process.cpuUsage()
  const { rss, heapTotal, heapUsed, external } = process.memoryUsage()
  return {
    cpuUsage,
    memoryUsage: {
      rss: format(rss),
      heapTotal: format(heapTotal),
      heapUsed: format(heapUsed),
      external: format(external),
    },
  }
})
