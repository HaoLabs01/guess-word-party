import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(path, import.meta.url), "utf8");
}

const readme = read("../README.md");
const agentGuidance = read("../AGENTS.md");
const gameplaySpec = read("../docs/gameplay-spec.md");
const appFlowSpec = read("../docs/app-flow-spec.md");
const review = read("../docs/app-optimization-review.md");

assert.match(readme, /\[游戏玩法验收标准\]\(\.\/docs\/gameplay-spec\.md\)/, "README links the gameplay spec");
assert.match(readme, /\[App 使用流程验收标准\]\(\.\/docs\/app-flow-spec\.md\)/, "README links the app flow spec");
assert.match(readme, /\[App 优化 Review\]\(\.\/docs\/app-optimization-review\.md\)/, "README links the optimization review");

assert.match(agentGuidance, /# Agent 开发准则/, "AGENTS.md provides project-level agent guidance");
for (const phrase of [
  "指哪儿打哪儿",
  "误触率要降到最低",
  "最快看懂玩法",
  "不会错误操作",
  "最高目的",
  "docs/app-flow-spec.md",
  "docs/gameplay-spec.md",
]) {
  assert.match(agentGuidance, new RegExp(phrase), `AGENTS.md includes ${phrase}`);
}

for (const section of ["角色", "手机姿态", "描述规则", "计分规则", "验收标准"]) {
  assert.match(gameplaySpec, new RegExp(`## ${section}`), `gameplay spec includes ${section}`);
}
for (const phrase of [
  "猜词人",
  "描述人",
  "主持/操作者",
  "屏幕朝向猜词人",
  "横屏模式",
  "横着拿，屏幕朝向猜词人",
  "点头=屏幕向下扣=猜对",
  "抬头=屏幕向天翻=跳过",
  "不能说出题面中的字",
  "猜对 +1",
  "跳过不加分",
]) {
  assert.match(gameplaySpec, new RegExp(phrase.replace("+", "\\+")), `gameplay spec defines ${phrase}`);
}

for (const section of ["准备页", "开始前", "倒计时", "游戏中", "结束页", "录像回看", "验收标准"]) {
  assert.match(appFlowSpec, new RegExp(`## ${section}`), `app flow spec includes ${section}`);
}
assert.match(appFlowSpec, /## 最高目标/, "app flow spec defines the highest product goals");
for (const phrase of [
  "指哪儿打哪儿",
  "误触率要降到最低",
  "最快看懂玩法",
  "不会错误操作",
  "开发时候的最高目的",
]) {
  assert.match(appFlowSpec, new RegExp(phrase), `app flow spec defines the goal: ${phrase}`);
}
for (const phrase of [
  "开始后不再弹授权确认",
  "显示模式",
  "横屏模式",
  "开始后锁定",
  "不显示题词",
  "极短提示",
  "题词最大化展示",
  "回到准备页时停止播放",
  "谁在看屏幕",
  "是否允许弹窗",
  "是否允许露题",
]) {
  assert.match(appFlowSpec, new RegExp(phrase), `app flow spec defines ${phrase}`);
}

for (const section of ["必须改", "建议改", "暂不改"]) {
  assert.match(review, new RegExp(`## ${section}`), `optimization review includes ${section}`);
}
assert.match(review, /第一轮执行范围/, "optimization review records the first-round execution scope");

console.log("spec docs passed");
