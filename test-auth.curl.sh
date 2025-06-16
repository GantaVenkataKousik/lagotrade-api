#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Testing Authentication APIs${NC}"

# Base URL
API_URL="http://localhost:5000/api"

# Test Register
echo -e "\n${GREEN}Testing Register API...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test@123"
  }')

echo "Register Response:"
echo $REGISTER_RESPONSE | json_pp

# Extract token from register response (assuming it returns a token)
REGISTER_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

# Test Login
echo -e "\n${GREEN}Testing Login API...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123"
  }')

echo "Login Response:"
echo $LOGIN_RESPONSE | json_pp

# Extract token from login response
LOGIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

# Summary
echo -e "\n${GREEN}📝 Test Summary:${NC}"
if [ ! -z "$REGISTER_TOKEN" ]; then
    echo -e "Register Token: ${GREEN}✅ Received${NC}"
else
    echo -e "Register Token: ${RED}❌ Not Received${NC}"
fi

if [ ! -z "$LOGIN_TOKEN" ]; then
    echo -e "Login Token: ${GREEN}✅ Received${NC}"
else
    echo -e "Login Token: ${RED}❌ Not Received${NC}"
fi 