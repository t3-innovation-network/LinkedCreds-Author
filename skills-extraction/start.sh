#!/bin/bash

echo "Starting Real-Time Skills Extraction..."

# Check if Ollama is running
if ! pgrep -x "ollama" > /dev/null; then
    echo "Warning: Ollama does not seem to be running. Please start Ollama first."
    echo "Run 'ollama serve' in a separate terminal."
fi

# Install backend dependencies if needed
echo "Checking backend dependencies..."
cd backend
pip install -q -r requirements.txt

# Start Backend in background
echo "Starting Backend on port 8001..."
uvicorn main:app --reload --host 0.0.0.0 --port 8001
