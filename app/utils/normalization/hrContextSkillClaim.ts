import { ISkill } from 'hr-context'
import type { FormData } from '../../credentialForm/form/types/Types'

export type SkillClaimFormData = {
  personName: string
  personId?: string
  skills: ISkill[]
  evidence?: Array<{ id: string; name: string; type?: string[]; description?: string }>
  expirationDate: string
}

export function normalizeSkillClaimFormData(formData: FormData): SkillClaimFormData {
  const skill0 = formData.skills?.[0]
  const skillName = skill0?.name ?? formData.credentialName ?? ''
  const skillDescription = formData.credentialDescription ?? undefined
  const narrative = typeof formData.description === 'string'
    ? formData.description
    : typeof formData.credentialDescription === 'string'
      ? formData.credentialDescription
      : ''

  const skills = [
    {
      name: skillName,
      description: skillDescription,
      durationPerformed: formData.credentialDuration ?? '',
      narrative,
      image: formData.evidenceLink ? { id: formData.evidenceLink, type: 'Image' } : undefined
    }
  ] as ISkill[]

  const evidence = (formData.evidence && Array.isArray(formData.evidence)) ? formData.evidence.map((p: any) => ({ id: p.url, name: p.name, description: p.description, type: ['Evidence'] })) : []
  return {
    personName: formData.fullName ?? '',
    skills,
    evidence: evidence.length ? evidence : [],
    expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
  }
}
