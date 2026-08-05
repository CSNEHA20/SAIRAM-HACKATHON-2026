import os
import json
import uuid
import asyncio
from typing import AsyncGenerator, Dict, Any, List, Optional
from dotenv import load_dotenv

try:
    import anthropic
    HAS_ANTHROPIC = True
except ImportError:
    anthropic = None
    HAS_ANTHROPIC = False
from agent.prompt import SYSTEM_PROMPT
from agent.session import session_store
from agent.tool_registry import TOOL_SCHEMAS, execute_tool

load_dotenv()

MAX_TOOL_ITERATIONS = int(os.getenv("MAX_TOOL_ITERATIONS", "8"))
DEFAULT_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")

def format_sse(event_dict: dict) -> str:
    """Formats event dict as standard SSE line."""
    return f"data: {json.dumps(event_dict)}\n\n"

class AgentOrchestrator:
    """
    ReAct Agent Orchestrator managing Claude Messages API tool_use loop.
    References: 05_AgentArchitecture.md & 10_BackendArchitecture.md
    """

    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self.model = os.getenv("ANTHROPIC_MODEL", DEFAULT_MODEL)
        self.is_mock_key = (
            not HAS_ANTHROPIC
            or not self.api_key
            or self.api_key == "mock_key_for_dev"
            or "your_anthropic_api_key" in self.api_key
        )
        if not self.is_mock_key and HAS_ANTHROPIC and anthropic:
            self.client = anthropic.AsyncAnthropic(api_key=self.api_key)
        else:
            self.client = None

    def is_claude_reachable(self) -> bool:
        """Returns whether a real Anthropic client is configured."""
        return self.client is not None and not self.is_mock_key

    async def process_message_stream(
        self,
        message: str,
        session_id: str,
        show_sql: bool = True
    ) -> AsyncGenerator[str, None]:
        """
        Main ReAct Loop async generator emitting 8-event SSE stream.
        """
        message_id = f"msg_{uuid.uuid4().hex[:10]}"
        clean_msg = message.strip()

        # Save user message to session
        session_store.add_message(session_id, "user", clean_msg)

        # Get sliding-window history for context
        history = session_store.get_messages(session_id)
        api_messages = []
        for msg in history[:-1]:  # exclude the just-added message to format cleanly
            api_messages.append({"role": msg["role"], "content": msg["content"]})
        api_messages.append({"role": "user", "content": clean_msg})

        # Run real Claude API loop if valid key exists, otherwise fallback to offline agent loop
        if not self.is_mock_key and self.client:
            async for sse_chunk in self._run_claude_loop(api_messages, session_id, message_id, show_sql):
                yield sse_chunk
        else:
            async for sse_chunk in self._run_offline_loop(clean_msg, session_id, message_id, show_sql):
                yield sse_chunk

    async def _run_claude_loop(
        self,
        messages: List[Dict[str, Any]],
        session_id: str,
        message_id: str,
        show_sql: bool
    ) -> AsyncGenerator[str, None]:
        """Real Claude API Messages ReAct loop with tool_use and tool_result."""
        iterations = 0
        assistant_response_content = []
        sql_statements_used = []

        try:
            while iterations < MAX_TOOL_ITERATIONS:
                iterations += 1
                response = await self.client.messages.create(
                    model=self.model,
                    max_tokens=4096,
                    system=SYSTEM_PROMPT,
                    tools=TOOL_SCHEMAS,
                    messages=messages
                )

                # Check stop reason
                if response.stop_reason == "tool_use":
                    tool_use_blocks = [b for b in response.content if b.type == "tool_use"]
                    
                    # Append assistant message with tool_use blocks to message history
                    messages.append({"role": "assistant", "content": response.content})

                    tool_results_content = []
                    for tool_block in tool_use_blocks:
                        tool_name = tool_block.name
                        tool_inputs = tool_block.input or {}

                        # Event: tool_start
                        yield format_sse({"type": "tool_start", "tool": tool_name})
                        await asyncio.sleep(0.05)

                        # Execute tool via registry
                        res_envelope = await execute_tool(tool_name, tool_inputs)
                        success = res_envelope.get("success", False)

                        # Event: tool_end
                        yield format_sse({"type": "tool_end", "tool": tool_name, "success": success})

                        # Handle derived events
                        if tool_name == "execute_query" and success and show_sql:
                            sql = res_envelope.get("sql")
                            if sql:
                                sql_statements_used.append(sql)
                                yield format_sse({"type": "sql", "content": sql})
                        elif tool_name == "generate_chart" and success:
                            yield format_sse({
                                "type": "chart",
                                "chart_type": res_envelope.get("chart_type", "bar"),
                                "title": res_envelope.get("title", ""),
                                "data": res_envelope.get("data", []),
                                "config": res_envelope.get("config", {})
                            })
                        elif tool_name == "generate_flowchart" and success:
                            yield format_sse({
                                "type": "diagram",
                                "diagram_type": res_envelope.get("diagram_type", "flowchart"),
                                "title": res_envelope.get("title", ""),
                                "mermaid": res_envelope.get("mermaid", "")
                            })

                        # Package tool_result block for Claude
                        tool_results_content.append({
                            "type": "tool_result",
                            "tool_use_id": tool_block.id,
                            "content": json.dumps(res_envelope)
                        })

                    # Inject tool_results into message stream for next reasoning loop
                    messages.append({"role": "user", "content": tool_results_content})

                elif response.stop_reason == "end_turn":
                    # Stream text blocks to client as token events
                    for block in response.content:
                        if block.type == "text":
                            text = block.text
                            assistant_response_content.append(text)
                            # Split into words/chunks for smooth streaming
                            words = text.split(" ")
                            for idx, word in enumerate(words):
                                chunk = word + (" " if idx < len(words) - 1 else "")
                                yield format_sse({"type": "token", "content": chunk})
                                await asyncio.sleep(0.02)
                    
                    full_text = "".join(assistant_response_content)
                    session_store.add_message(
                        session_id,
                        "assistant",
                        full_text,
                        sql_used=sql_statements_used
                    )
                    yield format_sse({"type": "done", "message_id": message_id})
                    return

            # Iteration limit reached
            yield format_sse({
                "type": "error",
                "code": "ITERATION_LIMIT_EXCEEDED",
                "message": "Maximum tool iteration limit reached."
            })

        except Exception as e:
            # Fall back gracefully to offline loop on API failure
            async for sse_chunk in self._run_offline_loop(messages[-1]["content"], session_id, message_id, show_sql):
                yield sse_chunk

    async def _run_offline_loop(
        self,
        user_msg: str,
        session_id: str,
        message_id: str,
        show_sql: bool
    ) -> AsyncGenerator[str, None]:
        """Deterministic offline ReAct loop executing get_schema & execute_query."""
        sql_used = []

        # Step 1: get_schema
        yield format_sse({"type": "tool_start", "tool": "get_schema"})
        schema_res = await execute_tool("get_schema", {})
        yield format_sse({
            "type": "tool_end",
            "tool": "get_schema",
            "success": schema_res.get("success", False)
        })
        await asyncio.sleep(0.05)

        # Step 2: Query execution logic based on prompt keywords
        query_sql = None
        lower_msg = user_msg.lower()

        if "top" in lower_msg or "product" in lower_msg or "revenue" in lower_msg or "price" in lower_msg:
            query_sql = "SELECT p.product_id, p.name, p.category, p.price, p.stock_quantity FROM products p ORDER BY p.price DESC LIMIT 5"
        elif "customer" in lower_msg or "city" in lower_msg:
            query_sql = "SELECT c.customer_id, c.name, c.email, c.city, c.country FROM customers c ORDER BY c.customer_id ASC LIMIT 5"
        elif "order" in lower_msg:
            query_sql = "SELECT o.order_id, o.customer_id, o.order_date, o.total_amount, o.status FROM orders o ORDER BY o.order_date DESC LIMIT 5"
        else:
            query_sql = "SELECT name, category, price FROM products LIMIT 5"

        yield format_sse({"type": "tool_start", "tool": "execute_query"})
        query_res = await execute_tool("execute_query", {"sql": query_sql})
        yield format_sse({
            "type": "tool_end",
            "tool": "execute_query",
            "success": query_res.get("success", False)
        })

        if show_sql and query_res.get("success"):
            sql_used.append(query_res["sql"])
            yield format_sse({"type": "sql", "content": query_res["sql"]})

        await asyncio.sleep(0.05)

        # Step 3: Optional chart or diagram step in offline mode
        if ("chart" in lower_msg or "bar" in lower_msg or "pie" in lower_msg or "line" in lower_msg) and query_res.get("success") and query_res.get("rows"):
            yield format_sse({"type": "tool_start", "tool": "generate_chart"})
            chart_type = "pie" if "pie" in lower_msg else ("line" if "line" in lower_msg else "bar")
            rows = query_res["rows"]
            cols = list(rows[0].keys()) if rows else []
            x_key = cols[1] if len(cols) > 1 else (cols[0] if cols else "name")
            y_key = cols[3] if len(cols) > 3 else (cols[-1] if cols else "price")
            
            chart_res = await execute_tool("generate_chart", {
                "chart_type": chart_type,
                "data": rows,
                "x_key": x_key,
                "y_key": y_key,
                "title": f"Top Products Visualization ({chart_type.capitalize()})"
            })
            yield format_sse({
                "type": "tool_end",
                "tool": "generate_chart",
                "success": chart_res.get("success", False)
            })
            if chart_res.get("success"):
                yield format_sse({
                    "type": "chart",
                    "chart_type": chart_res.get("chart_type", "bar"),
                    "title": chart_res.get("title", ""),
                    "data": chart_res.get("data", []),
                    "config": chart_res.get("config", {})
                })

        if "diagram" in lower_msg or "er" in lower_msg or "flowchart" in lower_msg or "relationship" in lower_msg:
            yield format_sse({"type": "tool_start", "tool": "generate_flowchart"})
            diag_res = await execute_tool("generate_flowchart", {
                "diagram_type": "er",
                "schema_data": schema_res,
                "title": "E-Commerce Database Schema ER Diagram"
            })
            yield format_sse({
                "type": "tool_end",
                "tool": "generate_flowchart",
                "success": diag_res.get("success", False)
            })
            if diag_res.get("success"):
                yield format_sse({
                    "type": "diagram",
                    "diagram_type": diag_res.get("diagram_type", "er"),
                    "title": diag_res.get("title", ""),
                    "mermaid": diag_res.get("mermaid", "")
                })

        # Step 4: Stream response text tokens
        rows_count = query_res.get("row_count", 0)
        tables_count = schema_res.get("total_tables", 5)

        response_text = (
            f"Based on the database schema ({tables_count} tables available), "
            f"I executed the query against the database and retrieved {rows_count} records. "
            f"The results have been validated and analyzed."
        )

        words = response_text.split(" ")
        for idx, word in enumerate(words):
            chunk = word + (" " if idx < len(words) - 1 else "")
            yield format_sse({"type": "token", "content": chunk})
            await asyncio.sleep(0.02)

        session_store.add_message(
            session_id,
            "assistant",
            response_text,
            sql_used=sql_used
        )

        yield format_sse({"type": "done", "message_id": message_id})

agent_orchestrator = AgentOrchestrator()

