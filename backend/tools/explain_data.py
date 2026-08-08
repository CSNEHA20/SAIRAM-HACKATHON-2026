from typing import Any, Dict, List, Optional

async def explain_data(
    data: List[Dict[str, Any]],
    columns: List[str],
    context: Optional[str] = None,
    insight_type: Optional[str] = "summary",
    **kwargs
) -> Dict[str, Any]:
    """
    30_ToolSpecifications.md §30.5 - explain_data tool implementation.
    Computes local metrics (totals, averages, min/max) to ground narrative responses.
    """
    if not data:
        return {"success": False, "error": "data array is empty — no rows to explain."}

    row_count = len(data)
    numeric_metrics: Dict[str, Any] = {}

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
        },
        "row_count": row_count
    }
