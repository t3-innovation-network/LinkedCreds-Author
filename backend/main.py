from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import spacy
from spacy.matcher import PhraseMatcher
from skillNer.skill_extractor_class import SkillExtractor
from skillNer.general_params import SKILL_DB

app = FastAPI()

# Allow front-end requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# load SkillNer once
nlp = spacy.load("en_core_web_lg")
skill_extractor = SkillExtractor(nlp, SKILL_DB, PhraseMatcher)


class TextRequest(BaseModel):
    text: str


@app.post("/extract")
def extract_skills(request: TextRequest):
    text = request.text
    result = skill_extractor.annotate(text)

    skills = set()

    for s in result["results"].get("full_matches", []):
        skills.add(s["doc_node_value"])

    for s in result["results"].get("ngram_scored", []):
        skills.add(s["doc_node_value"])

    return {"skills": list(skills)}


# Run the app using these commands:
#> python -m venv venv
#> venv/bin/pip install -r requirements.txt
#> venv/bin/python -m spacy download en_core_web_lg
#> venv/bin/uvicorn main:app --reload --port 8000
# http://localhost:8000/extract -> responds with skills when we provide text as input.
# example:
#> curl localhost:8000/extract --json '{"text":"skills text with python and sql"}'
