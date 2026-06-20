# 猜词派对

一个适合聚会玩的中文猜词游戏。一名玩家手持手机猜词，其他玩家看屏幕描述，但不能说出题面里的字。

## 验收标准文档

- [游戏玩法验收标准](./docs/gameplay-spec.md)
- [App 使用流程验收标准](./docs/app-flow-spec.md)
- [App 优化 Review](./docs/app-optimization-review.md)

README 只作为项目入口；玩法和流程优化以 `docs/` 下的验收标准为准。

## 本地运行

```bash
node server.mjs
```

然后打开：

```text
http://127.0.0.1:8787/
```

## 线上预览

https://guess-word-party.vercel.app/
