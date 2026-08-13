FROM python:3.11-slim

WORKDIR /app

# Set PYTHONPATH so Python can locate modules in /app and /app/backend
ENV PYTHONPATH=/app:/app/backend

# Copy requirements and install dependencies
COPY requirements.txt* backend/requirements.txt* ./
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; elif [ -f backend/requirements.txt ]; then pip install --no-cache-dir -r backend/requirements.txt; fi

# Copy files into /app
COPY . /app/
RUN if [ -d /app/backend ]; then cp -r /app/backend/* /app/; fi
COPY database/ /app/database/

# Create non-root runtime user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Health probe
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')"

# Start FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
