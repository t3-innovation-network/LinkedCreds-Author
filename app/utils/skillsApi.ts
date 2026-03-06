
export interface FrameworkMatch {
    framework: string
    socCode: string[]
    name: string
    similarityScore: number
}

export interface SkillMatch {
    id: string
    name: string
    description?: string
    source: string
    frameworkMatch: FrameworkMatch[]
}

interface ExtractedSkill {
    name: string
    source: string
}

interface SkillAlignment {
    targetName: string
    'similarity score': number
    targetCode: string[]
    id: string
    targetFramework?: string
}

interface SearchSkillResult {
    name: string
    source: string
    alignment: SkillAlignment[]
}

/** Step 1: Extract raw skill names from text (calls /extract) */
export const extractRawSkillsApi = async (text: string): Promise<string[]> => {
    if (!text || text.trim().length < 3) return []
    try {
        const res = await fetch('http://18.190.248.100:8001/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, top_k: 2 })
        })
        if (!res.ok) return []
        const data = await res.json()
        const skills: ExtractedSkill[] = data.extracted_skills ?? []
        // Filter to only names that appear in the original text
        return skills
            .map(s => s.name)
            .filter(name => text.toLowerCase().includes(name.toLowerCase()))
    } catch {
        return []
    }
}

/** Step 2: Map skill names to O*NET skills (calls /search) */
export const searchSkillsApi = async (skillNames: string[]): Promise<SkillMatch[]> => {
    if (!skillNames.length) return []
    try {
        const payload: ExtractedSkill[] = skillNames.map(name => ({ name, source: 'user' }))
        const res = await fetch('http://18.190.248.100:8001/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ extracted_skills: payload, top_k: 2 })
        })
        if (!res.ok) return []
        const data = await res.json()
        const skillResults: SearchSkillResult[] = data.skill ?? []

        return skillResults.map(skillResult => {
            const isAbbreviation = skillResult.name === skillResult.name.toUpperCase()
            const finalName = isAbbreviation ? skillResult.name : skillResult.name.toLowerCase()
            return {
                id: skillResult.alignment?.[0]?.id ?? `urn:uuid:${skillResult.name}`,
                name: finalName,
                source: skillResult.source ?? 'ollama',
                frameworkMatch: skillResult.alignment?.map(a => ({
                    framework: 'O*Net',
                    socCode: a.targetCode ?? [],
                    name: a.targetName ?? '',
                    similarityScore: a['similarity score'] ?? 0
                })) ?? []
            }
        })
    } catch {
        return []
    }
}

/** Combined convenience: extract + search in one call */
export const extractSkillsFromTextApi = async (text: string): Promise<SkillMatch[]> => {
    const names = await extractRawSkillsApi(text)
    return searchSkillsApi(names)
}
