import os
import subprocess
import sys

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

try:
    import kagglehub
except ImportError:
    install('kagglehub[pandas-datasets]')
    import kagglehub

try:
    import pandas as pd
except ImportError:
    install('pandas')
    import pandas as pd

datasets = [
    "ajmalkhann/retail-orders-dataset-etl-pipeline",
    "lakshmi25npathi/online-retail-dataset",
    "manjeetsingh/retaildataset"
]

print("Exploring datasets...")
for ds in datasets:
    print(f"\n--- Dataset: {ds} ---")
    try:
        path = kagglehub.dataset_download(ds)
        print("Path:", path)
        for root, dirs, files in os.walk(path):
            for file in files:
                if file.endswith('.csv'):
                    filepath = os.path.join(root, file)
                    print(f"Found CSV: {file}")
                    try:
                        df = pd.read_csv(filepath, nrows=5)
                        print("Columns:", df.columns.tolist())
                    except Exception as e:
                        print("Error reading CSV:", e)
    except Exception as e:
        print("Failed to load dataset:", e)
