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
    const gpd = document.getElementById('toggle-grouped');
    const ungrped = document.getElementById('toggle-ungrouped');
    const solutionsBtn = document.getElementById('show-solutions-btn');
    const solutionsModal = document.getElementById('solutions-modal');
    const solutionsBody = document.getElementById('solutions-body');

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
    const errorModal = document.getElementById('custom-error-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const proofModal = document.getElementById('proof-modal');
    const proofBody = document.getElementById('proof-body');
    const closeProofModalBtn = document.getElementById('close-proof-modal-btn');
    const contextMenu = document.getElementById('custom-context-menu');
    const visualRing = document.querySelector('.visual-ring');
    
    let groupedData = [];
    let rawData = []; // ADD THIS LINE (raw)
    let autoComputeEnabled = false;
    let dataType = 'grouped'; // ADD THIS LINE - 'grouped' or 'ungrouped' (raw)

    let contextMenuTargetIndex = -1;
    
    // Store data for proofs
    let currentProofData = {
        mean: null,
        median: null,
        mode: null,
        variance: null,
        stdDev: null
    };

    // Initialize active state for buttons
    if (gpd) gpd.classList.add('primary-button');
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

    function showError(message) {
        const msgText = document.getElementById('error-message-text');
        if (msgText) msgText.textContent = message;
        if (errorModal) errorModal.classList.remove('modal-hidden');
    }

	/**
 * Toggles between grouped and ungrouped data input (raw)
 */
function toggleDataType() {
    // Clear existing data
    if (dataType === 'grouped') {
        dataType = 'ungrouped';
        if (dataTypeText) dataTypeText.textContent = 'Switch to Grouped';
        headerCol1.textContent = 'Value (x)';
        headerCol2.textContent = 'Frequency (f)';
  
        headerCol3.style.display = 'none'; // Hide third column

        if (gpd) gpd.classList.remove('primary-button');
        if (ungrped) ungrped.classList.add('primary-button');
    } else {
        dataType = 'grouped';
        if (dataTypeText) dataTypeText.textContent = 'Switch to Ungrouped';
        headerCol1.textContent = 'Lower Limit';
        headerCol2.textContent = 'Upper Limit';
        headerCol3.style.display = ''; // Show third column

        if (gpd) gpd.classList.add('primary-button');
        if (ungrped) ungrped.classList.remove('primary-button');
    }
    
    // Clear data arrays FIRST
    groupedData = [];
    rawData = [];
    
    // Re-render table with new dataType BEFORE adding row
    renderTable();
    
    // Add initial empty row
    addRow();
    
    // Clear results
    displayResults({ mean: 0, median: 0, mode: 0, variance: 0, stdDev: 0 });
    breakdownContent.innerHTML = '<p class="placeholder-text">Enter data and click \'Calculate\' to see step-by-step computations.</p>';
}

/**
 * Resets the table by clearing data arrays and displaying an empty row
 */
function resetTable() {
    groupedData = [];
    rawData = [];
    addRow();
    displayResults({ mean: 0, median: 0, mode: 0, variance: 0, stdDev: 0 });
    breakdownContent.innerHTML = '<p class="placeholder-text">Enter data and click \'Calculate\' to see step-by-step computations.</p>';
}

    if (ungrped) ungrped.addEventListener('click', () => {
        if (dataType === 'grouped') toggleDataType();
        else resetTable();
    });
    if (gpd) gpd.addEventListener('click', () => {
        if (dataType === 'ungrouped') toggleDataType();
        else resetTable();
    });

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
        showError("Please enter valid numbers in all fields.");
        
        const table = document.getElementById('data-table');
        table.classList.add('shake-animation');
        setTimeout(() => table.classList.remove('shake-animation'), 500);
        
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
            
            // Add Context Menu Listener
            tr.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                openContextMenu(e, index);
            });
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
                <td><button class="remove-row-btn" data-index="${index}"><i class="fas fa-times"></i></button></td>
            `;
            dataTableBody.appendChild(tr);
            
            // Add Context Menu Listener
            tr.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                openContextMenu(e, index);
            });
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

    // --- Context Menu Logic ---
    function openContextMenu(e, index) {
        if (!contextMenu) return;
        
        contextMenuTargetIndex = index;
        contextMenu.classList.remove('context-menu-hidden');
        
        // Position menu
        const menuWidth = contextMenu.offsetWidth || 160;
        const menuHeight = contextMenu.offsetHeight || 80;
        let x = e.pageX;
        let y = e.pageY;

        // Check boundaries
        if (x + menuWidth > window.innerWidth) x -= menuWidth;
        if (y + menuHeight > window.innerHeight) y -= menuHeight;

        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
    }

    function closeContextMenu() {
        if (contextMenu) contextMenu.classList.add('context-menu-hidden');
        contextMenuTargetIndex = -1;
    }

    // Global click to close context menu
    window.addEventListener('click', closeContextMenu);
    
    // Handle Context Menu Actions
    const contextActions = document.querySelectorAll('.context-menu-item');
    contextActions.forEach(item => {
        item.addEventListener('click', () => {
            const action = item.getAttribute('data-action');
            if (action === 'delete') {
                removeRow(contextMenuTargetIndex);
            } else if (action === 'clear') {
                // Re-initialize specific row
                if (dataType === 'grouped') groupedData[contextMenuTargetIndex] = { lower: '', upper: '', frequency: '' };
                else rawData[contextMenuTargetIndex] = { value: '', frequency: '' };
                renderTable();
                if (autoComputeEnabled) calculateAndDisplayStatistics();
            }
            closeContextMenu();
        });
    });

    

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

    // Check if we have valid data
    const hasData = type === 'grouped' ? 
        (breakdown && breakdown.midpoints && breakdown.midpoints.length > 0) : 
        (breakdown && breakdown.values && breakdown.values.length > 0);

    if (!hasData) {
        breakdownContent.innerHTML = '<p class="placeholder-text">No valid data to show breakdown.</p>';
        return;
    }

    // Start building the table
    html += `<table class="breakdown-table">
                <thead>
                    <tr>`;

    if (type === 'grouped') {
        // Headers for Grouped Data
        html += `<th>Class</th>
                 <th>Midpoint (x)</th>
                 <th>f * x</th>
                 <th>< cf</th>`;
        
        if (breakdown.deviationSquared) {
            html += `<th>(x - Mean)²</th>
                     <th>f * (x - Mean)²</th>`;
        }
    } else {
        // Headers for Ungrouped Data
        html += `<th>Value (x)</th>
                 <th>Freq (f)</th>
                 <th>< cf</th>`;
        
        if (breakdown.deviations) {
            html += `<th>(x - Mean)</th>
                     <th>(x - Mean)²</th>
                     <th>f * (x - Mean)²</th>`;
        }
    }

    html += `   </tr>
                </thead>
                <tbody>`;

    // Populate Rows
    if (type === 'grouped') {
        breakdown.midpoints.forEach((item, i) => {
            html += `<tr>
                <td>${item.class}</td>
                <td>${item.midpoint}</td>
                <td>${breakdown.fx[i].fx}</td>
                <td>${breakdown.cumulativeFrequency[i].cf}</td>`;
            
            if (breakdown.deviationSquared) {
                html += `<td>${breakdown.deviationSquared[i].deviationSquared}</td>
                         <td>${breakdown.fDeviationSquared[i].fDeviationSquared}</td>`;
            }
            html += '</tr>';
        });
    } else {
        breakdown.values.forEach((item, i) => {
            html += `<tr>
                <td>${item.value}</td>
                <td>${item.frequency}</td>
                <td>${breakdown.cumulativeFrequency[i].cf}</td>`;
            
            if (breakdown.deviations) {
                html += `<td>${breakdown.deviations[i].deviation}</td>
                         <td>${breakdown.deviationsSquared[i].deviationSquared}</td>
                         <td>${breakdown.fDeviationsSquared[i].fDeviationSquared}</td>`;
            }
            html += '</tr>';
        });
    }

    html += `   </tbody>
            </table>`;

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
            const breakdown = { values: [], cumulativeFrequency: [], deviations: [], deviationsSquared: [], fDeviationsSquared: [] };
            let cum = 0;
            serverResult.dataset.forEach(d => {
                cum += d.frequency;
                breakdown.values.push({ value: d.value, frequency: d.frequency });
                breakdown.cumulativeFrequency.push({ value: d.value, cf: cum });
                const dev = d.value - serverResult.mean;
                const devSq = dev ** 2;
                breakdown.deviations.push({ value: d.value, deviation: dev.toFixed(2) });
                breakdown.deviationsSquared.push({ value: d.value, deviationSquared: devSq.toFixed(2) });
                breakdown.fDeviationsSquared.push({ value: d.value, fDeviationSquared: (d.frequency * devSq).toFixed(2) });
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

        if (visualRing) {
        visualRing.classList.add('is-processing');
        }
        
        // 3. Perform the actual math while the ring is spinning fast
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        const serverResult = await sendToBackend(currentData, dataType);
        if (serverResult) {
            const results = {
                mean: serverResult.mean,
                median: serverResult.median,
                mode: serverResult.mode,
                variance: serverResult.variance,
                stdDev: serverResult.stdDev,
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

        if (visualRing) {
            visualRing.classList.remove('is-processing');
        } 
    }

    // --- Proof Rendering ---
    function renderProof(type) {
        if (!currentProofData[type]) {
            proofBody.innerHTML = '<p>No data available for this calculation yet.</p>';
            return;
        }

        let html = '';
        const data = currentProofData[type];

        if (type === 'mean') {
            html = `
                <div class="proof-step"><strong>Formula:</strong> &mu; = &Sigma;(f &middot; x) / n</div>
                <div class="proof-step"><strong>Substitution:</strong> &mu; = ${data.sumFx.toFixed(2)} / ${data.n}</div>
                <div class="proof-step"><strong>Result:</strong> ${data.result.toFixed(4)}</div>
            `;
        } else if (type === 'median') {
            html = `
                <div class="proof-step"><strong>Formula:</strong> L + [ (n/2 - cf_b) / f_m ] * w</div>
                <div class="proof-step"><strong>Values:</strong> L=${data.L}, n=${data.n}, cf_b=${data.cf_b}, f_m=${data.f_m}, w=${data.w}</div>
                <div class="proof-step"><strong>Substitution:</strong> ${data.L} + [ (${data.n}/2 - ${data.cf_b}) / ${data.f_m} ] * ${data.w.toFixed(2)}</div>
                <div class="proof-step"><strong>Result:</strong> ${data.result.toFixed(4)}</div>
            `;
        } else if (type === 'mode') {
            html = `
                <div class="proof-step"><strong>Formula:</strong> L + [ (f_m - f_1) / (2f_m - f_1 - f_2) ] * w</div>
                <div class="proof-step"><strong>Values:</strong> L=${data.L}, f_m=${data.fm}, f_1=${data.f1}, f_2=${data.f2}, w=${data.w}</div>
                <div class="proof-step"><strong>Substitution:</strong> ${data.L} + [ (${data.fm} - ${data.f1}) / (2(${data.fm}) - ${data.f1} - ${data.f2}) ] * ${data.w.toFixed(2)}</div>
                <div class="proof-step"><strong>Result:</strong> ${data.result.toFixed(4)}</div>
            `;
        } else if (type === 'variance') {
            html = `
                <div class="proof-step"><strong>Formula:</strong> &sigma;&sup2; = &Sigma;(f &middot; (x - &mu;)&sup2;) / n</div>
                <div class="proof-step"><strong>Substitution:</strong> ${data.sumSq.toFixed(2)} / ${data.n}</div>
                <div class="proof-step"><strong>Result:</strong> ${data.result.toFixed(4)}</div>
            `;
        } else if (type === 'stdDev') {
            html = `
                <div class="proof-step"><strong>Formula:</strong> &sigma; = &radic;(&sigma;&sup2;)</div>
                <div class="proof-step"><strong>Substitution:</strong> &radic;(${data.variance.toFixed(4)})</div>
                <div class="proof-step"><strong>Result:</strong> ${data.result.toFixed(4)}</div>
            `;
        }
        proofBody.innerHTML = html;
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
                showError(`Server Error: ${err.error || 'Unknown error'}`);
                return null;
            }
            return await resp.json();
        } catch (err) {
            console.error('Backend compute failed:', err);
            showError('Could not connect to the server. Please check your connection.');
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

    // Add listeners to all View Proof buttons
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.view-proof-btn');
        if (btn) {
            const type = btn.getAttribute('data-type');
            renderProof(type);
            if (proofModal) proofModal.classList.remove('modal-hidden');
        }
    });

    if (closeProofModalBtn) {
        closeProofModalBtn.addEventListener('click', () => {
            if (proofModal) proofModal.classList.add('modal-hidden');
        });
    }

    // Remove old solutionsBtn listener if it exists or replace logic above

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

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            if (errorModal) errorModal.classList.add('modal-hidden');
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
        showError('Export to PDF functionality is not implemented yet. This feature requires jsPDF integration.');
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
