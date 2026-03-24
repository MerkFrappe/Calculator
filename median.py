import math
from typing import List, Dict, Any
from collections import Counter

def compute_stats(dataset: List[Dict[str, float]]) -> Dict[str, Any]:
    """Compute Grouped statistics."""
    data = [dict(row) for row in dataset]
    data.sort(key=lambda x: x['l'])

    n = sum(row['f'] for row in data)
    if n == 0:
        raise ValueError("Total frequency cannot be zero.")

    # Midpoints and class width
    for row in data:
        row['x'] = (row['l'] + row['u']) / 2
        row['i'] = row['u'] - row['l']

    # Mean: Σ(f*x) / n
    sum_fx = sum(row['f'] * row['x'] for row in data)
    mean = sum_fx / n

    # Median: L + [((n/2) - cf_before) / f_median] * i
    cum_freq = 0
    median_class = None
    cf_before = 0
    for row in data:
        prev_cf = cum_freq
        cum_freq += row['f']
        if cum_freq >= n / 2:
            median_class = row
            cf_before = prev_cf
            break
    
    median = median_class['l'] + (((n / 2) - cf_before) / median_class['f']) * median_class['i']

    # Mode: L + [(f1 - f0) / (2f1 - f0 - f2)] * i
    max_f = max(row['f'] for row in data)
    modal_indices = [i for i, row in enumerate(data) if row['f'] == max_f]
    
    # We take the first modal class for the calculation
    m_idx = modal_indices[0]
    modal_class = data[m_idx]
    f1 = modal_class['f']
    f0 = data[m_idx - 1]['f'] if m_idx > 0 else 0
    f2 = data[m_idx + 1]['f'] if m_idx < len(data) - 1 else 0

    denom = (f1 - f0) + (f1 - f2)
    if denom != 0:
        mode = modal_class['l'] + ((f1 - f0) / denom) * modal_class['i']
    else:
        mode = modal_class['x']

    # Population Variance: Σ(f * (x - mean)^2) / n
    sum_f_x_mean_sq = sum(row['f'] * (row['x'] - mean) ** 2 for row in data)
    variance = sum_f_x_mean_sq / n
    sd = math.sqrt(variance)

    return {
        'dataset': data,
        'n': n,
        'mean': mean,
        'median': median,
        'mode': mode,
        'variance': variance,
        'stdDev': sd,
    }

def compute_ungrouped_stats(dataset: List[Dict[str, float]]) -> Dict[str, Any]:
    """Compute Ungrouped statistics (Values and Frequencies)."""
    data = [dict(row) for row in dataset]
    data.sort(key=lambda x: x['value'])

    # Expand data
    expanded = []
    for row in data:
        for _ in range(int(row['frequency'])):
            expanded.append(row['value'])

    n = len(expanded)
    if n == 0:
        raise ValueError("Total frequency cannot be zero.")

    # Mean
    mean = sum(expanded) / n

    # Median
    mid = n // 2
    if n % 2 == 0:
        median = (expanded[mid - 1] + expanded[mid]) / 2
    else:
        median = expanded[mid]

    # Mode
    counts = Counter(expanded)
    max_f = max(counts.values())
    modes = [val for val, f in counts.items() if f == max_f]
    # Return the first mode for display, or average if needed
    mode = modes[0] if modes else 0

    # Variance (Population)
    variance = sum((x - mean) ** 2 for x in expanded) / n
    sd = math.sqrt(variance)

    return {
        'dataset': data,
        'n': n,
        'mean': mean,
        'median': median,
        'mode': mode,
        'variance': variance,
        'stdDev': sd,
    }