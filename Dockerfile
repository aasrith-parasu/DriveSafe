# Use a slim Python image with build tools available
FROM python:3.11-slim

# Install system dependencies needed for dlib, OpenCV, and cmake
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    libboost-python-dev \
    libboost-thread-dev \
    libgl1-mesa-glx \
    libglib2.0-0 \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python dependencies
# Install numpy first (dlib needs it at build time)
COPY requirements.txt .
RUN pip install --no-cache-dir numpy==2.4.4
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app
COPY . .

# Expose the port Railway will inject via $PORT
EXPOSE 5000

CMD ["python", "server.py"]
