import { ISkill } from 'hr-context'
import type { FormData } from '../../credentialForm/form/types/Types'

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

export function normalizeSkillClaimFormData(
  formData: FormData,
  issuerId: string
): { subject: SkillClaimFormData; evidence: any[] } {
  const skill0 = formData.skills?.[0]
  const skillName = skill0?.name ?? formData.credentialName ?? ''
  const skillDescription = formData.credentialDescription ?? undefined
  const narrative =
    typeof formData.description === 'string'
      ? formData.description
      : typeof formData.credentialDescription === 'string'
        ? formData.credentialDescription
        : ''

  const skills = [
    {
      name: skillName,
      description: narrative || skillDescription,
      durationPerformed: formData.credentialDuration ?? '',
      image: formData.evidenceLink
        ? { id: formData.evidenceLink, type: 'Image' }
        : undefined
    }
  ] as ISkill[]

  const evidence =
    formData.evidence && Array.isArray(formData.evidence)
      ? formData.evidence.map((p: any) => ({
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
    name: skillName,
    skill: skills
  }

  if (narrative) subject.description = narrative
  if (formData.credentialDuration) subject.durationPerformed = formData.credentialDuration

  return { subject, evidence }
}
