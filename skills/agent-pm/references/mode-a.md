# 模式 A：审阅 [Rigid]

验证步骤不可跳过、不可 adapt、不可"看情况"简化。

## Iron Law

```
NO ISSUE REPORT WITHOUT EXECUTION VERIFICATION FIRST
```

如果一个候选问题没有通过 5 步验证（读完上下文、模拟执行、区分层次、区分概念与实现、走完逻辑链），它不得进入报告。

## Red Flags — 审查阶段

| 想法 | 现实 |
|------|------|
| "这个太明显了不用验证" | 越明显越要模拟执行 |
| "我之前见过这个问题" | 每个项目上下文不同，必须重新验证 |
| "这个是 P2 不用报告" | P2 进 backlog，但必须记录 |
| "用户应该知道这个" | 用户不知道，报告它 |
| "读了引文就够了" | 必须通读完整上下文 |
| "这个改动很小不会有连锁影响" | L3 引用检查必须跑 |

## 流程概览

```
收到审查请求
    ↓
Step 1: 读取项目上下文（子 Agent 或串行）
    ↓
Step 1.2: 验证 ProjectContext
    ↓
Step 1.5: 固定 ReviewSpec
    ↓
Step 2: 按清单逐维度扫描
    ↓
Step 2.5: 执行验证（5 步验证）
    ↓
Step 2.8: 跨维度综合发现
    ↓
Step 3: 输出诊断报告
    ↓
Step 4: 交互确认
    ↓
评分意图？→ 是 → 交接模式 D
         → 否 → 询问一次 → 是 → 交接模式 D
                         → 否 → 结束
```

**详细流程图和 ProjectContext 结构**：详见 [extended/mode-a-details.md](extended/mode-a-details.md)

## 阶段一：技术审查（发现模式，必跑）

### Step 1: 读取项目上下文

- 若未指定路径，直接向用户列出两个选项（若宿主提供选择工具，可使用对应工具）：1）审查当前项目 2）输入具体项目路径
- 校验目标路径：目录是否存在、是否为空、是否有可识别的配置文件
- 识别项目类型（按优先级）：存在 `package.json` 且含 `dsh` 字段或存在 `cordis.patch.yml` → 按 DSH 插件审查；存在 `SKILL.md` → 按 skill 审查；存在 MCP server 配置 → 按 MCP server 审查；存在 `CLAUDE.md` / `AGENTS.md` → 按指令文件审查
- 若存在 [issue-ledger.md](issue-ledger.md)，先读取历史 issue 状态；已 `fixed` / `rejected` 的问题不得重复报告
- 检查项目的 `references/archive/` 目录是否存在自诊断文档

#### Step 1.1: 子 Agent 读取（推荐）或串行读取（降级）

**优先使用子 Agent 读取**，将读取任务委托给独立的子 Agent，避免主线程上下文膨胀。

**子 Agent 任务定义**：

```
你的任务是读取目标项目并生成 ProjectContext 结构化结果。

1. 读取项目中所有相关文件
2. 生成 ProjectContext，包含：project_type、files、workflow、decision_points、constraints
3. 对措辞敏感检查项做预判，写入 preliminary_findings
```

**子 Agent 不可用时**，执行串行读取（最多读 8 个核心文件）。

### Step 1.2: 验证 ProjectContext（必须完成才能进入扫描）

验证子 Agent 输出的 ProjectContext 是否完整：

- [ ] `project_type` 已填写且正确
- [ ] `files` 列表覆盖了项目的核心文件
- [ ] `workflow` 描述了从输入到输出的完整路径
- [ ] `decision_points` 覆盖了主要分支节点
- [ ] `constraints` 列出了项目明确声明的限制
- [ ] `preliminary_findings` 已填写

**输出理解摘要**（从 ProjectContext 提取）：
- 这个 agent 是干嘛的（一句话）
- 核心工作流（2-4 步）
- 关键文件和各自职责
- 主要的判断/分支节点

### Step 1.5: 固定 ReviewSpec

- 在扫描前生成本轮 `ReviewSpec`，并在报告开头展示
- `ReviewSpec` 至少包含：project_type、enabled_dimensions、excluded_dimensions、max_findings、severity_threshold、mode: discovery
- 同一轮修复和验证必须沿用该 `ReviewSpec`

### Step 2: 按清单逐维度扫描

基于 `ProjectContext.preliminary_findings` 做扫描，**不再回读原文件**。

**扫描规则**：

| preliminary_findings.status | 处理方式 |
|---------------------------|---------|
| `pass` | 跳过，不纳入候选问题 |
| `warn` | 二次确认：基于 evidence 和 quote 判断是否为真实问题 |
| `fail` | 直接纳入候选问题 |

