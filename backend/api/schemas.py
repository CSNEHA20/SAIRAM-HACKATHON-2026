from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class ChatOptions(BaseModel):
    show_sql: bool = Field(default=True, description="Whether to include SQL query events in SSE stream")
    stream: bool = Field(default=True, description="Whether to stream response via SSE")

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User question or query text")
    session_id: str = Field(..., min_length=1, description="Unique session identifier")
    options: ChatOptions = Field(default_factory=ChatOptions)

class MessageRecord(BaseModel):
    role: str
    content: str
    timestamp: str
    charts: Optional[List[Dict[str, Any]]] = None
    sql_used: Optional[List[str]] = None

class HistoryResponse(BaseModel):
    session_id: str
    messages: List[MessageRecord]
    message_count: int

class SchemaColumn(BaseModel):
    name: str
    type: str
    pk: bool
    notnull: bool

class SchemaForeignKey(BaseModel):
    from_column: str
    target_table: str
    target_column: str

class SchemaTable(BaseModel):
    name: str
    columns: List[SchemaColumn]
    foreign_keys: List[SchemaForeignKey]
    row_count: int

class SchemaResponse(BaseModel):
    success: bool
    tables: List[SchemaTable]
    total_tables: int

class HealthResponse(BaseModel):
    status: str
    database: str
    claude_api: str
    version: str = "1.0.0"

class ExportRequest(BaseModel):
    sql: str = Field(..., description="SQL SELECT query to execute and export")
    filename: Optional[str] = Field(default="export", description="Base filename without extension")

