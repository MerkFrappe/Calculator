document.addEventListener('DOMContentLoaded', () => {
    const dataTableBody = document.querySelector('#data-table tbody');
    const addRowBtn = document.getElementById('add-row-btn');
    const removeRowBtn = document.getElementById('remove-row-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const autoComputeToggle = document.getElementById('auto-compute-toggle');
    const resetTableBtn = document.getElementById('reset-table-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const heroCalcBtn = document.getElementById('hero-calc-btn');
    const heroAddBtn = document.getElementById('hero-add-btn');

    const meanResult = document.querySelector('[data-target="mean"]');
    const medianResult = document.querySelector('[data-target="median"]');
    const modeResult = document.querySelector('[data-target="mode"]');
    const varianceResult = document.querySelector('[data-target="variance"]');
    const stdDevResult = document.querySelector('[data-target="stdDev"]');
    const breakdownContent = document.getElementById('breakdown-content');

    let groupedData = [];
    let autoComputeEnabled = false;

    // --- Utility Functions ---

    /**
     * Animates a number counter from a start value to an end value.
     * @param {HTMLElement} element The DOM element to update.
     * @param {number} start The starting number.
     * @param {number} end The target number.
     * @param {number} duration The duration of the animation in milliseconds.
     */
    function animateNumber(element, start, end, duration) {
        const range = end - start;
        let current = start;
        const increment = end > start ? 1 : -1;
        const stepTime = Math.abs(Math.floor(duration / range));
        let lastValue = start;

        // Clear any existing animation interval to prevent multiple animations on the same element
        if (element.animationInterval) {
            clearInterval(element.animationInterval);
        }

        element.animationInterval = setInterval(() => {
            current += increment;
            // Ensure we don't overshoot the target
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                clearInterval(element.animationInterval);
                element.textContent = end.toFixed(2);
            } else {
                element.textContent = current.toFixed(2);
            }
        }, stepTime);
    }

    /**
     * Validates a number input field.
     * @param {HTMLInputElement} inputElement The input element to validate.
     * @returns {boolean} True if the input is valid, false otherwise.
     */
    function validateInput(inputElement) {
        const value = inputElement.value;
        // Allow empty string for initial state, but check for non-negative numbers
        const isValid = value === '' || (!isNaN(value) && isFinite(value) && parseFloat(value) >= 0);
        if (isValid) {
            inputElement.classList.remove('error-glow');
        } else {
            inputElement.classList.add('error-glow');
        }
        return isValid;
    }

    /**
     * Gathers data from the table, validates it, and returns an array of objects.
     * @returns {Array<Object>|null} An array of grouped data objects, or null if there are validation errors.
     */
    function getTableData() {
        const rows = dataTableBody.querySelectorAll('tr');
        const data = [];
        let hasError = false;

        rows.forEach((row) => {
            const lowerInput = row.querySelector('.lower-limit-input');
            const upperInput = row.querySelector('.upper-limit-input');
            const freqInput = row.querySelector('.frequency-input');

            // Validate inputs
            const lowerValid = validateInput(lowerInput);
            const upperValid = validateInput(upperInput);
            const freqValid = validateInput(freqInput);

            if (!lowerValid || !upperValid || !freqValid) {
                hasError = true;
            }

            const lower = parseFloat(lowerInput.value);
            const upper = parseFloat(upperInput.value);
            const frequency = parseFloat(freqInput.value);

            // Check for valid numbers and class interval order
            if (!isNaN(lower) && !isNaN(upper) && !isNaN(frequency)) {
                if (lower >= upper) {
                    lowerInput.classList.add('error-glow');
                    upperInput.classList.add('error-glow');
                    hasError = true;
                }
                data.push({ lower, upper, frequency });
            } else if (lowerInput.value !== '' || upperInput.value !== '' || freqInput.value !== '') {
                // If any field has input but is not a valid number, mark as error
                hasError = true;
            }
        });

        if (hasError) {
            alert('Please correct the invalid inputs in the table. Lower limit must be less than upper limit, and all inputs must be non-negative numbers.');
            return null; // Indicate error
        }
        return data;
    }

    /**
     * Renders the grouped data array into the HTML table.
     */
    function renderTable() {
        dataTableBody.innerHTML = ''; // Clear existing rows
        if (groupedData.length === 0) {
            // Add an initial empty row if the table is empty
            addRow();
            return;
        }

        groupedData.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="number" class="lower-limit-input" value="${row.lower}" min="0"></td>
                <td><input type="number" class="upper-limit-input" value="${row.upper}" min="0"></td>
                <td><input type="number" class="frequency-input" value="${row.frequency}" min="0"></td>
                <td><button class="remove-row-btn" data-index="${index}"><i class="fas fa-times"></i></button></td>
            `;
            dataTableBody.appendChild(tr);
        });

        // Attach event listeners to new inputs
        dataTableBody.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', handleTableInput);
            input.addEventListener('change', handleTableInput); // For blur/enter
        });
        dataTableBody.querySelectorAll('.remove-row-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const indexToRemove = parseInt(event.currentTarget.dataset.index);
                removeRow(indexToRemove);
            });
        });
    }

    /**
     * Adds a new empty row to the groupedData array and re-renders the table.
     */
    function addRow() {
        groupedData.push({ lower: '', upper: '', frequency: '' });
        renderTable();
    }

    /**
     * Removes a row from the groupedData array and re-renders the table.
     * If no index is provided, removes the last row. Ensures at least one row remains.
     * @param {number} [index=-1] The index of the row to remove.
     */
    function removeRow(index = -1) {
        if (groupedData.length > 1) { // Always keep at least one row
            if (index === -1 || index >= groupedData.length) {
                groupedData.pop(); // Remove last row by default
            } else {
                groupedData.splice(index, 1); // Remove specific row
            }
            renderTable();
            if (autoComputeEnabled) {
                calculateAndDisplayStatistics();
            }
        } else if (groupedData.length === 1) {
            // If only one row, clear its content instead of removing it
            groupedData[0] = { lower: '', upper: '', frequency: '' };
            renderTable();
            if (autoComputeEnabled) {
                calculateAndDisplayStatistics();
            }
        }
    }

    /**
     * Handles input changes in the table, validates, updates data, and triggers auto-compute if enabled.
     * @param {Event} event The input event.
     */
    function handleTableInput(event) {
        const input = event.target;
        validateInput(input);

        const row = input.closest('tr');
        const rowIndex = Array.from(dataTableBody.children).indexOf(row);

        if (rowIndex !== -1) {
            if (input.classList.contains('lower-limit-input')) {
                groupedData[rowIndex].lower = input.value === '' ? '' : parseFloat(input.value);
            } else if (input.classList.contains('upper-limit-input')) {
                groupedData[rowIndex].upper = input.value === '' ? '' : parseFloat(input.value);
            } else if (input.classList.contains('frequency-input')) {
                groupedData[rowIndex].frequency = input.value === '' ? '' : parseFloat(input.value);
            }
        }

        if (autoComputeEnabled) {
            calculateAndDisplayStatistics();
        }
    }

    // --- Statistics Calculations ---

    /**
     * Calculates grouped Mean, Median, Mode, Variance, and Standard Deviation.
     * @param {Array<Object>} data An array of objects, each with lower, upper, and frequency.
     * @returns {{results: Object, breakdown: Object}} An object containing the calculated statistics and step-by-step breakdown.
     */
    function calculateGroupedStatistics(data) {
        const results = {
            mean: NaN,
            median: NaN,
            mode: NaN,
            variance: NaN,
            stdDev: NaN,
        };
        const breakdown = {
            midpoints: [],
            fx: [],
            cumulativeFrequency: [],
            deviationSquared: [],
            fDeviationSquared: [],
        };

        // Basic validation for calculation
        if (!data || data.length === 0 || data.some(d => isNaN(d.lower) || isNaN(d.upper) || isNaN(d.frequency) || d.frequency < 0 || d.lower >= d.upper)) {
            breakdownContent.innerHTML = '<p class="placeholder-text">Invalid or insufficient data for computation. Please ensure all fields are valid non-negative numbers and lower limit is less than upper limit.</p>';
            return { results, breakdown };
        }

        // Sort data by lower limit to ensure correct cumulative frequency and median/mode class finding
        data.sort((a, b) => a.lower - b.lower);

        let totalFrequency = 0;
        let sumFx = 0;
        let currentCumulativeFreq = 0;

        // Step 1: Calculate Midpoints, f*x, and Cumulative Frequency
        data.forEach((d, i) => {
            const midpoint = (d.lower + d.upper) / 2;
            const fx = d.frequency * midpoint;

            totalFrequency += d.frequency;
            sumFx += fx;
            currentCumulativeFreq += d.frequency;

            breakdown.midpoints.push({ class: `${d.lower}-${d.upper}`, midpoint: midpoint.toFixed(2) });
            breakdown.fx.push({ class: `${d.lower}-${d.upper}`, fx: fx.toFixed(2) });
            breakdown.cumulativeFrequency.push({ class: `${d.lower}-${d.upper}`, cf: currentCumulativeFreq });
        });

        // Check for total frequency
        if (totalFrequency === 0) {
            breakdownContent.innerHTML = '<p class="placeholder-text">Total frequency is zero. Cannot compute statistics.</p>';
            return { results, breakdown };
        }

        // Mean
        results.mean = sumFx / totalFrequency;

        // Median
        const medianPosition = totalFrequency / 2;
        let medianClass = null;
        let cfBeforeMedianClass = 0;
        let medianClassFreq = 0;
        let medianClassLowerLimit = 0;
        let classWidth = 0;

        currentCumulativeFreq = 0; // Reset for median calculation
        for (let i = 0; i < data.length; i++) {
            currentCumulativeFreq += data[i].frequency;
            if (currentCumulativeFreq >= medianPosition) {
                medianClass = data[i];
                medianClassLowerLimit = data[i].lower;
                medianClassFreq = data[i].frequency;
                classWidth = data[i].upper - data[i].lower;
                cfBeforeMedianClass = (i > 0) ? breakdown.cumulativeFrequency[i - 1].cf : 0;
                break;
            }
        }

        if (medianClass && medianClassFreq > 0) {
            results.median = medianClassLowerLimit + (((medianPosition - cfBeforeMedianClass) / medianClassFreq) * classWidth);
        } else {
            results.median = NaN;
        }

        // Mode
        let maxFreq = 0;
        let modalClass = null;
        let modalClassIndex = -1;

        data.forEach((d, i) => {
            if (d.frequency > maxFreq) {
                maxFreq = d.frequency;
                modalClass = d;
                modalClassIndex = i;
            }
        });

        if (modalClass && modalClass.frequency > 0) {
            const f1 = (modalClassIndex > 0) ? data[modalClassIndex - 1].frequency : 0;
            const f2 = (modalClassIndex < data.length - 1) ? data[modalClassIndex + 1].frequency : 0;
            const fm = modalClass.frequency;
            const L = modalClass.lower;
            const w = modalClass.upper - modalClass.lower;

            const denominator = (2 * fm - f1 - f2);
            if (denominator > 0) {
                results.mode = L + ((fm - f1) / denominator) * w;
            } else {
                // If denominator is 0 or negative, it indicates a problematic distribution for this formula (e.g., bimodal, uniform)
                results.mode = NaN;
            }
        } else {
            results.mode = NaN;
        }

        // Variance and Standard Deviation (Population Variance)
        let sumFDeviationSquared = 0;
        if (!isNaN(results.mean)) { // Only calculate if mean is valid
            data.forEach(d => {
                const midpoint = (d.lower + d.upper) / 2;
                const deviation = midpoint - results.mean;
                const deviationSquared = deviation * deviation;
                const fDeviationSquared = d.frequency * deviationSquared;
                sumFDeviationSquared += fDeviationSquared;

                breakdown.deviationSquared.push({ class: `${d.lower}-${d.upper}`, deviationSquared: deviationSquared.toFixed(2) });
                breakdown.fDeviationSquared.push({ class: `${d.lower}-${d.upper}`, fDeviationSquared: fDeviationSquared.toFixed(2) });
            });

            if (totalFrequency > 0) {
                results.variance = sumFDeviationSquared / totalFrequency; // Population variance
                results.stdDev = Math.sqrt(results.variance);
            } else {
                results.variance = NaN;
                results.stdDev = NaN;
            }
        } else {
            results.variance = NaN;
            results.stdDev = NaN;
        }

        return { results, breakdown };
    }

    // --- Display Functions ---

    /**
     * Displays the calculated statistics in the result cards with animation.
     * @param {Object} stats An object containing mean, median, mode, variance, and stdDev.
     */
    function displayResults(stats) {
        const duration = 800; // Animation duration in ms

        // Get current values for animation start, default to 0 if NaN
        const currentMean = parseFloat(meanResult.textContent) || 0;
        const currentMedian = parseFloat(medianResult.textContent) || 0;
        const currentMode = parseFloat(modeResult.textContent) || 0;
        const currentVariance = parseFloat(varianceResult.textContent) || 0;
        const currentStdDev = parseFloat(stdDevResult.textContent) || 0;

        // Ensure target values are numbers, default to 0 if NaN
        const targetMean = isNaN(stats.mean) ? 0 : stats.mean;
        const targetMedian = isNaN(stats.median) ? 0 : stats.median;
        const targetMode = isNaN(stats.mode) ? 0 : stats.mode;
        const targetVariance = isNaN(stats.variance) ? 0 : stats.variance;
        const targetStdDev = isNaN(stats.stdDev) ? 0 : stats.stdDev;

        animateNumber(meanResult, currentMean, targetMean, duration);
        animateNumber(medianResult, currentMedian, targetMedian, duration);
        animateNumber(modeResult, currentMode, targetMode, duration);
        animateNumber(varianceResult, currentVariance, targetVariance, duration);
        animateNumber(stdDevResult, currentStdDev, targetStdDev, duration);
    }

    /**
     * Displays the step-by-step computation breakdown in the right panel.
     * @param {Object} breakdown An object containing arrays for midpoints, fx, cumulative frequency, etc.
     */
    function displayBreakdown(breakdown) {
        let html = '';

        if (breakdown.midpoints.length === 0) {
            html = '<p class="placeholder-text">No valid data to show breakdown.</p>';
        } else {
            html += '<h3>Midpoints (x_mid)</h3><ul>';
            breakdown.midpoints.forEach(item => {
                html += `<li>Class ${item.class}: ${item.midpoint}</li>`;
            });
            html += '</ul>';

            html += '<h3>f * x_mid</h3><ul>';
            breakdown.fx.forEach(item => {
                html += `<li>Class ${item.class}: ${item.fx}</li>`;
            });
            html += '</ul>';

            html += '<h3>Cumulative Frequency (cf)</h3><ul>';
            breakdown.cumulativeFrequency.forEach(item => {
                html += `<li>Class ${item.class}: ${item.cf}</li>`;
            });
            html += '</ul>';

            if (breakdown.deviationSquared.length > 0 && !isNaN(parseFloat(breakdown.deviationSquared[0].deviationSquared))) {
                html += '<h3>(x_mid - Mean)&sup2;</h3><ul>';
                breakdown.deviationSquared.forEach(item => {
                    html += `<li>Class ${item.class}: ${item.deviationSquared}</li>`;
                });
                html += '</ul>';

                html += '<h3>f * (x_mid - Mean)&sup2;</h3><ul>';
                breakdown.fDeviationSquared.forEach(item => {
                    html += `<li>Class ${item.class}: ${item.fDeviationSquared}</li>`;
                });
                html += '</ul>';
            } else {
                html += '<p class="placeholder-text">Deviation calculations not available (e.g., mean is NaN).</p>';
            }
        }
        breakdownContent.innerHTML = html;
    }

    /**
     * Orchestrates getting data, calculating statistics, and displaying results/breakdown.
     */
    function calculateAndDisplayStatistics() {
        const currentData = getTableData();
        if (!currentData || currentData.length === 0 || currentData.some(d => d.lower === '' || d.upper === '' || d.frequency === '')) {
            // Clear results and breakdown if data is invalid or incomplete
            displayResults({ mean: 0, median: 0, mode: 0, variance: 0, stdDev: 0 });
            breakdownContent.innerHTML = '<p class="placeholder-text">Enter data and click \'Calculate\' to see step-by-step computations.</p>';
            return;
        }

        // Try backend first; fallback to client calculation on failure
        sendToBackend(currentData).then(serverResult => {
            if (serverResult) {
                // Build results object compatible with displayResults
                const results = {
                    mean: serverResult.mean,
                    median: serverResult.median,
                    mode: serverResult.mode,
                    variance: serverResult.variance,
                    stdDev: serverResult.std_dev,
                };

                // Build breakdown from server dataset and mean
                const breakdown = { midpoints: [], fx: [], cumulativeFrequency: [], deviationSquared: [], fDeviationSquared: [] };
                let cum = 0;
                serverResult.dataset.forEach(d => {
                    const midpoint = (d.l + d.u) / 2;
                    const fx = d.f * midpoint;
                    cum += d.f;
                    breakdown.midpoints.push({ class: `${d.l}-${d.u}`, midpoint: midpoint.toFixed(2) });
                    breakdown.fx.push({ class: `${d.l}-${d.u}`, fx: fx.toFixed(2) });
                    breakdown.cumulativeFrequency.push({ class: `${d.l}-${d.u}`, cf: cum });
                    const deviationSquared = ((midpoint - serverResult.mean) ** 2).toFixed(2);
                    const fDeviationSquared = (d.f * Math.pow(midpoint - serverResult.mean, 2)).toFixed(2);
                    breakdown.deviationSquared.push({ class: `${d.l}-${d.u}`, deviationSquared });
                    breakdown.fDeviationSquared.push({ class: `${d.l}-${d.u}`, fDeviationSquared });
                });

                displayResults(results);
                displayBreakdown(breakdown);
                return;
            }

            // Fallback to client-side if server call failed
            const { results, breakdown } = calculateGroupedStatistics(currentData);
            displayResults(results);
            displayBreakdown(breakdown);
        }).catch(() => {
            const { results, breakdown } = calculateGroupedStatistics(currentData);
            displayResults(results);
            displayBreakdown(breakdown);
        });
    }


    /**
     * Send data to backend compute endpoint. Returns parsed JSON on success or null on failure.
     * @param {Array<Object>} data
     * @returns {Promise<Object|null>}
     */
    async function sendToBackend(data) {
        try {
            const payload = { dataset: data.map(d => ({ l: d.lower, u: d.upper, f: d.frequency })) };
            const resp = await fetch('/api/compute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!resp.ok) return null;
            const json = await resp.json();
            return json;
        } catch (err) {
            console.warn('Backend compute failed, falling back to client:', err);
            return null;
        }
    }

    // --- Event Listeners ---

    addRowBtn.addEventListener('click', addRow);
    removeRowBtn.addEventListener('click', () => removeRow()); // Remove last row by default
    calculateBtn.addEventListener('click', calculateAndDisplayStatistics);

    autoComputeToggle.addEventListener('change', (event) => {
        autoComputeEnabled = event.target.checked;
        if (autoComputeEnabled) {
            calculateAndDisplayStatistics();
        }
    });

    if (heroCalcBtn) {
        heroCalcBtn.addEventListener('click', () => {
            calculateAndDisplayStatistics();
            heroCalcBtn.classList.add('cta-pulse');
            setTimeout(() => heroCalcBtn.classList.remove('cta-pulse'), 500);
            document.querySelector('.center-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    if (heroAddBtn) {
        heroAddBtn.addEventListener('click', () => {
            addRow();
            document.querySelector('.left-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const lastInput = dataTableBody.querySelector('tr:last-child input');
            if (lastInput) {
                lastInput.focus();
            }
        });
    }

    resetTableBtn.addEventListener('click', () => {
        groupedData = [];
        renderTable(); // This will add one empty row
        displayResults({ mean: 0, median: 0, mode: 0, variance: 0, stdDev: 0 });
        breakdownContent.innerHTML = '<p class="placeholder-text">Enter data and click \'Calculate\' to see step-by-step computations.</p>';
    });

    exportPdfBtn.addEventListener('click', () => {
        alert('Export to PDF functionality is not implemented in this pure JS example. You would typically use a library like jsPDF for this.');
        // For a pure JS approach, one might try to print the page or generate a very basic text file.
        // window.print(); // This would print the whole page, not just specific results.
    });

    // Initial render and calculation when the page loads
    renderTable(); // Ensures at least one row is present
    calculateAndDisplayStatistics(); // Calculate with initial (likely empty) data to show 0s and placeholder

    // --- Update Hero Title ---
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        heroTitle.textContent = 'ProjectMYMD';
    }

    // --- Shiny Sparkle Effect ---
    function createSparkle() {
        const sparkle = document.createElement('div');
        sparkle.classList.add('sparkle');
        
        // Random position
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        const size = Math.random() * 3 + 1; // Random size 1-4px
        
        sparkle.style.left = `${x}px`;
        sparkle.style.top = `${y}px`;
        sparkle.style.width = `${size}px`;
        sparkle.style.height = `${size}px`;

        document.body.appendChild(sparkle);

        // Remove after animation completes
        setTimeout(() => {
            sparkle.remove();
        }, 2000);
    }

    // Generate sparkles periodically
    setInterval(createSparkle, 500);
});
