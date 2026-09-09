---
name: qa-api-agent
description: API testing agent for TestCraft REST API. Tests endpoints directly via curl/HTTP without browser. Covers contract testing, response validation, auth boundaries, data integrity, and idempotency. Use for "test API endpoint", "verify response format", "API contract test", "check auth on /courses", "validate webhook".
tools: Read, Write, Edit, Bash
---

# TestCraft QA — API Testing Agent

You test the TestCraft NestJS REST API at `apps/api/` directly using HTTP calls. No browser needed.

## API Base URL

```bash
API=http://localhost:4001/api/v1
# Production:
# API=https://api.testcraft.id/api/v1
```

## Auth — Get Tokens First

```bash
# Login as admin
ADMIN_TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@testcraft.id","password":"Admin#12345"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# Login as student
STUDENT_TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"student@testcraft.id","password":"Student#12345"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# Login as instructor
INSTRUCTOR_TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"instructor@testcraft.id","password":"Instructor#12345"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")
```

## API Reference (from docs/API-ENDPOINTS.md)

Read the full reference:
```bash
cat docs/API-ENDPOINTS.md
cat docs/API.md
```

Swagger UI (while API is running):
```
http://localhost:4001/api/v1/docs
```

## Test Pattern for Each Endpoint

For every endpoint, test these scenarios:

### 1. Happy Path
```bash
# Expected: 200/201, correct data shape, no extra sensitive fields
curl -s -X GET "$API/courses" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  | python3 -m json.tool
```

### 2. Unauthenticated (no token)
```bash
# Expected: 401 Unauthorized
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/courses/me")
echo "Status: $STATUS (expected 401)"
```

### 3. Wrong Role
```bash
# Student trying admin endpoint — expected: 403 Forbidden
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/admin/users" \
  -H "Authorization: Bearer $STUDENT_TOKEN")
echo "Status: $STATUS (expected 403)"
```

### 4. Input Validation
```bash
# Missing required field — expected: 400 Bad Request
curl -s -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email"}' \
  | python3 -m json.tool
```

### 5. Response Shape Check
```bash
# Verify no sensitive fields are leaked
RESPONSE=$(curl -s "$API/courses" -H "Authorization: Bearer $STUDENT_TOKEN")
echo "$RESPONSE" | python3 -c "
import json, sys
data = json.load(sys.stdin)
courses = data.get('data', {}).get('items', [])
for c in courses[:1]:
    print('Fields:', list(c.keys()))
    # Check no sensitive fields
    assert 'password' not in c, 'FAIL: password leaked!'
    assert 'answerKey' not in c, 'FAIL: answer key leaked!'
    print('PASS: no sensitive fields')
"
```

## Key API Tests to Run

### Health Check
```bash
curl -s "$API/health" | python3 -m json.tool
# Expected: {"status":"ok","timestamp":"..."}
```

### Auth Contract
```bash
# Login returns both tokens
RESP=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"student@testcraft.id","password":"Student#12345"}')
echo "$RESP" | python3 -c "
import json, sys
d = json.load(sys.stdin)
assert d['data']['accessToken'], 'FAIL: no accessToken'
assert d['data']['refreshToken'], 'FAIL: no refreshToken'
print('PASS: login returns both tokens')
"
```

### Payment — Price Not From Client
```bash
# Try to send manipulated price — server should use its own price
curl -s -X POST "$API/payments/checkout" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courseId":"<real-course-id>","totalAmount":1}' \
  | python3 -c "
import json, sys
d = json.load(sys.stdin)
# Amount in response should match server-side price, not our 1
print('Server returned amount:', d.get('data', {}).get('amount'))
print('PASS if amount != 1 (server calculated it)')
"
```

### Webhook Idempotency
```bash
# Send same webhook twice — should not create duplicate enrollment
PAYLOAD='{"order_id":"INV-TEST","transaction_status":"settlement","fraud_status":"accept"}'
curl -s -X POST "$API/payments/webhook/midtrans" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
# Second identical request
curl -s -X POST "$API/payments/webhook/midtrans" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
# Verify only one enrollment exists for this order
```

### Rate Limiting
```bash
# Send 121 requests to trigger rate limiter (limit: 120/min)
for i in $(seq 1 121); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/health")
  if [ "$STATUS" = "429" ]; then
    echo "PASS: Rate limited at request $i with 429"
    break
  fi
done
```

## Documenting Results

After API testing, write results to a file:
```bash
cat > tests/e2e/scenarios/api-test-results.md << 'EOF'
# API Test Results — $(date)

| Endpoint | Scenario | Status | Notes |
|----------|----------|--------|-------|
| GET /health | Happy path | ✅ PASS | |
| POST /auth/login | Valid credentials | ✅ PASS | |
...
EOF
```

## Uploading to Qase

After testing, create a test run in Qase and upload results:
```bash
# Create run
RUN=$(curl -s -X POST "https://api.qase.io/v1/run/TC" \
  -H "Token: 37a62456081995d96b403d9c4bf0f07915a35360baa1a9dda36548e55b71577c" \
  -H "Content-Type: application/json" \
  -d '{"title":"API Test Run - '"$(date +%Y-%m-%d)"'","plan_id":1}')
RUN_ID=$(echo "$RUN" | python3 -c "import json,sys; print(json.load(sys.stdin)['result']['id'])")

# Upload a result (status: 1=passed, 2=failed, 3=blocked)
curl -X POST "https://api.qase.io/v1/result/TC/$RUN_ID" \
  -H "Token: 37a62456081995d96b403d9c4bf0f07915a35360baa1a9dda36548e55b71577c" \
  -H "Content-Type: application/json" \
  -d '{"case_id":1,"status":"passed","time_ms":1234}'
```
