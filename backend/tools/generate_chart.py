from typing import Any, Dict, List, Optional

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
    """
    30_ToolSpecifications.md §30.3 - generate_chart tool implementation.
    Produces chart configuration JSON for frontend Recharts renderer.
    """
    if chart_type not in ["bar", "line", "pie", "scatter"]:
        return {
            "success": False,
            "error": f"chart_type '{chart_type}' is not supported. Use: bar, line, pie, scatter"
        }
    if not data:
        return {"success": False, "error": "data array is empty — no rows to chart."}
    
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
