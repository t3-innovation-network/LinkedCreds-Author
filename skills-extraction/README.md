# skills-extraction-ollama


# Real-Time Skills Extraction with Ollama

This project extracts skills from text using a local LLM (Ollama) and maps them to the O*NET taxonomy using vector similarity search.

## Prerequisites

1.  **Python 3.10+**
2.  **Ollama**: Install from [ollama.com](https://ollama.com).
3.  **Models**: Pull the required models:
    ```bash
    ollama pull qwen2.5:7b
    # For faster inference (less accurate):
    # ollama pull qwen2.5:3b
    ```

## Setup

1.  **Install Dependencies**:
    ```bash
    cd backend
    pip install -r requirements.txt
    ```

2.  **Data Files**:
    Ensure the following files are present in `backend/`:
    -   `onet_faiss.index`
    -   `onet_embeddings.npy`
    -   `ONet_Skills_Taxonomy/` folder

    (These should have been copied automatically during setup).

## Running the Application

1.  **Start the Backend**:
    ```bash
    cd backend
    uvicorn main:app --reload --port 8000
    ```

2.  **Start the Frontend**:
    Open `frontend/index.html` in your browser.
    
    *Note: For a better experience, you can serve it with a simple HTTP server:*
    ```bash
    cd frontend
    python -m http.server 3000
    ```
    Then visit `http://localhost:3000`.

## Configuration

-   **Model**: To change the LLM model (e.g., to `qwen2.5:3b`), edit `backend/main.py` and update `OLLAMA_MODEL`.
-   **Top K**: The number of mapped O*NET skills returned can be adjusted in the frontend request or backend default.

## Optimization

-   The backend loads the FAISS index and SentenceTransformer model into memory on startup to minimize latency.
-   Using a smaller model like `qwen2.5:3b` or `llama3.2:3b` will significantly reduce extraction time.
