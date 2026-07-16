# ThreatLens web — container image for free hosts (Hugging Face Spaces, Render,
# Fly.io, Railway…). Pure standard library: nothing to install.
FROM python:3.11-slim

WORKDIR /app
COPY . .

# Hosts inject the port via $PORT; server.py reads it (defaults to 8000).
ENV PORT=8000
EXPOSE 8000

CMD ["python", "server.py"]
