# 快速开始

> 30 秒了解 agent-pm，5 分钟上手使用。

## agent-pm 是什么

一个 AI 产品经理型审查工具，帮你检查 Claude Code / DeepSeek Harness（DSH）agent 项目的设计质量。不是代码审查员，是产品经理视角——关注"写的人以为说清楚了但其实没有"的问题。

在 DSH 中，可以直接说“用 agent-pm 审查这个项目”，或通过技能目录加载 `agent-pm`；如果宿主支持斜杠命令，也可以使用 `/agent-pm`。

## 四种用法

| 用法 | 触发方式 | 说明 |
|------|---------|------|
| 审查项目 | `/agent-pm /path/to/project` | 扫描项目，输出问题报告 |
| 修复问题 | 审查后选择"修复" | 自动修复已确认的问题 |
| 产品评分 | `/agent-pm /path/to/project --score` 或 `产品评分` | 独立进入产品评审，做三方评估和多维度打分 |
| 创建新 Skill | `/agent-pm --new` | 澄清需求，生成方案 |

## 审查流程一览

```
输入路径 → 自动扫描 → 报告问题 → 确认修复 → 产品评审
   │           │           │           │           │
   ▼           ▼           ▼           ▼           ▼
 模式选择    9 维度检查   P0-P3 分级  逐个修复    三方评估
```

## 第一次用？从这里开始

### 我只想快速看结果

```
/agent-pm /path/to/your/project
```

全程自动，不需要额外操作。审查完成后会问你是否继续产品评审。

### 我想了解审查维度

审查基于 9 个维度：

1. **指令层** — 角色定义、边界、约束是否清晰
2. **工具层** — tool 设计是否合理
3. **工作流层** — 流程是否完整、有无死路
4. **逻辑正确性** — 判断、数据流、时序是否正确
5. **设计质量** — 是否简洁、无冗余
6. **输出层** — 输出格式和质量
7. **用户交互层** — 交互体验
8. **最佳实践** — 成熟设计模式
9. **目标治理层** — 评估反馈、迭代循环

### 我想看一份审查报告示例

→ [examples/example-review-output.md](examples/example-review-output.md)

### 我想了解产品评审的评分标准

→ [extended/rubric-scoring.md](extended/rubric-scoring.md)

## 常见场景

| 场景 | 推荐路径 |
|------|---------|
| 刚写完一个 Skill，想检查质量 | `/agent-pm` 直接审查 |
| 审查出了问题，想自动修复 | 审查后选择"修复" |
| 只想评分，不审查 | `/agent-pm --score` 或说"产品评分" |
| 想创建一个新 Skill | `/agent-pm --new`，先做需求澄清 |
| 想了解评分标准 | 读 `rubric-scoring.md` |
| 想看完整审查流程 | 读 `mode-a.md` |
| 想看评分流程 | 读 `mode-d.md` |

## 文件导航

| 文件 | 用途 | 何时读 |
|------|------|--------|
| `SKILL.md` | 主入口，核心原则 | 首次了解 |
| `references/quick-start.md` | 快速开始（本文件） | 首次使用 |
| `references/faq.md` | 常见问题 | 遇到问题时 |
| `references/checklist.md` | 审查清单 | 想了解审查维度 |
| `references/mode-a.md` | 技术审查流程 | 想了解审查细节 |
| `references/mode-b.md` | 修复验证流程 | 想了解修复细节 |
| `references/mode-c.md` | 新 Skill 创建流程 | 想创建新 Skill |
| `references/mode-d.md` | 产品评审流程 | 想做或了解产品评分 |
| `references/report-templates.md` | 报告模板 | 想了解输出格式 |
| `references/extended/rubric-scoring.md` | 评分标准 | 想了解评分细节 |
| `references/examples/` | 完整示例 | 想看实际案例 |
