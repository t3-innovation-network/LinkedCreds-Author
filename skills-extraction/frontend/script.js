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

        try {
            const response = await fetch(`${API_URL}/extract`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text, top_k: 3 }),
                signal: abortController.signal
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const data = await response.json();
            currentSkills = data.extracted_skills;


            renderResults(data);

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
        const { extracted_skills, mapped_skills, execution_time } = data;

        // Update stats
        statsDiv.textContent = `Found ${extracted_skills.length} skills in ${execution_time.toFixed(2)}s`;

        resultsSection.innerHTML = '';

        if (extracted_skills.length === 0) {
            return;
        }

        extracted_skills.forEach(skill => {
            const card = document.createElement('div');
            card.className = 'skill-card';

            const header = document.createElement('div');
            header.className = 'extracted-skill';
            header.textContent = skill;
            card.appendChild(header);

            const mappedContainer = document.createElement('div');
            mappedContainer.className = 'mapped-skills';

            const related = mapped_skills[skill] || [];
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
                    name.textContent = item.name;

                    const score = document.createElement('span');
                    score.className = 'mapped-score';
                    score.textContent = `${(item.score * 100).toFixed(0)}%`;

                    headerRow.appendChild(name);
                    headerRow.appendChild(score);
                    row.appendChild(headerRow);

                    // Details row with SOC and UUID
                    const detailsDiv = document.createElement('div');
                    detailsDiv.style.fontSize = '0.8rem';
                    detailsDiv.style.color = '#666';
                    detailsDiv.style.marginTop = '4px';

                    if (item.soc_codes && item.soc_codes.length > 0) {
                        const socDiv = document.createElement('div');
                        socDiv.innerHTML = `<strong>SOC:</strong> ${item.soc_codes.join(', ')}`;
                        detailsDiv.appendChild(socDiv);
                    }

                    if (item.uuid) {
                        const uuidDiv = document.createElement('div');
                        uuidDiv.innerHTML = `<strong>UUID:</strong> <span style="font-family: monospace;">${item.uuid}</span>`;
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
