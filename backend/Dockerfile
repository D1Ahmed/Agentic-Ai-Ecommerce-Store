# Use an official Python runtime as a parent image
FROM python:3.13-slim

# Set environment variables to prevent Python from writing .pyc files
# and to ensure stdout and stderr are not buffered
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies and Node.js (required by Prisma)
# We install Node.js 20.x, which is the current LTS
RUN apt-get update && apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy Python requirements and install them globally within the container
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy package.json to install Node dependencies (like the Prisma CLI)
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of your application code
COPY . .

# Generate the Prisma client
# Because we are running this in the Docker image directly (without an isolated .venv),
# the generated client will be placed perfectly alongside your pip packages,
# and Uvicorn will be able to resolve it effortlessly.
RUN prisma generate

# Expose the port (though Railway overrides this with $PORT)
EXPOSE 8000

# Start Uvicorn. We use `sh -c` to allow Railway to pass its dynamic $PORT environment variable.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
