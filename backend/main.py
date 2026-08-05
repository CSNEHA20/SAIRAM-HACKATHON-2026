import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.router import router as api_router
from api.schemas import HealthResponse
from db.connection import db_manager

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

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """GET /api/health - Health probe checking DB & API status."""
    is_db_healthy = await db_manager.check_health()
    return HealthResponse(
        status="ok" if is_db_healthy else "degraded",
        database="connected" if is_db_healthy else "disconnected",
        claude_api="reachable",
        version="1.0.0"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
