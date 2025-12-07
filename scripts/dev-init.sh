#!/bin/bash
# FantasyMax Session Initialization Script
# Run at the start of each development session

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}=== FantasyMax Session Init ===${NC}"
echo ""

# 1. Confirm directory
EXPECTED_DIR="FantasyMax"
CURRENT_DIR=$(basename "$PWD")

if [ "$CURRENT_DIR" != "$EXPECTED_DIR" ]; then
    echo -e "${RED}ERROR: Expected to be in $EXPECTED_DIR${NC}"
    echo "Current: $PWD"
    exit 1
fi
echo -e "${GREEN}✓ Working directory confirmed${NC}"

# 2. Check required files
echo ""
echo -e "${BLUE}Checking session tracking files...${NC}"

REQUIRED_FILES=(
    "ROADMAP.md"
    "PROGRESS.md"
    "CLAUDE.md"
    "features.json"
    "docs/SESSION_PROTOCOL.md"
    "docs/KNOWN_ISSUES.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗ MISSING: $file${NC}"
    fi
done

# 3. Check source structure
echo ""
echo -e "${BLUE}Checking source structure...${NC}"
if [ -d "src" ]; then
    echo -e "${GREEN}✓${NC} src/ exists"
else
    echo -e "${RED}✗ src/ missing${NC}"
fi

if [ -d "supabase" ]; then
    echo -e "${GREEN}✓${NC} supabase/ exists"
else
    echo -e "${RED}✗ supabase/ missing${NC}"
fi

# 4. Install dependencies if needed
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules exists"
else
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# 5. Run verification
echo ""
echo -e "${BLUE}Running verification...${NC}"

# Type check
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Build passes"
else
    echo -e "${YELLOW}!${NC} Build has issues (run 'npm run build' to see errors)"
fi

# 6. Show feature status
echo ""
echo -e "${BLUE}=== Feature Status ===${NC}"
if [ -f "features.json" ]; then
    PASS=$(grep -c '"status": "pass"' features.json 2>/dev/null || echo "0")
    FAIL=$(grep -c '"status": "fail"' features.json 2>/dev/null || echo "0")
    IN_PROGRESS=$(grep -c '"status": "in-progress"' features.json 2>/dev/null || echo "0")
    NOT_STARTED=$(grep -c '"status": "not-started"' features.json 2>/dev/null || echo "0")
    echo -e "${GREEN}Pass:${NC} $PASS | ${RED}Fail:${NC} $FAIL | ${YELLOW}In Progress:${NC} $IN_PROGRESS | ${CYAN}Not Started:${NC} $NOT_STARTED"
fi

# 7. Show recent progress
echo ""
echo -e "${BLUE}=== Recent Progress ===${NC}"
if [ -f "PROGRESS.md" ]; then
    # Show first session entry (most recent)
    awk '/^## Session [0-9]/{if(found)exit; found=1} found' PROGRESS.md | head -20
    # If no session entries yet, show the old format
    if [ $? -ne 0 ] || [ -z "$(awk '/^## Session [0-9]/{if(found)exit; found=1} found' PROGRESS.md | head -1)" ]; then
        head -40 PROGRESS.md
    fi
fi

# 8. Show known issues
echo ""
echo -e "${BLUE}=== Open Issues ===${NC}"
if [ -f "docs/KNOWN_ISSUES.md" ]; then
    OPEN_COUNT=$(grep -c "^\*\*Status:\*\* Open" docs/KNOWN_ISSUES.md 2>/dev/null || echo "0")
    echo -e "Open issues: ${YELLOW}$OPEN_COUNT${NC}"
fi

# 9. Show next tasks from ROADMAP
echo ""
echo -e "${BLUE}=== Next Tasks (from ROADMAP.md) ===${NC}"
if [ -f "ROADMAP.md" ]; then
    grep -n "\- \[ \]" ROADMAP.md | head -5
fi

echo ""
echo -e "${GREEN}=== Ready to develop! ===${NC}"
echo ""
echo -e "${CYAN}Quick commands:${NC}"
echo "  npm run dev      - Start dev server"
echo "  npm run build    - Build for production"
echo ""
echo -e "${CYAN}Session tips:${NC}"
echo "  • Work on ONE task at a time"
echo "  • Update docs after each completed task"
echo "  • Use checkpoint prompt if context gets long"
