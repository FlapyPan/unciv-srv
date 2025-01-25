import Toast, { type PluginOptions, POSITION } from 'vue-toastification'

export default defineNuxtPlugin(({ vueApp }) => {
  vueApp.use(Toast, {
    timeout: 3000,
    draggable: true,
    position: POSITION.TOP_CENTER,
  } as PluginOptions)
})
