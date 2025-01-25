export const formatDate = (date: Date | string | number) =>
  new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })

export const formatTime = (date: Date | string | number) => new Date(date).toLocaleString('zh-CN')
