# tests/test_llm_extraction_categorized.py
import json
import os
import time
import sys
from pathlib import Path
from typing import List, Dict, Tuple
import openai
from collections import Counter

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

SYSTEM_PROMPT = """
You are an expert Skill Extraction engine.

Task:
- Extract ONLY skills (technologies, tools, frameworks, methodologies, soft skills, hard skills) from the given text.
- A term must be treated as a skill ONLY if it is used in a professional, technical, educational, or workplace context.
- Ignore terms that appear in non-skill meanings such as animals, food, geography, common nouns, or everyday conversation.
- Do not extract skills that are not present in the text, limit yourself to the skills present in the text. Example: If the text does not contain "Python", do not extract "Python".
- Key words like 'science based approaches', 'customer support' are not considered as skills.
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

class CategorizedExtractionTester:
    def __init__(self, model: str = "gpt-4o"):
        # Try to load from .env file manually
        env_path = Path(__file__).parent.parent / '.env'
        if env_path.exists():
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        os.environ[key.strip()] = value.strip().strip('"').strip("'")
        
        self.api_key = os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            print("WARNING: OPENAI_API_KEY not found in environment or .env file.")
            raise ValueError("OPENAI_API_KEY environment variable not set")
        
        self.client = openai.OpenAI(api_key=self.api_key)
        self.model = model
        self.results = []
    
    def extract_skills_via_api(self, text: str) -> List[str]:
        """Call OpenAI API to extract skills"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": text}
                ],
                temperature=0.0,
            )
            content = response.choices[0].message.content
            
            # Clean up code blocks if present
            content = content.replace("```json", "").replace("```", "").strip()
            
            try:
                extracted_skills = json.loads(content)
                if isinstance(extracted_skills, list):
                    return extracted_skills
                elif isinstance(extracted_skills, dict):
                    # Handle dict response
                    for key in ['skills', 'extracted_skills', 'results', 'data']:
                        if key in extracted_skills:
                             if isinstance(extracted_skills[key], list):
                                return extracted_skills[key]
                    return []
                return []

            except json.JSONDecodeError:
                return []
                
        except Exception as e:
            print(f"API request failed: {e}")
            return []

    def load_test_cases(self, filepath: str) -> List[Dict]:
        """Load test cases from JSON file containing 'test_cases' list"""
        with open(filepath, 'r') as f:
            data = json.load(f)
        return data['test_cases']
    
    def normalize_skill(self, skill: str) -> str:
        """Normalize skill strings for comparison"""
        return skill.lower().strip().replace('-', ' ')
    
    def calculate_metrics_for_category(self, extracted_set: set, expected_list: List[str]) -> Dict:
        """Calculate metrics for a specific category of expected skills"""
        expected_set = set(self.normalize_skill(s) for s in expected_list)
        
        if not expected_set:
            return {
                'precision': 1.0, # N/A but treat as perfect if we expected nothing
                'recall': 1.0,
                'f1': 1.0,
                'found': 0,
                'total': 0,
                'missing': []
            }
            
        # For category metrics:
        # True Positives: Skills in Expected Set that were found in Extracted Set
        # False Negatives: Skills in Expected Set that were NOT found
        # Note: Precision is hard to define per-category because extracted skills aren't categorized by the LLM.
        # We will focus on Recall (Recovery Rate) for each category.
        
        found = expected_set.intersection(extracted_set)
        missing = expected_set - extracted_set
        
        recall = len(found) / len(expected_set) if expected_set else 0
        
        return {
            'recall': recall,
            'found_count': len(found),
            'total_expected': len(expected_set),
            'found_skills': list(found),
            'missing_skills': list(missing)
        }

    def test_single_case(self, test_case: Dict) -> Dict:
        """Test a single extraction case against categorized expectations"""
        start_time = time.time()
        
        # 1. Extract skills (flat list from LLM)
        extracted_skills = self.extract_skills_via_api(test_case['input_text'])
        extracted_norm = set(self.normalize_skill(s) for s in extracted_skills)
        
        end_time = time.time()
        
        # 2. Compare against each category
        expected_all = []
        categories = ['basic', 'intermediate', 'advanced']
        category_metrics = {}
        
        for cat in categories:
            expected_list = test_case['expected_skills'].get(cat, [])
            expected_all.extend(expected_list)
            category_metrics[cat] = self.calculate_metrics_for_category(extracted_norm, expected_list)
            
        # 3. Calculate Global Metrics (Precision handles the "Extra" skills)
        expected_all_norm = set(self.normalize_skill(s) for s in expected_all)
        
        true_positives = extracted_norm.intersection(expected_all_norm)
        false_positives = extracted_norm - expected_all_norm
        
        precision = len(true_positives) / len(extracted_norm) if extracted_norm else 0
        recall_global = len(true_positives) / len(expected_all_norm) if expected_all_norm else 0
        f1_global = 2 * (precision * recall_global) / (precision + recall_global) if (precision + recall_global) > 0 else 0

        return {
            'test_id': test_case['id'],
            'input_text': test_case['input_text'],
            'latency_ms': (end_time - start_time) * 1000,
            'extracted_skills_count': len(extracted_skills),
            'extracted_skills': extracted_skills,
            'category_metrics': category_metrics,
            'global_metrics': {
                'precision': precision,
                'recall': recall_global,
                'f1': f1_global,
                'extra_skills': list(false_positives)
            }
        }
    
    def run_suite(self, test_cases_path: str):
        test_cases = self.load_test_cases(test_cases_path)
        print(f"Running {len(test_cases)} categorized test cases...")
        
        overall_results = []
        
        for tc in test_cases:
            print(f"\n--- Test: {tc['id']} ---")
            result = self.test_single_case(tc)
            overall_results.append(result)
            
            # Print Result
            print(f"Global F1: {result['global_metrics']['f1']:.2%}")
            print(f"Extra Skills (Hallucinations?): {result['global_metrics']['extra_skills']}")
            
            for cat, metric in result['category_metrics'].items():
                if metric.get('total_expected', 0) > 0:
                    print(f"[{cat.upper()}] Recall: {metric['recall']:.2%} ({metric['found_count']}/{metric['total_expected']})")
                    if metric['missing_skills']:
                        print(f"   Missing: {metric['missing_skills']}")
                else:
                    print(f"[{cat.upper()}] No skills expected.")

        # Summary
        print("\n" + "="*60)
        print("SUMMARY")
        print("="*60)
        avg_f1 = sum(r['global_metrics']['f1'] for r in overall_results) / len(overall_results)
        print(f"Average Global F1: {avg_f1:.2%}")
        
        # Average Recall per category
        for cat in ['basic', 'intermediate', 'advanced']:
            total_recall = 0
            count = 0
            for r in overall_results:
                # Fix: Access the nested dictionary correctly
                cat_metrics = r['category_metrics'].get(cat, {})
                if cat_metrics.get('total_expected', 0) > 0:
                    total_recall += cat_metrics['recall']
                    count += 1
            
            if count > 0:
                print(f"Avg {cat.capitalize()} Recall: {total_recall/count:.2%}")
            else:
                 print(f"Avg {cat.capitalize()} Recall: N/A")

if __name__ == "__main__":
    try:
        tester = CategorizedExtractionTester()
        test_file = Path(__file__).parent / 'categorized_test_cases.json'
        tester.run_suite(str(test_file))
    except Exception as e:
        print(f"Error: {e}")
