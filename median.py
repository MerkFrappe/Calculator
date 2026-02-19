import math
import pandas as pd
from pathlib import Path
from typing import List, Dict, Any

def compute_stats(dataset: List[Dict[str, float]]) -> Dict[str, Any]:
    """Compute grouped statistics from dataset list of dicts with keys 'l','u','f'.

    Returns a dict with augmented dataset and computed measures.
    """
    # Defensive copy and sort
    data = [dict(row) for row in dataset]
    data.sort(key=lambda x: x['l'])

    n = sum(row['f'] for row in data)
    if n == 0:
        raise ValueError("Total frequency cannot be zero.")

    # Midpoints and class width
    for row in data:
        row['x'] = (row['l'] + row['u']) / 2
        row['i'] = row['u'] - row['l']

    # Mean
    sum_fx = sum(row['f'] * row['x'] for row in data)
    mean = sum_fx / n

    # Median
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
    if median_class is None:
        raise ValueError("Could not determine median class")

    median = median_class['l'] + (((n / 2) - cf_before) / median_class['f']) * median_class['i']

    # Mode
    max_f = max(row['f'] for row in data)
    modal_idx = next(i for i, row in enumerate(data) if row['f'] == max_f)
    modal_class = data[modal_idx]

    f1 = modal_class['f']
    f0 = data[modal_idx - 1]['f'] if modal_idx > 0 else 0
    f2 = data[modal_idx + 1]['f'] if modal_idx < len(data) - 1 else 0

    denom = (f1 - f0) + (f1 - f2)
    if denom != 0:
        mode = modal_class['l'] + ((f1 - f0) / denom) * modal_class['i']
    else:
        mode = modal_class['x']

    # Variance and SD
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
        'std_dev': sd,
    }


def run_stats_test():
    """Original CLI entrypoint preserved for backward compatibility."""
    import pandas as pd

    print("--- Grouped Data Statistics Tester ---")

    try:
        # Option to choose input method
        print("\nChoose input method:")
        print("1. Enter data manually")
        print("2. Read from Excel file")
        choice = input("Enter choice (1 or 2): ").strip()

        dataset = []

        if choice == "1":
            # Collect Input Manually
            num_rows = int(input("How many intervals (rows) do you want to enter? "))

            for i in range(num_rows):
                print(f"\nRow {i+1}:")
                low = float(input(f"  Enter Lower Limit: "))
                high = float(input(f"  Enter Upper Limit: "))
                freq = float(input(f"  Enter Frequency: "))
                dataset.append({'l': low, 'u': high, 'f': freq})

        elif choice == "2":
            # Read from Excel file
            excel_path = input("Enter the path to Excel file: ").strip()

            # Check if file exists
            if not Path(excel_path).exists():
                print(f"Error: File '{excel_path}' not found.")
                return

            # Read Excel file
            print("Reading Excel file...")
            df = pd.read_excel(excel_path)

            # Display available columns
            print(f"\nAvailable columns in your Excel file:")
            for i, col in enumerate(df.columns):
                print(f"{i+1}. {col}")

            # Ask user which columns to use
            lower_col = input("Enter name of column for Lower Limits: ").strip()
            upper_col = input("Enter name of column for Upper Limits: ").strip()
            freq_col = input("Enter name of column for Frequencies: ").strip()

            # Check if columns exist
            for col in [lower_col, upper_col, freq_col]:
                if col not in df.columns:
                    print(f"Error: Column '{col}' not found in Excel file.")
                    return

            # Convert to dataset format
            for idx, row in df.iterrows():
                dataset.append({
                    'l': float(row[lower_col]),
                    'u': float(row[upper_col]),
                    'f': float(row[freq_col])
                })

            print(f"Successfully loaded {len(dataset)} rows from Excel.")

        else:
            print("Invalid choice. Exiting.")
            return

        result = compute_stats(dataset)

        # Print results
        data = result['dataset']
        n = result['n']
        mean = result['mean']
        median = result['median']
        mode = result['mode']
        variance = result['variance']
        sd = result['std_dev']

        print("\n" + "=" * 40)
        print(f"{'Lower':>10} | {'Upper':>10} | {'Freq':>10} | {'Midpoint':>10}")
        print("-" * 50)
        for row in data:
            print(f"{row['l']:10.2f} | {row['u']:10.2f} | {row['f']:10.2f} | {row['x']:10.2f}")
        print("-" * 50)
        print(f"Total N: {n}")
        print("=" * 50)

        print(f"Mean (Average):     {mean:.4f}")
        print(f"Median:             {median:.4f}")
        print(f"Mode:               {mode:.4f}")
        print(f"Variance:           {variance:.4f}")
        print(f"Standard Deviation: {sd:.4f}")
        print("=" * 50)

    except ValueError:
        print("Invalid input! Please enter numbers only.")
    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    run_stats_test()