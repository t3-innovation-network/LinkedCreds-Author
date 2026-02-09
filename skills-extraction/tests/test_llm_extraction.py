# backend/tests/test_llm_extraction.py
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


class LLMExtractionTester:
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
            
            # Adjust this based on your API response structure
            # Common patterns:
            # return response.json()["skills"]
            # return response.json()["extracted_skills"]
            # return response.json()
            
            data = response.json()
            
            # Handle different response formats
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
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        return {
            'precision': precision,
            'recall': recall,
            'f1': f1,
            'true_positives': true_positives,
            'false_positives': false_positives,
            'false_negatives': false_negatives,
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
    
    def test_consistency(self, test_case: Dict, num_runs: int = 5) -> Dict:
        """Test extraction consistency across multiple runs"""
        results = []
        for _ in range(num_runs):
            extracted = self.extract_skills_via_api(test_case['input_text'])
            results.append(set(self.normalize_skill(s) for s in extracted if s))
        
        # Check if all results are identical
        all_same = all(r == results[0] for r in results)
        
        # Calculate variation
        all_skills = set()
        for r in results:
            all_skills.update(r)
        
        consistency_score = len(results[0]) / len(all_skills) if all_skills else 0
        
        return {
            'test_id': test_case['id'],
            'is_consistent': all_same,
            'consistency_score': consistency_score,
            'unique_variations': len(all_skills)
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
        print(f"\nRunning {len(test_cases)} test cases...")
        successful_tests = 0
        
        for idx, tc in enumerate(test_cases, 1):
            print(f"\nTest {idx}/{len(test_cases)}: {tc['id']}")
            print(f"Input: {tc['input_text'][:80]}...")
            
            result = self.test_single_case(tc)
            results['per_case'].append(result)
            
            if result['true_positives'] > 0 or (result['false_positives'] == 0 and result['false_negatives'] == 0):
                successful_tests += 1
            
            # Print immediate feedback
            print(f"Precision: {result['precision']:.2%} | Recall: {result['recall']:.2%} | F1: {result['f1']:.2%}")
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
            results['overall']['avg_f1'] = sum(r['f1'] for r in results['per_case']) / total_cases
            results['overall']['avg_latency_ms'] = sum(r['latency_ms'] for r in results['per_case']) / total_cases
            results['overall']['total_tests'] = total_cases
            results['overall']['successful_tests'] = successful_tests
        
        return results


def test_llm_extraction():
    # API endpoint - change port if needed
    API_ENDPOINT = "http://127.0.0.1:8001/extract"  # Adjust endpoint path if needed
    
    # Initialize tester
    tester = LLMExtractionTester(API_ENDPOINT)
    
    # Check if API is running
    try:
        response = requests.get("http://127.0.0.1:8001/")
        print(f"API Status: {response.status_code}")
    except requests.exceptions.RequestException:
        print("WARNING: Cannot connect to API. Make sure the backend is running on port 8001")
        return
    
    # Run tests
    test_cases_path = Path(__file__).parent / 'onet_test_cases.json'
    results = tester.run_full_suite(str(test_cases_path))
    
    # Create results directory if it doesn't exist
    results_dir = Path(__file__).parent / 'results'
    results_dir.mkdir(exist_ok=True)
    
    # Save results
    results_file = results_dir / 'llm_extraction_results.json'
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    # Print summary
    print("\n" + "="*60)
    print("OVERALL TEST RESULTS")
    print("="*60)
    print(f"Total Tests: {results['overall']['total_tests']}")
    print(f"Successful Tests: {results['overall']['successful_tests']}")
    print(f"Average Precision: {results['overall']['avg_precision']:.2%}")
    print(f"Average Recall: {results['overall']['avg_recall']:.2%}")
    print(f"Average F1 Score: {results['overall']['avg_f1']:.2%}")
    print(f"Average Latency: {results['overall']['avg_latency_ms']:.2f}ms")
    print(f"\nResults saved to: {results_file}")
    print("="*60)


if __name__ == "__main__":
    test_llm_extraction()