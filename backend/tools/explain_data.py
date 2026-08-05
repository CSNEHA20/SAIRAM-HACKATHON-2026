from typing import Any, Dict, List, Optional

async def explain_data(
    data: List[Dict[str, Any]],
    columns: List[str],
    context: Optional[str] = None,
    insight_type: Optional[str] = "summary",
    **kwargs
) -> Dict[str, Any]:
    """
    07_ToolSpecifications.md § Tool 5 - explain_data tool implementation.
    Computes key statistical metrics locally from a dataset to ground the LLM narrative in actual numbers.
    """
    if not data or not isinstance(data, list):
        return {
            "success": False,
            "error": "data array is empty — no rows to explain."
        }
    
    if not columns:
        columns = list(data[0].keys()) if isinstance(data[0], dict) else []

    row_count = len(data)
    numeric_metrics: Dict[str, Any] = {}

    # Extract numeric columns and compute basic aggregates
    for col in columns:
        vals = [r[col] for r in data if isinstance(r, dict) and col in r and isinstance(r[col], (int, float))]
        if vals:
            col_min = min(vals)
            col_max = max(vals)
            col_sum = sum(vals)
            col_avg = round(col_sum / len(vals), 2)
            numeric_metrics[col] = {
                "min": col_min,
                "max": col_max,
                "total": col_sum,
                "average": col_avg
            }

    # Frame summary string based on computed metrics
    first_row = data[0]
    summary_parts = [f"Dataset contains {row_count} records across {len(columns)} columns ({', '.join(columns)})."]
    if numeric_metrics:
        first_num_col = list(numeric_metrics.keys())[0]
        m = numeric_metrics[first_num_col]
        summary_parts.append(
            f"For key metric '{first_num_col}', values range from {m['min']} to {m['max']} "
            f"with a total of {m['total']} and average of {m['average']}."
        )

    summary_text = " ".join(summary_parts)

    return {
        "success": True,
        "insight_type": insight_type or "summary",
        "context": context or "Query result summary",
        "row_count": row_count,
        "columns": columns,
        "summary": summary_text,
        "key_metrics": {
            "row_count": row_count,
            "numeric_aggregates": numeric_metrics,
            **numeric_metrics
        },
        "sample_first_row": first_row
    }
