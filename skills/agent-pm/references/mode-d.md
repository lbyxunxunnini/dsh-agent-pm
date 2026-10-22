# 模式 D：产品评审 / 评分 [Rigid]

产品评审是一个**独立的一等模式**，不是技术审查或修复的附属阶段。用户可以随时直接进入，无需先跑技术审查。

## Iron Law

```
SCORE ONLY WHAT EXISTS — NO FIXING, NO NEW TECHNICAL ISSUES
```

模式 D 只评分，不修复问题、不新增技术 issue、不进入模式 A/B，除非用户明确要求。

## 触发条件

以下任一条件满足时，进入模式 D：

1. **用户显式请求**：消息包含"产品评分""产品评审""打分""综合评级""三方评估""--score""给这个 skill 打分"
2. **模式 A 交接**：技术审查闭环后，用户请求中包含"评分"关键词，或用户对询问回答"是/进入评分/打分"
3. **模式 B 交接**：修复验证完成后，`product_review_gate` 为 `pending_after_fix`，且用户确认进入
4. **issue-ledger 恢复**：上一轮遗留 `pending_action: enter_product_review`，用户说"进入评分"时直接恢复

## 不触发的情况

以下情况**不**进入模式 D：

### 概念混淆类

| 用户表述 | 不触发原因 | 正确处理 |
|---------|-----------|---------|
| "我想了解评分标准" | 询问评分方法，不是触发评分 | 解释 rubric 或指向 [extended/rubric-scoring.md](extended/rubric-scoring.md) |
| "评分标准有哪些" | 同上 | 同上 |
| "怎么评分" / "评分是什么意思" | 询问机制，不是请求执行 | 解释产品评审的流程和维度 |
| "三方评估法是什么" | 询问方法定义 | 解释三方评估法，指向 report-templates.md |
| "rubric 里打分的标准是什么" | 询问文档内容 | 指向 rubric-scoring.md |

### 对象错误类

| 用户表述 | 不触发原因 | 正确处理 |
|---------|-----------|---------|
| "这个修复方案你打几分" | 对象是修复方案，不是产品整体 | 在当前模式内回答，不切换 |
| "你给这个 issue 评个级" | 评估单个问题的 severity，不是产品评审 | 用 P0-P3 分级，不进入 D |
| "综合评级一下这个修复" | 对象是修复结果 | 在模式 B 或验证报告中评估修复质量 |
| "这个维度能打几分"（技术审查中） | 审查过程中对单个维度的讨论 | 在当前上下文回答，不切换模式 |

### 模糊表述类

| 用户表述 | 不触发原因 | 正确处理 |
|---------|-----------|---------|
| "这个项目怎么样" | 模糊评价请求 | 进入模式 A（审查），不是 D |
| "帮我看看这个 skill" | "看看"= 审查 | 进入模式 A |
| "你觉得这个设计好不好" | 设计评价是审查维度 | 进入模式 A |
| "有什么改进空间" | 发现改进点是审查职责 | 进入模式 A（产品评审做的是量化评级，不是列改进点） |

### 缺少目标类

| 用户表述 | 不触发原因 | 正确处理 |
|---------|-----------|---------|
| "给我一个综合评级"（无项目路径，无 ledger 历史） | 缺少评分对象 | 询问：要对哪个项目评分？ |
| "打分"（无上下文，无历史） | 无法确定目标 | 询问目标项目 |
| "产品评审"（无路径） | 同上 | 提供选项：当前项目 / 输入路径 / 从历史恢复 |

### 历史查询类

| 用户表述 | 不触发原因 | 正确处理 |
|---------|-----------|---------|
| "上次评分是多少" / "之前打了几分" | 查询历史记录 | 查找 issue-ledger 中的产品评审状态 |
| "和上次评分比有进步吗" | 对比历史 | 先查找历史评分，再询问是否要做新一轮来对比 |
| "这个项目评过了吗" | 查询状态 | 查 ledger，返回状态摘要 |

### 交接中的歧义类

