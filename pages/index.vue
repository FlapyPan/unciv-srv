<script setup lang="ts">
import { useAuthStore } from '~/store/auth'
import { useToast } from 'vue-toastification'
import xlsx from 'json-as-xlsx'

const auth = useAuthStore()
auth.check()

const toast = createToast()

const { data: statusData } = useAsyncData(
  'status',
  () => $fetch('/status'),
  {
    default: () => ({ todayActive: 0, weekActive: 0 }),
  },
)

const gamesKeys = [
  { value: 'id', label: '对局 ID' },
  { value: 'creatorId', label: '创建玩家 ID' },
]
const gamesK = shallowRef(gamesKeys[0].value)
const gamesQ = shallowRef('')
const gamesPage = shallowRef(1)
const gamesPageCount = 10
const gamesSkip = computed(() => (gamesPage.value - 1) * gamesPageCount)
const gamesColumns = [
  { key: 'id', label: '对局 ID' },
  { key: 'creatorId', label: '创建玩家 ID' },
  { key: 'createdAt', label: '创建时间' },
  { key: 'updatedAt', label: '更新时间' },
]
const expand = ref({
  openedRows: [],
  row: {},
})
const { data: gamesRawData, error: gamesError, status: gamesStatus, refresh: gamesRefresh } = useAsyncData(
  'games',
  () => $fetch('/admin/games', {
    params: {
      skip: gamesSkip.value,
      take: gamesPageCount,
      [gamesK.value]: gamesQ.value,
    },
  }),
  {
    default: () => ({ list: [], total: 0 }),
  },
)

const gamesData = computed(() => {
  const { list, total } = gamesRawData.value
  return {
    list: list.map((game) => ({
      ...game,
      createdAt: formatTime(game.createdAt),
      updatedAt: formatTime(game.updatedAt),
    })),
    total,
  }
})

const gamesReset = () => {
  gamesK.value = gamesKeys[0].value
  gamesQ.value = ''
  gamesPage.value = 1
  gamesRefresh()
}
const gamesSearch = () => {
  gamesRefresh()
}

const LogOpMap: Record<string, string> = {
  SAVE: '保存',
  READ: '读取',
}
const changedMap: Record<string, string> = {
  0: '无',
  2: '更换了IP',
  4: '更换了客户端',
  6: '更换了IP和客户端',
}

const downloading = shallowRef(false)
const downloadAnalysisLog = async (gameId: string) => {
  downloading.value = true
  if (!/^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}$/.test(gameId)) {
    toast.error('请输入正确的对局ID')
    return
  }
  try {
    const rawLogs = await $fetch(`/admin/logs/analysis/${gameId}`)
    const logs = rawLogs.map((log) => ({
      ...log,
      op: LogOpMap[log.op] ?? '未知',
      changed: changedMap[log.changed] ?? '未知',
      createdAt: formatTime(log.createdAt),
    }))
    if (!logs.length) {
      toast.error('没有查询到日志')
      downloading.value = false
      return
    }
    const columns = [
      { label: '对局ID', value: 'gameId' },
      { label: '玩家ID', value: 'playerId' },
      { label: '时间', value: 'createdAt' },
      { label: 'IP', value: 'ip' },
      { label: 'UA', value: 'ua' },
      { label: '操作', value: 'op' },
      { label: '异常操作', value: 'changed' },
    ]
    const data = [{ sheet: '所有玩家', columns, content: logs }]
    const groupByPlayer = Object.groupBy(logs, (log) => log.playerId)
    for (const playerId in groupByPlayer) {
      data.push({
        sheet: `${playerId.slice(0, 28)}...`,
        columns,
        content: groupByPlayer[playerId]!,
      })
    }
    xlsx(data, { fileName: `分析日志_${gameId}` })
  } finally {
    downloading.value = false
  }
}
</script>

<template>
  <main>
    <UCard class="mb-3">
      <template #header>
        <div class="flex items-center gap-2">
          <h2 class="text-xl font-bold">状态</h2>
        </div>
      </template>
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2">
          <h3>今日活跃对局数</h3>
          <span class="text-primary">{{ statusData.todayActive }}</span>
        </div>
        <UDivider orientation="vertical" class="h-6" />
        <div class="flex items-center gap-2">
          <h3>本周活跃对局数</h3>
          <span class="text-primary">{{ statusData.weekActive }}</span>
        </div>
      </div>
    </UCard>
    <UCard class="mb-3">
      <template #header>
        <div class="flex items-center gap-2">
          <h2 class="text-xl font-bold">所有对局({{ gamesData.total }})</h2>
        </div>
      </template>
      <div class="flex gap-2 pb-3 border-b border-gray-200 dark:border-gray-700">
        <USelect v-model="gamesK" :options="gamesKeys" option-attribute="label" />
        <UInput class="flex-1" v-model="gamesQ" placeholder="查询..." @keydown.enter="gamesSearch" />
        <UButton @click="gamesSearch">查询</UButton>
        <UButton @click="gamesReset" variant="soft">重置</UButton>
      </div>
      <UTable :rows="gamesData.list"
              :columns="gamesColumns"
              v-model:expand="expand"
              :loading="gamesStatus === 'pending'">
        <template #expand="{ row, index }">
          <div class="p-4">
            <UButton @click="downloadAnalysisLog(row.id)" :loading="downloading">
              下载分析日志
            </UButton>
            <pre class="mt-2">{{ gamesRawData.list[index] }}</pre>
          </div>
        </template>
      </UTable>
      <div class="flex justify-end px-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <UPagination v-model="gamesPage" :page-count="gamesPageCount" :total="gamesData.total" />
      </div>
    </UCard>
  </main>
</template>

<style scoped>

</style>
