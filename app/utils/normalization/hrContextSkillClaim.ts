import { ISkill } from 'hr-context'
import type { FormData } from '../../credentialForm/form/types/Types'

const skillId = (seed?: string) =>
  seed?.startsWith('urn:') ? seed : `urn:uuid:${seed || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now())}`

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
}

/**
 * Build SkillClaim `skill[]` for signing.
 * - skill[0] = form claim ("What skill do you want to claim?" + description + duration)
 * - skill[1..] = AI-suggested alignments (name only; vc-storage persists these fields)
 */
export function buildSkillClaimSkillsFromForm(data: FormData): ISkill[] {
  const claimName = (data.credentialName ?? '').trim()
  const claimDescription = (data.credentialDescription ?? '').trim()
  const claimDuration = (data.credentialDuration ?? '').trim()

  const primarySkill: ISkill = {
    id: skillId(),
    name: claimName,
    ...(claimDescription ? { description: claimDescription, narrative: claimDescription } : {}),
    ...(claimDuration ? { durationPerformed: claimDuration } : {})
  }

  const alignedSkills: ISkill[] = (data.skills ?? []).map(skill => ({
    id: skillId(skill.id),
    name: skill.name,
    source: skill.source || 'ollama',
    ...(skill.frameworkMatch?.length ? { frameworkMatch: skill.frameworkMatch } : {})
  }))

  return [primarySkill, ...alignedSkills]
}

export function normalizeSkillClaimFormData(
  formData: FormData,
  issuerId: string
): { subject: SkillClaimFormData; evidence: any[] } {
  const skills = buildSkillClaimSkillsFromForm(formData)
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
    skill: skills
  }

  const claimDescription = (formData.credentialDescription ?? '').trim()
  if (claimDescription) subject.description = claimDescription
  if (formData.credentialDuration) subject.durationPerformed = formData.credentialDuration

  return { subject, evidence }
}
