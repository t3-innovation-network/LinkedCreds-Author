# backend/tests/test_retrieval.py
from sentence_transformers import SentenceTransformer
import json
import time
import numpy as np
import pandas as pd
from typing import List, Dict
from pathlib import Path
import faiss

# Constants to match backend
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


class RetrievalTester:
    def __init__(self, index_path: str, metadata_path: str):
        """
        Initialize FAISS retrieval tester - loads pre-built index from disk
        
        Args:
            index_path: Path to saved FAISS index file (onet_faiss.index)
            metadata_path: Path to metadata JSON file (onet_metadata.json)
        """
        print("Loading pre-built FAISS index from disk...")
        
        # Load FAISS index
        print(f"Loading index from: {index_path}")
        self.index = faiss.read_index(index_path)
        print(f"✓ Index loaded with {self.index.ntotal} vectors")
        
        # Load metadata
        print(f"Loading metadata from: {metadata_path}")
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        # Extract skill names from the metadata structure
        self.onet_skills_dict = metadata
        self.onet_skills = list(self.onet_skills_dict.keys())
        
        # Build index to skill mapping for faster lookups
        self.idx_to_skill = {i: skill for i, skill in enumerate(self.onet_skills)}
        
        # Store dimension (infer from index)
        self.dimension = self.index.d
        
        print(f"✓ Loaded {len(self.onet_skills)} O*NET skills")
        print(f"✓ Embedding dimension: {self.dimension}")
        
        # Initialize embedding model (same model as backend)
        print("Loading SentenceTransformer model...")
        self.device = 'cpu'
        self.encoder = SentenceTransformer(MODEL_NAME, device=self.device)
        print("✓ Model loaded successfully!")
        
        self.results = []
    
    def map_skill_to_onet(self, skill: str, top_k: int = 5) -> List[Dict]:
        """Map a single skill to O*NET skills using FAISS index (same as backend)"""
        try:
            # Generate embedding for the input skill
            query_emb = self.encoder.encode([skill], convert_to_numpy=True, device=self.device)
            query_emb = query_emb.astype('float32')
            
            # Normalize query embedding (same as backend normalize function)
            query_emb = query_emb / np.linalg.norm(query_emb, keepdims=True)
            
            # Search FAISS index (using Inner Product for normalized vectors = cosine similarity)
            scores, indices = self.index.search(query_emb, top_k)
            
            # Convert to results (same format as backend)
            results = []
            for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
                if idx >= 0 and idx < len(self.onet_skills):
                    skill_name = self.idx_to_skill[idx]
                    skill_metadata = self.onet_skills_dict[skill_name]
                    
                    results.append({
                        'skill_name': skill_name,
                        'similarity': float(score),  # Already cosine similarity from IndexFlatIP
                        'rank': i + 1,
                        'index': int(idx),
                        'uuid': skill_metadata.get('uuid', '')
                    })
            
            return results
        except Exception as e:
            print(f"Error mapping skill '{skill}': {e}")
            return []
    
    def load_test_cases(self, filepath: str) -> List[Dict]:
        """Load retrieval test cases from JSON file"""
        with open(filepath, 'r') as f:
            data = json.load(f)
        return data['test_cases']
    
    def normalize_skill(self, skill: str) -> str:
        """Normalize skill strings for comparison"""
        return skill.lower().strip().replace('-', ' ').replace('_', ' ')
    
    def test_top_k_accuracy(self, extracted_skill: str, expected_skills: List[str], k: int = 5) -> Dict:
        """Test if expected matches appear in top-K results"""
        results = self.map_skill_to_onet(extracted_skill, top_k=k)
        
        # Extract skill names from results
        retrieved_skills = []
        for r in results:
            retrieved_skills.append({
                'name': self.normalize_skill(r['skill_name']),
                'similarity': r['similarity'],
                'rank': r['rank'],
                'uuid': r['uuid']
            })
        
        # Normalize expected skills
        expected_names_normalized = [self.normalize_skill(skill) for skill in expected_skills]
        retrieved_names = [r['name'] for r in retrieved_skills]

        print("Expected Skills:", expected_skills)
        print("Retrieved Skills:", retrieved_names)
        
        # Calculate hits
        hits_at_k = len(set(retrieved_names).intersection(set(expected_names_normalized)))
        
       
        
        # Calculate precision and recall
        precision = hits_at_k / len(retrieved_names) if retrieved_names else 0
        recall = hits_at_k / len(expected_names_normalized) if expected_names_normalized else 0
        
        return {
            'hits_at_k': hits_at_k,
            'precision': precision,
            'recall': recall,
            'top_match': retrieved_skills[0] if retrieved_skills else None,
            'all_results': retrieved_skills[:k],
            'expected_found': [name for name in expected_names_normalized if name in retrieved_names],
            'expected_missing': [name for name in expected_names_normalized if name not in retrieved_names]
        }
    
    def test_similarity_threshold(self, extracted_skill: str, expected_skills: List[str], min_similarity: float = 0.5) -> Dict:
        """Test if similarity scores meet minimum thresholds"""
        results = self.map_skill_to_onet(extracted_skill, top_k=10)
        
        # Normalize expected skills
        expected_names_normalized = [self.normalize_skill(skill) for skill in expected_skills]
        
        threshold_violations = []
        found_skills = []
        
        for expected_name in expected_names_normalized:
            # Find this expected match in results
            found = None
            for r in results:
                r_name = self.normalize_skill(r['skill_name'])
                
                if r_name == expected_name:
                    found = r
                    break
            
            if found:
                similarity = found['similarity']
                found_skills.append(expected_name)
                if similarity < min_similarity:
                    threshold_violations.append({
                        'skill': expected_name,
                        'expected_min': min_similarity,
                        'actual': similarity
                    })
            else:
                threshold_violations.append({
                    'skill': expected_name,
                    'error': 'Not found in top-10 results'
                })
        
        return {
            'passed': len(threshold_violations) == 0,
            'violations': threshold_violations,
            'found_count': len(found_skills),
            'missing_count': len(expected_names_normalized) - len(found_skills),
            'found_skills': found_skills
        }
    
    def test_retrieval_speed(self, num_queries: int = 20) -> Dict:
        """Benchmark retrieval speed"""
        test_skills = [
            "Python programming",
            "Project management",
            "Data analysis",
            "Machine learning",
            "Communication skills",
            "Leadership",
            "SQL database",
            "JavaScript",
            "Critical thinking",
            "Team coordination"
        ]
        
        # Repeat to reach num_queries
        skills_to_test = (test_skills * ((num_queries // len(test_skills)) + 1))[:num_queries]
        
        start_time = time.time()
        
        for skill in skills_to_test:
            _ = self.map_skill_to_onet(skill, top_k=3)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        return {
            'total_time_ms': total_time * 1000,
            'avg_time_per_query_ms': (total_time * 1000) / num_queries,
            'queries_per_second': num_queries / total_time if total_time > 0 else 0,
            'num_queries': num_queries
        }
    
    def test_index_integrity(self) -> Dict:
        """Verify FAISS index is correctly loaded"""
        return {
            'index_size': self.index.ntotal,
            'skills_count': len(self.onet_skills),
            'dimension': self.index.d,
            'is_trained': self.index.is_trained,
            'index_type': 'IndexFlatIP (Inner Product / Cosine Similarity)',
            'integrity_check': self.index.ntotal == len(self.onet_skills)
        }
    
    def run_full_suite(self, test_cases_path: str) -> Dict:
        """Run complete retrieval test suite"""
        # First check index integrity
        print("\n" + "="*60)
        print("FAISS INDEX INTEGRITY CHECK")
        print("="*60)
        integrity = self.test_index_integrity()
        for key, value in integrity.items():
            print(f"{key}: {value}")
        
        if not integrity['integrity_check']:
            print("\nWARNING: Index integrity check failed!")
            print("Index size and skills count don't match!")
        else:
            print("\n✓ Index integrity verified!")
        
        test_cases = self.load_test_cases(test_cases_path)
        
        results = {
            'index_integrity': integrity,
            'per_case': [],
            'overall': {
                'avg_precision': 0,
                'avg_recall': 0,
                'total_tests': 0,
                'successful_matches': 0
            }
        }
        
        print("\n" + "="*60)
        print(f"Running {len(test_cases)} retrieval test cases...")
        print("="*60)
        
        for idx, tc in enumerate(test_cases, 1):
            print(f"\n{'='*60}")
            print(f"Test {idx}/{len(test_cases)}: {tc['id']}")
            print(f"Extracted Skill: {tc['extracted_skill']}")
            print(f"Expected Skills: {tc['expected_onet_skills']}")
            print('-'*60)
            
            start_time = time.time()
            
            # Test top-k accuracy
            accuracy_result = self.test_top_k_accuracy(
                tc['extracted_skill'],
                tc['expected_onet_skills'],
                k=3
            )
            
            # Test similarity thresholds
            threshold_result = self.test_similarity_threshold(
                tc['extracted_skill'],
                tc['expected_onet_skills'],
                min_similarity=0.5
            )
            
            end_time = time.time()
            
            test_result = {
                'test_id': tc['id'],
                'extracted_skill': tc['extracted_skill'],
                'expected_matches': tc['expected_onet_skills'],
                'latency_ms': (end_time - start_time) * 1000,
                **accuracy_result,
                'threshold_test': threshold_result
            }
            
            results['per_case'].append(test_result)
            
            if accuracy_result['hits_at_k'] > 0:
                results['overall']['successful_matches'] += 1
            
            # Print immediate feedback
            print(f"Results:")
            print(f"  Hits@5: {accuracy_result['hits_at_k']}/{len(tc['expected_onet_skills'])}")
            print(f"  Precision: {accuracy_result['precision']:.2%}")
            print(f"  Recall: {accuracy_result['recall']:.2%}")
            print(f"  Latency: {test_result['latency_ms']:.2f}ms")
            print(f"\nTop Match:")
            if accuracy_result['top_match']:
                print(f"  {accuracy_result['top_match']['name']} (similarity: {accuracy_result['top_match']['similarity']:.3f})")
            
            if accuracy_result['expected_found']:
                print(f"\n✓ Found ({len(accuracy_result['expected_found'])}):")
                for skill in accuracy_result['expected_found']:
                    print(f"  - {skill}")
            
            if accuracy_result['expected_missing']:
                print(f"\n✗ Missing ({len(accuracy_result['expected_missing'])}):")
                for skill in accuracy_result['expected_missing']:
                    print(f"  - {skill}")
            
            print(f"\nThreshold Test: {'✓ PASS' if threshold_result['passed'] else '✗ FAIL'}")
            if threshold_result['violations']:
                print(f"Violations: {len(threshold_result['violations'])}/{len(tc['expected_onet_skills'])}")
        
        # Calculate overall metrics
        total_cases = len(results['per_case'])
        if total_cases > 0:
            results['overall']['avg_precision'] = sum(r['precision'] for r in results['per_case']) / total_cases
            results['overall']['avg_recall'] = sum(r['recall'] for r in results['per_case']) / total_cases
            results['overall']['total_tests'] = total_cases
        
        # Add speed test
        print("\n" + "="*60)
        print("RETRIEVAL SPEED BENCHMARK")
        print("="*60)
        speed_result = self.test_retrieval_speed(num_queries=20)
        results['speed_benchmark'] = speed_result
        print(f"Queries tested: {speed_result['num_queries']}")
        print(f"Total time: {speed_result['total_time_ms']:.2f}ms")
        print(f"Average query time: {speed_result['avg_time_per_query_ms']:.2f}ms")
        print(f"Queries per second: {speed_result['queries_per_second']:.2f}")
        
        return results


def test_retrieval():
    # Paths to saved FAISS index files
    backend_dir = Path(__file__).parent.parent
    
    INDEX_PATH = backend_dir / 'backend' / 'onet_faiss.index'
    METADATA_PATH = backend_dir / 'backend' / 'onet_metadata.json'
    
    print("="*60)
    print("FAISS RETRIEVAL TEST (Loading from Disk)")
    print("="*60)
    print(f"Index File: {INDEX_PATH}")
    print(f"Metadata File: {METADATA_PATH}")
    print("="*60)
    
    # Initialize tester (loads pre-built index)
    print("\nInitializing FAISS Retrieval Tester...")
    tester = RetrievalTester(
        str(INDEX_PATH),
        str(METADATA_PATH)
    )
    
    # Run tests
    test_cases_path = Path(__file__).parent / 'retrieval_test_cases.json'
    
    # Check if test file exists
    if not test_cases_path.exists():
        print(f"\nERROR: Test cases file not found: {test_cases_path}")
        print("Please create retrieval_test_cases.json first")
        return
    
    results = tester.run_full_suite(str(test_cases_path))
    
    # Create results directory if it doesn't exist
    results_dir = Path(__file__).parent / 'results'
    results_dir.mkdir(exist_ok=True)
    
    # Save results
    results_file = results_dir / 'retrieval_results.json'
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    # Print summary
    print("\n" + "="*60)
    print("FINAL RETRIEVAL TEST RESULTS")
    print("="*60)
    print(f"Total Tests: {results['overall']['total_tests']}")
    print(f"Successful Matches: {results['overall']['successful_matches']}")
    print(f"Average Precision: {results['overall']['avg_precision']:.2%}")
    print(f"Average Recall: {results['overall']['avg_recall']:.2%}")
    print(f"\nSpeed Benchmark:")
    print(f"  Avg Query Time: {results['speed_benchmark']['avg_time_per_query_ms']:.2f}ms")
    print(f"  Queries/Second: {results['speed_benchmark']['queries_per_second']:.2f}")
    print(f"\nResults saved to: {results_file}")
    print("="*60)


if __name__ == "__main__":
    test_retrieval()