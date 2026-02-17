# tests/test_skill_dropout_rate.py
import pytest
import json
import sys
from pathlib import Path
from collections import Counter
import requests

# Add the project root to Python path to allow imports if needed, 
# though for this specific file we might just import from the sibling file.
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Import the existing tester class
try:
    from tests.test_llm_extraction import LLMExtractionTester
except ImportError:
    # If running from the tests directory directly
    sys.path.append(str(Path(__file__).parent))
    from test_llm_extraction import LLMExtractionTester

def test_skill_dropout_rate():
    # API endpoint - assuming same port 8001 as in test_llm_extraction.py
    API_ENDPOINT = "http://127.0.0.1:8001/extract"
    
    # Initialize tester
    tester = LLMExtractionTester(API_ENDPOINT)
    
    # Check if API is running
    try:
        requests.get("http://127.0.0.1:8001/")
    except requests.exceptions.RequestException:
        print("WARNING: Cannot connect to API. Make sure the backend is running on port 8001")
        return

    # Load test cases
    test_cases_path = Path(__file__).parent / 'onet_skill_dropouts_test_cases.json'
    if not test_cases_path.exists():
        print(f"Error: Test cases file not found at {test_cases_path}")
        return
        
    print(f"\nLoading test cases from: {test_cases_path.name}")
    results = tester.run_full_suite(str(test_cases_path))
    
    # Calculate Skill Dropout Rate
    # User Formula: (Valid Expected Skills - Extracted Skills) / Valid Expected Skills * 100
    # Interpretation: 
    #   Valid Expected Skills = Total number of expected skills across all test cases.
    #   Extracted Skills = Total number of CORRECTLY extracted skills (True Positives).
    #   (Deduction: If we used raw extracted count, hallucinations would artificially lower the dropout rate, which is undesirable).
    
    total_valid_expected_skills = 0
    total_correctly_extracted_skills = 0  # This represents the "Extracted Skills" in the formula that matches expected.
    all_missing_skills = []
    
    for case_result in results['per_case']:
        n_expected = len(case_result['expected_skills'])
        # n_true_positives is the intersection match count
        n_true_positives = case_result['true_positives']
        
        total_valid_expected_skills += n_expected
        total_correctly_extracted_skills += n_true_positives
        all_missing_skills.extend(case_result['missing_skills'])

    dropout_rate = 0.0
    if total_valid_expected_skills > 0:
        dropout_rate = (total_valid_expected_skills - total_correctly_extracted_skills) / total_valid_expected_skills
        
    # Analyze most frequently dropped skills
    missing_counts = Counter(all_missing_skills)
    top_missing = missing_counts.most_common(10)
    
    # Print Report
    print("\n" + "="*60)
    print("SKILL DROP OUT RATE REPORT")
    print("="*60)
    print(f"Total Test Cases:           {len(results['per_case'])}")
    print(f"Valid Expected Skills:      {total_valid_expected_skills}")
    print(f"Correctly Extracted Skills: {total_correctly_extracted_skills}")
    print(f"Skill Drop Out Rate:        {dropout_rate:.2%}")
    print(" Formula: (Valid Expected - Extracted) / Valid Expected")
    print("-" * 60)
    print("Top 10 Most Frequently Dropped Skills:")
    for skill, count in top_missing:
        print(f"  - {skill} ({count} times)")
    print("="*60)

    # Save detailed report
    report = {
        'total_cases': len(results['per_case']),
        'total_valid_expected_skills': total_valid_expected_skills,
        'total_correctly_extracted_skills': total_correctly_extracted_skills,
        'dropout_rate': dropout_rate,
        'top_missing_skills': dict(top_missing),
        'detailed_results': results
    }
    
    results_dir = Path(__file__).parent / 'results'
    results_dir.mkdir(exist_ok=True)
    report_file = results_dir / 'skill_dropout_rate_report.json'
    
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    print(f"\nDetailed report saved to: {report_file}")

if __name__ == "__main__":
    test_skill_dropout_rate()