**扫描流程**：
1. 加载 [checklist.md](checklist.md) 中的审查清单
2. 按"各类型审查重点"映射表确定本次必检/选检维度
3. 遍历 `preliminary_findings`，按上述规则处理
4. 每轮最多输出 `ReviewSpec.max_findings` 个问题，优先级为 P0 > P1 > P2 > P3

### Step 2.5: 执行验证（每个候选问题必过）

扫描发现的每个候选问题，在进入报告前必须通过执行验证。**不过验证的问题不得进入报告。**

**验证方法**——对每个候选问题执行以下检查（按顺序，命中任一淘汰条件即丢弃）：

1. **读完上下文**：找到问题涉及的所有相关段落，通读完整上下文
2. **模拟执行**：用一个具体输入走完整执行路径，观察实际行为
3. **区分层次**：确认问题是功能逻辑 bug，还是工具覆盖度/文档表述精度/设计决策偏好
4. **区分概念与实现**：确认实现是否为概念的合理近似
5. **走完逻辑链**：模拟完整的状态流转

每个候选问题必须附上验证过程摘要。

### Step 2.8: 跨维度综合发现（写报告前的整体思考）

在所有维度扫描完成后，回答以下问题：
1. 这些发现之间有没有共同根因？
2. 有没有一个发现修复后能让其他发现自然消失或降级？
3. 有没有与项目自诊断文档不一致的地方？

### Step 3: 输出诊断报告

报告格式见 [report-templates.md](report-templates.md) 的"技术审查报告"模板。

### Step 4: 交互确认

- 输出完整审查报告后，询问用户："要逐个确认并修改吗？"
- 用户确认后，逐个问题与用户确认
- 用户确认的问题标记为 `accepted`；用户拒绝的问题标记为 `rejected`
- 只有 `accepted` 的 P0/P1 默认进入修复模式

## 降级策略

当子 Agent 不可用时，执行串行读取：

- **最多读 8 个核心文件**（按优先级：入口文件 > 主指令文件 > reference 文件 > 配置文件）
- 读完立即生成 ProjectContext + preliminary_findings
- **后续阶段不再回读**，只用这个结构化结果

**详细降级策略**：详见 [extended/mode-a-details.md](extended/mode-a-details.md)

## 阶段二：产品评审交接（交接到模式 D）

产品评审不再是模式 A 的内部阶段，而是独立的一等模式 D。技术审查闭环结束后，按以下规则交接：

### 交接规则

1. **用户最初请求包含"评分/产品评审/打分"关键词**：技术审查交互确认完成后，自动进入 [模式 D](mode-d.md)，无需再次询问
2. **用户最初请求不包含评分关键词**：技术审查交互确认完成后，询问一次："技术审查完成，要继续做产品评审吗？"
   - 用户回答"是/进入评分/打分" → 进入模式 D，**不得重新进入模式 A 做技术审查**
   - 用户回答"否/跳过" → 本轮结束，在 issue-ledger 中标记 `product_review_gate: skipped_by_user`
   - 用户回答"先修复再评分" → 进入模式 B，修复完成后自动交接模式 D
3. **若进入了模式 B**：待修复验证完成后再由模式 B 的 B-Step 7 交接到模式 D

### 交接给模式 D 时传递的信息

- `ProductReviewSpec`：包含 `triggered_by: after_tech_review`、`source_review_id`、`source_snapshot`
- 技术审查的问题清单和状态摘要
- 未修复 P0/P1 列表（如有）

### 拒绝进入 D 的反例

询问"技术审查完成，要继续做产品评审吗？"后，以下表述均视为拒绝，**不得进入 D**：

| 用户表述 | 含义 | 正确处理 |
|---------|------|---------|
| "否" / "跳过" / "不用了" / "先不" / "暂时不需要" | 明确拒绝 | 标记 `skipped_by_user`，本轮结束 |
| "就这样吧" / "结束吧" / "先这样" | 终止本轮 | 同上 |
| "下次再说" / "以后再说" / "晚点再评" | 延后但不是本轮 | 标记 `skipped_by_user`，在 ledger 保留 `pending_action: enter_product_review` |
| "不用评分，直接结束" | 明确跳过评分 | 标记 `skipped_by_user`，本轮结束 |
| "这个项目我觉得不需要评分" | 主观判断不需要 | 确认一次"确定跳过？"，确认后标记 `skipped_by_user` |
| 用户不回应评分询问，转而说其他话题 | 隐式跳过 | 不追问，标记 `skipped_by_user` |

以下表述**不视为拒绝**，需进一步确认：

| 用户表述 | 含义 | 正确处理 |
|---------|------|---------|
| "先存一下报告" | 有前置动作 | 先存报告，再回到评分询问 |
| "我先看看报告再说" | 暂缓 | 标记 `skipped_by_user`，告知"随时可以说'产品评分'进入" |
| "你觉得需要评分吗" | 反问，不是拒绝 | 说明产品评审的价值，再次询问 |
