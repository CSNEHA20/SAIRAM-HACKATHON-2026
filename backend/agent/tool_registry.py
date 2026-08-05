import json
from typing import Any, Dict, List, Optional
from tools.get_schema import get_schema
from tools.execute_query import execute_query

# JSON Schemas for Anthropic Messages API (30_ToolSpecifications.md)
TOOL_SCHEMAS = [
    {
        "name": "get_schema",
        "description": "Retrieve complete database structure — tables, columns, types, primary keys, foreign keys, and row counts. Call this first before writing SQL or when table structure is unknown.",
        "input_schema": {
            "type": "object",
            "properties": {
                "table_filter": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Optional list of table names to inspect. If omitted, all tables are returned."
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

# Implementation functions for visualization & insight tools
async def generate_chart(
    chart_type: str,
    data: List[Dict[str, Any]],
    x_key: str,
    y_key: str,
    title: Optional[str] = None,
    x_label: Optional[str] = None,
    y_label: Optional[str] = None,
    color: Optional[str] = None,
    **kwargs
) -> Dict[str, Any]:
    """30_ToolSpecifications.md §30.3 - generate_chart tool implementation."""
    if chart_type not in ["bar", "line", "pie", "scatter"]:
        return {
            "success": False,
            "error": f"Invalid chart_type '{chart_type}'. Must be one of: bar, line, pie, scatter."
        }
    if not data:
        return {"success": False, "error": "Cannot generate chart: dataset is empty."}
    
    first_row = data[0]
    if x_key not in first_row or y_key not in first_row:
        available = list(first_row.keys())
        return {
            "success": False,
            "error": f"Keys '{x_key}' or '{y_key}' not found in dataset.",
            "hint": f"Available columns in data: {', '.join(available)}"
        }

    return {
        "success": True,
        "chart_type": chart_type,
        "title": title or f"{chart_type.capitalize()} Chart: {y_key} by {x_key}",
        "data": data,
        "config": {
            "x_key": x_key,
            "y_key": y_key,
            "x_label": x_label or x_key,
            "y_label": y_label or y_key,
            "color": color or "#6366f1"
        }
    }

async def generate_flowchart(
    diagram_type: str,
    mermaid_code: Optional[str] = None,
    schema_data: Optional[Dict[str, Any]] = None,
    title: Optional[str] = None,
    **kwargs
) -> Dict[str, Any]:
    """30_ToolSpecifications.md §30.4 - generate_flowchart tool implementation."""
    if diagram_type not in ["er", "flowchart", "sequence"]:
        return {
            "success": False,
            "error": f"Invalid diagram_type '{diagram_type}'. Must be one of: er, flowchart, sequence."
        }

    # Path A: Auto-ER from schema_data
    if schema_data and "tables" in schema_data:
        mermaid_lines = ["erDiagram"]
        tables = schema_data["tables"]
        for t in tables:
            tname = t["name"].upper()
            mermaid_lines.append(f"    {tname} {{")
            for c in t.get("columns", []):
                ctype = c.get("type", "TEXT")
                cname = c.get("name")
                pk = "PK" if c.get("pk") else ""
                mermaid_lines.append(f"        {ctype} {cname} {pk}".strip())
            mermaid_lines.append("    }")

            for fk in t.get("foreign_keys", []):
                target = fk.get("target_table", "").upper()
                if target:
                    mermaid_lines.append(f"    {tname} ||--o{{ {target} : \"references\"")
        
        return {
            "success": True,
            "diagram_type": "er",
            "title": title or "Database ER Diagram",
            "mermaid": "\n".join(mermaid_lines)
        }

    # Path B: User/LLM provided mermaid_code
    if mermaid_code:
        return {
            "success": True,
            "diagram_type": diagram_type,
            "title": title or f"{diagram_type.capitalize()} Diagram",
            "mermaid": mermaid_code.strip()
        }

    return {
        "success": False,
        "error": "Either mermaid_code or schema_data must be provided to generate a flowchart."
    }

async def explain_data(
    data: List[Dict[str, Any]],
    columns: List[str],
    context: Optional[str] = None,
    insight_type: Optional[str] = "summary",
    **kwargs
) -> Dict[str, Any]:
    """30_ToolSpecifications.md §30.5 - explain_data tool implementation."""
    if not data:
        return {"success": False, "error": "data array is empty — no rows to explain."}

    row_count = len(data)
    numeric_metrics: Dict[str, Any] = {}

    # Compute basic aggregations for numeric columns
    for col in columns:
        vals = [row[col] for row in data if col in row and isinstance(row[col], (int, float))]
        if vals:
            numeric_metrics[col] = {
                "total": round(sum(vals), 2),
                "average": round(sum(vals) / len(vals), 2),
                "min": min(vals),
                "max": max(vals)
            }

    return {
        "success": True,
        "insight_type": insight_type,
        "summary": f"Dataset contains {row_count} rows across {len(columns)} columns.",
        "key_metrics": {
            "row_count": row_count,
            "numeric_aggregates": numeric_metrics
        }
    }

# TOOL_MAP registry dispatch map (06_ToolArchitecture.md §2)
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
    Enforces exception safety and returns structured envelope (06_ToolArchitecture.md §2).
    """
    if name not in TOOL_MAP:
        return {
            "success": False,
            "error": f"Unknown tool: {name}. Available tools: {', '.join(TOOL_MAP.keys())}"
        }

    tool_func = TOOL_MAP[name]
    try:
        if name == "get_schema":
            table_filter = inputs.get("table_filter")
            return await tool_func(table_filter=table_filter)
        elif name == "execute_query":
            sql = inputs.get("sql", "")
            return await tool_func(sql=sql)
        else:
            return await tool_func(**inputs)
    except Exception as e:
        return {
            "success": False,
            "error": f"Tool execution exception in {name}: {str(e)}"
        }
