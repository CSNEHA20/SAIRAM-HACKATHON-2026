import os
import asyncio
import json
from typing import Any, Dict, List, Optional
from tools.get_schema import get_schema
from tools.execute_query import execute_query
from tools.generate_chart import generate_chart
from tools.generate_flowchart import generate_flowchart
from tools.explain_data import explain_data

TOOL_TIMEOUT_SECONDS = float(os.getenv("TOOL_TIMEOUT_SECONDS", "30"))

# JSON Schemas for Anthropic Messages API (07_ToolSpecifications.md)
TOOL_SCHEMAS = [
    {
        "name": "get_schema",
        "description": "Retrieve complete database structure — tables, columns, types, primary keys, foreign keys, and row counts. Call this first before writing SQL or when table structure is unknown.",
        "input_schema": {
            "type": "object",
            "properties": {
                "table_filter": {
                    "type": "string",
                    "description": "Optional table name to narrow the inspection. If omitted, all tables are returned."
                }
            },
            "required": []
        }
    },
    {
        "name": "execute_query",
        "description": "Execute a validated SELECT SQL query against the e-commerce database and return structured rows. Only SELECT statements are permitted.",
        "input_schema": {
            "type": "object",
            "properties": {
                "sql": {
                    "type": "string",
                    "description": "The SELECT SQL query statement to execute."
                },
                "limit": {
                    "type": "integer",
                    "description": "Optional row cap (default 100, maximum 1000)."
                }
            },
            "required": ["sql"]
        }
    },
    {
        "name": "generate_chart",
        "description": "Convert query results into chart configuration for the frontend renderer. Choose chart_type by analytical fit.",
        "input_schema": {
            "type": "object",
            "properties": {
                "chart_type": {
                    "type": "string",
                    "enum": ["bar", "line", "pie", "scatter"],
                    "description": "Analytical shape: bar (comparison), line (trend), pie (parts of whole), scatter (correlation)."
                },
                "data": {
                    "type": "array",
                    "items": {"type": "object"},
                    "description": "Array of result row objects (from execute_query)."
                },
                "x_key": {
                    "type": "string",
                    "description": "Column name for x-axis / category label."
                },
                "y_key": {
                    "type": "string",
                    "description": "Column name for y-axis / metric value."
                },
                "title": {
                    "type": "string",
                    "description": "Optional title for the chart."
                },
                "x_label": {"type": "string", "description": "Optional x-axis label."},
                "y_label": {"type": "string", "description": "Optional y-axis label."},
                "color": {"type": "string", "description": "Optional series color (hex)."}
            },
            "required": ["chart_type", "data", "x_key", "y_key"]
        }
    },
    {
        "name": "generate_flowchart",
        "description": "Generate Mermaid code for ER diagrams, process flows, or sequence diagrams.",
        "input_schema": {
            "type": "object",
            "properties": {
                "diagram_type": {
                    "type": "string",
                    "enum": ["er", "flowchart", "sequence"],
                    "description": "Diagram type: er (database structure), flowchart (process), sequence (workflow)."
                },
                "mermaid_code": {
                    "type": "string",
                    "description": "Pre-written Mermaid code string."
                },
                "schema_data": {
                    "type": "object",
                    "description": "Optional schema object from get_schema to auto-generate ER diagram."
                },
                "title": {
                    "type": "string",
                    "description": "Optional title for the diagram."
                }
            },
            "required": ["diagram_type"]
        }
    },
    {
        "name": "explain_data",
        "description": "Compute key metrics locally from a dataset to ground the narrative in actual numbers.",
        "input_schema": {
            "type": "object",
            "properties": {
                "data": {
                    "type": "array",
                    "items": {"type": "object"},
                    "description": "Array of result rows to compute metrics on."
                },
                "columns": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Columns available in dataset."
                },
                "context": {"type": "string", "description": "User question context."},
                "insight_type": {
                    "type": "string",
                    "enum": ["summary", "trend", "comparison", "anomaly"],
                    "description": "Analytical lens."
                }
            },
            "required": ["data", "columns"]
        }
    }
]

# TOOL_MAP registry dispatch map
TOOL_MAP = {
    "get_schema": get_schema,
    "execute_query": execute_query,
    "generate_chart": generate_chart,
    "generate_flowchart": generate_flowchart,
    "explain_data": explain_data,
}

async def execute_tool(name: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
    """
    Registry entrypoint: dispatches tool name to implementation.
    Enforces exception safety, timeout, and returns structured envelope.
    """
    if name not in TOOL_MAP:
        return {
            "success": False,
            "error": f"Unknown tool: {name}. Available tools: {', '.join(TOOL_MAP.keys())}"
        }

    tool_func = TOOL_MAP[name]
    try:
        return await asyncio.wait_for(tool_func(**inputs), timeout=TOOL_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        return {
            "success": False,
            "error": f"Tool {name} timed out after {TOOL_TIMEOUT_SECONDS}s."
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Tool execution exception in {name}: {str(e)}"
        }

