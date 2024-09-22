import type { Driver } from 'unstorage'
import fsLiteDriver from 'unstorage/drivers/fs-lite'
import mongodbDriver from 'unstorage/drivers/mongodb'

const createStorageDriver = (): Driver => {
  const config = useRuntimeConfig()
  const type = config.storageType || 'local'
  if (type === `mongodb`) {
    const connectionString = config.mongodb_uri || `mongodb://localhost:27017`
    const databaseName = config.mongodbDatabase || `unciv-srv`
    consola.info(`Use MongoDB storage`)
    return mongodbDriver({ connectionString, databaseName, collectionName: `files` })
  }
  if (type !== `local`) {
    consola.warn(`Unknown STORAGE_TYPE: '${type}', use default value: 'local'`)
  }
  const basePath = config.localDataPath || `./data`
  consola.info(`Use local file storage, path:`, basePath)
  return fsLiteDriver({ base: basePath })
}

export default nitroPlugin(() => {
  const storage = useStorage()
  const driver = createStorageDriver()
  storage.mount('files', driver)
})
