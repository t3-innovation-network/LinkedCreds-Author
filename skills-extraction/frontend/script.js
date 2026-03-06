const API_URL = '';

document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('inputText');

    const resultsSection = document.getElementById('resultsSection');
    const loaderContainer = document.getElementById('loaderContainer');
    const statsDiv = document.getElementById('stats');

    let debounceTimer;
    let abortController = null;
    let currentSkills = [];

    // Sync scroll


    // Input event
    inputText.addEventListener('input', () => {
        const text = inputText.value;


        // Debounce API call
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            extractSkills(text);
        }, 1000); // 1 second debounce
    });

    async function extractSkills(text) {
        if (!text.trim()) {
            currentSkills = [];

            resultsSection.innerHTML = '';
            statsDiv.textContent = '';
            return;
        }

        // Cancel previous request
        if (abortController) {
            abortController.abort();
        }
        abortController = new AbortController();

        setLoading(true);
        const startTime = performance.now();

        try {
            // 1. Extract skills
            const extractResponse = await fetch(`${API_URL}/extract`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text, top_k: 3 }),
                signal: abortController.signal
            });

            if (!extractResponse.ok) {
                throw new Error(`Extract Error: ${extractResponse.statusText}`);
            }

            const extractData = await extractResponse.json();
            currentSkills = extractData.extracted_skills;

            if (!currentSkills || currentSkills.length === 0) {
                renderResults({
                    skill: [],
                    execution_time: (performance.now() - startTime) / 1000
                });
                return;
            }

            // 2. Search skills (map to O*NET)
            const searchResponse = await fetch(`${API_URL}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ extracted_skills: currentSkills, top_k: 3 }),
                signal: abortController.signal
            });

            if (!searchResponse.ok) {
                throw new Error(`Search Error: ${searchResponse.statusText}`);
            }

            const searchData = await searchResponse.json();
            searchData.execution_time = (performance.now() - startTime) / 1000;

            renderResults(searchData);

        } catch (error) {
            if (error.name === 'AbortError') {
                return; // Ignore aborted requests
            }
            console.error('Extraction failed:', error);
            // Don't clear results on error, just log it
        } finally {
            setLoading(false);
        }
    }





    function setLoading(isLoading) {
        if (isLoading) {
            loaderContainer.style.display = 'flex';
        } else {
            loaderContainer.style.display = 'none';
        }
    }

    function renderResults(data) {
        const skills = data.skill || [];
        const execution_time = data.execution_time;

        // Update stats
        const timeStr = execution_time ? execution_time.toFixed(2) : '0.00';
        statsDiv.textContent = `Found ${skills.length} skills in ${timeStr}s`;

        resultsSection.innerHTML = '';

        if (skills.length === 0) {
            return;
        }

        skills.forEach(skillObj => {
            const card = document.createElement('div');
            card.className = 'skill-card';

            const header = document.createElement('div');
            header.className = 'extracted-skill';
            header.textContent = skillObj.name;
            card.appendChild(header);

            const mappedContainer = document.createElement('div');
            mappedContainer.className = 'mapped-skills';

            const related = skillObj.alignment || [];
            if (related.length > 0) {
                related.forEach(item => {
                    const row = document.createElement('div');
                    row.className = 'mapped-item';

                    // Header row with Name and Score
                    const headerRow = document.createElement('div');
                    headerRow.style.display = 'flex';
                    headerRow.style.justifyContent = 'space-between';
                    headerRow.style.alignItems = 'center';

                    const name = document.createElement('span');
                    name.className = 'mapped-name';
                    name.textContent = item.targetName;

                    const score = document.createElement('span');
                    score.className = 'mapped-score';
                    score.textContent = `${(item['similarity score'] * 100).toFixed(0)}%`;

                    headerRow.appendChild(name);
                    headerRow.appendChild(score);
                    row.appendChild(headerRow);

                    // Details row with SOC and UUID
                    const detailsDiv = document.createElement('div');
                    detailsDiv.style.fontSize = '0.8rem';
                    detailsDiv.style.color = '#666';
                    detailsDiv.style.marginTop = '4px';

                    if (item.targetCode && item.targetCode.length > 0) {
                        const socDiv = document.createElement('div');
                        socDiv.innerHTML = `<strong>SOC:</strong> ${item.targetCode.join(', ')}`;
                        detailsDiv.appendChild(socDiv);
                    }

                    if (item.id) {
                        const uuidDiv = document.createElement('div');
                        uuidDiv.innerHTML = `<strong>UUID:</strong> <span style="font-family: monospace;">${item.id}</span>`;
                        detailsDiv.appendChild(uuidDiv);
                    }

                    row.appendChild(detailsDiv);
                    mappedContainer.appendChild(row);
                });
            } else {
                const empty = document.createElement('div');
                empty.className = 'mapped-item';
                empty.textContent = 'No O*NET match found';
                mappedContainer.appendChild(empty);
            }

            card.appendChild(mappedContainer);
            resultsSection.appendChild(card);
        });
    }
});
