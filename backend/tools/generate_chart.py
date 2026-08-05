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
    Converts query result rows into chart configuration for the frontend renderer.
    """
    valid_types = ["bar", "line", "pie", "scatter"]
    if chart_type not in valid_types:
        return {
            "success": False,
            "error": f"Invalid chart_type '{chart_type}'. Must be one of: {', '.join(valid_types)}."
        }
    if not data or not isinstance(data, list):
        return {"success": False, "error": "Cannot generate chart: dataset is empty or invalid."}
    
    first_row = data[0]
    if not isinstance(first_row, dict):
        return {"success": False, "error": "Cannot generate chart: row items are not objects."}

    if x_key not in first_row or y_key not in first_row:
        available = list(first_row.keys())
        return {
            "success": False,
            "error": f"Column '{x_key}' or '{y_key}' not found in dataset.",
            "hint": f"Available columns in data: {', '.join(available)}"
        }

    return {
        "success": True,
        "chart_type": chart_type,
        "title": title or f"{chart_type.capitalize()} Chart: {y_label or y_key} by {x_label or x_key}",
        "data": data,
        "config": {
            "x_key": x_key,
            "y_key": y_key,
            "x_label": x_label or x_key,
            "y_label": y_label or y_key,
            "color": color or "#6366f1"
        }
    }
