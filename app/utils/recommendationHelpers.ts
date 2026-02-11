// Helper functions for recommendations management

// Helper function to safely get recommendation name
// Returns the RECIPIENT's name (who the recommendation is for)
export const getRecommendationName = (recommendation: any): string => {
  try {
    if (!recommendation || typeof recommendation !== 'object') {
      return 'Unknown Recommendation'
    }

    if (
      !recommendation.credentialSubject ||
      typeof recommendation.credentialSubject !== 'object'
    ) {
      return 'Invalid Recommendation'
    }

    // Return recipient's name (who the recommendation is for)
    // Fall back to recommender's name if recipientName is not available
    return recommendation.credentialSubject.recipientName ||
      recommendation.credentialSubject.name ||
      'Unnamed Recommendation'
  } catch (error) {
    console.error('Error in getRecommendationName:', error, recommendation)
    return 'Error Loading Recommendation'
  }
}

// Helper function to safely get recommendation text (stripped of HTML)
export const getRecommendationText = (recommendation: any): string => {
  try {
    if (!recommendation?.credentialSubject?.recommendationText) {
      return 'No recommendation text available'
    }

    // Strip HTML tags for preview
    const htmlText = recommendation.credentialSubject.recommendationText
    const textWithoutTags = htmlText.replace(/<[^>]*>/g, '')

    // Truncate if too long
    if (textWithoutTags.length > 150) {
      return textWithoutTags.substring(0, 150) + '...'
    }

    return textWithoutTags
  } catch (error) {
    console.error('Error in getRecommendationText:', error, recommendation)
    return 'Error loading text'
  }
}

// Helper function to safely get qualifications text (stripped of HTML)
export const getQualificationsText = (recommendation: any): string => {
  try {
    if (!recommendation?.credentialSubject?.qualifications) {
      return 'No qualifications specified'
    }

    // Strip HTML tags for preview
    const htmlText = recommendation.credentialSubject.qualifications
    const textWithoutTags = htmlText.replace(/<[^>]*>/g, '')

    // Truncate if too long
    if (textWithoutTags.length > 100) {
      return textWithoutTags.substring(0, 100) + '...'
    }

    return textWithoutTags
  } catch (error) {
    console.error('Error in getQualificationsText:', error, recommendation)
    return 'Error loading qualifications'
  }
}

// Helper function to validate recommendation object
export const isValidRecommendation = (recommendation: any): boolean => {
  try {
    return (
      recommendation &&
      typeof recommendation === 'object' &&
      recommendation.id &&
      recommendation.credentialSubject &&
      typeof recommendation.credentialSubject === 'object' &&
      recommendation.credentialSubject.name &&
      recommendation.credentialSubject.recommendationText
    )
  } catch (error) {
    console.error('Error validating recommendation:', error, recommendation)
    return false
  }
}

// Safe helper to get recommendation ID
export const getRecommendationId = (recommendation: any): string => {
  try {
    // Try to get the Google Drive file ID first (most reliable)
    if (recommendation?.id?.id) {
      return recommendation.id.id
    }
    // Fallback to credential ID
    if (recommendation?.id) {
      return recommendation.id
    }
    // Last resort: generate a unique ID from credential URN or timestamp
    if (recommendation?.credentialId) {
      return recommendation.credentialId
    }
    // Generate unique fallback ID
    return `unknown-id-${Date.now()}-${Math.random()}`
  } catch (error) {
    console.error('Error getting recommendation ID:', error, recommendation)
    return `error-id-${Date.now()}-${Math.random()}`
  }
}

