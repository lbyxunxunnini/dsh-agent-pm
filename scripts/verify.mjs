// Static and provider-level checks for the packaged agent-pm skill.
//
// Run with `npm run verify`. This does not boot a Harness instance; it calls
// the plugin's provider directly with a minimal ctx stub so a broken
// frontmatter parser or missing skill file fails before installation.
import assert from 'node:assert/strict'
import { apply, name } from '../lib/index.js'

const providers = []
const ctx = {
  skills: {
    registerProvider(create) {
      providers.push(
        create({
          signal: { aborted: false },
          invalidate() {}
        })
      )
    }
  }
}

apply(ctx)

assert.equal(name, 'dsh-agent-pm')
assert.equal(providers.length, 1, 'plugin must register exactly one provider')

const provider = providers[0]
const candidates = await provider.list({})

assert.ok(candidates.length > 0, 'provider must discover at least one skill')
const candidate = candidates.find((entry) => entry.name === 'agent-pm')
assert.ok(candidate, 'provider must expose the agent-pm skill')
assert.match(candidate.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
assert.ok(candidate.description.length > 0, 'description must not be empty')
assert.ok(
  candidate.description.includes('USE FOR'),
  'multi-line description block must be parsed'
)
assert.equal(candidate.invocation.modelInvocable, true)
assert.equal(candidate.invocation.userInvocable, true)

const skill = await provider.get(candidate, {})
assert.ok(skill, 'provider must load the selected skill')
assert.equal(skill.name, 'agent-pm')
assert.equal(skill.resourceBase.kind, 'directory')
assert.ok(skill.content.includes('Iron Law'), 'skill body must be loaded')
assert.ok(
  skill.content.includes('NO ISSUE REPORT WITHOUT EXECUTION VERIFICATION FIRST'),
  'skill body must retain the Iron Law'
)

console.log(
  `[verify] ${name}: ${candidates.length} skill(s), agent-pm loaded (${skill.content.length} chars)`
)
