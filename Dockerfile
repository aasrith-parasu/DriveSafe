FROM python:3.11-slim

# Only what opencv-python-headless needs
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD gunicorn server:app --bind 0.0.0.0:$PORT --timeout 120 --workers 2
