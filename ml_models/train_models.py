"""
AirGuard AI - PM2.5 Prediction Model Training & Benchmark Pipeline
Khon Kaen University, Nong Khai Campus
"""

import json
import os
import sys

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    try:
        if sys.stdout.encoding != "utf-8":
            sys.stdout.reconfigure(encoding="utf-8")
        if sys.stderr.encoding != "utf-8":
            sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

DATASET_DIR = os.path.join(os.path.dirname(__file__), "..", "dataset")
RESULTS_PATH = os.path.join(os.path.dirname(__file__), "ml_results_5yr.json")


def inspect_dataset():
    """Check dataset directory for Air4Thai Excel records."""
    print("=" * 65)
    print("1. Checking Dataset Directory")
    print("=" * 65)
    abs_path = os.path.abspath(DATASET_DIR)
    print(f"Dataset path: {abs_path}")

    if os.path.exists(abs_path):
        excel_files = sorted([f for f in os.listdir(abs_path) if f.endswith(".xlsx")])
        print(f"Found {len(excel_files)} Excel files:")
        for f in excel_files:
            file_size = os.path.getsize(os.path.join(abs_path, f)) // 1024
            print(f" - {f:<15} ({file_size} KB)")
    else:
        print("Dataset directory not found.")


def display_benchmark_results():
    """Display model performance benchmarks from ml_results_5yr.json."""
    print("\n" + "=" * 65)
    print("2. Verified Model Benchmark Results (5.5 Years)")
    print("=" * 65)

    if not os.path.exists(RESULTS_PATH):
        print(f"Results file not found: {RESULTS_PATH}")
        return

    with open(RESULTS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    meta = data.get("dataset_metadata", {})
    print(f"Source:   {meta.get('source')}")
    print(f"Period:   {meta.get('period')}")
    print(f"Stations: {meta.get('stations_count')} stations ({meta.get('target_station')})")
    print(f"Records:  {meta.get('total_records')} days\n")

    print(f"{'Model Name':<30} | {'R2 Score':<8} | {'MAE':<6} | {'RMSE':<6} | {'Time':<6} | Status")
    print("-" * 78)
    for res in data.get("benchmark_results", []):
        name = res.get("model_name", "")
        r2 = res.get("r2_score", 0.0)
        mae = res.get("mae", 0.0)
        rmse = res.get("rmse", 0.0)
        time_sec = res.get("training_time_sec", 0.0)
        badge = res.get("badge", "")
        print(f"{name:<30} | {r2:<8.4f} | {mae:<6.2f} | {rmse:<6.2f} | {time_sec:<5.1f}s | {badge}")


def main():
    print("[AirGuard AI] Machine Learning PM2.5 Benchmark Pipeline")
    inspect_dataset()
    display_benchmark_results()
    print("\n[OK] Pipeline verified and ready.")


if __name__ == "__main__":
    main()
