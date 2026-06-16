
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
    /** LLM model used for extraction, e.g. 'qwen2.5:7b'. Absent for user-entered skills. */
    model?: string
    frameworkMatch: FrameworkMatch[]
}

/** Fallback when the extraction backend does not report which model it used. */
export const DEFAULT_EXTRACTION_MODEL = 'qwen2.5:7b'

interface ExtractedSkill {
    name: string
    source: string
    model?: string
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
    model?: string
    alignment: SkillAlignment[]
}

const extractCache = new Map<string, string[]>()
const searchCache = new Map<string, SkillMatch>()

export const warmupSkillsApi = async (): Promise<void> => {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_SKILLS_API_URL
        await fetch(`${baseUrl}/extract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: 'warmup', top_k: 1 })
        })
    } catch {
    }
}
export const extractRawSkillsApi = async (text: string, signal?: AbortSignal): Promise<string[]> => {
    if (!text || text.trim().length < 3) return []

    if (extractCache.has(text)) {
        return extractCache.get(text)!
    }

    try {
        const baseUrl = process.env.NEXT_PUBLIC_SKILLS_API_URL
        const res = await fetch(`${baseUrl}/extract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, top_k: 2 }),
            signal
        })
        if (!res.ok) return []
        const data = await res.json()
        const skills: ExtractedSkill[] = data.extracted_skills ?? []
        const lowerText = text.toLowerCase()
        const result = skills
            .map(s => s.name)
            .filter(name => lowerText.includes(name.toLowerCase()))
            .sort((a, b) => lowerText.indexOf(a.toLowerCase()) - lowerText.indexOf(b.toLowerCase()))

        extractCache.set(text, result)
        return result
    } catch (error: any) {
        if (error.name === 'AbortError') throw error;
        return []
    }
}

/**
 * Step 2: Map skill names to O*NET skills (calls /search).
 * `sourcesByName` (keyed by lowercased name) marks where each skill came from:
 * 'user' for manual UI additions, 'ollama' (default) for LLM-extracted names.
 */
export const searchSkillsApi = async (
    skillNames: string[],
    signal?: AbortSignal,
    sourcesByName?: Record<string, string>
): Promise<SkillMatch[]> => {
    if (!skillNames.length) return []

    const uncachedNames: string[] = []
    const cachedResults: SkillMatch[] = []

    for (const name of skillNames) {
        const lowerName = name.toLowerCase()
        if (searchCache.has(lowerName)) {
            cachedResults.push(searchCache.get(lowerName)!)
        } else {
            uncachedNames.push(name)
        }
    }

    let fetchedResults: SkillMatch[] = []

    if (uncachedNames.length > 0) {
        try {
            const payload: ExtractedSkill[] = uncachedNames.map(name => ({
                name,
                source: sourcesByName?.[name.toLowerCase()] ?? 'ollama'
            }))
            const baseUrl = process.env.NEXT_PUBLIC_SKILLS_API_URL
            const res = await fetch(`${baseUrl}/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ extracted_skills: payload, top_k: 2 }),
                signal
            })
            if (!res.ok) return cachedResults
            const data = await res.json()
            const skillResults: SearchSkillResult[] = data.skill ?? []

            fetchedResults = skillResults.map(skillResult => {
                const isAbbreviation = skillResult.name === skillResult.name.toUpperCase()
                const finalName = isAbbreviation ? skillResult.name : skillResult.name.toLowerCase()
                const source = skillResult.source ?? 'ollama'
                return {
                    id: skillResult.alignment?.[0]?.id ?? `urn:uuid:${skillResult.name}`,
                    name: finalName,
                    source,
                    ...(source !== 'user'
                        ? { model: skillResult.model ?? DEFAULT_EXTRACTION_MODEL }
                        : {}),
                    frameworkMatch: skillResult.alignment?.map(a => ({
                        framework: 'O*Net',
                        socCode: a.targetCode ?? [],
                        name: a.targetName ?? '',
                        similarityScore: a['similarity score'] ?? 0
                    })) ?? []
                }
            })

            fetchedResults.forEach(result => {
                searchCache.set(result.name.toLowerCase(), result)
            })
        } catch (error: any) {
            if (error.name === 'AbortError') throw error;
        }
    }

    const allResults = [...cachedResults, ...fetchedResults]

    return allResults.sort((a, b) => {
        const indexA = skillNames.findIndex(name => name.toLowerCase() === a.name.toLowerCase())
        const indexB = skillNames.findIndex(name => name.toLowerCase() === b.name.toLowerCase())
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
    })
}
export const extractSkillsFromTextApi = async (text: string, signal?: AbortSignal): Promise<SkillMatch[]> => {
    const names = await extractRawSkillsApi(text, signal)
    return searchSkillsApi(names, signal)
}
