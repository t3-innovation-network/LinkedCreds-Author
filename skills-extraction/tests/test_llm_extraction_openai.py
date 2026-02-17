# tests/test_llm_extraction_openai.py
import pytest
import json
import os
import time
import sys
from pathlib import Path
from typing import List, Dict
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

class LLMExtractionTester:
    def __init__(self, model: str = "gpt-5-mini"):
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
            print("\n" + "!"*60)
            print("MISSING API KEY")
            print("!"*60)
            print("Please set the OPENAI_API_KEY environment variable.")
            print("You can do this in two ways:")
            print("1. Create a .env file in the project root with:")
            print("   OPENAI_API_KEY=sk-your-key-here")
            print("2. Run with the environment variable set:")
            print("   OPENAI_API_KEY=sk-... python3 tests/test_llm_extraction_openai.py")
            print("!"*60 + "\n")
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
            
            # Clean up code blocks if present (consistent with backend logic)
            content = content.replace("```json", "").replace("```", "").strip()
            
            try:
                extracted_skills = json.loads(content)
                if isinstance(extracted_skills, list):
                    return extracted_skills
                elif isinstance(extracted_skills, dict):
                     # Try common key names if it returned a dict wrapper
                    for key in ['skills', 'extracted_skills', 'results', 'data']:
                        if key in extracted_skills:
                             if isinstance(extracted_skills[key], list):
                                return extracted_skills[key]
                    print(f"Warning: Unexpected dictionary format: {extracted_skills}")
                    return []
                else:
                    print(f"Warning: Unexpected response type: {type(extracted_skills)}")
                    return []

            except json.JSONDecodeError as e:
                print(f"Failed to parse JSON response: {e}")
                print(f"Raw content: {content}")
                return []
                
        except Exception as e:
            print(f"API request failed: {e}")
            return []

    def load_test_cases(self, filepath: str) -> List[Dict]:
        """Load test cases from JSON file"""
        with open(filepath, 'r') as f:
            data = json.load(f)
        return data['test_cases']
    
    def normalize_skill(self, skill: str) -> str:
        """Normalize skill strings for comparison"""
        return skill.lower().strip().replace('-', ' ')
    
    def calculate_metrics(self, extracted: List[str], expected: List[str]) -> Dict:
        """Calculate precision, recall, and F1 score"""
        # Normalize skills
        extracted_norm = set(self.normalize_skill(s) for s in extracted if s)
        expected_norm = set(self.normalize_skill(s) for s in expected if s)
        
        # Calculate metrics
        true_positives = len(extracted_norm.intersection(expected_norm))
        false_positives = len(extracted_norm - expected_norm)
        false_negatives = len(expected_norm - extracted_norm)

        if extracted_norm == expected_norm == set():
            true_positives = 1
            false_positives = 0
            false_negatives = 0 
        
        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
        hallucination_rate = false_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        return {
            'precision': precision,
            'recall': recall,
            'f1': f1,
            'true_positives': true_positives,
            'false_positives': false_positives,
            'false_negatives': false_negatives,
            "hallucination_rate": hallucination_rate,
            'extracted_skills': list(extracted_norm),
            'expected_skills': list(expected_norm),
            'missing_skills': list(expected_norm - extracted_norm),
            'extra_skills': list(extracted_norm - expected_norm)
        }
    
    def test_single_case(self, test_case: Dict) -> Dict:
        """Test a single extraction case"""
        start_time = time.time()
        
        # Call API to extract skills
        extracted_skills = self.extract_skills_via_api(test_case['input_text'])
        
        end_time = time.time()
        
        metrics = self.calculate_metrics(extracted_skills, test_case['expected_skills'])
        
        return {
            'test_id': test_case['id'],
            'input_text': test_case['input_text'][:100] + '...' if len(test_case['input_text']) > 100 else test_case['input_text'],
            'latency_ms': (end_time - start_time) * 1000,
            **metrics
        }
    
    def run_full_suite(self, test_cases_path: str) -> Dict:
        """Run complete test suite"""
        test_cases = self.load_test_cases(test_cases_path)
        
        results = {
            'per_case': [],
            'overall': {
                'avg_precision': 0,
                'avg_recall': 0,
                'avg_f1': 0,
                'avg_latency_ms': 0,
                'total_tests': 0,
                'successful_tests': 0
            }
        }
        
        # Test each case
        print(f"\nRunning {len(test_cases)} test cases using OpenAI...")
        successful_tests = 0
        
        for idx, tc in enumerate(test_cases, 1):
            print(f"\nTest {idx}/{len(test_cases)}: {tc['id']}")
            print(f"Input: {tc['input_text'][:80]}...")
            
            result = self.test_single_case(tc)
            results['per_case'].append(result)
            
            if result['true_positives'] > 0 or (result['false_positives'] == 0 and result['false_negatives'] == 0):
                successful_tests += 1
            
            # Print immediate feedback
            print(f"Precision: {result['precision']:.2%} | Recall: {result['recall']:.2%} | F1: {result['f1']:.2%} | False Positives: {result['false_positives']}")
            print(f"Expected: {result['expected_skills']}")
            print(f"Extracted: {result['extracted_skills']}")
            if result['missing_skills']:
                print(f"Missing: {result['missing_skills']}")
            if result['extra_skills']:
                print(f"Extra: {result['extra_skills']}")
        
        # Calculate overall metrics
        total_cases = len(results['per_case'])
        if total_cases > 0:
            results['overall']['avg_precision'] = sum(r['precision'] for r in results['per_case']) / total_cases
            results['overall']['avg_recall'] = sum(r['recall'] for r in results['per_case']) / total_cases
            results['overall']['false_positives'] = sum(r['false_positives'] for r in results['per_case']) / total_cases
            results['overall']['hallucination_rate'] = sum(r['hallucination_rate'] for r in results['per_case']) / total_cases
            results['overall']['avg_f1'] = sum(r['f1'] for r in results['per_case']) / total_cases
            results['overall']['avg_latency_ms'] = sum(r['latency_ms'] for r in results['per_case']) / total_cases
            results['overall']['total_tests'] = total_cases
            results['overall']['successful_tests'] = successful_tests
        
        return results

def test_llm_extraction_openai():
    # Initialize tester
    try:
        tester = LLMExtractionTester(model="gpt-4o-mini")
    except ValueError as e:
        print(f"Error initializing tester: {e}")
        return

    # Run tests
    test_cases_path = Path(__file__).parent / 'onet_test_cases.json'
    results = tester.run_full_suite(str(test_cases_path))
    
    # Create results directory if it doesn't exist
    results_dir = Path(__file__).parent / 'results'
    results_dir.mkdir(exist_ok=True)
    
    # Save results
    results_file = results_dir / 'llm_openai_extraction_results.json'
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    # Print summary
    print("\n" + "="*60)
    print("OVERALL TEST RESULTS (OPENAI)")
    print("="*60)
    print(f"Total Tests: {results['overall']['total_tests']}")
    print(f"Successful Tests: {results['overall']['successful_tests']}")
    print(f"Average Precision: {results['overall']['avg_precision']:.2%}")
    print(f"Average Hallucination Rate: {results['overall']['hallucination_rate']:.2%}")
    print(f"Average Recall: {results['overall']['avg_recall']:.2%}")
    print(f"Average F1 Score: {results['overall']['avg_f1']:.2%}")
    print(f"Average Latency: {results['overall']['avg_latency_ms']:.2f}ms")
    print(f"\nResults saved to: {results_file}")
    print("="*60)

if __name__ == "__main__":
    test_llm_extraction_openai()
