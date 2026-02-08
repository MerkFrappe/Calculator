import math

def run_stats_test():
    print("--- Grouped Data Statistics Tester ---")
    
    try:
        # 1. Collect Input
        num_rows = int(input("How many intervals (rows) do you want to enter? "))
        dataset = []

        for i in range(num_rows):
            print(f"\nRow {i+1}:")
            low = float(input(f"  Enter Lower Limit: "))
            high = float(input(f"  Enter Upper Limit: "))
            freq = float(input(f"  Enter Frequency: "))
            dataset.append({'l': low, 'u': high, 'f': freq})

        # 2. Mathematical Logic
        n = sum(row['f'] for row in dataset)
        if n == 0:
            print("Error: Total frequency cannot be zero.")
            return

        # Midpoints and Class Width
        for row in dataset:
            row['x'] = (row['l'] + row['u']) / 2  # Midpoint
            row['i'] = row['u'] - row['l']        # Class Width

        # A. Mean Calculation
        sum_fx = sum(row['f'] * row['x'] for row in dataset)
        mean = sum_fx / n

        # B. Median Calculation
        cum_freq = 0
        median_class = None
        cf_before = 0
        for row in dataset:
            prev_cf = cum_freq
            cum_freq += row['f']
            if cum_freq >= n / 2:
                median_class = row
                cf_before = prev_cf
                break
        
        median = median_class['l'] + (((n/2) - cf_before) / median_class['f']) * median_class['i']

        # C. Mode Calculation
        max_f = max(row['f'] for row in dataset)
        modal_idx = next(i for i, row in enumerate(dataset) if row['f'] == max_f)
        modal_class = dataset[modal_idx]
        
        f1 = modal_class['f']
        f0 = dataset[modal_idx - 1]['f'] if modal_idx > 0 else 0
        f2 = dataset[modal_idx + 1]['f'] if modal_idx < len(dataset) - 1 else 0
        
        denom = (f1 - f0) + (f1 - f2)
        if denom != 0:
            mode = modal_class['l'] + ((f1 - f0) / denom) * modal_class['i']
        else:
            mode = modal_class['x'] # Fallback to midpoint if no clear peak

        # D. Variance & SD Calculation
        sum_f_x_mean_sq = sum(row['f'] * (row['x'] - mean)**2 for row in dataset)
        variance = sum_f_x_mean_sq / n
        sd = math.sqrt(variance)

        # 3. Display Results
        print("\n" + "="*40)
        print(f"{'Lower':>10} | {'Upper':>10} | {'Freq':>10}")
        print("-" * 40)
        for row in dataset:
            print(f"{row['l']:10.2f} | {row['u']:10.2f} | {row['f']:10.2f}")
        print("-" * 40)
        print(f"Total N: {n}")
        print("="*40)

        print(f"Mean (Average):     {mean:.4f}")
        print(f"Median:             {median:.4f}")
        print(f"Mode:               {mode:.4f}")
        print(f"Variance:           {variance:.4f}")
        print(f"Standard Deviation: {sd:.4f}")
        print("="*40)

    except ValueError:
        print("Invalid input! Please enter numbers only.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    run_stats_test()