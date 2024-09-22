//https://nitro.unjs.io/config
export default defineNitroConfig({
  runtimeConfig: {
    storageType: `local`,
    localDataPath: `./data`,
    mongodb_uri: `mongodb://LocaLhost:2701`,
    mongodbDatabase: `unciv-srv`,
  },
})
