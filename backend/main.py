from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from typing import List, Dict, Any, Union, Optional
import uuid
import sys
import os
import json

import logging

import numpy as np
import pandas as pd
import faiss

import spacy
from spacy.matcher import PhraseMatcher
from skillNer.skill_extractor_class import SkillExtractor
from skillNer.general_params import SKILL_DB
from sentence_transformers import SentenceTransformer

# ---------------------------------------------------------------------------
# Allow imports from the skills-extraction/backend module (skill_graph,
# predict_soc, adjacent_socs, plus the O*NET graph JSON).
# ---------------------------------------------------------------------------
_SKILLS_EXTR_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "skills-extraction", "backend",
)
if _SKILLS_EXTR_PATH not in sys.path:
    sys.path.insert(0, _SKILLS_EXTR_PATH)

from skill_graph import (
    load_graph, get_skills_for_soc, get_soc_title, get_soc_major_group,
    get_all_soc_codes, get_skill_type,
)
import predict_soc
import adjacent_socs


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Real-Time Skills Extraction API")

# Allow front-end requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

onet_metadata = {}
onet_skills = []
onet_index = None
model = None
SPACY_MODEL_NAME = "en_core_web_lg"
TRANSFORMER_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
OLLAMA_MODEL = "qwen2.5:7b"  # Can be changed to qwen2.5:3b for speed


# load SkillNer once
nlp = spacy.load(SPACY_MODEL_NAME)
skill_extractor = SkillExtractor(nlp, SKILL_DB, PhraseMatcher)


class TextRequest(BaseModel):
    text: str


class SearchRequest(BaseModel):
    extracted_skills: List[Union[str, Dict[str, Any]]]
    top_k: int = 2



class PredictSOCRequest(BaseModel):
    skills: List[str]
    top_n: int = 5
    include_all: bool = False
    alpha: float = 0.6


class AdjacentSOCRequest(BaseModel):
    soc: str
    top_n: int = 5
    skills: Optional[List[str]] = None
    include_all: bool = False




@app.post("/predict-soc")
def predict_soc_endpoint(request: PredictSOCRequest):
    """Predict the most likely SOC codes for a list of skills.

    Accepts a list of skill names, classifies them into hard/soft,
    and scores candidate SOC codes from the O*NET knowledge graph.
    """
    graph = load_graph()
    idx = {s: s for s in graph["nodes"]["skills"]}
    hard, soft, nf = predict_soc.classify(request.skills, idx)

    if not hard and not soft:
        return {"predictions": [], "not_found": nf}

    preds = predict_soc.predict(
        hard, soft,
        top_n=request.top_n,
        include_all=request.include_all,
        alpha=request.alpha,
    )
    return {"predictions": preds, "not_found": nf}


@app.post("/adjacent-socs")
def adjacent_socs_endpoint(request: AdjacentSOCRequest):
    """Find SOC codes adjacent to a given SOC for upskilling.

    Uses Jaccard similarity over skill overlap to rank adjacent SOCs,
    split into same-category and cross-category results.
    """
    same, cross = adjacent_socs.adjacent(
        request.soc,
        top_n=request.top_n,
        user_skills=request.skills,
        include_all=request.include_all,
    )
    return {"same_category": same, "cross_category": cross}


@app.get("/soc/{soc_code}")
def get_soc_details(soc_code: str):
    """Return metadata and associated skills for an O*NET SOC code."""
    title = get_soc_title(soc_code)
    skills = get_skills_for_soc(soc_code)
    major_group = get_soc_major_group(soc_code)

    hard_skills = [
        s for s in skills
        if get_skill_type(s) in ("technology", "both")
    ]
    soft_skills = [
        s for s in skills
        if get_skill_type(s) in ("soft", "both")
    ]

    return {
        "soc": soc_code,
        "title": title,
        "major_group": major_group,
        "hard_skills": hard_skills,
        "soft_skills": soft_skills,
        "total_skills": len(skills),
    }



@app.on_event("startup")
async def startup_event():
    """Pre-load the O*NET graph into memory so the first request is fast."""
    load_graph()

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
            onet_metadata[name]["uuid"] = uuid.uuid5(uuid.NAMESPACE_DNS, name).urn

        logger.info(f"Loaded {len(onet_skills)} O*NET skills.")

        with open("onet_metadata.json", "w") as f:
            json.dump(onet_metadata, f, indent=4)
        
    except Exception as e:
        logger.error(f"Error loading O*NET skills: {e}")
        raise e

    logger.info("Loading SentenceTransformer model...")
    try:
        model = SentenceTransformer(TRANSFORMER_MODEL_NAME)
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



