# linkedcreds ChangeLog

## 0.2.0 - TBD

### Changed (SkillClaim provenance + data model alignment)

- Bumped `@cooperation/vc-storage` to `^1.0.48` (new SkillClaim data model:
  separate `inferredSkill`, no `narrative`, `socCode` as `string[]`).
- `searchSkillsApi` now sends real per-name provenance instead of hardcoding
  `source: 'user'` for every result: manually added skills are labeled `user`
  and LLM-extracted skills `ollama`, with `model` read from the backend
  response (defaulting to `qwen2.5:7b`).
- `CredentialPreview` now passes a `sourcesByName` map into `searchSkillsApi`
  so manual UI additions retain `source: 'user'` through the `/search` step.
- `hrContextSkillClaim` no longer duplicates the description into `narrative`,
  and splits skills by provenance into `skill[]` (user-entered) and
  `inferredSkill[]` (LLM-extracted).
- Updated both signing paths (`signSkillClaim` and
  `generateCredentialData`/`signVCWithEngine` in `credential.ts`) for the new
  SkillClaim shape.

## 0.1.5 - 2026-05-22
