# Changelog

## 0.1.0 - 2026-10-22

### Added

- 首次发布 Agent PM 的 DSH 插件版本。
- 通过 `ctx.skills.registerProvider()` 把 `agent-pm` 注册到 DSH 宿主技能层。
- 新增 `references/dsh-plugin-review.md`，覆盖 DSH 插件清单、`ctx` 注册、资源路径、事件清理和版本兼容检查。
- 新增 `scripts/verify.mjs`，用最小 `ctx` stub 验证技能发现、多行 description 解析和正文加载。

### Changed

- 审查范围从 Claude Code 扩展到 Claude Code + DSH。
- 项目类型识别新增 DSH 插件（`package.json` 的 `dsh` 字段或 `cordis.patch.yml`）。
- 将 Claude Code 专属的 `AskUserQuestion` 表述改为宿主无关的提问描述。

### Notes

- 技能内容基于 `agent-pm` v3.0.11。
- 插件面向 DSH `0.2.1-rc.2` 编写；已在隔离 `DSH_HOME` 中验证安装、技能发现、正文加载和卸载，未做 Web UI 人工触发验证。
