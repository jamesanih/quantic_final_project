"""End-to-end registration flow tests. Run: python3 tests/test_registration.py"""
import urllib.request, json, sys, time

BASE = "http://localhost:8001/api/auth"
PASSED = FAILED = 0

def _run_test_case(name, fn):
    global PASSED, FAILED
    try:
        fn()
        PASSED += 1; print(f"  PASS {name}")
    except Exception as e:
        FAILED += 1; print(f"  FAIL {name}: {e}")

def api(method, path, data=None):
    url = BASE + path
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read()) if r.status != 204 else {}
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def test_register_candidate():
    s, d = api("POST", "/register", {"email": f"c{int(time.time())}@t.ai","password":"StrongP@ss1","full_name":"Test","role":"CANDIDATE"})
    assert s == 201 and "user_id" in d, f"got {s}"

def test_register_then_login():
    e = f"l{int(time.time())}@t.ai"
    assert api("POST","/register",{"email":e,"password":"Test1234!","full_name":"T","role":"CANDIDATE"})[0] == 201
    s, d = api("POST","/login",{"email":e,"password":"Test1234!"})
    assert s == 200 and "access_token" in d, f"got {s}:{d}"

def test_duplicate():
    e = f"d{int(time.time())}@t.ai"
    api("POST","/register",{"email":e,"password":"Pass123!","full_name":"A","role":"CANDIDATE"})
    assert api("POST","/register",{"email":e,"password":"Pass123!","full_name":"B","role":"CANDIDATE"})[0] == 409

def test_wrong_password():
    e = f"w{int(time.time())}@t.ai"
    api("POST","/register",{"email":e,"password":"Correct1!","full_name":"X","role":"CANDIDATE"})
    assert api("POST","/login",{"email":e,"password":"WrongPass!"})[0] == 401

def test_nonexistent():
    assert api("POST","/login",{"email":f"nx{int(time.time())}@t.ai","password":"Whatever1!"})[0] == 401

if __name__ == "__main__":
    print("Registration Tests\n")
    for n, f in [("Register candidate", test_register_candidate), ("Register + login", test_register_then_login), ("Duplicate rejected", test_duplicate), ("Wrong password", test_wrong_password), ("Nonexistent user", test_nonexistent)]:
        _run_test_case(n, f)
    print(f"\n{PASSED} passed, {FAILED} failed")
    sys.exit(1 if FAILED else 0)