| 上下文 | 用户表述 | 不触发原因 | 正确处理 |
|--------|---------|-----------|---------|
| 模式 A 询问"继续产品评审？" | "是，但我想先自己看一下报告" | "是，但是…"不能截断 | 等待用户确认，不进入 D |
| 模式 B 询问"继续产品评审？" | "好，不过先存一下报告" | 有前置动作 | 先存报告，再进入 D |
| 模式 B 询问"继续产品评审？" | "先这样吧" | 用户跳过 | 标记 `skipped_by_user`，本轮结束 |
| 任何交接点 | "打分吧，但别修问题了" | 这不是反例——应正确进入 D | 进入 D，`unresolved_blockers_policy: score_current_state` |

## 流程概览

```
收到产品评分请求
    ↓
D-Step 1: 识别目标与恢复上下文
    ↓
D-Step 2: 加载评分所需上下文
    ↓
D-Step 3: 执行产品评审
    ↓
D-Step 4: 输出评审报告
    ↓
D-Step 5: 更新台账
```

## D-Step 1: 识别目标与恢复上下文

### 1a. 确定目标项目

按优先级：
1. 用户消息中指定的路径
2. 上一轮 `ReviewSpec` 中的 `project_path`（从 issue-ledger 恢复）
3. 当前工作目录

### 1b. 恢复上下文

检查 [issue-ledger.md](issue-ledger.md) 中是否存在以下可恢复字段：

- `pending_action: enter_product_review` → 直接恢复，跳过技术审查
- `source_review_id` → 关联到对应技术审查的发现
- `source_project_path` → 目标项目路径
- `last_context_summary` → 上一轮的上下文摘要

**恢复前必须执行完整性校验**，任意一项校验失败则放弃恢复，回退到询问模式：

- [ ] `source_project_path` 指向的目录存在且可读
- [ ] `source_review_id` 对应的 issue 记录仍存在且未被后续操作覆盖
- [ ] `last_context_summary` 非空且包含有效的项目摘要
- [ ] 若 `pending_action: enter_product_review` 存在，其对应的模式 D 上下文（ProductReviewSpec、维度选择）完整

校验失败时的回退行为：
```
无法恢复上一轮的评分上下文，因为 [具体原因]。
你可以：1) 重新指定项目路径进入评分 2) 从头开始技术审查+评分
```

### 1c. 确定 ProductReviewSpec

```yaml
ProductReviewSpec:
  mode: product_review
  target_project: /path/to/project
  triggered_by: explicit_user_request / after_tech_review / after_fix_verification / ledger_resume
  source_review_id: review-xxx  # 如有
  source_snapshot: current / post_fix / historical
  unresolved_blockers_policy: score_current_state / require_fix_first
```

**unresolved_blockers_policy 规则**：
- 默认 `score_current_state`：即使存在未修复 P0/P1，也按当前状态评分，但将未修复问题作为负向证据
- 若用户说"先修复再评分" → 交接模式 B，修复完成后回到 D
- 若用户说"先按当前状态评分" → 直接进入 D-Step 3

## D-Step 2: 加载评分所需上下文

### 2a. 读取项目文件

- 若存在有效的 `source_review_id` 且 `source_snapshot` 为 `post_fix`：读取项目当前状态（已修复后的文件）
- 若为 `explicit_user_request`：读取项目核心文件，获取足够上下文用于评分（不需要完整技术审查级别的深度）
- 最少读取：入口文件 + 主指令文件 + 关键 reference 文件（通常 3-5 个）

**项目文件过多时的处理策略**（按优先级取，满足后停止）：

1. 入口文件（SKILL.md / CLAUDE.md / package.json 等）
2. 主指令文件（核心流程描述）
3. 关键 reference 文件（checklist、report-templates 等），最多 3 个
4. 若仍有重要文件未覆盖 → 在评分报告中标注"未完整读取"，列出未读文件名并说明对评分的影响
5. 子目录中的文件仅在上述文件引用到且评估必需时才读

原则：评分的上下文充分性优先于文件数量限制。宁可多读 2 个关键文件确保评分准确，也不因为硬上限而给出不完整的评分。

### 2b. 加载评分框架

- 加载 [report-templates.md](report-templates.md) 的"产品评审"模板和"价值评定（三方评估法）"
- 加载 [extended/rubric-scoring.md](extended/rubric-scoring.md) 的量化评分 Rubric
- 若存在历史技术审查报告，将其发现作为反方观点的输入参考

