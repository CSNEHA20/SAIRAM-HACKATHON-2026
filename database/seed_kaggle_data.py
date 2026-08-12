import os
import sqlite3
import subprocess
import sys

def ensure_package(pkg_install_name, import_name=None):
    if import_name is None:
        import_name = pkg_install_name
    try:
        __import__(import_name)
    except ImportError:
        print(f"Installing {pkg_install_name}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", pkg_install_name])

ensure_package('pandas')
ensure_package('openpyxl')
ensure_package('kagglehub[pandas-datasets]', 'kagglehub')

import kagglehub
import pandas as pd

# Authentication: place kaggle.json in ~/.kaggle/kaggle.json
# OR set KAGGLE_TOKEN environment variable before running this script

DB_PATH = os.path.join(os.path.dirname(__file__), "ecommerce.sqlite")

def seed_database():
    print(f"Connecting to database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Dataset 1: ajmalkhann/retail-orders-dataset-etl-pipeline
    print("\n--- Processing Dataset 1: ajmalkhann/retail-orders-dataset-etl-pipeline ---")
    ds1_path = kagglehub.dataset_download("ajmalkhann/retail-orders-dataset-etl-pipeline")
    
    # customer.csv -> customers table
    cust_file = os.path.join(ds1_path, "customer.csv")
    if os.path.exists(cust_file):
        print("Loading customers...")
        df_cust = pd.read_csv(cust_file)
        # Columns: ['customer_id', 'gender', 'first_name', 'last_name', 'full_name', 'age', 'city', 'signup_date']
        df_cust_mapped = pd.DataFrame({
            'customer_id': df_cust['customer_id'],
            'name': df_cust['full_name'],
            'email': df_cust['customer_id'].apply(lambda x: f"user_{x}@example.com"),
            'phone': None,
            'city': df_cust['city'],
            'country': 'India',
            'created_at': df_cust['signup_date']
        })
        df_cust_mapped.to_sql('customers', conn, if_exists='replace', index=False)
        print(f"Inserted {len(df_cust_mapped)} rows into customers.")

    # products.csv -> products table
    prod_file = os.path.join(ds1_path, "products.csv")
    if os.path.exists(prod_file):
        print("Loading products...")
        df_prod = pd.read_csv(prod_file)
        # Columns: ['product_id', 'brand', 'category', 'sub_category', 'mrp']
        df_prod_mapped = pd.DataFrame({
            'product_id': df_prod['product_id'],
            'name': df_prod['brand'] + ' ' + df_prod['sub_category'],
            'category': df_prod['category'],
            'price': df_prod['mrp'],
            'stock_quantity': 100,
            'description': df_prod['sub_category'] + ' by ' + df_prod['brand'],
            'created_at': '2026-01-01 00:00:00'
        })
        df_prod_mapped.to_sql('products', conn, if_exists='replace', index=False)
        print(f"Inserted {len(df_prod_mapped)} rows into products.")

    # orders.csv -> orders table
    orders_file = os.path.join(ds1_path, "orders.csv")
    if os.path.exists(orders_file):
        print("Loading orders...")
        df_orders = pd.read_csv(orders_file)
        # Columns: ['order_id', 'customer_id', 'order_date', 'order_ts', 'city', 'state', 'payment_method', 'order_status', 'total_amount']
        df_orders_mapped = pd.DataFrame({
            'order_id': df_orders['order_id'],
            'customer_id': df_orders['customer_id'],
            'order_date': df_orders['order_date'],
            'total_amount': df_orders['total_amount'],
            'status': df_orders['order_status'].str.lower()
        })
        df_orders_mapped.to_sql('orders', conn, if_exists='replace', index=False)
        print(f"Inserted {len(df_orders_mapped)} rows into orders.")

    # order_items.csv -> order_items table
    items_file = os.path.join(ds1_path, "order_items.csv")
    if os.path.exists(items_file):
        print("Loading order_items...")
        df_items = pd.read_csv(items_file)
        # Columns: ['order_id', 'product_id', 'quantity', 'unit_price', 'discount', 'net_amount']
        df_items['item_id'] = range(1, len(df_items) + 1)
        df_items_mapped = pd.DataFrame({
            'item_id': df_items['item_id'],
            'order_id': df_items['order_id'],
            'product_id': df_items['product_id'],
            'quantity': df_items['quantity'],
            'unit_price': df_items['unit_price']
        })
        df_items_mapped.to_sql('order_items', conn, if_exists='replace', index=False)
        print(f"Inserted {len(df_items_mapped)} rows into order_items.")

    # 2. Dataset 2: lakshmi25npathi/online-retail-dataset
    print("\n--- Processing Dataset 2: lakshmi25npathi/online-retail-dataset ---")
    ds2_path = kagglehub.dataset_download("lakshmi25npathi/online-retail-dataset")
    excel_file = os.path.join(ds2_path, "online_retail_II.xlsx")
    if os.path.exists(excel_file):
        print("Loading online_retail_II.xlsx (this may take a moment)...")
        # Load first sheet or chunk to keep performance smooth
        df_retail = pd.read_excel(excel_file, sheet_name=0, nrows=50000)
        # Clean column names
        df_retail.columns = [c.replace(' ', '_').lower() for c in df_retail.columns]
        df_retail.to_sql('online_retail_transactions', conn, if_exists='replace', index=False)
        print(f"Inserted {len(df_retail)} rows into online_retail_transactions.")

    # 3. Dataset 3: manjeetsingh/retaildataset
    print("\n--- Processing Dataset 3: manjeetsingh/retaildataset ---")
    ds3_path = kagglehub.dataset_download("manjeetsingh/retaildataset")
    
    stores_file = os.path.join(ds3_path, "stores data-set.csv")
    if os.path.exists(stores_file):
        df_stores = pd.read_csv(stores_file)
        df_stores.columns = [c.replace(' ', '_').lower() for c in df_stores.columns]
        df_stores.to_sql('retail_stores', conn, if_exists='replace', index=False)
        print(f"Inserted {len(df_stores)} rows into retail_stores.")

    sales_file = os.path.join(ds3_path, "sales data-set.csv")
    if os.path.exists(sales_file):
        df_sales = pd.read_csv(sales_file, nrows=50000)
        df_sales.columns = [c.replace(' ', '_').lower() for c in df_sales.columns]
        df_sales.to_sql('retail_sales', conn, if_exists='replace', index=False)
        print(f"Inserted {len(df_sales)} rows into retail_sales.")

    features_file = os.path.join(ds3_path, "Features data set.csv")
    if os.path.exists(features_file):
        df_features = pd.read_csv(features_file, nrows=50000)
        df_features.columns = [c.replace(' ', '_').lower() for c in df_features.columns]
        df_features.to_sql('retail_features', conn, if_exists='replace', index=False)
        print(f"Inserted {len(df_features)} rows into retail_features.")

    conn.commit()
    conn.close()
    print("\nDatabase seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
