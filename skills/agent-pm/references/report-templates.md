# 报告模板

## 技术审查报告

```
## 技术审查报告

### ReviewSpec
- project_type: skill / CLAUDE.md / MCP server
- mode: discovery
- enabled_dimensions: [...]
- excluded_dimensions: [...]
- max_findings: 8
- severity_threshold: P1
- product_review_gate: pending_after_tech_review / pending_after_fix / not_requested_in_this_round / completed / skipped_by_user
- product_review_gate_next_action: enter_mode_d / ask_user / none

### [维度名]
- `APM-WORKFLOW-001` **[P1 必须改]** status: open
  - 证据：具体位置和原文/行为
  - 影响：为什么会导致不收敛或错误执行
  - 建议：修改方向
  - 实现提示（可选，复杂改进时填写）：具体的 schema 草案、决策树、落地文件清单、预计工作量等。与"建议"（方向）区分——"建议"回答"往哪改"，"实现提示"回答"怎么改"。维度 9（G-001~G-006）类改进建议必填
  - 验收条件：修复后如何判断通过
```

## 修复计划

```
## 修复计划（共 N 项）

### 必须修复
1. APM-WORKFLOW-001 [P1] 问题描述 → 依赖 APM-SAFETY-002
   - 验收条件：...
2. APM-SAFETY-002 [P0] 问题描述 → 无依赖（先修）
   - 验收条件：...

### Backlog（本轮不阻塞）
4. APM-DESIGN-003 [P2] 问题描述 → status: deferred
5. APM-OUTPUT-004 [P3] 问题描述 → status: deferred

→ 确认修复顺序？(Y/n/调整)
```

## 修复验证报告

```
## 修复验证报告

### ReviewSpec
- mode: verification
- inherited_from: 本轮 discovery ReviewSpec
- product_review_gate: pending_after_fix / completed / skipped_by_user

### 修复结果
- APM-WORKFLOW-001 [P1] —— fixed
  - 验收条件：全部通过
- APM-SAFETY-002 [P0] —— partially_fixed
  - 未通过条件：...
- APM-DESIGN-003 [P2] —— deferred，本轮不阻塞

### 本次 diff 引入的 P0/P1 回归
- 无 / [列出直接由本次修改引入的问题]

### Backlog
- [仅记录 unrelated P2/P3，不阻塞]

### 产品评审交接
- status: pending_after_fix / completed / skipped_by_user
- next_action: enter_mode_d / ask_user / none
- next_prompt: "修复验证完成，要继续做产品评审吗？" / "无"
```

## ProductReviewSpec

```
### ProductReviewSpec
- mode: product_review
- target_project: /path/to/project
- triggered_by: explicit_user_request / after_tech_review / after_fix_verification / ledger_resume
- source_review_id: review-xxx  # 关联的技术审查 ID，独立触发时为 null
- source_snapshot: current / post_fix / historical
- unresolved_blockers_policy: score_current_state / require_fix_first
- unresolved_issues_in_score: [列出影响评分的未修复问题] / 无
```

## 产品评审

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
（三方评估法：支持方 + 反方 + 综合方）

### 维度评分明细
| 维度 | 评分 | 证据引用 |
|------|------|---------|
| [维度 1] | X/5 | 支持方#N、反方#M |
| ... | ... | ... |

### 总体评分
X.X / 5.0（各维度评分的加权平均）

### 目标治理综合分析
（过程控制 vs 目标治理比例、最高杠杆改进方向、改进依赖关系）

### 发展方向
（短/中/长期路线图）

### 用户接受策略
（定位 + 行动清单）
```

### 价值评定（三方评估法）

采用**三方评估法**确保评分客观公正：

1. **支持方**：扮演项目的支持者，列出所有优点和独特价值（至少 5 条）
2. **反方**：扮演项目的批评者，列出所有缺点和改进空间（至少 5 条）
3. **综合方**：基于双方观点，对每个维度逐项评分，给出客观公正的综合评级

#### 评审维度选择

评审维度分为三层，根据被审查项目类型自动选择：

**第一层：核心维度（所有项目必评）**

| 维度 | 说明 | 必评 |
|------|------|------|
| **逻辑闭环性** | 规则之间是否有矛盾、是否有死循环/无限循环风险、退出条件是否完备 | ✅ |
| **一致性** | 文件之间的规则是否一致、术语是否统一、引用是否正确 | ✅ |
| **清晰度** | 指令是否清晰无歧义、边界是否明确 | ✅ |
| **具体性** | 约束是否具体可测量、验收标准是否明确 | ✅ |

**第二层：工具类型维度（按工具类型选择）**

| 工具类型 | 重点维度 |
|---------|---------|
| **Skill** | 指令清晰度、边界明确性、组合性、token 效率 |
| **Agent** | 推理能力、规划能力、工具调用能力、错误恢复 |
| **MCP Server** | Tool schema 正确性、资源管理、安全性、性能 |

**第三层：场景维度（按项目特点选择）**

| 项目特点 | 重点维度 |
|---------|---------|
| **有迭代机制** | Loop 成熟度（评估 + 循环 + 退出条件） |
| **面向用户** | 易用性、文档完整性、错误提示 |
| **跨项目复用** | 可组合性、依赖管理、版本兼容 |
| **有安全风险** | 权限控制、输入验证、敏感数据处理 |
| **有商业价值** | 痛度、差异化、ROI |
| **面向国内用户** | 生态适配性（语言支持、网络依赖、本地化程度） |

#### 反方观点约束

反方观点**必须聚焦于模型可验证的问题**，禁止以下类型的批评：

| 禁止的批评类型 | 原因 | 替代方案 |
|---------------|------|---------|
| "没有实战验证" | 模型无法验证是否在真实场景中用过 | 检查逻辑正确性、边界条件覆盖 |
| "用户是否会遵守" | 模型无法预测用户行为 | 检查规则是否可执行、是否有歧义 |
| "市场反响如何" | 模型无法预测市场 | 检查差异化、痛点是否真实存在 |
| "竞品会怎么反应" | 模型无法预测竞品 | 检查技术壁垒、可替代性 |
| "团队执行力如何" | 模型无法评估团队 | 检查规则是否清晰、是否有歧义 |

**反方应该检查的内容**：

| 检查类型 | 说明 |
|---------|------|
| **逻辑正确性** | 规则之间是否有矛盾、是否有死循环风险 |
| **可执行性** | 规则是否可执行、是否有歧义、是否有遗漏 |
| **一致性** | 文件之间的规则是否一致、术语是否统一 |
| **完整性** | 是否有遗漏的边界条件、是否有未处理的异常 |
| **退出条件** | 是否有明确的退出条件、是否有最大重试次数 |
| **资源消耗** | token 成本是否合理、是否有优化空间 |

三方评估的输出格式：

```
#### 支持方观点（优点）
1. [优点 1] — [具体证据：文件路径:行号]
2. [优点 2] — [具体证据：文件路径:行号]
...

