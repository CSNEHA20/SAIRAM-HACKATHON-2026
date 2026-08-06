"""MongoDB adapter implementation using motor."""

import os
from typing import Any, Dict, List, Optional, Tuple

from db.adapters import DatabaseAdapter


def _default_connection_string() -> str:
    return os.getenv(
        "DATABASE_URL",
        "mongodb://localhost:27017/dataflow"
    )


class MongoDBAdapter(DatabaseAdapter):
    name = "mongodb"
    dialect = "mongodb"

    def __init__(self, connection_string: Optional[str] = None, **kwargs: Any) -> None:
        super().__init__(connection_string or _default_connection_string(), **kwargs)
        self._client = None
        self._db = None

    def _get_client(self):
        if self._client is None:
            try:
                import motor.motor_asyncio
            except ImportError as exc:
                raise RuntimeError(
                    "motor is required for MongoDB support. "
                    "Install it with: pip install motor"
                ) from exc
            self._client = motor.motor_asyncio.AsyncIOMotorClient(self.connection_string)
            db_name = self.options.get("db_name") or os.getenv("MONGODB_DB_NAME", "dataflow")
            self._db = self._client[db_name]
        return self._client, self._db

    async def initialize(self) -> None:
        self._get_client()

    async def check_health(self) -> bool:
        try:
            client, _ = self._get_client()
            await client.admin.command("ping")
            return True
        except Exception:
            return False

    async def execute_query(
        self,
        query: str,
        params: Optional[Tuple[Any, ...]] = None
    ) -> Dict[str, Any]:
        """Execute a MongoDB aggregation pipeline expressed as JSON array string."""
        try:
            import json
            _, db = self._get_client()
            parts = query.strip().split("|", 1)
            collection_name = parts[0].strip()
            pipeline_json = parts[1].strip() if len(parts) > 1 else "[]"
            pipeline = json.loads(pipeline_json)
            cursor = db[collection_name].aggregate(pipeline)
            rows = []
            async for doc in cursor:
                rows.append(doc)
            columns = []
            if rows:
                columns = list(rows[0].keys())
            return {
                "columns": columns,
                "rows": rows,
                "row_count": len(rows)
            }
        except Exception as e:
            return {
                "columns": [],
                "rows": [],
                "row_count": 0,
                "error": str(e)
            }

    async def execute_script(self, script: str) -> None:
        """No-op for MongoDB; indexes are created lazily."""
        pass

    async def get_schema(
        self,
        table_filter: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        try:
            _, db = self._get_client()
            all_tables = await db.list_collection_names()

            if not all_tables:
                return {
                    "success": False,
                    "error": "No collections found in database.",
                    "available_tables": [],
                    "tables": [],
                    "total_tables": 0
                }

            target_tables = all_tables
            if table_filter:
                filter_set = {t.lower() for t in table_filter}
                target_tables = [t for t in all_tables if t.lower() in filter_set]
                missing = [t for t in table_filter if t.lower() not in {t.lower() for t in all_tables}]
                if missing:
                    return {
                        "success": False,
                        "error": f"Collection(s) not found: {', '.join(missing)}.",
                        "available_tables": all_tables,
                        "tables": [],
                        "total_tables": 0
                    }

            schema_tables = []
            for collection_name in target_tables:
                # Sample up to 100 documents to infer schema
                rows = await db[collection_name].find().limit(100).to_list(length=100)
                columns_map: Dict[str, str] = {}
                for doc in rows:
                    for key, value in doc.items():
                        if key not in columns_map:
                            columns_map[key] = type(value).__name__

                columns = [
                    {
                        "name": name,
                        "type": py_type,
                        "pk": name == "_id",
                        "nullable": True,
                        "notnull": False
                    }
                    for name, py_type in columns_map.items()
                ]

                row_count = await db[collection_name].estimated_document_count()

                schema_tables.append({
                    "name": collection_name,
                    "columns": columns,
                    "foreign_keys": [],
                    "row_count": row_count
                })

            return {
                "success": True,
                "tables": schema_tables,
                "total_tables": len(schema_tables)
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to retrieve schema: {str(e)}",
                "tables": [],
                "total_tables": 0
            }

    def get_context_description(self) -> str:
        return "a MongoDB database (NoSQL). For queries, use collection_name|[JSON aggregation pipeline]"
