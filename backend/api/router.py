import asyncio
import json
import uuid
from typing import AsyncGenerator
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from agent.session import session_store
from api.schemas import ChatRequest, HistoryResponse, MessageRecord, SchemaResponse
from tools.get_schema import get_schema
from tools.execute_query import execute_query

router = APIRouter(prefix="/api")

def format_sse_event(event_data: dict) -> str:
    """Formats a python dict into standard SSE wire format: data: <json>\n\n"""
    return f"data: {json.dumps(event_data)}\n\n"

async def stub_sse_generator(request: ChatRequest) -> AsyncGenerator[str, None]:
    """
    CP1 Stub SSE Event Generator.
    Emits typed events following the 8-event frozen SSE contract (18_IntegrationPlan.md):
    tool_start -> tool_end -> sql -> token x N -> done
    """
    message_id = f"msg_{uuid.uuid4().hex[:10]}"
    user_msg = request.message.strip()

    # Save user message in session store
    session_store.add_message(request.session_id, "user", user_msg)

    # Event 1: tool_start for schema discovery
    yield format_sse_event({"type": "tool_start", "tool": "get_schema"})
    await asyncio.sleep(0.1)

    # Perform actual get_schema execution to verify database connection
    schema_res = await get_schema()
    yield format_sse_event({
        "type": "tool_end",
        "tool": "get_schema",
        "success": schema_res.get("success", False)
    })
    await asyncio.sleep(0.1)

    # Event 2: tool_start for execute_query
    yield format_sse_event({"type": "tool_start", "tool": "execute_query"})
    await asyncio.sleep(0.1)

    # Sample query execution for stub stream demonstration
    sample_sql = "SELECT p.name AS product_name, p.category, p.price FROM products p ORDER BY p.price DESC LIMIT 5"
    query_res = await execute_query(sample_sql)

    if request.options.show_sql and query_res.get("success"):
        yield format_sse_event({
            "type": "sql",
            "content": query_res["sql"]
        })
        await asyncio.sleep(0.1)

    yield format_sse_event({
        "type": "tool_end",
        "tool": "execute_query",
        "success": query_res.get("success", False)
    })
    await asyncio.sleep(0.1)

    # Event 3: Stream tokens
    response_text = (
        f"I received your query: '{user_msg}'. "
        f"I analyzed the database schema ({schema_res.get('total_tables', 0)} tables available) "
        f"and retrieved top product records from SQLite."
    )
    words = response_text.split(" ")
    accumulated_content = []

    for word in words:
        chunk = word + " "
        accumulated_content.append(chunk)
        yield format_sse_event({
            "type": "token",
            "content": chunk
        })
        await asyncio.sleep(0.03)

    # Save assistant response in session store
    full_response = "".join(accumulated_content)
    session_store.add_message(
        request.session_id,
        "assistant",
        full_response,
        sql_used=[sample_sql] if request.options.show_sql else []
    )

    # Event 4: Terminal done event
    yield format_sse_event({
        "type": "done",
        "message_id": message_id
    })

from agent.orchestrator import agent_orchestrator

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    POST /api/chat - Main conversational streaming endpoint powered by AgentOrchestrator.
    Emits an SSE stream of typed events (08_APIArchitecture.md & 05_AgentArchitecture.md).
    """
    if not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "EMPTY_MESSAGE", "message": "Message cannot be empty."}
        )

    return StreamingResponse(
        agent_orchestrator.process_message_stream(
            message=request.message,
            session_id=request.session_id,
            show_sql=request.options.show_sql
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/session/{session_id}/history", response_model=HistoryResponse)
async def get_session_history(session_id: str):
    """GET /api/session/{id}/history - Retrieves message history for a session."""
    messages = session_store.get_messages(session_id)
    records = [MessageRecord(**msg) for msg in messages]
    return HistoryResponse(
        session_id=session_id,
        messages=records,
        message_count=len(records)
    )

@router.delete("/session/{session_id}")
async def clear_session(session_id: str):
    """DELETE /api/session/{id} - Clears message history for a session."""
    success = session_store.clear_session(session_id)
    return {"success": success, "message": f"Session {session_id} cleared."}

@router.get("/schema", response_model=SchemaResponse)
async def direct_schema_introspection():
    """GET /api/schema - Direct PRAGMA schema introspection for UI schema panel."""
    res = await get_schema()
    if not res.get("success"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "DB_ERROR", "message": res.get("error", "Failed to fetch schema")}
        )
    return SchemaResponse(
        success=True,
        tables=res["tables"],
        total_tables=res["total_tables"]
    )

import csv
import io
from fastapi.responses import Response
from api.schemas import ExportRequest

@router.post("/export/csv")
async def export_csv(req: ExportRequest):
    """POST /api/export/csv - Execute SELECT query and stream CSV file download."""
    res = await execute_query(req.sql)
    if not res.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "SQL_UNSAFE" if "Forbidden" in res.get("error", "") else "DB_ERROR", "message": res.get("error")}
        )
    
    output = io.StringIO()
    writer = csv.writer(output)
    cols = res.get("columns", [])
    writer.writerow(cols)
    for row in res.get("rows", []):
        writer.writerow([row.get(col, "") for col in cols])
        
    filename = req.filename or "export"
    if not filename.endswith(".csv"):
        filename = f"{filename}.csv"
        
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