#### 反方观点（缺点）
1. [缺点 1] — [具体证据：文件路径:行号] — [检查类型：逻辑正确性/可执行性/一致性/完整性/退出条件/资源消耗]
2. [缺点 2] — [具体证据：文件路径:行号] — [检查类型：...]
...

#### 综合评级
- 评审维度：[列出本次评审使用的维度]
- 维度评分明细：
  | 维度 | 评分 | 证据引用 |
  |------|------|---------|
  | [维度 1] | X/5 | [引用支持方/反方的具体条目编号] |
  | [维度 2] | X/5 | [引用支持方/反方的具体条目编号] |
  | ... | ... | ... |
- 总体评分：X.X / 5.0（各维度评分的加权平均）
- 核心判断：[2-3 句话总结]
- 主要短板：[1-2 个最关键的改进点]
```

#### 量化评分 Rubric

每个维度按以下标准评分（1-5 分），必须基于三方评估中列出的具体证据，不得凭印象打分。

评分时必须引用支持方/反方的具体条目编号作为证据，例如："[维度名] 评分 4/5 — 证据：支持方#3、反方#2"。

**详细评分标准**：详见 [extended/rubric-scoring.md](extended/rubric-scoring.md)

### 目标治理综合分析

> 此步骤不是列问题清单，而是从整体上回答三个核心问题。逐维度扫描只能发现"缺了什么"，这里要产出"这些东西之间的关系是什么""为什么缺这个比缺那个更致命""怎么补才能产生协同效应"。

**过程控制 vs 目标治理**：
- 过程控制规则：X 条（列举主要规则，如"禁止 X""必须按 Y 步骤""不得 Z"）
- 目标治理规则：Y 条（列举主要规则，如"目标定义""验收标准""品质锚定""评估维度"）
- 比例：X:Y
- 判断：[平衡 / 偏向过程控制 / 偏向目标治理]
- 具体分析：[2-3 句话说明张力在哪，例如"项目的能量主要花在确保 Agent 不走错路（13 道门禁、7 条宪法），但在'帮 Agent 理解什么是好结果'方面相对薄弱"]

**最高杠杆改进方向**：
1. [方向名] — [为什么这个最有杠杆，补了它能连带改善什么]
2. [方向名] — [同上]

**改进依赖关系**：
- [A] 和 [B] 必须同步实施，因为 [原因]
- [C] 应在 [A+B] 之后，因为 [原因]
- [D] 可独立实施

### 发展方向

- 输出短/中/长期路线图草案，每阶段 2-3 个关键动作
- 标注依赖关系和前置条件

### 用户接受策略

- **定位**：目标用户是谁、核心卖点是什么、一句话介绍怎么说
- **行动清单**：列出"你可以做的 5 件事"——面向该项目的**目标用户**，让他们能立刻上手体验并感受到价值

## 文件保存报告

```
# Agent PM 审查报告

- 审查日期：YYYY-MM-DD
- 项目路径：/path/to/project
- 项目类型：skill / CLAUDE.md / MCP server
- 产品评审状态：pending_after_tech_review / pending_after_fix / completed / skipped_by_user / not_requested_in_this_round
- 产品评审交接动作：enter_mode_d / ask_user / none

## 技术审查
（按维度组织，同对话报告格式，包含 ReviewSpec、issue_id、severity、status、acceptance_criteria）

## 修复记录（如有，未执行则标注"未执行"）
- 修复项数：N
- 成功：X / 失败：Y
- 详细修改：[文件列表及变更摘要]
- 验证模式结果：[fixed / partially_fixed / failed]
- Backlog：[deferred issue 列表]

## 产品评审（如有，未执行则标注"未执行"）
- 状态：[completed / skipped_by_user / not_requested_in_this_round]
- 触发时机：[tech_review / fix_verification / -]
- 若未执行，记录原因：[用户跳过 / 本轮未进入该阶段（not_requested_in_this_round） / -]
- 若已执行，（同对话报告格式）

## 自定义规则更新（如有）
- 新增候选规则：CRXXX - 规则描述（来源：项目名，日期）
- 正式采纳规则：RXXX - 规则描述（来源：项目名，日期）
- 新增候选修复模板：[模板描述]
- 淘汰候选规则：RXXX - 规则描述（淘汰日期）
```
