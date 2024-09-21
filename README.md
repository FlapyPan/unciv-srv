# UncivSrv

简单的 [Unciv](https://github.com/yairm210/Unciv) 服务器，使用 [Nitro](https://github.com/unjs/nitro) 进行开发。

## 如何运行

请使用 Bun.js。

### 安装依赖

```sh
bun i
```

### 配置

UncivSrc 读取环境变量作为配置，可通过 `.env` 文件进行配置。

[参考配置](example.env)

### 启动

```sh
bun run dev
# 或
bun run build && bun run preview
```
