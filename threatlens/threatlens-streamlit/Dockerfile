# ThreatLens — local-first container. Build once, run anywhere, $0 recurring cost.
FROM python:3.11-slim

WORKDIR /app

# Install dependencies first for better layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8501

# Run the dashboard
CMD ["streamlit", "run", "app.py", "--server.address=0.0.0.0", "--server.port=8501"]
