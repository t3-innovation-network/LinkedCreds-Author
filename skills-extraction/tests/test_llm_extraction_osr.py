import pytest
import json
import requests
from typing import List, Dict
from collections import Counter
import time
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


class LLMOSRTester:
    def __init__(self, api_endpoint: str):
        self.api_endpoint = api_endpoint
        self.results = []
    
    def extract_skills_via_api(self, text: str) -> List[str]:
        """Call the API endpoint to extract skills"""
        try:
            response = requests.post(
                self.api_endpoint,
                json={"text": text},
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            
            # Handle different response formats based on common patterns
            if isinstance(data, list):
                return data
            elif isinstance(data, dict):
                # Try common key names
                for key in ['skills', 'extracted_skills', 'results', 'data']:
                    if key in data:
                        return data[key]
            
            print(f"Warning: Unexpected response format: {data}")
            return []
            
        except requests.exceptions.RequestException as e:
            print(f"API request failed: {e}")
            return []
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON response: {e}")
            return []
    
    def load_test_cases(self, filepath: str) -> List[Dict]:
        """Load test cases from JSON file"""
        with open(filepath, 'r') as f:
            data = json.load(f)
        return data['observable_skill_tests']
    
    def normalize_skill(self, skill: str) -> str:
        """Normalize skill strings for comparison"""
        return skill.lower().strip().replace('-', ' ')
    
    def calculate_osr(self, extracted: List[str], expected_classification: Dict[str, str]) -> Dict:
        """Calculate Observable Skill Ratio (OSR)"""
        # Normalize extracted skills
        extracted_norm = {self.normalize_skill(s): s for s in extracted if s} # map normalized to original
        
        # Normalize expected skills (keys)
        expected_norm_map = {self.normalize_skill(k): (k, v) for k, v in expected_classification.items()}
        
        matched_skills = []
        hallucinated_skills = []
        
        do_count = 0
        po_count = 0
        
        for norm_skill, orig_skill in extracted_norm.items():
            if norm_skill in expected_norm_map:
                orig_expected, classification = expected_norm_map[norm_skill]
                matched_skills.append((orig_skill, classification))
                if classification == "DO":
                    do_count += 1
                elif classification == "PO":
                    po_count += 1
            else:
                hallucinated_skills.append(orig_skill)
        
        total_extracted = len(extracted_norm)
        
        osr = ((do_count + po_count) / total_extracted * 100) if total_extracted > 0 else 0
        
        # Additional metrics
        expected_total = len(expected_classification)
        recall = (do_count + po_count) / expected_total if expected_total > 0 else 0
        
        return {
            'osr_score': osr,
            'do_count': do_count,
            'po_count': po_count,
            'total_extracted': total_extracted,
            'matched_skills': matched_skills,
            'hallucinated_skills': hallucinated_skills,
            'recall': recall
        }
    
    def test_single_case(self, test_case: Dict) -> Dict:
        """Test a single OSR case"""
        start_time = time.time()
        
        # Call API to extract skills
        extracted_skills = self.extract_skills_via_api(test_case['input_text'])
        
        end_time = time.time()
        
        metrics = self.calculate_osr(extracted_skills, test_case['expected_classification'])
        
        return {
            'test_id': test_case['id'],
            'input_text': test_case['input_text'][:100] + '...' if len(test_case['input_text']) > 100 else test_case['input_text'],
            'latency_ms': (end_time - start_time) * 1000,
            'extracted_raw': extracted_skills, 
            **metrics
        }
    
    def run_osr_suite(self, test_cases_path: str) -> Dict:
        """Run complete OSR test suite"""
        test_cases = self.load_test_cases(test_cases_path)
        
        results = {
            'per_case': [],
            'overall': {
                'avg_osr': 0,
                'avg_recall': 0,
                'avg_latency_ms': 0,
                'total_tests': 0,
                'total_do': 0,
                'total_po': 0,
                'total_extracted_skills': 0
            }
        }
        
        # Test each case
        print(f"\nRunning {len(test_cases)} OSR test cases...")
        
        for idx, tc in enumerate(test_cases, 1):
            print(f"\nTest {idx}/{len(test_cases)}: {tc['id']}")
            print(f"Input: {tc['input_text'][:80]}...")
            
            result = self.test_single_case(tc)
            results['per_case'].append(result)
            
            # Print immediate feedback
            print(f"OSR Score: {result['osr_score']:.2f}% | DO: {result['do_count']} | PO: {result['po_count']} | Total Extracted: {result['total_extracted']}")
            print(f"Expected Classification: {tc['expected_classification']}")
            print(f"Extracted: {result['extracted_raw']}")
            if result['hallucinated_skills']:
                print(f"Hallucinated (Not in expected): {result['hallucinated_skills']}")
        
        # Calculate overall metrics
        total_cases = len(results['per_case'])
        if total_cases > 0:
            results['overall']['avg_osr'] = sum(r['osr_score'] for r in results['per_case']) / total_cases
            results['overall']['avg_recall'] = sum(r['recall'] for r in results['per_case']) / total_cases
            results['overall']['avg_latency_ms'] = sum(r['latency_ms'] for r in results['per_case']) / total_cases
            results['overall']['total_tests'] = total_cases
            results['overall']['total_do'] = sum(r['do_count'] for r in results['per_case'])
            results['overall']['total_po'] = sum(r['po_count'] for r in results['per_case'])
            results['overall']['total_extracted_skills'] = sum(r['total_extracted'] for r in results['per_case'])
        
        return results


def main():
    # API endpoint - change port if needed
    API_ENDPOINT = "http://127.0.0.1:8001/extract"
    
    # Initialize tester
    tester = LLMOSRTester(API_ENDPOINT)
    
    # Check if API is running
    try:
        response = requests.get("http://127.0.0.1:8001/")
        print(f"API Status: {response.status_code}")
    except requests.exceptions.RequestException:
        print("WARNING: Cannot connect to API. Make sure the backend is running on port 8001")
        return
    
    # Run tests
    test_cases_path = Path(__file__).parent / 'osr_test_cases.json'
    results = tester.run_osr_suite(str(test_cases_path))
    
    # Create results directory if it doesn't exist
    results_dir = Path(__file__).parent / 'results'
    results_dir.mkdir(exist_ok=True)
    
    # Save results
    results_file = results_dir / 'osr_extraction_results.json'
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    # Print summary
    print("\n" + "="*60)
    print("OSR TEST RESULTS SUMMARY")
    print("="*60)
    print(f"Total Tests: {results['overall']['total_tests']}")
    print(f"Average OSR Score: {results['overall']['avg_osr']:.2f}%")
    print(f"Average Recall: {results['overall']['avg_recall']:.2%}")
    print(f"Total Extracted Skills: {results['overall']['total_extracted_skills']}")
    print(f"Total DO Skills Found: {results['overall']['total_do']}")
    print(f"Total PO Skills Found: {results['overall']['total_po']}")
    print(f"Average Latency: {results['overall']['avg_latency_ms']:.2f}ms")
    print(f"\nResults saved to: {results_file}")
    print("="*60)


if __name__ == "__main__":
    main()
