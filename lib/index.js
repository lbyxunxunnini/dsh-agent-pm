// dsh-agent-pm: Agent PM skill for the DeepSeek Harness.
//
// A Cordis plugin that registers one skill provider into the HOST layer of the
// `ctx.skills` registry, so every agent preset's scope chain merges the skill.
// The skill body lives in `../skills/agent-pm/SKILL.md`; the provider locates
// it from `import.meta.url` and loads the body on demand.
//
// The provider protocol mirrors @deepseek-ai/dsh-skill-filesystem:
//   - list() discovers directory-bundle candidates from YAML frontmatter
//   - get()  parses the winning candidate and returns a directory resource
//            base so relative references resolve inside the skill directory
//
// @module dsh-agent-pm
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { basename, dirname, join } from 'node:path'

const name = 'dsh-agent-pm'
const inject = ['skills']

/** Registry precedence for packaged skill providers: below project and user roots. */
const PACKAGED_SKILL_RANK = 550

/** The source bucket these skills advertise under (prompt-visible metadata). */
const SOURCE = 'custom'

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

function booleanValue(value, fallback) {
  if (value === undefined) return fallback
  const normalized = String(value).trim().toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  return fallback
}

/**
 * Parse the YAML frontmatter block of a SKILL.md into metadata plus body.
 * Supports quoted scalars and the `|`, `|-`, `>`, `>-` block scalars used by
 * skill descriptions. Nested blocks are left to the caller; only top-level
 * scalar keys are consumed by DSH discovery.
 * @param text - the raw skill file contents.
 * @returns parsed metadata object and the markdown body, or null when the file
 *   has no frontmatter block.
 */
function parseFrontmatter(text) {
  if (!text.startsWith('---')) return null
  const close = /\n---[ \t]*(?:\n|$)/.exec(text.slice(3))
  if (close === null) return null
  const block = text.slice(3, 3 + close.index)
  const body = text.slice(3 + close.index + close[0].length).replace(/^\n+/, '')
  const metadata = {}
  const lines = block.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim() || /^\s/.test(line)) continue
    const match = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line)
    if (match === null) continue

    const key = match[1]
    const raw = match[2].trim()
    const blockMatch = /^([|>])([+-]?)\s*$/.exec(raw)
    if (blockMatch === null) {
      metadata[key] = stripQuotes(raw)
      continue
    }

    const folded = blockMatch[1] === '>'
    const strip = blockMatch[2] === '-'
    const collected = []
    let j = i + 1
    while (j < lines.length) {
      const next = lines[j]
      if (next.trim() === '') {
        collected.push('')
        j++
        continue
      }
      if (!/^\s/.test(next)) break
      collected.push(next)
      j++
    }

    const nonEmpty = collected.filter((entry) => entry.trim() !== '')
    const baseIndent =
      nonEmpty.length > 0
        ? Math.min(...nonEmpty.map((entry) => entry.match(/^\s*/)[0].length))
        : 0
    const normalized = collected.map((entry) =>
      entry.trim() === '' ? '' : entry.slice(baseIndent)
    )
    if (strip) {
      while (normalized.length > 0 && normalized[normalized.length - 1] === '') {
        normalized.pop()
      }
    }
    metadata[key] = folded
      ? normalized.join(' ').trim()
      : normalized.join('\n').trim()
    i = j - 1
  }

  return { metadata, body }
}

/**
 * Read and parse one skill directory's SKILL.md.
 * @param skillFile - absolute path to the SKILL.md file.
 * @param signal - optional cancellation; aborts the read.
 * @returns the parsed skill record, or undefined when the file is missing or
 *   has no usable name/description.
 */
async function parseSkillFile(skillFile, signal) {
  let text
  try {
    text = await readFile(skillFile, 'utf8')
  } catch {
    return undefined
  }
  if (signal?.aborted) return undefined

  const parsed = parseFrontmatter(text)
  if (parsed === null) return undefined

  const skillName = parsed.metadata.name || basename(dirname(skillFile))
  const description = parsed.metadata.description ?? ''
  if (!skillName || !description) return undefined

  const modelInvocable = !booleanValue(
    parsed.metadata['disable-model-invocation'],
    false
  )
  const userInvocable = booleanValue(parsed.metadata['user-invocable'], true)

  return {
    name: skillName,
    description,
    ...(parsed.metadata.whenToUse !== undefined
      ? { whenToUse: parsed.metadata.whenToUse }
      : {}),
    invocation: { modelInvocable, userInvocable },
    metadata: parsed.metadata,
    content: parsed.body
  }
}

/**
 * Discover packaged skill candidates by scanning the package's `skills/`
 * directory: one subdirectory per skill, each carrying a SKILL.md.
 * @param skillsRoot - absolute path to this package's skills directory.
 * @param signal - optional cancellation.
 * @returns the candidate list.
 */
async function discoverCandidates(skillsRoot, signal) {
  let entries
  try {
    entries = await readdir(skillsRoot, { withFileTypes: true })
  } catch {
    return []
  }

  const candidates = []
  for (const entry of entries) {
    if (signal?.aborted) break
    if (!entry.isDirectory()) continue

    const skillDir = join(skillsRoot, entry.name)
    const skillFile = join(skillDir, 'SKILL.md')
    const parsed = await parseSkillFile(skillFile, signal)
    if (parsed === undefined) continue

    candidates.push({
      name: parsed.name,
      description: parsed.description,
      ...(parsed.whenToUse !== undefined ? { whenToUse: parsed.whenToUse } : {}),
      invocation: parsed.invocation,
      source: SOURCE,
      provider: name,
      rank: PACKAGED_SKILL_RANK,
      locator: skillDir,
      path: skillFile,
      ...(Object.keys(parsed.metadata).length > 0
        ? { metadata: parsed.metadata }
        : {})
    })
  }
  return candidates
}

/** Register the packaged agent-pm provider on `ctx.skills`. */
function apply(ctx) {
  const skillsRoot = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    'skills'
  )

  ctx.skills.registerProvider((control) => ({
    name,
    async list(options) {
      if (control.signal.aborted) return []
      return discoverCandidates(skillsRoot, options.signal)
    },
    async get(candidate, options) {
      if (control.signal.aborted) return undefined
      const parsed = await parseSkillFile(candidate.path, options.signal)
      if (parsed === undefined) return undefined
      return {
        name: parsed.name,
        description: parsed.description,
        ...(parsed.whenToUse !== undefined
          ? { whenToUse: parsed.whenToUse }
          : {}),
        invocation: parsed.invocation,
        source: SOURCE,
        provider: name,
        resourceBase: { kind: 'directory', path: candidate.locator },
        path: candidate.path,
        ...(Object.keys(parsed.metadata).length > 0
          ? { metadata: parsed.metadata }
          : {}),
        content: parsed.content
      }
    }
  }))
}

export { apply, name, inject }
export default { apply, name, inject }
