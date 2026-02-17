from sentence_transformers import SentenceTransformer
import os
import ast
import json
import logging
import time
import uuid
from typing import List, Dict, Any

import numpy as np
import pandas as pd
import faiss
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ollama import chat

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Real-Time Skills Extraction API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
onet_metadata = {}
onet_skills = []
onet_index = None
model = None
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
OLLAMA_MODEL = "qwen2.5:7b"  # Can be changed to qwen2.5:3b for speed

SYSTEM_PROMPT = """
You are an expert Skill Extraction engine.

Task:
- Extract ONLY skills (technologies, tools, frameworks, methodologies, soft skills, hard skills) from the given text.
- A term must be treated as a skill ONLY if it is used in a professional, technical, educational, or workplace context.
- This skills extraction is not only meant for technical skills and soft skills but also for any other skills that can be used in a professional, technical, educational, or workplace context (It may include white-collar jobs, blue-collar jobs, etc.).
- Ignore terms that appear in non-skill meanings such as animals, food, geography, common nouns, or everyday conversation.
- Output list of extracted skills as shown below.
- Output Format:
    ["Python", "Project Management", "Machine Learning"]
Rules:
- Do NOT include any explanations or extra text.
- Do NOT include duplicates (case-insensitive).
- Skill names should be clean, human-readable phrases.
- If a term is ambiguous, include it ONLY when surrounding context clearly indicates it is a skill.
- If no skills are found, return [].
"""

class ExtractionRequest(BaseModel):
    text: str
    top_k: int = 2

@app.on_event("startup")
async def startup_event():
    global onet_skills, onet_index, model, onet_metadata
    
    logger.info("Loading O*NET skills...")
    try:
        # Load skills from Excel files
        base_path = os.path.dirname(os.path.abspath(__file__))
        tech_skills_path = os.path.join(base_path, "ONet_Skills_Taxonomy", "Technology Skills.xlsx")
        skills_path = os.path.join(base_path, "ONet_Skills_Taxonomy", "Skills.xlsx")
        
        df_tech = pd.read_excel(tech_skills_path)
        df_skills = pd.read_excel(skills_path)
        
        onet_metadata = {}

        # Process Technology Skills
        # using zip for performance over iterrows
        for name, code in zip(df_tech["Example"], df_tech["O*NET-SOC Code"]):
            if pd.isna(name): continue
            name = str(name).strip()
            if name not in onet_metadata:
                onet_metadata[name] = {"soc_codes": set()}
            onet_metadata[name]["soc_codes"].add(code)

        # Process Soft Skills
        for name, code in zip(df_skills["Element Name"], df_skills["O*NET-SOC Code"]):
            if pd.isna(name): continue
            name = str(name).strip()
            if name not in onet_metadata:
                onet_metadata[name] = {"soc_codes": set()}
            onet_metadata[name]["soc_codes"].add(code)

        # Finalize keys and metadata
        onet_skills = list(onet_metadata.keys())
        
        # Generate UUIDs and convert sets to lists
        for name in onet_skills:
            onet_metadata[name]["soc_codes"] = list(onet_metadata[name]["soc_codes"])
            # Use deterministic UUID based on the skill name
            onet_metadata[name]["uuid"] = str(uuid.uuid5(uuid.NAMESPACE_DNS, name))

        logger.info(f"Loaded {len(onet_skills)} O*NET skills.")

        with open("onet_metadata.json", "w") as f:
            json.dump(onet_metadata, f, indent=4)
        
    except Exception as e:
        logger.error(f"Error loading O*NET skills: {e}")
        raise e

    logger.info("Loading SentenceTransformer model...")
    try:
        model = SentenceTransformer(MODEL_NAME)
        logger.info("SentenceTransformer model loaded.")
    except Exception as e:
        logger.error(f"Error loading SentenceTransformer: {e}")
        raise e

    logger.info("Creating FAISS index...")
    try:
        # Create index dynamically
        if not onet_skills:
            raise ValueError("No O*NET skills loaded to index.")
            
        skill_embeddings = model.encode(onet_skills, show_progress_bar=True, convert_to_numpy=True)
        skill_embeddings = skill_embeddings / np.linalg.norm(skill_embeddings, axis=1, keepdims=True)
        dim = skill_embeddings.shape[1]
        
        onet_index = faiss.IndexFlatIP(dim)
        onet_index.add(skill_embeddings)
        
        logger.info(f"FAISS index created with {onet_index.ntotal} vectors.")
        index_path = os.path.join(base_path, "onet_faiss.index")
        faiss.write_index(onet_index, index_path)
        logger.info(f"FAISS index saved to: {index_path}")
        
    except Exception as e:
        logger.error(f"Error creating FAISS index: {e}")
        raise e

def normalize(v):
    return v / np.linalg.norm(v, keepdims=True)

def retrieve_top_k_skills(index, text, skills, k=50):
    query_emb = model.encode([text], convert_to_numpy=True)
    query_emb = normalize(query_emb)
    scores, indices = index.search(query_emb, k)
    indices = indices[0]
    scores = scores[0]

    results = [(skills[i], float(scores[j])) for j, i in enumerate(indices)]
    return results

def extract_skills_ollama(text: str) -> List[str]:
    try:
        response = chat(model=OLLAMA_MODEL, messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text}
        ])
        content = response.message.content
        # Clean up code blocks if present
        content = content.replace("```json", "").replace("```", "").strip()
        extracted_skills = ast.literal_eval(content)
        if not isinstance(extracted_skills, list):
            logger.warning(f"Ollama returned non-list: {extracted_skills}")
            return []
        return extracted_skills
    except Exception as e:
        logger.error(f"Error in Ollama extraction: {e}")
        return []

@app.post("/extract")
async def extract_endpoint(request: ExtractionRequest):
    
    # 1. Extract skills using Ollama
    extracted_skills = extract_skills_ollama(request.text)
    
    # 2. Map to O*NET skills
    skill_mapping = {}
    for skill in extracted_skills:
        related = retrieve_top_k_skills(onet_index, skill, onet_skills, k=request.top_k)
        # Format for JSON response
        formatted_related = []
        skills_added = set()
        for name, score in related:
            meta = onet_metadata.get(name, {})
            # Limit SOC codes to first 5, join by comma for display if needed, or send as list
            soc_codes_list = meta.get("soc_codes", [])
            uuid_val = meta.get("uuid", "")
            
            # Deduplicate based on title-cased name
            normalized_name = name.title()
            if normalized_name not in skills_added:
                skills_added.add(normalized_name)
                formatted_related.append({
                    "onet_skill_name": normalized_name, 
                    "similarity_score": score,
                    "soc_codes": soc_codes_list[:5],
                    "uuid": uuid_val
                })
        skill_mapping[skill] = formatted_related
        
    
    return {
        "extracted_skills": extracted_skills,
        "mapped_skills": skill_mapping
    }

# Mount backend to /api if needed, or just let specific routes handle it.
# Mount frontend StaticFiles to root
# app.mount("/", StaticFiles(directory="../frontend", html=True), name="static") will be added at the end
# But first, remove the old root endpoint so it doesn't conflict or just rename it.


@app.get("/health")
def health_check():
    return {"status": "ok", "model": OLLAMA_MODEL}

# Mount frontend
# Note: We use an absolute path or relative to main.py to be safe, but ".." assumes CWD or file relation
import os
frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")