### 2c. 加载历史产品评审状态

从 issue-ledger 读取：
- 该项目是否已做过产品评审
- 上次评分结果（如有），用于对比变化

## D-Step 3: 执行产品评审

### 3a. 价值评定（三方评估法）

按 [report-templates.md](report-templates.md) 的三方评估法执行：

1. **支持方**：列出项目优点和独特价值（至少 5 条），每条附具体证据（文件路径:行号）
2. **反方**：列出项目缺点和改进空间（至少 5 条），每条附具体证据和检查类型。反方观点必须聚焦于模型可验证的问题（逻辑正确性、可执行性、一致性、完整性、退出条件、资源消耗），禁止不可验证的批评
3. **综合方**：基于双方观点，对每个维度逐项评分

### 3b. 维度评分

按三层维度框架选择评审维度：

- **第一层（核心维度，必评）**：逻辑闭环性、一致性、清晰度、具体性
- **第二层（工具类型维度）**：根据项目类型（Skill/Agent/MCP Server）选择
- **第三层（场景维度）**：根据项目特点（迭代机制/面向用户/跨项目复用/安全风险/商业价值/面向国内用户）选择

每个维度按 1-5 分评分，必须引用支持方/反方的具体条目编号作为证据。

### 3c. 量化评分

按 [extended/rubric-scoring.md](extended/rubric-scoring.md) 的 Rubric 标准，对每个维度给出量化分数。

总体评分 = 各维度评分的加权平均。

### 3d. 目标治理综合分析

- 统计过程控制规则 vs 目标治理规则的数量和比例
- 判断平衡状态
- 识别最高杠杆改进方向（2-3 个）
- 分析改进依赖关系

### 3e. 发展方向

- 短期（1-2 周）：2-3 个关键动作
- 中期（1-3 月）：2-3 个关键动作
- 长期（3-6 月）：2-3 个关键动作
- 标注依赖关系和前置条件

### 3f. 用户接受策略

- 目标用户定位
- 核心卖点
- 一句话介绍
- 行动清单：目标用户可以做的 5 件事

### 3g. 未修复问题的处理

若项目存在未修复 P0/P1：
- 在评分中作为负向证据引用
- 在"主要短板"中明确指出
- 标注"以下评分基于当前状态，含 X 个未修复 P0/P1"
- 不强制跳回模式 B，除非用户要求

## D-Step 4: 输出评审报告

按 [report-templates.md](report-templates.md) 的"产品评审"模板输出。

输出格式：
```
## 产品评审

### ProductReviewSpec
- mode: product_review
- target_project: /path/to/project
- triggered_by: explicit_user_request / after_tech_review / after_fix_verification
- source_snapshot: current / post_fix
- unresolved_blockers_policy: score_current_state / require_fix_first
- unresolved_issues_in_score: [列出影响评分的未修复问题] / 无

### 价值评定
（三方评估法完整输出）

### 维度评分明细
（表格：维度 | 评分 | 证据引用）

### 总体评分
X.X / 5.0

### 目标治理综合分析
（过程控制 vs 目标治理比例、最高杠杆改进方向、改进依赖关系）

### 发展方向
（短/中/长期路线图）

### 用户接受策略
（定位 + 行动清单）
```

## D-Step 5: 更新台账

- 在 [issue-ledger.md](issue-ledger.md) 中更新产品评审状态为 `completed`
- 清除 `pending_action: enter_product_review`
- 记录评分结果摘要

## 模式 D 的边界

### D 不做的事

- 不执行技术审查（那是模式 A）
- 不修复问题（那是模式 B）
- 不创建新 skill（那是模式 C）
- 不新增技术 issue
- 不进入验证模式

### D 之后的合法转换

- 用户说"修复这些问题" → 进入模式 B（需先确认哪些问题要修）
- 用户说"重新审查" → 进入模式 A
- 用户说"修改后再评一次" → 模式 B 修复 → 回到模式 D
- 其他情况 → 本轮结束

## 降级策略

若无法读取项目文件（路径无效、权限不足等）：
- 若存在历史 `ProductReviewSpec` 和评分结果 → 基于历史数据重新评估
- 若无历史数据 → 告知用户无法评分，需要有效的项目路径