@app.post("/extract")
def extract_skills(request: TextRequest):
    text = request.text
    result = skill_extractor.annotate(text)

    skills = set()

    for s in result["results"].get("full_matches", []):
        skills.add(s["doc_node_value"])

    for s in result["results"].get("ngram_scored", []):
        skills.add(s["doc_node_value"])

    # Return format matching what the frontend skillsApi.ts expects
    return {
        "extracted_skills": [
            {"name": name, "source": "skillner"}
            for name in skills
        ]
    }


def _get_mock_alignments(skill_name: str, top_k: int = 2) -> List[Dict[str, Any]]:
    """Return a list of mocked alignment dicts for *skill_name*.

    If the skill is found in MOCK_SIMILAR_SKILLS (case‑insensitive),
    up to *top_k* related skills are returned.  Otherwise an empty list
    is returned so the frontend still receives a valid response.
    """
    key = skill_name.strip().lower()
    similar = MOCK_SIMILAR_SKILLS.get(key, [])[:top_k]

    alignments: List[Dict[str, Any]] = []
    for i, related in enumerate(similar):
        score = round(0.95 - i * 0.10, 2)  # 0.95, 0.85, …
        alignments.append({
            "type": ["Alignment"],
            "targetFramework": "SkillNer",
            "similarity score": score,
            "targetCode": [],
            "targetName": related,
            "id": uuid.uuid5(uuid.NAMESPACE_DNS, f"{skill_name}::{related}").urn,
        })
    return alignments


@app.post("/search")
def search_skills(request: SearchRequest):
    
    # 2. Map to O*NET skills
    skills_response = []
    
    # Handle the case where the frontend sends a list of string vs list of dicts
    for skill_item in request.extracted_skills:
        skill_name = skill_item["name"] if isinstance(skill_item, dict) else skill_item
        skill_source = skill_item.get("source", "ollama") if isinstance(skill_item, dict) else "ollama"
        
        related = retrieve_top_k_skills(onet_index, skill_name, onet_skills, k=request.top_k)
        
        alignments = []
        skills_added = set()
        for name, score in related:
            meta = onet_metadata.get(name, {})
            soc_codes_list = meta.get("soc_codes", [])
            uuid_val = meta.get("uuid", "")
            
            # Deduplicate based on title-cased name
            normalized_name = name.title()
            if normalized_name not in skills_added:
                skills_added.add(normalized_name)
                alignments.append({
                    "type": ["Alignment"],
                    "targetFramework": "O*NET",
                    "similarity score": round(float(score), 2),
                    "targetCode": soc_codes_list[:5],
                    "targetName": normalized_name,
                    "id": uuid_val
                })
        
        skills_response.append({
            "name": skill_name,
            "source": skill_source,
            "alignment": alignments
        })
        
    return {
        "skill": skills_response
    }

# Run the app using these commands:
#> python -m venv venv
#> venv/bin/pip install -r requirements.txt
#> venv/bin/python -m spacy download en_core_web_lg
#> venv/bin/uvicorn main:app --reload --port 8000
# http://localhost:8000/extract       -> responds with skills when we provide text as input.
# http://localhost:8000/search        -> returns mocked similar-skill alignments.
# http://localhost:8000/predict-soc   -> predicts SOC codes from a list of skills (O*NET graph)
# http://localhost:8000/adjacent-socs -> finds SOC codes adjacent to a given SOC
# http://localhost:8000/soc/{code}    -> returns metadata & skills for a specific SOC code
# example:
#> curl localhost:8000/extract --json '{"text":"skills text with python and sql"}'
#> curl localhost:8000/search --json '{"extracted_skills":[{"name":"python","source":"skillner"}],"top_k":2}'
#> curl localhost:8000/predict-soc --json '{"skills":["Python","SQL","Machine Learning"],"top_n":3}'
#> curl localhost:8000/adjacent-socs --json '{"soc":"15-1132.00","top_n":5}'
#> curl localhost:8000/soc/15-1132.00
