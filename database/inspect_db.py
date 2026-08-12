import sqlite3, json, os

DB_PATH = os.path.join(os.path.dirname(__file__), "ecommerce.sqlite")
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [r[0] for r in cursor.fetchall()]
print("TABLES:", json.dumps(tables, indent=2))
for t in tables:
    cursor.execute(f'SELECT COUNT(*) FROM "{t}"')
    count = cursor.fetchone()[0]
    cursor.execute(f'PRAGMA table_info("{t}")')
    cols = [r[1] for r in cursor.fetchall()]
    print(f"  [{t}] {count} rows | columns: {cols}")
conn.close()
