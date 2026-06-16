import { ISkill } from 'hr-context'
import type { FormData } from '../../credentialForm/form/types/Types'
import { DEFAULT_EXTRACTION_MODEL, FrameworkMatch } from '../skillsApi'

const skillId = (seed?: string) =>
  seed?.startsWith('urn:') ? seed : `urn:uuid:${seed || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now())}`

/** LLM-extracted skill, emitted as `credentialSubject.inferredSkill`. */
export type InferredSkill = {
  id: string
  name: string
  source: string
  model?: string
  frameworkMatch?: FrameworkMatch[]
}

export type SkillClaimFormData = {
  type: string[]
  person: {
    id: string
    name: string
  }
  name: string
  description?: string
  durationPerformed?: string
  skill: ISkill[]
  inferredSkill?: InferredSkill[]
}

/**
 * Build SkillClaim skills for signing, split by provenance:
 * - skills[0] = form claim ("What skill do you want to claim?" + description + duration)
 * - skills[1..] = manual UI additions (source 'user')
 * - inferredSkills = LLM-extracted skills (source/model + frameworkMatch alignments)
 */
export function buildSkillClaimSkillsFromForm(data: FormData): {
  skills: ISkill[]
  inferredSkills: InferredSkill[]
} {
  const claimName = (data.credentialName ?? '').trim()
  const claimDescription = (data.credentialDescription ?? '').trim()
  const claimDuration = (data.credentialDuration ?? '').trim()

  const primarySkill: ISkill = {
    id: skillId(),
    name: claimName,
    ...(claimDescription ? { description: claimDescription } : {}),
    ...(claimDuration ? { durationPerformed: claimDuration } : {})
  }

  const skills: ISkill[] = [primarySkill]
  const inferredSkills: InferredSkill[] = []

  for (const skill of data.skills ?? []) {
    if (skill.source === 'user') {
      skills.push({
        id: skillId(skill.id),
        name: skill.name,
        source: 'user'
      })
    } else {
      inferredSkills.push({
        id: skillId(skill.id),
        name: skill.name,
        source: 'ollama',
        model: skill.model || DEFAULT_EXTRACTION_MODEL,
        ...(skill.frameworkMatch?.length ? { frameworkMatch: skill.frameworkMatch } : {})
      })
    }
  }

  return { skills, inferredSkills }
}

export function normalizeSkillClaimFormData(
  formData: FormData,
  issuerId: string
): { subject: SkillClaimFormData; evidence: any[] } {
  const { skills, inferredSkills } = buildSkillClaimSkillsFromForm(formData)
  const claimName = (formData.credentialName ?? '').trim()

  const evidence =
    formData.evidence && Array.isArray(formData.evidence)
      ? formData.evidence.map((p: { url: string; name: string; description?: string }) => ({
          id: p.url,
          name: p.name,
          description: p.description,
          type: ['Evidence']
        }))
      : []

  const subject: SkillClaimFormData = {
    type: ['SkillClaim'],
    person: {
      id: issuerId,
      name: formData.fullName ?? ''
    },
    name: claimName,
    skill: skills,
    ...(inferredSkills.length ? { inferredSkill: inferredSkills } : {})
  }

  const claimDescription = (formData.credentialDescription ?? '').trim()
  if (claimDescription) subject.description = claimDescription
  if (formData.credentialDuration) subject.durationPerformed = formData.credentialDuration

  return { subject, evidence }
}
