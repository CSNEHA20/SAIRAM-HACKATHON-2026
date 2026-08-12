# Problem Statement & Objectives

## Problem Statement

Build a ChatGPT-like conversational application where an LLM-powered agent can:

1. **Understand natural language queries** about data
2. **Connect to and query SQL/NoSQL databases**
3. **Generate dynamic visualizations** (charts, graphs, flowcharts)
4. **Provide conversational explanations** of the data insights

The core challenge is to design and implement custom tools (functions) for the LLM agent that enable database connectivity, query execution, and visualization generation.

## Objectives

### Primary Objectives
- **Chat Interface:** Build a responsive chat UI similar to ChatGPT for user interaction
- **Agent Tools Development:** Create function-calling tools that the LLM can invoke
- **Database Integration:** Implement tools for schema discovery, query generation, and execution
- **Visualization Generation:** Create tools to generate charts (bar, line, pie, scatter) and flowcharts/diagrams

### Secondary Objectives
- Handle multi-turn conversations with context retention
- Provide error handling and graceful fallbacks
- Support query explanation and SQL transparency
