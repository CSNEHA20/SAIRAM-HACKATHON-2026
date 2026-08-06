import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.router import router as api_router
from api.schemas import HealthResponse
from db.connection import db_manager
from agent.orchestrator import agent_orchestrator

load_dotenv()

app = FastAPI(
    title="DataFlow AI Backend",
    description="Conversational Database Analytics API",
    version="1.0.0"
)

# CORS Configuration (08_APIArchitecture.md §5)
cors_origin = os.getenv("CORS_ORIGIN", "http://localhost:5173")
origins = [origin.strip() for origin in cors_origin.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router)


@app.on_event("startup")
async def startup_event():
    """Startup probe: ensure indexes exist and DB is reachable."""
    await db_manager.initialize()

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """GET /api/health - Health probe checking DB & Claude API status."""
    is_db_healthy = await db_manager.check_health()
    claude_reachable = agent_orchestrator.is_claude_reachable()
    overall_ok = is_db_healthy and claude_reachable
    return HealthResponse(
        status="ok" if overall_ok else "degraded",
        database="connected" if is_db_healthy else "disconnected",
        claude_api="reachable" if claude_reachable else "unreachable",
        version="1.0.0"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
