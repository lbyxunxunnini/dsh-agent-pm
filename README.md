# dsh-agent-pm

Agent PM 的 DeepSeek Harness（DSH）插件版本。

它把 `agent-pm` 技能注册到 DSH 的 `ctx.skills` 宿主层，让每个 agent preset 都能在技能目录里看到并使用它。

## 这是什么

Agent PM 是一个产品经理视角的 agent 项目审查工具。它不审查实现代码，而是审查“写的人以为说清楚了但其实没有”的设计问题：

- Claude Code `SKILL.md` / DSH `<name>/SKILL.md`
- `CLAUDE.md` / `AGENTS.md` / 指令文件
- MCP Server
- DSH 插件（技能包 / 工具 / 事件）

核心约束是 Iron Law：`NO ISSUE REPORT WITHOUT EXECUTION VERIFICATION FIRST`。

## 安装

### 本地目录

```sh
dsh plugin --profile web add /absolute/path/to/dsh-agent-pm
```

### npm（发布后）

```sh
dsh plugin --profile web add dsh-agent-pm
```

### GitHub（发布后）

```sh
dsh plugin --profile web add github:lbyxunxunnini/dsh-agent-pm
```

安装后启动对应的 profile：

```sh
dsh --profile web
```

## 使用

在 DSH 会话里直接说：

```text
用 agent-pm 审查这个项目
```

也可以在技能目录中选择 `agent-pm`。如果宿主支持斜杠命令，可以使用：

```text
/agent-pm [path] [--score]
```

常用组合：

- `审查并评分` → 审查后进入产品评分
- `只评分` → 直接进入产品评审
- `修复后评分` → 先修复已确认问题，再评分
- `创建新 skill` → 进入需求澄清模式

## 审查模式

| 模式 | 作用 |
|------|------|
| A：审阅 | 按 checklist 做技术审查，输出问题报告 |
| B：修复 | 修复已确认的 accepted 问题 |
| C：新 Skill 澄清 | 在生成 SKILL.md 之前闭环目标、边界、流程和验收 |
| D：产品评审 / 评分 | 三方评估、维度评分、目标治理分析 |

DSH 插件额外读取 `skills/agent-pm/references/dsh-plugin-review.md`，检查插件清单、`ctx` 注册、资源路径和版本兼容声明。

## 目录结构

```text
dsh-agent-pm/
├── package.json          # dsh.bundle 清单
├── cordis.patch.yml      # 插入技能提供者
├── lib/index.js          # ctx.skills 提供者
├── skills/agent-pm/
│   ├── SKILL.md
│   └── references/       # 审查清单、模式、示例、DSH 专项清单
└── scripts/verify.mjs    # 静态 + provider 级检查
```

## 版本

| 层 | 版本 |
|----|------|
| 插件 | `0.1.0` |
| 技能内容 | 基于 `agent-pm` `3.0.11` |

插件面向 DSH `0.2.1-rc.2` 编写。DSH 目前是开发者预览，后续版本可能有破坏性变更；安装前请先核对版本。

> 当前状态：已在隔离的 `DSH_HOME` 中用 DSH `0.2.1-rc.2` 完成安装、技能发现、正文加载和卸载验证；未在 Web UI 中做人工触发验证。首次实测步骤见下节。

## 验证

```sh
npm run verify
```

该命令不会启动 DSH，而是用最小 `ctx` stub 调用插件注册的 provider，验证：

- 插件只注册一个 provider
- `skills/agent-pm/SKILL.md` 能被发现
- 多行 `description: |-` 能被正确解析
- `get()` 能加载正文并返回目录型 `resourceBase`

真实 DSH 验证建议使用隔离的 `DSH_HOME`：

```sh
export DSH_HOME=/tmp/dsh-agent-pm-test
dsh plugin --profile test add /absolute/path/to/dsh-agent-pm
dsh --profile test --dump-config
dsh --profile test
```

确认技能目录出现 `agent-pm` 后，再卸载并确认技能消失。

## License

MIT
