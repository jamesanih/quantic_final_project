import requests
import os

def test_cv_upload():
    print("--- Testing CV Upload Pipeline ---")
    
    # 1. Create a dummy PDF-like content (actually text but with .pdf extension for the service)
    cv_filename = "test_upload_cv.pdf"
    with open(cv_filename, "wb") as f:
        f.write(b"%PDF-1.4\n1 0 obj\n<< /Title (Test CV) /Author (John Doe) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF")

    try:
        # 2. Upload to CV service
        print(f"Uploading {cv_filename} to CV service...")
        with open(cv_filename, "rb") as f:
            files = {"file": (cv_filename, f, "application/pdf")}
            response = requests.post("http://localhost:8002/api/cvs/upload", files=files)
        
        if response.status_code != 200:
            print(f"FAILED: CV upload returned status {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        cv_data = response.json()
        cv_id = cv_data.get("id")
        candidate_id = cv_data.get("candidate_id")
        print(f"SUCCESS: CV uploaded. ID: {cv_id}, Candidate ID: {candidate_id}")

        # 3. Verify in CV List
        print("Verifying CV in 'My CVs' list...")
        list_response = requests.get("http://localhost:8002/api/cvs/me")
        if any(cv["id"] == cv_id for cv in list_response.json()):
            print("SUCCESS: CV found in list.")
        else:
            print("FAILED: CV not found in list.")
            return False

        # 4. Verify in Vector Service
        print("Verifying indexing in Vector service...")
        search_payload = {"query": "Test CV", "limit": 10}
        vector_response = requests.post("http://localhost:8003/api/vectors/search", json=search_payload)
        
        candidates = vector_response.json().get("candidates", [])
        if any(c["candidate_id"] == candidate_id for c in candidates):
            print("SUCCESS: Candidate found in Vector search.")
        else:
            # Check if it exists at least in the fallback pool
            print("INFO: Not found in top search results, checking all...")
            all_response = requests.post("http://localhost:8003/api/vectors/search", json={"limit": 100})
            if any(c["candidate_id"] == candidate_id for c in all_response.json().get("candidates", [])):
                print("SUCCESS: Candidate found in full Vector pool.")
            else:
                print("FAILED: Candidate not indexed in Vector service.")
                return False

        print("\n--- ALL TESTS PASSED ---")
        return True

    except Exception as e:
        print(f"ERROR during test: {e}")
        return False
    finally:
        if os.path.exists(cv_filename):
            os.remove(cv_filename)

if __name__ == "__main__":
    test_cv_upload()
