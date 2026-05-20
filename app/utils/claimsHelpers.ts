// Helper functions for claims management

// Border colors for mobile cards
export const borderColors = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#22c55e',
  '#6366f1'
]

export const getRandomBorderColor = (): string => {
  return borderColors[Math.floor(Math.random() * borderColors.length)]
}

// Date formatting functions
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const getTimeAgo = (claim: any): string => {
  const dateStr =
    claim?.proof?.created ||
    claim?.issuanceDate ||
    claim?.validFrom ||
    claim?.id?.createdTime ||
    new Date().toISOString()
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return 'Invalid date'
  }
  return formatDate(date)
}

export const getTimeDifference = (claim: any): string => {
  const dateStr =
    claim?.proof?.created ||
    claim?.issuanceDate ||
    claim?.validFrom ||
    claim?.id?.createdTime ||
    new Date().toISOString()
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return '0 seconds'
  }

  const now = new Date()
  const diffInMilliseconds = now.getTime() - date.getTime()
  // Ensure we don't return negative time if clocks are slightly out of sync
  const diffInSeconds = Math.max(0, Math.floor(diffInMilliseconds / 1000))
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  const months =
    (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth())

  if (months > 0) return `${months} ${months === 1 ? 'month' : 'months'}`
  if (diffInDays >= 30) return `${diffInDays} days`
  if (diffInDays > 0) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'}`
  if (diffInHours > 0) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'}`
  if (diffInMinutes > 0)
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'}`
  return `${diffInSeconds} ${diffInSeconds === 1 ? 'second' : 'seconds'}`
}

// VC subtypes from @cooperation/vc-storage (SkillClaimCredential | RecommendationCredential)
const hasVcType = (claim: any, subtype: string) =>
  Array.isArray(claim?.type) && claim.type.some((t: string) => t.includes(subtype))

export const isSkillClaimCredential = (claim: any): boolean =>
  hasVcType(claim, 'SkillClaimCredential')

export const isRecommendationCredential = (claim: any): boolean =>
  hasVcType(claim, 'RecommendationCredential')

export const getDuration = (claim: any): string => {
  try {
    const subject = claim?.credentialSubject
    if (!subject) return ''
    if (isSkillClaimCredential(claim)) {
      return subject.skill?.[0]?.durationPerformed || ''
    }
    return getTimeDifference(claim)
  } catch (error) {
    return ''
  }
}

export const getCredentialName = (claim: any): string => {
  const subject = claim?.credentialSubject
  if (!subject) return ''
  if (isRecommendationCredential(claim)) return subject.name || ''
  if (isSkillClaimCredential(claim)) {
    return subject.skill?.[0]?.name || subject.name || ''
  }
  return ''
}

export const getCredentialDescription = (claim: any): string => {
  const subject = claim?.credentialSubject
  if (!subject) return ''
  if (isRecommendationCredential(claim)) return subject.recommendationText || ''
  if (isSkillClaimCredential(claim)) {
    const skill = subject.skill?.[0]
    return skill?.narrative || skill?.description || subject.description || ''
  }
  return ''
}

/** AI-suggested skills on a SkillClaim (skill[1..], not the claim title). */
export const getSkillClaimAlignments = (claim: any): string[] => {
  const subject = claim?.credentialSubject
  if (!subject || !isSkillClaimCredential(claim)) return []
  const title = getCredentialName(claim)
  return (subject.skill ?? [])
    .slice(1)
    .map((s: { name?: string }) => s.name)
    .filter((name: string) => name && name !== title)
}

export const getCredentialPersonName = (claim: any): string => {
  const subject = claim?.credentialSubject
  if (!subject) return ''
  if (isSkillClaimCredential(claim)) return subject.person?.name || ''
  if (isRecommendationCredential(claim)) return subject.recipientName || ''
  return ''
}

export const getCredentialType = (claim: any): string => {
  try {
    if (!claim || typeof claim !== 'object') {
      return 'Unknown'
    }

    const types = Array.isArray(claim.type) ? claim.type : []
    if (types.includes('EmploymentCredential')) return 'Employment'
    if (types.includes('VolunteeringCredential')) return 'Volunteer'
    if (types.includes('PerformanceReviewCredential')) return 'Performance Review'
    return 'Skill'
  } catch (error) {
    console.error('Error in getCredentialType:', error, claim)
    return 'Unknown'
  }
}

// Helper function to validate claim object
export const isValidClaim = (claim: any): boolean => {
  try {
    return (
      claim &&
      typeof claim === 'object' &&
      claim.id &&
      claim.credentialSubject &&
      typeof claim.credentialSubject === 'object'
    )
  } catch (error) {
    console.error('Error validating claim:', error, claim)
    return false
  }
}

// Safe helper to get claim ID
export const getClaimId = (claim: any): string => {
  try {
    if (claim?.id?.id) return claim.id.id
    if (claim?.id) return claim.id
    return 'unknown-id'
  } catch (error) {
    console.error('Error getting claim ID:', error, claim)
    return 'error-id'
  }
}

/** @deprecated Use isSkillClaimCredential */
export const isSkillCredential = isSkillClaimCredential

// LinkedIn URL generation
export const generateLinkedInUrl = (claim: any): string => {
  try {
    const claimId = getClaimId(claim)
    const credentialName = getCredentialName(claim)
    const issuanceDate = new Date(claim.issuanceDate || claim.proof?.created || new Date())
    const baseLinkedInUrl = 'https://www.linkedin.com/profile/add'
    const params = new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name: credentialName,
      organizationName: 'LinkedTrust',
      issueYear: issuanceDate.getFullYear().toString(),
      issueMonth: (issuanceDate.getMonth() + 1).toString(),
      certUrl: `https://linkedcreds.allskillscount.org/view/${claimId}`,
      certId: claimId
    })
    return `${baseLinkedInUrl}?${params.toString()}`
  } catch (error) {
    console.error('Error generating LinkedIn URL:', error, claim)
    return 'https://www.linkedin.com/profile/add'
  }
}
