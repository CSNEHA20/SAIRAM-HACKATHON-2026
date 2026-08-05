from typing import Any, Dict, Optional

async def generate_flowchart(
    diagram_type: str,
    mermaid_code: Optional[str] = None,
    schema_data: Optional[Dict[str, Any]] = None,
    title: Optional[str] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    07_ToolSpecifications.md § Tool 4 - generate_flowchart tool implementation.
    Generates Mermaid.js diagram strings for ER diagrams, process flows, or sequence diagrams.
    """
    valid_types = ["er", "flowchart", "sequence"]
    if diagram_type not in valid_types:
        return {
            "success": False,
            "error": f"Invalid diagram_type '{diagram_type}'. Must be one of: {', '.join(valid_types)}"
        }

    # Case A: Auto-generate ER diagram from schema_data if schema_data provided
    if schema_data and "tables" in schema_data:
        lines = ["erDiagram"]
        tables = schema_data["tables"]
        for t in tables:
            tname = t["name"].upper()
            lines.append(f"    {tname} {{")
            for c in t.get("columns", []):
                ctype = c.get("type", "TEXT")
                cname = c.get("name")
                pk = "PK" if c.get("pk") else ""
                lines.append(f"        {ctype} {cname} {pk}".strip())
            lines.append("    }")
        
        # Add relationships
        for t in tables:
            tname = t["name"].upper()
            for fk in t.get("foreign_keys", []):
                target = fk.get("target_table") or fk.get("table")
                if target:
                    lines.append(f"    {tname} }}|--|| {target.upper()} : references")
        
        mermaid_str = "\n".join(lines)
        return {
            "success": True,
            "diagram_type": diagram_type,
            "title": title or "Database ER Diagram",
            "mermaid": mermaid_str,
            "mermaid_code": mermaid_str
        }

    # Case B: Direct Mermaid code provided
    if mermaid_code:
        clean_code = mermaid_code.strip()

        # Simple auto-prefix if diagram type header missing
        if diagram_type == "er" and not clean_code.startswith("erDiagram"):
            clean_code = "erDiagram\n" + clean_code
        elif diagram_type == "flowchart" and not (clean_code.startswith("flowchart") or clean_code.startswith("graph")):
            clean_code = "flowchart TD\n" + clean_code
        elif diagram_type == "sequence" and not clean_code.startswith("sequenceDiagram"):
            clean_code = "sequenceDiagram\n" + clean_code

        return {
            "success": True,
            "diagram_type": diagram_type,
            "title": title or f"{diagram_type.capitalize()} Diagram",
            "mermaid": clean_code,
            "mermaid_code": clean_code
        }

    return {
        "success": False,
        "error": "Either 'mermaid_code' or 'schema_data' must be provided to generate a diagram."
    }
