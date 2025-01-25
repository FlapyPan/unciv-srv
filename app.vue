<script setup lang="ts">
import { useAuthStore } from '~/store/auth'
import type { FormError, FormSubmitEvent } from '#ui/types'

const auth = useAuthStore()
auth.check()

const state = reactive({
  username: undefined,
  password: undefined,
  remember: false,
})

const validate = (state: any): FormError[] => {
  const errors = []
  if (!state.username) errors.push({ path: 'username', message: '请输入账号' })
  if (!state.password) errors.push({ path: 'password', message: '请输入密码' })
  return errors
}

const onSubmit = async (event: FormSubmitEvent<any>) => {
  await auth.login(event.data)
  auth.loginVisible = false
}
</script>

<template>
  <div class="container mx-auto p-3">
    <NuxtLayout>
      <UCard class="mb-3">
        <div class=" flex gap-3 items-center">
          <img src="/favicon-96x96.png" class="w-12 h-12 rounded-lg" alt="Unciv Srv">
          <h1 class="text-2xl font-bold hidden md:block">Unciv Srv</h1>
          <div class="flex-1"></div>
          <template v-if="auth.isLogin">
            <span class="font-bold hidden sm:block text-xs">{{ auth.info.playerId }}</span>
            <UButton @click="auth.logout">退出</UButton>
          </template>
          <UButton v-else @click="auth.loginVisible = true">登录</UButton>
        </div>
      </UCard>
      <UModal v-model="auth.loginVisible">
        <UForm :validate="validate" :state="state" class="space-y-4 p-6" @submit="onSubmit">
          <UFormGroup label="用户名" name="username">
            <UInput v-model="state.username" />
          </UFormGroup>
          <UFormGroup label="密码" name="password">
            <UInput v-model="state.password" type="password" />
          </UFormGroup>
          <UFormGroup name="remember">
            <UCheckbox v-model="state.remember" label="记住密码" />
          </UFormGroup>
          <UButton type="submit">
            登录
          </UButton>
        </UForm>
      </UModal>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style lang="postcss">
:root, body {
  @apply bg-white dark:bg-black;
}
</style>
