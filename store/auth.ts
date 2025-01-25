export const useAuthStore = defineStore('auth', () => {
  const info = shallowRef({ playerId: '' })
  const isLogin = shallowRef(false)
  const loginVisible = shallowRef(false)

  const check = async () => {
    const storageData = JSON.parse(localStorage.getItem('auth') || '{}')
    try {
      info.value = await $fetch('/auth/check', {
        headers: {
          Authorization: `Basic ${btoa(`${storageData.playerId}:${storageData.password}`)}`,
        },
      })
      isLogin.value = true
    } catch {
      info.value = { playerId: '' }
      isLogin.value = false
    }
  }

  const login = async (form: { playerId: string, password: string, remember: boolean }) => {
    try {
      info.value = await $fetch(`/auth`, {
        headers: {
          Authorization: `Basic ${btoa(`${form.playerId}:${form.password}`)}`,
        },
      })
      if (form.remember) {
        localStorage.setItem('auth', JSON.stringify(form))
      }
      isLogin.value = true
      createToast().success('登录成功')
    } catch (e: any) {
      isLogin.value = false
      createToast().success(`登录失败 ${e.message}`)
      throw e
    }
  }

  const logout = async () => {
    localStorage.removeItem('auth')
    info.value = { playerId: '' }
    isLogin.value = false
  }

  return {
    info,
    isLogin,
    loginVisible,
    check,
    login,
    logout,
  }
})
