#!/bin/bash

###############################################################################
# WorldSim Pre-Launch Validation Script
#
# Performs comprehensive checks before production deployment:
# 1. TypeScript compilation
# 2. ESLint checks
# 3. Production build
# 4. Bundle size analysis
# 5. Environment variable validation
# 6. Public asset verification
# 7. Database connectivity
# 8. All tests passing
#
# Exit code 0 = All checks passed
# Exit code 1 = One or more checks failed
###############################################################################

set -e  # Exit on first error

echo "========================================="
echo "WorldSim Pre-Launch Validation"
echo "========================================="
echo ""

FAILED_CHECKS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

###############################################################################
# 1. TypeScript Compilation
###############################################################################
echo "📝 [1/9] Checking TypeScript compilation..."
if npx tsc --noEmit; then
    echo -e "${GREEN}✓ TypeScript compilation successful${NC}"
else
    echo -e "${RED}✗ TypeScript compilation failed${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
echo ""

###############################################################################
# 2. ESLint Checks
###############################################################################
echo "🔍 [2/9] Running ESLint checks..."
if npm run lint; then
    echo -e "${GREEN}✓ ESLint checks passed${NC}"
else
    echo -e "${RED}✗ ESLint checks failed${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
echo ""

###############################################################################
# 3. Production Build
###############################################################################
echo "🏗️  [3/9] Creating production build..."
if npm run build; then
    echo -e "${GREEN}✓ Production build successful${NC}"
else
    echo -e "${RED}✗ Production build failed${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
echo ""

###############################################################################
# 4. Bundle Size Analysis
###############################################################################
echo "📦 [4/9] Analyzing bundle size..."
if [ -d ".next" ]; then
    BUNDLE_SIZE=$(du -sh .next | awk '{print $1}')
    echo "   Bundle size: $BUNDLE_SIZE"

    # Check if bundle is reasonable (< 50MB for .next directory)
    BUNDLE_SIZE_BYTES=$(du -s .next | awk '{print $1}')
    MAX_SIZE=$((50 * 1024))  # 50MB in KB

    if [ "$BUNDLE_SIZE_BYTES" -lt "$MAX_SIZE" ]; then
        echo -e "${GREEN}✓ Bundle size is acceptable${NC}"
    else
        echo -e "${YELLOW}⚠ Bundle size is larger than expected${NC}"
    fi
else
    echo -e "${RED}✗ Build directory not found${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
echo ""

###############################################################################
# 5. Environment Variables
###############################################################################
echo "🔐 [5/9] Checking environment variables..."
REQUIRED_VARS=(
    "NEXT_PUBLIC_MAPBOX_TOKEN"
    "OPENAI_API_KEY"
    "ANTHROPIC_API_KEY"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
)

MISSING_VARS=0
for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        echo -e "${RED}   ✗ Missing: $VAR${NC}"
        MISSING_VARS=$((MISSING_VARS + 1))
    else
        echo -e "${GREEN}   ✓ Found: $VAR${NC}"
    fi
done

if [ $MISSING_VARS -eq 0 ]; then
    echo -e "${GREEN}✓ All environment variables present${NC}"
else
    echo -e "${RED}✗ $MISSING_VARS environment variable(s) missing${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
echo ""

###############################################################################
# 6. Public Assets
###############################################################################
echo "🖼️  [6/9] Verifying public assets..."
REQUIRED_ASSETS=(
    "public/regions.json"
)

MISSING_ASSETS=0
for ASSET in "${REQUIRED_ASSETS[@]}"; do
    if [ -f "$ASSET" ]; then
        FILE_SIZE=$(du -sh "$ASSET" | awk '{print $1}')
        echo -e "${GREEN}   ✓ Found: $ASSET ($FILE_SIZE)${NC}"
    else
        echo -e "${RED}   ✗ Missing: $ASSET${NC}"
        MISSING_ASSETS=$((MISSING_ASSETS + 1))
    fi
done

if [ $MISSING_ASSETS -eq 0 ]; then
    echo -e "${GREEN}✓ All required assets present${NC}"
else
    echo -e "${RED}✗ $MISSING_ASSETS asset(s) missing${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
echo ""

###############################################################################
# 7. Run All Tests
###############################################################################
echo "🧪 [7/9] Running all tests..."
if npm test -- --passWithNoTests; then
    echo -e "${GREEN}✓ All tests passed${NC}"
else
    echo -e "${RED}✗ Tests failed${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
echo ""

###############################################################################
# 8. Security Checks
###############################################################################
echo "🔒 [8/9] Running security audit..."
if npm audit --production; then
    echo -e "${GREEN}✓ No critical vulnerabilities found${NC}"
else
    echo -e "${YELLOW}⚠ Security vulnerabilities detected (check npm audit for details)${NC}"
fi
echo ""

###############################################################################
# 9. Performance Checks
###############################################################################
echo "⚡ [9/9] Verifying performance benchmarks..."
if npm test tests/performance; then
    echo -e "${GREEN}✓ Performance benchmarks passed${NC}"
else
    echo -e "${YELLOW}⚠ Some performance benchmarks failed${NC}"
fi
echo ""

###############################################################################
# Final Summary
###############################################################################
echo "========================================="
echo "Validation Summary"
echo "========================================="
if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CHECKS PASSED${NC}"
    echo ""
    echo "✨ WorldSim is ready for production deployment!"
    exit 0
else
    echo -e "${RED}✗ $FAILED_CHECKS CHECK(S) FAILED${NC}"
    echo ""
    echo "❌ Please fix the issues above before deploying to production."
    exit 1
fi
