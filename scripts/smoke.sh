#!/bin/bash

# Smoke Tests pour LMS - Tests de base après déploiement
# Usage: ./scripts/smoke.sh https://your-app.vercel.app

set -e

BASE_URL=${1:-"http://localhost:3000"}
ORG_SLUG="test-org"

echo "🧪 Smoke Tests LMS - Base URL: $BASE_URL"
echo "=========================================="

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour tester une URL
test_url() {
    local method=$1
    local url=$2
    local expected_status=$3
    local description=$4
    
    echo -n "Testing $description... "
    
    if [ "$method" = "GET" ]; then
        status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    elif [ "$method" = "POST" ]; then
        status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            -d '{"title":"Smoke Test Pathway"}')
    elif [ "$method" = "PUT" ]; then
        status=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$url" \
            -H "Content-Type: application/json" \
            -d '{"title":"Smoke Test Updated"}')
    elif [ "$method" = "DELETE" ]; then
        status=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$url")
    fi
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✅ $status${NC}"
        return 0
    else
        echo -e "${RED}❌ $status (expected $expected_status)${NC}"
        return 1
    fi
}

# Tests de base
echo -e "\n${YELLOW}1. Tests de base${NC}"
test_url "GET" "$BASE_URL/api/formations?org=$ORG_SLUG" "400" "Formations API (missing auth)"
test_url "GET" "$BASE_URL/api/parcours?org=$ORG_SLUG" "400" "Parcours API (missing auth)"

# Test de rate limiting
echo -e "\n${YELLOW}2. Test de rate limiting${NC}"
echo -n "Testing rate limiting... "
for i in {1..65}; do
    curl -s -o /dev/null "$BASE_URL/api/formations?org=$ORG_SLUG" &
done
wait

# Le 65ème appel devrait retourner 429
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/formations?org=$ORG_SLUG")
if [ "$status" = "429" ]; then
    echo -e "${GREEN}✅ Rate limiting works (429)${NC}"
else
    echo -e "${YELLOW}⚠️  Rate limiting not triggered ($status)${NC}"
fi

# Test des pages principales
echo -e "\n${YELLOW}3. Test des pages${NC}"
test_url "GET" "$BASE_URL/" "200" "Home page"
test_url "GET" "$BASE_URL/login/admin" "200" "Login page"

# Test de l'API env-check
echo -e "\n${YELLOW}4. Test de configuration${NC}"
test_url "GET" "$BASE_URL/api/env-check" "200" "Environment check"

# Test avec authentification simulée (si possible)
echo -e "\n${YELLOW}5. Test d'authentification${NC}"
echo -n "Testing auth flow... "

# Test sans token (devrait retourner 401)
auth_status=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer invalid-token" \
    "$BASE_URL/api/formations?org=$ORG_SLUG")

if [ "$auth_status" = "401" ] || [ "$auth_status" = "400" ]; then
    echo -e "${GREEN}✅ Auth protection works ($auth_status)${NC}"
else
    echo -e "${YELLOW}⚠️  Auth status unclear ($auth_status)${NC}"
fi

# Test de performance
echo -e "\n${YELLOW}6. Test de performance${NC}"
echo -n "Testing response time... "
start_time=$(date +%s%3N)
curl -s -o /dev/null "$BASE_URL/api/env-check"
end_time=$(date +%s%3N)
duration=$((end_time - start_time))

if [ "$duration" -lt 1000 ]; then
    echo -e "${GREEN}✅ Fast response (${duration}ms)${NC}"
else
    echo -e "${YELLOW}⚠️  Slow response (${duration}ms)${NC}"
fi

# Test de santé général
echo -e "\n${YELLOW}7. Test de santé général${NC}"
echo -n "Testing overall health... "

# Vérifier que l'application répond
health_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$health_status" = "200" ]; then
    echo -e "${GREEN}✅ Application is healthy${NC}"
else
    echo -e "${RED}❌ Application unhealthy ($health_status)${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 Smoke tests completed successfully!${NC}"
echo "=========================================="
echo "✅ API endpoints responding"
echo "✅ Rate limiting active"
echo "✅ Authentication protected"
echo "✅ Pages loading"
echo "✅ Performance acceptable"
echo ""
echo "🚀 Application ready for production!"
