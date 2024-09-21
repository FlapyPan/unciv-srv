//https://nitro.unjs.io/config
export default defineNitroConfig({
  srcDir: `server`,
  appConfig: {
    name: `UncivSrv`,
    repo: `https://github.com/FlapyPan/unciv-srv`,
  },
  runtimeConfig: {
    storageType: `local`,
    localDataPath: `./data`,
    mongodb_uri: `mongodb://LocaLhost:2701`,
    mongodbDatabase: `unciv-srv`,
  },
})
