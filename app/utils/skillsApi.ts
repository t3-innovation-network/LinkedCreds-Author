
export interface SkillMatch {
    name: string
    score: number
    soc_codes: string[]
    uuid: string
    originalMatch?: string
    onetName?: string
}

export interface SkillExtractionResponse {
    extracted_skills: string[]
    mapped_skills: Record<string, SkillMatch[]>
}

export const extractSkillsFromTextApi = async (text: string): Promise<SkillMatch[]> => {
    if (!text || text.trim().length < 3) return []

    try {
        const response = await fetch('http://127.0.0.1:8001/extract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                top_k: 2
            })
        })

        if (!response.ok) {
            console.error('Skill extraction API failed:', response.statusText)
            return []
        }

        const data: SkillExtractionResponse = await response.json()
        const { extracted_skills, mapped_skills } = data
        const validExtractedSkills = extracted_skills.filter(term =>
            text.toLowerCase().includes(term.toLowerCase())
        )

        const flattenedSkills: SkillMatch[] = []
        validExtractedSkills.forEach(extractedTerm => {
            // Casing Logic: If term is all uppercase (Likely Acronym/Abbreviation), keep it. 
            // Otherwise, convert to lowercase.
            const isAbbreviation = extractedTerm === extractedTerm.toUpperCase()
            const finalName = isAbbreviation ? extractedTerm : extractedTerm.toLowerCase()

            const matches = mapped_skills[extractedTerm]
            if (matches && matches.length > 0) {
                const bestMatch = matches[0]
                flattenedSkills.push({
                    ...bestMatch,
                    name: finalName,
                    onetName: bestMatch.name,
                    originalMatch: extractedTerm
                })
            } else {
                flattenedSkills.push({
                    name: finalName,
                    score: 1.0,
                    soc_codes: [],
                    uuid: extractedTerm,
                    originalMatch: extractedTerm
                })
            }
        })

        // Remove duplicates based on uuid
        const uniqueSkills = flattenedSkills.reduce((acc, current) => {
            const x = acc.find(item => item.uuid === current.uuid)
            if (!x) {
                return acc.concat([current])
            } else {
                return acc
            }
        }, [] as SkillMatch[])

        return uniqueSkills

    } catch (error) {
        console.error('Error calling skill extraction API:', error)
        return []
    }
}
