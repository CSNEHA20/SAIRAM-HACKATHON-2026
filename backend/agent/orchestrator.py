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

try:
    import openai
    from openai import AsyncOpenAI
    HAS_OPENAI = True
except ImportError:
    openai = None
    AsyncOpenAI = None
    HAS_OPENAI = False

from agent.prompt import SYSTEM_PROMPT, build_system_prompt
from agent.session import session_store
from agent.tool_registry import TOOL_SCHEMAS, execute_tool

load_dotenv()

MAX_TOOL_ITERATIONS = int(os.getenv("MAX_TOOL_ITERATIONS", "8"))
DEFAULT_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")


def format_sse(event_dict: dict) -> str:
    """Formats event dict as standard SSE line."""
    return f"data: {json.dumps(event_dict)}\n\n"


async def _stream_text(text: str) -> AsyncGenerator[str, None]:
    """Split text into word chunks and yield token SSE events."""
    words = text.split(" ")
    for idx, word in enumerate(words):
        chunk = word + (" " if idx < len(words) - 1 else "")
        yield format_sse({"type": "token", "content": chunk})


class AgentOrchestrator:
    """
    ReAct Agent Orchestrator managing Anthropic Messages API & OpenAI/NVIDIA Nemotron tool_use loops.
    References: 05_AgentArchitecture.md & 10_BackendArchitecture.md
    """

    def __init__(self):
        self._refresh_clients()

    def _refresh_clients(self):
        """Reload provider clients from current environment variables."""
        try:
            self.api_key = os.getenv("ANTHROPIC_API_KEY", "")
            self.model = os.getenv("ANTHROPIC_MODEL", DEFAULT_MODEL)
            self.offline_demo_mode = os.getenv("OFFLINE_DEMO_MODE", "false").lower() in ("true", "1", "yes")
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

            # NVIDIA Nemotron / OpenAI-compatible configuration
            self.nvidia_key = (
                os.getenv("NVIDIA_API_KEY")
                or os.getenv("NEMOTRON_API_KEY")
                or os.getenv("OPENAI_API_KEY", "")
            )
            self.nvidia_base_url = os.getenv(
                "NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"
            )
            self.nvidia_model = (
                os.getenv("NVIDIA_MODEL")
                or os.getenv("NEMOTRON_MODEL")
                or os.getenv("OPENAI_MODEL", "nvidia/nemotron-3.5-lightning-30b-a3b")
            )
            self.is_nvidia_mock = (
                not HAS_OPENAI
                or not self.nvidia_key
                or self.nvidia_key == "mock_key_for_dev"
                or "your_nvidia_api_key" in self.nvidia_key
            )
            if not self.is_nvidia_mock and HAS_OPENAI and AsyncOpenAI:
                self.openai_client = AsyncOpenAI(
                    api_key=self.nvidia_key,
                    base_url=self.nvidia_base_url
                )
            else:
                self.openai_client = None
        except Exception as err:
            print(f"[Client Init Error]: {err}")
            self.client = None
            self.openai_client = None

    def is_claude_reachable(self) -> bool:
        """Returns whether a real Anthropic or NVIDIA/OpenAI client is configured."""
        self._refresh_clients()
        return (self.client is not None and not self.is_mock_key) or (
            self.openai_client is not None and not self.is_nvidia_mock
        )

    def is_llm_reachable(self) -> bool:
        """Returns whether any real LLM provider client is configured."""
        return self.is_claude_reachable()

    async def process_message_stream(
        self,
        message: str,
        session_id: str,
        show_sql: bool = True
    ) -> AsyncGenerator[str, None]:
        """
        Main ReAct Loop async generator emitting 8-event SSE stream.
        """
        try:
            # Always refresh environment settings on incoming stream request
            self._refresh_clients()

            message_id = f"msg_{uuid.uuid4().hex[:10]}"
            clean_msg = message.strip()

            # Save user message to session
            session_store.add_message(session_id, "user", clean_msg)

            # Get sliding-window history for context
            history = session_store.get_messages(session_id)
            api_messages: List[Dict[str, Any]] = []
            for msg in history[:-1]:
                role = str(msg.get("role", "user"))
                content = str(msg.get("content", ""))
                if role in ("user", "assistant") and content:
                    api_messages.append({"role": role, "content": content})
            api_messages.append({"role": "user", "content": clean_msg})

            has_real_provider = (not self.is_mock_key and self.client is not None) or (
                not self.is_nvidia_mock and self.openai_client is not None
            )
            if self.offline_demo_mode:
                async for sse_chunk in self._run_offline_loop(clean_msg, session_id, message_id, show_sql):
                    yield sse_chunk
            elif has_real_provider:
                if not self.is_mock_key and self.client:
                    async for sse_chunk in self._run_claude_loop(api_messages, session_id, message_id, show_sql):
                        yield sse_chunk
                else:
                    async for sse_chunk in self._run_openai_loop(api_messages, session_id, message_id, show_sql):
                        yield sse_chunk
            else:
                yield format_sse({
                    "type": "error",
                    "code": "CLAUDE_UNCONFIGURED",
                    "message": (
                        "No LLM provider is configured. Set a valid ANTHROPIC_API_KEY or NVIDIA_API_KEY in your env file, "
                        "or enable OFFLINE_DEMO_MODE=true for a deterministic demo without an API key."
                    )
                })
                return
        except Exception as e:
            print(f"[Process Message Stream Exception]: {e}")
            yield format_sse({
                "type": "error",
                "code": "ORCHESTRATOR_ERROR",
                "message": f"Orchestrator error: {str(e)}"
            })

    async def _run_claude_loop(
        self,
        messages: List[Dict[str, Any]],
        session_id: str,
        message_id: str,
        show_sql: bool
    ) -> AsyncGenerator[str, None]:
        """Real Claude API Messages ReAct loop with tool_use and tool_result."""
        iterations = 0
        assistant_response_content: List[str] = []
        sql_statements_used: List[str] = []
        charts_collected: List[Dict[str, Any]] = []
        diagrams_collected: List[Dict[str, Any]] = []

        try:
            while iterations < MAX_TOOL_ITERATIONS:
                iterations += 1

                async with self.client.messages.stream(
                    model=self.model,
                    max_tokens=4096,
                    system=build_system_prompt(),
                    tools=TOOL_SCHEMAS,
                    messages=messages
                ) as stream:
                    async for text_delta in stream.text_stream:
                        assistant_response_content.append(text_delta)
                        yield format_sse({"type": "token", "content": text_delta})
                        await asyncio.sleep(0.005)

                    response = await stream.get_final_message()

                # Check stop reason
                if response.stop_reason == "tool_use":
                    tool_use_blocks = [b for b in response.content if b.type == "tool_use"]

                    # Append assistant message with tool_use blocks to message history
                    messages.append({"role": "assistant", "content": response.content})

                    tool_results_content: List[Dict[str, Any]] = []
                    for tool_block in tool_use_blocks:
                        tool_name = tool_block.name
                        tool_inputs = tool_block.input or {}

                        # Event: tool_start
                        yield format_sse({"type": "tool_start", "tool": tool_name})
                        await asyncio.sleep(0.03)

                        # Execute tool via registry
                        res_envelope = await execute_tool(tool_name, tool_inputs)

                        # Cache schema per-session when get_schema succeeds
                        if tool_name == "get_schema" and res_envelope.get("success"):
                            session_store.set_schema_cache(session_id, res_envelope)
                        success = res_envelope.get("success", False)

                        # Event: tool_end
                        yield format_sse({"type": "tool_end", "tool": tool_name, "success": success})

                        # Handle derived events
                        if tool_name == "execute_query" and success and show_sql:
                            sql = res_envelope.get("sql") or res_envelope.get("sql_executed")
                            if sql:
                                sql_statements_used.append(sql)
                                yield format_sse({"type": "sql", "content": sql})
                        elif tool_name == "generate_chart" and success:
                            chart_event = {
                                "type": "chart",
                                "chart_type": res_envelope.get("chart_type", "bar"),
                                "title": res_envelope.get("title", ""),
                                "data": res_envelope.get("data", []),
                                "config": res_envelope.get("config", {})
                            }
                            charts_collected.append(chart_event)
                            yield format_sse(chart_event)
                        elif tool_name == "generate_flowchart" and success:
                            diagram_event = {
                                "type": "diagram",
                                "diagram_type": res_envelope.get("diagram_type", "flowchart"),
                                "title": res_envelope.get("title", ""),
                                "mermaid": res_envelope.get("mermaid", "")
                            }
                            diagrams_collected.append(diagram_event)
                            yield format_sse(diagram_event)

                        # Package tool_result block for Claude
                        tool_results_content.append({
                            "type": "tool_result",
                            "tool_use_id": tool_block.id,
                            "content": json.dumps(res_envelope)
                        })

                    # Inject tool_results into message stream for next reasoning loop
                    messages.append({"role": "user", "content": tool_results_content})

                elif response.stop_reason == "end_turn":
                    full_text = "".join(assistant_response_content)
                    session_store.add_message(
                        session_id,
                        "assistant",
                        full_text,
                        charts=charts_collected,
                        sql_used=sql_statements_used,
                        diagrams=diagrams_collected
                    )
                    yield format_sse({"type": "done", "message_id": message_id})
                    return

            # Iteration limit reached
            yield format_sse({
                "type": "error",
                "code": "TOOL_ERROR",
                "message": "Maximum tool iteration limit reached."
            })

        except Exception as e:
            # Graceful failure: emit a friendly error event instead of switching to mock data.
            print(f"[Anthropic API Error]: {type(e).__name__}: {str(e)}")
            yield format_sse({
                "type": "error",
                "code": "API_ERROR",
                "message": f"Anthropic API call failed ({type(e).__name__}): {str(e)}"
            })

    def _build_react_system_prompt(self) -> str:
        """Build a system prompt that embeds tool schemas for text-based ReAct (no function calling API needed)."""
        tool_descriptions = []
        for schema in TOOL_SCHEMAS:
            props = schema.get("input_schema", {}).get("properties", {})
            required = schema.get("input_schema", {}).get("required", [])
            params_desc = []
            for pname, pdef in props.items():
                req = " (required)" if pname in required else " (optional)"
                params_desc.append(f"  - {pname}{req}: {pdef.get('description', pdef.get('type', ''))}")
            tool_descriptions.append(
                f"Tool: {schema['name']}\n"
                f"Description: {schema['description']}\n"
                f"Parameters:\n" + "\n".join(params_desc) if params_desc else f"Tool: {schema['name']}\nDescription: {schema['description']}\nParameters: none"
            )

        tools_block = "\n\n".join(tool_descriptions)
        base = build_system_prompt()
        react_instructions = f"""
You have access to the following tools. To call a tool, output ONLY a JSON block with this exact format (nothing else on that turn):

<tool_call>
{{"tool": "TOOL_NAME", "arguments": {{...}}}}
</tool_call>

After each tool result is shown to you, continue reasoning and either call another tool or give your final answer as plain text (no tool_call block).

AVAILABLE TOOLS:
{tools_block}

Rules:
- Always start by calling get_schema to understand the database.
- Then call execute_query with a valid SELECT SQL statement.
- To visualize data, call generate_chart after execute_query.
- Give a final plain-text answer summarizing the results.
- NEVER output a tool_call block in your final answer.
"""
        return base + react_instructions

    async def _run_openai_loop(
        self,
        messages: List[Dict[str, Any]],
        session_id: str,
        message_id: str,
        show_sql: bool
    ) -> AsyncGenerator[str, None]:
        """NVIDIA Nemotron text-based ReAct loop (no function-calling API required).
        Tool schemas are embedded in the system prompt; tool calls are parsed from model text."""
        import re

        iterations = 0
        assistant_response_content: List[str] = []
        sql_statements_used: List[str] = []
        charts_collected: List[Dict[str, Any]] = []
        diagrams_collected: List[Dict[str, Any]] = []

        react_system = self._build_react_system_prompt()
        oai_messages: List[Dict[str, Any]] = [{"role": "system", "content": react_system}]
        for m in messages:
            oai_messages.append({"role": m["role"], "content": m["content"]})

        try:
            while iterations < MAX_TOOL_ITERATIONS:
                iterations += 1

                response = await self.openai_client.chat.completions.create(
                    model=self.nvidia_model,
                    messages=oai_messages,
                    max_tokens=2048,
                    temperature=0.1
                )

                raw_text: str = response.choices[0].message.content or ""

                # Check if model wants to call a tool
                tool_match = re.search(
                    r"<tool_call>\s*(.*?)\s*</tool_call>",
                    raw_text,
                    re.DOTALL
                )

                if tool_match:
                    # Extract any text before the tool call and stream it as thinking
                    pre_text = raw_text[:tool_match.start()].strip()
                    if pre_text:
                        async for tok in _stream_text(pre_text + " "):
                            yield tok
                            await asyncio.sleep(0.005)

                    tool_name = ""
                    tool_inputs = {}
                    try:
                        raw_json = tool_match.group(1).strip()
                        raw_json = re.sub(r"^```(?:json)?\s*", "", raw_json)
                        raw_json = re.sub(r"\s*```$", "", raw_json)
                        call_data = json.loads(raw_json)
                        if isinstance(call_data, dict):
                            tool_name = str(call_data.get("tool", ""))
                            tool_inputs = call_data.get("arguments", {})
                            if not isinstance(tool_inputs, dict):
                                tool_inputs = {}
                        else:
                            tool_match = None
                    except Exception as parse_err:
                        print(f"[Tool Call Parse Error]: {parse_err}. Raw: {tool_match.group(1)[:200]}")
                        tool_match = None

                if tool_match and tool_name:
                    # Append assistant message
                    oai_messages.append({"role": "assistant", "content": raw_text})

                    # Event: tool_start
                    yield format_sse({"type": "tool_start", "tool": tool_name})
                    await asyncio.sleep(0.03)

                    # Execute tool via registry
                    res_envelope = await execute_tool(tool_name, tool_inputs)

                    if tool_name == "get_schema" and res_envelope.get("success"):
                        session_store.set_schema_cache(session_id, res_envelope)
                    success = res_envelope.get("success", False)

                    # Event: tool_end
                    yield format_sse({"type": "tool_end", "tool": tool_name, "success": success})

                    # Derived SSE events
                    if tool_name == "execute_query" and success and show_sql:
                        sql = res_envelope.get("sql") or res_envelope.get("sql_executed")
                        if sql:
                            sql_statements_used.append(sql)
                            yield format_sse({"type": "sql", "content": sql})
                    elif tool_name == "generate_chart" and success:
                        chart_event = {
                            "type": "chart",
                            "chart_type": res_envelope.get("chart_type", "bar"),
                            "title": res_envelope.get("title", ""),
                            "data": res_envelope.get("data", []),
                            "config": res_envelope.get("config", {})
                        }
                        charts_collected.append(chart_event)
                        yield format_sse(chart_event)
                    elif tool_name == "generate_flowchart" and success:
                        diagram_event = {
                            "type": "diagram",
                            "diagram_type": res_envelope.get("diagram_type", "flowchart"),
                            "title": res_envelope.get("title", ""),
                            "mermaid": res_envelope.get("mermaid", "")
                        }
                        diagrams_collected.append(diagram_event)
                        yield format_sse(diagram_event)

                    # Feed tool result back as user turn (ReAct pattern)
                    result_summary = json.dumps(res_envelope)
                    if len(result_summary) > 3000:
                        result_summary = result_summary[:3000] + "... [truncated]"
                    oai_messages.append({
                        "role": "user",
                        "content": f"Tool result for {tool_name}:\n{result_summary}\n\nContinue reasoning."
                    })

                else:
                    # No tool call — this is the final answer
                    final_text = re.sub(r"<tool_call>.*?</tool_call>", "", raw_text, flags=re.DOTALL).strip()
                    final_text = re.sub(r"</?tool_call>", "", final_text).strip()
                    if not final_text:
                        final_text = "Analysis complete."

                    assistant_response_content.append(final_text)
                    async for token_event in _stream_text(final_text):
                        yield token_event
                        await asyncio.sleep(0.008)

                    session_store.add_message(
                        session_id,
                        "assistant",
                        final_text,
                        charts=charts_collected,
                        sql_used=sql_statements_used,
                        diagrams=diagrams_collected
                    )
                    yield format_sse({"type": "done", "message_id": message_id})
                    return

            yield format_sse({
                "type": "error",
                "code": "TOOL_ERROR",
                "message": "Maximum tool iteration limit reached."
            })

        except Exception as e:
            print(f"[NVIDIA/OpenAI API Error]: {type(e).__name__}: {str(e)}")
            yield format_sse({
                "type": "error",
                "code": "API_ERROR",
                "message": f"NVIDIA/OpenAI API Call Failed ({type(e).__name__}): {str(e)}"
            })

    async def _run_offline_loop(
        self,
        user_msg: str,
        session_id: str,
        message_id: str,
        show_sql: bool
    ) -> AsyncGenerator[str, None]:
        """
        Deterministic offline ReAct loop used when no Anthropic key is available.
        Implements the three canonical use cases (UC1-UC3) so the product demos
        correctly without an external LLM.
        """
        sql_used: List[str] = []
        charts_collected: List[Dict[str, Any]] = []
        diagrams_collected: List[Dict[str, Any]] = []
        lower_msg = user_msg.lower()

        # Step 1: get_schema (with per-session cache)
        yield format_sse({"type": "tool_start", "tool": "get_schema"})
        cached_schema = session_store.get_schema_cache(session_id)
        if cached_schema:
            schema_res = cached_schema
        else:
            schema_res = await execute_tool("get_schema", {})
            if schema_res.get("success"):
                session_store.set_schema_cache(session_id, schema_res)
        yield format_sse({
            "type": "tool_end",
            "tool": "get_schema",
            "success": schema_res.get("success", False)
        })
        await asyncio.sleep(0.03)

        # UC2 / ER diagram path
        if any(k in lower_msg for k in ("er", "diagram", "relationship", "schema")) and "flow" not in lower_msg:
            yield format_sse({"type": "tool_start", "tool": "generate_flowchart"})
            diag_res = await execute_tool("generate_flowchart", {
                "diagram_type": "er",
                "schema_data": schema_res,
                "title": "E-Commerce Database ER Diagram"
            })
            yield format_sse({"type": "tool_end", "tool": "generate_flowchart", "success": diag_res.get("success", False)})
            if diag_res.get("success"):
                diagram_event = {
                    "type": "diagram",
                    "diagram_type": "er",
                    "title": diag_res.get("title", ""),
                    "mermaid": diag_res.get("mermaid", "")
                }
                diagrams_collected.append(diagram_event)
                yield format_sse(diagram_event)

            response_text = (
                "Here is the ER diagram for the e-commerce database. "
                "The five tables are connected as follows: customers place orders, "
                "orders contain order_items, products appear in order_items, and "
                "products are tracked in inventory."
            )
            async for token_event in _stream_text(response_text):
                yield token_event
                await asyncio.sleep(0.01)
            session_store.add_message(
                session_id,
                "assistant",
                response_text,
                diagrams=diagrams_collected
            )
            yield format_sse({"type": "done", "message_id": message_id})
            return

        # UC3 / process flowchart path
        if any(k in lower_msg for k in ("flow", "process", "how orders flow", "order flow")):
            yield format_sse({"type": "tool_start", "tool": "generate_flowchart"})
            flow_code = (
                "flowchart TD\n"
                "    C[Customer] -->|places| O[Order]\n"
                "    O -->|contains| OI[Order Items]\n"
                "    OI -->|references| P[Products]\n"
                "    P -->|tracked by| I[Inventory]\n"
                "    O -->|lifecycle| S[Status: pending -> processing -> shipped -> delivered]"
            )
            diag_res = await execute_tool("generate_flowchart", {
                "diagram_type": "flowchart",
                "mermaid_code": flow_code,
                "title": "Order Process Flow"
            })
            yield format_sse({"type": "tool_end", "tool": "generate_flowchart", "success": diag_res.get("success", False)})
            if diag_res.get("success"):
                diagram_event = {
                    "type": "diagram",
                    "diagram_type": "flowchart",
                    "title": diag_res.get("title", ""),
                    "mermaid": diag_res.get("mermaid", "")
                }
                diagrams_collected.append(diagram_event)
                yield format_sse(diagram_event)

            response_text = (
                "This flowchart shows how orders move through the system. "
                "A customer places an order, which contains order items referencing products. "
                "Products are tracked in inventory, and each order passes through a status lifecycle."
            )
            async for token_event in _stream_text(response_text):
                yield token_event
                await asyncio.sleep(0.01)
            session_store.add_message(
                session_id,
                "assistant",
                response_text,
                diagrams=diagrams_collected
            )
            yield format_sse({"type": "done", "message_id": message_id})
            return

        # Step 2: choose and execute a representative SELECT query
        query_sql = self._choose_offline_query(lower_msg)

        yield format_sse({"type": "tool_start", "tool": "execute_query"})
        query_res = await execute_tool("execute_query", {"sql": query_sql})
        yield format_sse({
            "type": "tool_end",
            "tool": "execute_query",
            "success": query_res.get("success", False)
        })

        if show_sql and query_res.get("success"):
            executed_sql = query_res.get("sql") or query_res.get("sql_executed", query_sql)
            sql_used.append(executed_sql)
            yield format_sse({"type": "sql", "content": executed_sql})

        await asyncio.sleep(0.03)

        # Step 3: generate chart for data questions when appropriate
        chart_type = None
        if "pie" in lower_msg:
            chart_type = "pie"
        elif "line" in lower_msg or "trend" in lower_msg:
            chart_type = "line"
        elif "scatter" in lower_msg:
            chart_type = "scatter"
        elif "bar" in lower_msg or "chart" in lower_msg or "top" in lower_msg or "revenue" in lower_msg:
            chart_type = "bar"

        rows = query_res.get("rows", []) if query_res.get("success") else []
        if chart_type and rows:
            cols = list(rows[0].keys()) if rows else []
            x_key = cols[0] if cols else "category"
            y_key = cols[1] if len(cols) > 1 else cols[0]

            yield format_sse({"type": "tool_start", "tool": "generate_chart"})
            chart_res = await execute_tool("generate_chart", {
                "chart_type": chart_type,
                "data": rows,
                "x_key": x_key,
                "y_key": y_key,
                "title": self._offline_chart_title(lower_msg, chart_type)
            })
            yield format_sse({"type": "tool_end", "tool": "generate_chart", "success": chart_res.get("success", False)})
            if chart_res.get("success"):
                chart_event = {
                    "type": "chart",
                    "chart_type": chart_res.get("chart_type", "bar"),
                    "title": chart_res.get("title", ""),
                    "data": chart_res.get("data", []),
                    "config": chart_res.get("config", {})
                }
                charts_collected.append(chart_event)
                yield format_sse(chart_event)

        # Step 4: grounded explanation
        row_count = query_res.get("row_count", 0) if query_res.get("success") else 0
        tables_count = schema_res.get("total_tables", 0)

        response_text = self._build_offline_response(lower_msg, row_count, tables_count, bool(chart_type))
        async for token_event in _stream_text(response_text):
            yield token_event
            await asyncio.sleep(0.01)

        session_store.add_message(
            session_id,
            "assistant",
            response_text,
            charts=charts_collected,
            sql_used=sql_used,
            diagrams=diagrams_collected
        )
        yield format_sse({"type": "done", "message_id": message_id})

    def _choose_offline_query(self, lower_msg: str) -> str:
        """Pick a representative query for the offline fallback path."""
        if "top" in lower_msg and "revenue" in lower_msg:
            return (
                "SELECT p.name AS product_name, SUM(oi.quantity * oi.unit_price) AS total_revenue "
                "FROM order_items oi JOIN products p ON oi.product_id = p.product_id "
                "GROUP BY p.product_id, p.name ORDER BY total_revenue DESC LIMIT 5"
            )
        if "top" in lower_msg and "customer" in lower_msg:
            return (
                "SELECT c.name, COUNT(o.order_id) AS total_orders, SUM(o.total_amount) AS total_spent "
                "FROM customers c JOIN orders o ON c.customer_id = o.customer_id "
                "GROUP BY c.customer_id ORDER BY total_spent DESC LIMIT 10"
            )
        if "status" in lower_msg or "distribution" in lower_msg:
            return (
                "SELECT status, COUNT(*) AS count FROM orders GROUP BY status ORDER BY count DESC"
            )
        if "category" in lower_msg:
            return (
                "SELECT p.category, SUM(oi.quantity * oi.unit_price) AS revenue "
                "FROM order_items oi JOIN products p ON oi.product_id = p.product_id "
                "GROUP BY p.category ORDER BY revenue DESC"
            )
        if "low stock" in lower_msg or "stock" in lower_msg:
            return (
                "SELECT p.name, p.stock_quantity, i.warehouse_location "
                "FROM products p JOIN inventory i ON p.product_id = i.product_id "
                "WHERE p.stock_quantity < 20 ORDER BY p.stock_quantity ASC"
            )
        if "monthly" in lower_msg or "trend" in lower_msg:
            return (
                "SELECT strftime('%Y-%m', order_date) AS month, SUM(total_amount) AS revenue "
                "FROM orders WHERE status != 'cancelled' GROUP BY month ORDER BY month DESC LIMIT 12"
            )
        if "customer" in lower_msg:
            return "SELECT customer_id, name, email, city, country FROM customers LIMIT 10"
        if "order" in lower_msg:
            return (
                "SELECT o.order_id, c.name AS customer_name, o.order_date, o.total_amount, o.status "
                "FROM orders o JOIN customers c ON o.customer_id = c.customer_id "
                "ORDER BY o.order_date DESC LIMIT 10"
            )
        return "SELECT p.product_id, p.name, p.category, p.price FROM products ORDER BY p.price DESC LIMIT 5"

    def _offline_chart_title(self, lower_msg: str, chart_type: str) -> str:
        """Generate a context-aware chart title for offline mode."""
        if "revenue" in lower_msg:
            return f"Revenue Analysis ({chart_type.capitalize()})"
        if "customer" in lower_msg:
            return f"Customer Analysis ({chart_type.capitalize()})"
        if "status" in lower_msg:
            return f"Order Status Distribution ({chart_type.capitalize()})"
        if "category" in lower_msg:
            return f"Revenue by Category ({chart_type.capitalize()})"
        return f"Query Results ({chart_type.capitalize()})"

    def _build_offline_response(self, lower_msg: str, row_count: int, tables_count: int, has_chart: bool) -> str:
        """Build a concise, grounded response for offline mode."""
        base = f"Based on the database schema ({tables_count} tables available), I executed the query and retrieved {row_count} records."
        if has_chart:
            base += " The chart above visualizes the key metric."
        if "revenue" in lower_msg:
            base += " Revenue is computed as quantity multiplied by unit price from order_items, joined with products."
        elif "status" in lower_msg:
            base += " This shows how orders are distributed across the order lifecycle."
        elif "customer" in lower_msg:
            base += " Spend is aggregated across each customer's orders."
        return base


agent_orchestrator = AgentOrchestrator()

