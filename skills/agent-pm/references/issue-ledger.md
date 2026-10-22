# Agent PM Issue Ledger

> 此文件用于记录 agent-pm 审查问题的生命周期，防止同一项目在多轮审查中反复发现、反复修复、反复引入新问题。
>
> 使用规则：
> - 每轮审查开始前先读取本文件，复用已有 issue_id 和 rejected/deferred 状态。
> - 每轮修复结束后更新本文件。
> - 每轮技术闭环结束后更新产品评审状态，避免下一轮丢失“是否已评分/是否被用户跳过”。
> - 候选规则只能记录在这里，不能立即污染 checklist。

---

## 当前项目问题台账

| issue_id | 项目 | 维度 | severity | status | first_seen | last_seen | 证据位置 | 验证结果 |
|----------|------|------|----------|--------|------------|-----------|----------|----------|
| 暂无 | - | - | - | - | - | - | - | - |

### 状态定义

- `open`：已发现，但用户尚未确认是否处理
- `accepted`：用户确认需要修复
- `fixed_pending_verification`：已修改，等待验证
- `fixed`：验收条件已通过
- `partially_fixed`：部分验收条件未通过
- `failed`：修复失败或引入阻塞回归
- `rejected`：用户拒绝处理，后续不得重复报告
- `deferred`：进入 backlog，本轮不阻塞

---

## 本轮 ReviewSpec 记录

```yaml
review_id:
date:
project_path:
project_type:
mode: discovery
enabled_dimensions: []
excluded_dimensions: []
max_findings: 8
severity_threshold: P1
checklist_version:
product_review_gate:
product_review_status:
product_review_trigger:
```

---

## 本轮产品评审状态

| review_id | 状态 | 触发时机 | 最近提示语 | 结果摘要 |
|-----------|------|----------|------------|----------|
| 当前轮次 | pending_after_tech_review / pending_after_fix / completed / skipped_by_user / not_requested_in_this_round | tech_review / fix_verification / explicit_user_request / - | "技术审查完成，要继续做产品评审吗？" / "修复验证完成，要继续做产品评审吗？" / - | 暂无 |

### 状态说明

- `pending_after_tech_review`：技术审查已完成，等待询问或执行产品评审
- `pending_after_fix`：修复验证已完成，等待询问或执行产品评审
- `completed`：本轮已完成多维度评分和产品评审输出
- `skipped_by_user`：用户明确表示本轮不做产品评审
- `not_requested_in_this_round`：本轮是纯修复或其他流程，不要求进入产品评审

### 可恢复字段（跨轮次上下文传递）

以下字段在每轮结束时更新，供下一轮用户说"进入评分"时恢复上下文，避免重新分类到 A/B：

```yaml
pending_action: enter_product_review  # 存在时直接进入模式 D
source_review_id: review-xxx          # 关联的技术审查 ID
source_project_path: /path/to/project # 目标项目路径
last_context_summary: |               # 上一轮上下文摘要
  项目类型：skill
  技术审查发现 3 个 P1, 2 个 P2
  已修复 2 个 P1，1 个 P1 用户拒绝
  产品评审状态：pending_after_fix
```

---

## Backlog

| issue_id | severity | 问题摘要 | 延后原因 | 重新触发条件 |
|----------|----------|----------|----------|--------------|
| 暂无 | - | - | - | - |

---

## 候选规则

候选规则不得在当前审查闭环内生效。只有满足跨项目证据、非重复、用户确认后，才能进入 `checklist.md` 的正式自定义规则。

说明：`checklist.md` 中的维度九 G-001~G-006 是已采纳的正式审查框架，用来保证 agent-pm 会检查目标治理能力；本节 CR-002~CR-005 仍是候选经验规则，用来验证具体严重程度、触发阈值和系统性问题模式是否能跨项目复现。审查时可以用 G 维度发现问题，但不得仅凭 CR 候选规则把某类问题自动升级为正式自定义规则。

### CR-001: 执行验证必须在报告前完成

- **状态**: accepted
- **来源项目**: flutter-forge
- **首次发现日期**: 2026-05-19
- **重复出现项目**: -
- **关联 issue_id**: 本轮 6 个误报全部因缺少执行验证
- **规则描述**: 每个候选问题在进入报告前，必须通过"读完上下文 → 模拟执行 → 区分层次 → 区分概念与实现 → 走完逻辑链"五步验证。不过验证的问题不得进入报告。
- **检查方式**: SKILL.md Step 2.5 已集成
- **不采纳风险**: 继续产出误报，用户信任度下降
- **采纳条件**: 已采纳，已写入 SKILL.md 和 checklist.md

### CR-002: 开发类 skill 缺少评估反馈体系是系统性缺陷

- **状态**: candidate
- **来源项目**: Harness Engineering 文章实践
- **首次发现日期**: 2026-06-10
- **重复出现项目**: 待验证
- **关联 issue_id**: -
- **规则描述**: 开发类 skill（如 flutter-forge、h5-forge）如果没有结构化的评估体系（Rubric/量化评分），而仅靠二元 pass/fail 或 Agent 自我评估，产出质量会不稳定。这不是 P3 风格问题，而是 P2 系统性缺陷。
- **检查方式**: 维度九 G-001
- **不采纳风险**: 产出质量不稳定，Agent 自评偏正向
- **采纳条件**: 待跨项目验证

### CR-003: 线性执行流程在开发类 skill 中导致产出质量不稳定

- **状态**: candidate
- **来源项目**: Harness Engineering 文章实践
- **首次发现日期**: 2026-06-10
- **重复出现项目**: 待验证
- **关联 issue_id**: -
- **规则描述**: 开发类 skill 的执行流程如果是线性的（S1→S2→S4→S5→S6），没有"评估→反馈→改进"的迭代循环，产出质量高度依赖首次执行的质量，无法通过反馈循环持续改进。
- **检查方式**: 维度九 G-003
- **不采纳风险**: 一次执行质量不高时无法自我改进
- **采纳条件**: 待跨项目验证

### CR-004: 执行者和评估者共享上下文导致评估偏正向

- **状态**: candidate
- **来源项目**: Harness Engineering 文章实践
- **首次发现日期**: 2026-06-10
- **重复出现项目**: 待验证
- **关联 issue_id**: -
- **规则描述**: 当执行角色（Developer/impl-agent）和评估角色（Evaluator/verify-agent）共享上下文时，评估者能看到执行者的实现思路和自我评估，倾向于给出正面评价（"自出题、自执行、自判卷"导致分数虚高）。
- **检查方式**: 维度九 G-004
- **不采纳风险**: 评估结果不可信，迭代循环失去驱动力
- **采纳条件**: 待跨项目验证

### CR-005: 过程控制规则占比超过 80% 时 Agent 行为趋于僵硬

- **状态**: candidate
- **来源项目**: Loop Engineering 文章
- **首次发现日期**: 2026-06-10
- **重复出现项目**: 待验证
- **关联 issue_id**: -
- **规则描述**: 当项目中"必须/禁止/不得"类规则（过程控制）占比超过 80%，而"目标/验收/品质/评估"类规则（目标治理）不足 20% 时，Agent 行为趋于合规导向而非目标导向，系统僵硬。
- **检查方式**: 维度九 G-005
- **不采纳风险**: 系统僵化，Agent 花大量精力遵守规则而非朝目标前进
- **采纳条件**: 待跨项目验证

---

## 候选修复模板

### CF-001: 候选模板标题

- **状态**: candidate / accepted / rejected
- **适用问题模式**:
- **修改范围**:
- **验收条件**:
- **成功项目**:
- **失败项目**:
- **失败原因**:
