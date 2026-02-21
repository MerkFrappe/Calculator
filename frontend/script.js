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
    const toggleDataTypeBtn = document.getElementById('toggle-data-type-btn');
    const dataTypeText = document.getElementById('data-type-text');
    const headerCol1 = document.querySelector('#data-table thead th:nth-child(1)');
    const headerCol2 = document.querySelector('#data-table thead th:nth-child(2)');
    const headerCol3 = document.querySelector('#data-table thead th:nth-child(3)');
    const breakdownContent = document.getElementById('breakdown-content');

    let groupedData = [];
    let rawData = []; // ADD THIS LINE (raw)
    let autoComputeEnabled = false;
    let dataType = 'grouped'; // ADD THIS LINE - 'grouped' or 'ungrouped' (raw)
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
 * Toggles between grouped and ungrouped data input (raw)
 */
function toggleDataType() {
    // Clear existing data
    if (dataType === 'grouped') {
        dataType = 'ungrouped';
        dataTypeText.textContent = 'Switch to Grouped';
        headerCol1.textContent = 'Value';
        headerCol2.textContent = 'Frequency';
        headerCol3.style.display = 'none'; // Hide third column
    } else {
        dataType = 'grouped';
        dataTypeText.textContent = 'Switch to Ungrouped';
        headerCol1.textContent = 'Lower Limit';
        headerCol2.textContent = 'Upper Limit';
        headerCol3.style.display = ''; // Show third column
    }
    
    // Clear data arrays
    groupedData = [];
    rawData = [];
    
    // Add initial empty row
    addRow();
    
    // Clear results
    displayResults({ mean: 0, median: 0, mode: 0, variance: 0, stdDev: 0 });
    breakdownContent.innerHTML = '<p class="placeholder-text">Enter data and click \'Calculate\' to see step-by-step computations.</p>';
}

    /**
     * Gathers data from the table, validates it, and returns an array of objects.
     * @returns {Array<Object>|null} An array of grouped data objects, or null if there are validation errors.
     */
function getTableData() {
    const rows = dataTableBody.querySelectorAll('tr');
    const data = [];
    let hasError = false;

    if (dataType === 'grouped') {
        rows.forEach((row) => {
            const lowerInput = row.querySelector('.lower-limit-input');
            const upperInput = row.querySelector('.upper-limit-input');
            const freqInput = row.querySelector('.frequency-input');

            if (!lowerInput || !upperInput || !freqInput) return;

            const lowerValid = validateInput(lowerInput);
            const upperValid = validateInput(upperInput);
            const freqValid = validateInput(freqInput);

            if (!lowerValid || !upperValid || !freqValid) {
                hasError = true;
            }

            const lower = parseFloat(lowerInput.value);
            const upper = parseFloat(upperInput.value);
            const frequency = parseFloat(freqInput.value);

            if (!isNaN(lower) && !isNaN(upper) && !isNaN(frequency)) {
                if (lower >= upper) {
                    lowerInput.classList.add('error-glow');
                    upperInput.classList.add('error-glow');
                    hasError = true;
                }
                data.push({ lower, upper, frequency });
            } else if (lowerInput.value !== '' || upperInput.value !== '' || freqInput.value !== '') {
                hasError = true;
            }
        });
    } else {
        rows.forEach((row) => {
            const valueInput = row.querySelector('.value-input');
            const freqInput = row.querySelector('.frequency-input');

            if (!valueInput || !freqInput) return;

            const valueValid = validateInput(valueInput);
            const freqValid = validateInput(freqInput);

            if (!valueValid || !freqValid) {
                hasError = true;
            }

            const value = parseFloat(valueInput.value);
            const frequency = parseFloat(freqInput.value);

            if (!isNaN(value) && !isNaN(frequency)) {
                data.push({ value, frequency });
            } else if (valueInput.value !== '' || freqInput.value !== '') {
                hasError = true;
            }
        });
    }

    if (hasError) {
        alert('Please correct the invalid inputs in the table.');
        return null;
    }
    return data;
}    /**
     * Adds a new empty row to the groupedData array and re-renders the table.
     */
    function addRow() {
    if (dataType === 'grouped') {
        groupedData.push({ lower: '', upper: '', frequency: '' });
    } else {
        rawData.push({ value: '', frequency: '' });
    }
    renderTable();
}

    /**
     * Removes a row from the groupedData array and re-renders the table.
     * If no index is provided, removes the last row. Ensures at least one row remains.
     * @param {number} [index=-1] The index of the row to remove.
     */
   function removeRow(index = -1) {
    if (dataType === 'grouped') {
        if (groupedData.length > 1) {
            if (index === -1 || index >= groupedData.length) {
                groupedData.pop();
            } else {
                groupedData.splice(index, 1);
            }
            renderTable();
        } else if (groupedData.length === 1) {
            groupedData[0] = { lower: '', upper: '', frequency: '' };
            renderTable();
        }
    } else {
        if (rawData.length > 1) {
            if (index === -1 || index >= rawData.length) {
                rawData.pop();
            } else {
                rawData.splice(index, 1);
            }
            renderTable();
        } else if (rawData.length === 1) {
            rawData[0] = { value: '', frequency: '' };
            renderTable();
        }
    }
    
    if (autoComputeEnabled) {
        calculateAndDisplayStatistics();
    }
}

    /**
     * Handles input changes in the table, validates, updates data, and triggers auto-compute if enabled.
     * @param {Event} event The input event.
     */
    function renderTable() {
    dataTableBody.innerHTML = '';
    
    if (dataType === 'grouped') {
        if (groupedData.length === 0) {
            groupedData.push({ lower: '', upper: '', frequency: '' });
        }

        groupedData.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="number" class="lower-limit-input" value="${row.lower}" min="0" step="any"></td>
                <td><input type="number" class="upper-limit-input" value="${row.upper}" min="0" step="any"></td>
                <td><input type="number" class="frequency-input" value="${row.frequency}" min="0" step="any"></td>
                <td><button class="remove-row-btn" data-index="${index}"><i class="fas fa-times"></i></button></td>
            `;
            dataTableBody.appendChild(tr);
        });
    } else {
        if (rawData.length === 0) {
            rawData.push({ value: '', frequency: '' });
        }

        rawData.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="number" class="value-input" value="${row.value}" min="0" step="any"></td>
                <td><input type="number" class="frequency-input" value="${row.frequency}" min="0" step="any"></td>
                <td style="display: none;"></td>
                <td><input type="number" class="value-input" value="${row.value}" min="0" step="any" placeholder="Value"></td>
                <td><input type="number" class="frequency-input" value="${row.frequency}" min="0" step="any" placeholder="Frequency"></td>
                <td><button class="remove-row-btn" data-index="${index}"><i class="fas fa-times"></i></button></td>
            `;
            dataTableBody.appendChild(tr);
        });
    }

    // Attach event listeners
    // Hide the third column cell for ungrouped data rows
    if (dataType === 'ungrouped') {
        dataTableBody.querySelectorAll('tr').forEach(tr => {
            tr.children[2].style.display = 'none';
        });
    }
    dataTableBody.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', handleTableInput);
        input.addEventListener('change', handleTableInput);
    });
    
    dataTableBody.querySelectorAll('.remove-row-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const indexToRemove = parseInt(event.currentTarget.dataset.index);
            removeRow(indexToRemove);
        });
    });
}
    function handleTableInput(event) {
    const input = event.target;
    validateInput(input);

    const row = input.closest('tr');
    const rowIndex = Array.from(dataTableBody.children).indexOf(row);

    if (rowIndex !== -1) {
        if (dataType === 'grouped') {
            if (input.classList.contains('lower-limit-input')) {
                groupedData[rowIndex].lower = input.value === '' ? '' : parseFloat(input.value);
            } else if (input.classList.contains('upper-limit-input')) {
                groupedData[rowIndex].upper = input.value === '' ? '' : parseFloat(input.value);
            } else if (input.classList.contains('frequency-input')) {
                groupedData[rowIndex].frequency = input.value === '' ? '' : parseFloat(input.value);
            }
        } else {
            if (input.classList.contains('value-input')) {
                rawData[rowIndex].value = input.value === '' ? '' : parseFloat(input.value);
            } else if (input.classList.contains('frequency-input')) {
                rawData[rowIndex].frequency = input.value === '' ? '' : parseFloat(input.value);
            }
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
   function calculateUngroupedStatistics(data) {
    const results = {
        mean: NaN,
        median: NaN,
        mode: NaN,
        variance: NaN,
        stdDev: NaN,
    };
    const breakdown = {
        values: [],
        frequencies: [],
        cumulativeFrequency: [],
        deviations: [],
        deviationsSquared: [],
    };

    if (!data || data.length === 0 || data.some(d => isNaN(d.value) || isNaN(d.frequency) || d.frequency < 0)) {
        return { results, breakdown };
    }

    // Sort by value
    data.sort((a, b) => a.value - b.value);

    // Expand data for calculations
    let expandedData = [];
    data.forEach(d => {
        for (let i = 0; i < d.frequency; i++) {
            expandedData.push(d.value);
        }
    });

    const totalFrequency = expandedData.length;
    
    if (totalFrequency === 0) {
        return { results, breakdown };
    }

    // Mean
    const sum = expandedData.reduce((acc, val) => acc + val, 0);
    results.mean = sum / totalFrequency;

    // Median
    expandedData.sort((a, b) => a - b);
    const midIndex = Math.floor(totalFrequency / 2);
    if (totalFrequency % 2 === 0) {
        results.median = (expandedData[midIndex - 1] + expandedData[midIndex]) / 2;
    } else {
        results.median = expandedData[midIndex];
    }

    // Mode
    const frequencyMap = new Map();
    expandedData.forEach(val => {
        frequencyMap.set(val, (frequencyMap.get(val) || 0) + 1);
    });
    
    let maxFreq = 0;
    let modes = [];
    frequencyMap.forEach((freq, val) => {
        if (freq > maxFreq) {
            maxFreq = freq;
            modes = [val];
        } else if (freq === maxFreq) {
            modes.push(val);
        }
    });
    
    results.mode = modes.length === 1 ? modes[0] : NaN;

    // Variance and Standard Deviation
    const squaredDeviations = expandedData.map(val => Math.pow(val - results.mean, 2));
    const sumSquaredDeviations = squaredDeviations.reduce((acc, val) => acc + val, 0);
    results.variance = sumSquaredDeviations / totalFrequency;
    results.stdDev = Math.sqrt(results.variance);

    // Build breakdown
    let cumulativeFreq = 0;
    data.forEach(d => {
        const deviation = d.value - results.mean;
        const deviationSquared = Math.pow(deviation, 2);
        
        breakdown.values.push({ value: d.value, frequency: d.frequency });
        cumulativeFreq += d.frequency;
        breakdown.cumulativeFrequency.push({ value: d.value, cf: cumulativeFreq });
        breakdown.deviations.push({ value: d.value, deviation: deviation.toFixed(2) });
        breakdown.deviationsSquared.push({ value: d.value, deviationSquared: deviationSquared.toFixed(2) });
    });

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
  function displayBreakdown(breakdown, type) {
    let html = '';

    if (type === 'grouped') {
        if (!breakdown || !breakdown.midpoints || breakdown.midpoints.length === 0) {
            html = '<p class="placeholder-text">No valid data to show breakdown.</p>';
        } else {
            html += '<h3>Midpoints (x)</h3><ul>';
            breakdown.midpoints.forEach(item => html += `<li>Class ${item.class}: ${item.midpoint}</li>`);
            html += '</ul>';

            html += '<h3>f * x</h3><ul>';
            breakdown.fx.forEach(item => html += `<li>Class ${item.class}: ${item.fx}</li>`);
            html += '</ul>';

            html += '<h3>Cumulative Frequency (&lt;cf)</h3><ul>';
            breakdown.cumulativeFrequency.forEach(item => html += `<li>Class ${item.class}: ${item.cf}</li>`);
            html += '</ul>';

            if (breakdown.deviationSquared && breakdown.deviationSquared.length > 0) {
                html += '<h3>(x_mid - Mean)&sup2;</h3><ul>';
                breakdown.deviationSquared.forEach(item => html += `<li>Class ${item.class}: ${item.deviationSquared}</li>`);
                html += '</ul>';

                html += '<h3>f * (x_mid - Mean)&sup2;</h3><ul>';
                breakdown.fDeviationSquared.forEach(item => html += `<li>Class ${item.class}: ${item.fDeviationSquared}</li>`);
                html += '</ul>';
            }
        }
    } else { // Ungrouped
        if (!breakdown || !breakdown.values || breakdown.values.length === 0) {
            html = '<p class="placeholder-text">No valid data to show breakdown.</p>';
        } else {
            html += '<h3>Values (x) and Frequencies (f)</h3><ul>';
            breakdown.values.forEach(item => html += `<li>Value ${item.value}: Frequency ${item.frequency}</li>`);
            html += '</ul>';

            html += '<h3>Cumulative Frequency</h3><ul>';
            breakdown.cumulativeFrequency.forEach(item => html += `<li>Value ${item.value}: ${item.cf}</li>`);
            html += '</ul>';

            if (breakdown.deviations && breakdown.deviations.length > 0) {
                html += '<h3>Deviations (x - Mean)</h3><ul>';
                breakdown.deviations.forEach(item => html += `<li>Value ${item.value}: ${item.deviation}</li>`);
                html += '</ul>';

                html += '<h3>Squared Deviations (x - Mean)&sup2;</h3><ul>';
                breakdown.deviationsSquared.forEach(item => html += `<li>Value ${item.value}: ${item.deviationSquared}</li>`);
                html += '</ul>';
            }
        }
    }
    
    breakdownContent.innerHTML = html;
}

    function generateBreakdown(serverResult, type) {
        if (type === 'grouped') {
            const breakdown = { midpoints: [], fx: [], cumulativeFrequency: [], deviationSquared: [], fDeviationSquared: [] };
            let cum = 0;
            serverResult.dataset.forEach(d => {
                const midpoint = d.x;
                cum += d.f;
                breakdown.midpoints.push({ class: `${d.l}-${d.u}`, midpoint: midpoint.toFixed(2) });
                breakdown.fx.push({ class: `${d.l}-${d.u}`, fx: (d.f * midpoint).toFixed(2) });
                breakdown.cumulativeFrequency.push({ class: `${d.l}-${d.u}`, cf: cum });
                const devSq = (midpoint - serverResult.mean) ** 2;
                breakdown.deviationSquared.push({ class: `${d.l}-${d.u}`, deviationSquared: devSq.toFixed(2) });
                breakdown.fDeviationSquared.push({ class: `${d.l}-${d.u}`, fDeviationSquared: (d.f * devSq).toFixed(2) });
            });
            return breakdown;
        } else { // ungrouped
            const breakdown = { values: [], cumulativeFrequency: [], deviations: [], deviationsSquared: [] };
            let cum = 0;
            serverResult.dataset.forEach(d => {
                cum += d.frequency;
                breakdown.values.push({ value: d.value, frequency: d.frequency });
                breakdown.cumulativeFrequency.push({ value: d.value, cf: cum });
                const dev = d.value - serverResult.mean;
                breakdown.deviations.push({ value: d.value, deviation: dev.toFixed(2) });
                breakdown.deviationsSquared.push({ value: d.value, deviationSquared: (dev ** 2).toFixed(2) });
            });
            return breakdown;
        }
    }

    /**
     * Orchestrates getting data, calculating statistics, and displaying results/breakdown.
     */
    async function calculateAndDisplayStatistics() {
        const currentData = getTableData();
        if (currentData === null) { return; }

        const isComplete = dataType === 'grouped'
            ? currentData.length > 0 && !currentData.some(d => d.lower === '' || d.upper === '' || d.frequency === '')
            : currentData.length > 0 && !currentData.some(d => d.value === '' || d.frequency === '');

        if (!isComplete) {
            displayResults({ mean: 0, median: 0, mode: 0, variance: 0, stdDev: 0 });
            breakdownContent.innerHTML = '<p class="placeholder-text">Enter data and click \'Calculate\' to see step-by-step computations.</p>';
            return;
        }

        const serverResult = await sendToBackend(currentData, dataType);
        if (serverResult) {
            const results = {
                mean: serverResult.mean,
                median: serverResult.median,
                mode: serverResult.mode,
                variance: serverResult.variance,
                stdDev: serverResult.std_dev,
            };
            const breakdown = generateBreakdown(serverResult, dataType);
            displayResults(results);
            displayBreakdown(breakdown, dataType);
        } else {
            // Fallback to client-side calculation
            if (dataType === 'grouped') {
                const { results, breakdown } = calculateGroupedStatistics(currentData);
                displayResults(results);
                displayBreakdown(breakdown, 'grouped');
            } else {
                const { results, breakdown } = calculateUngroupedStatistics(currentData);
                displayResults(results);
                displayBreakdown(breakdown, 'ungrouped');
            }
        }
    }


    /**
     * Send data to backend compute endpoint. Returns parsed JSON on success or null on failure.
     * @param {Array<Object>} data
     * @param {string} type
     * @returns {Promise<Object|null>}
     */
    async function sendToBackend(data, type) {
        try {
            let payload;
            if (type === 'grouped') {
                payload = {
                    dataset: data.map(d => ({ l: d.lower, u: d.upper, f: d.frequency })),
                    type: type
                };
            } else {
                payload = {
                    dataset: data.map(d => ({ value: d.value, frequency: d.frequency })),
                    type: type
                };
            }
            const resp = await fetch('/api/compute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!resp.ok) {
                const err = await resp.json();
                alert(`Server Error: ${err.error || 'Unknown error'}`);
                return null;
            }
            return await resp.json();
        } catch (err) {
            console.error('Backend compute failed:', err);
            alert('Could not connect to the server. Please check your connection.');
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
	
    // Add this after the other button event listeners
    if (toggleDataTypeBtn) {
        toggleDataTypeBtn.addEventListener('click', () => {
            toggleDataType();
            if (autoComputeEnabled) {
                calculateAndDisplayStatistics();
            }
        });
    }

    resetTableBtn.addEventListener('click', () => {
    if (dataType === 'grouped') {
        groupedData = [{ lower: '', upper: '', frequency: '' }];
        groupedData = [];
    } else {
        rawData = [{ value: '', frequency: '' }];
        rawData = [];
    }
    renderTable();
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
