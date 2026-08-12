import pytest
from tools.ingest_dataset import ingest_csv_bytes, sanitize_table_name

@pytest.mark.asyncio
async def test_sanitize_table_name():
    assert sanitize_table_name("My Custom Dataset 2026!") == "my_custom_dataset_2026"

@pytest.mark.asyncio
async def test_ingest_csv_bytes():
    csv_data = b"product_id,product_name,price\n101,Gadget,49.99\n102,Widget,19.99\n"
    res = await ingest_csv_bytes(csv_data, "test_products_upload")
    assert res.get("success") is True
    assert res.get("table_name") == "test_products_upload"
    assert res.get("rows_inserted") == 2
