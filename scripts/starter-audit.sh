#!/usr/bin/env bash
# starter:audit — Self-audit of this CARSI/NodeJS-Starter-V1 repo.
# Checks governance files, model currency, visual assets, and code quality.
# Usage: pnpm starter:audit

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PASS=0
FAIL=0
WARN=0
REPORT=""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check() {
  local label="$1"
  local result="$2"  # "pass" | "fail" | "warn"
  local detail="${3:-}"
  if [[ "$result" == "pass" ]]; then
    echo -e "  ${GREEN}✅ PASS${NC}  $label"
    PASS=$((PASS + 1))
    REPORT+="| $label | ✅ pass | $detail |\n"
  elif [[ "$result" == "warn" ]]; then
    echo -e "  ${YELLOW}⚠️  WARN${NC}  $label${detail:+  — $detail}"
    WARN=$((WARN + 1))
    REPORT+="| $label | ⚠️ warn | $detail |\n"
  else
    echo -e "  ${RED}❌ FAIL${NC}  $label${detail:+  — $detail}"
    FAIL=$((FAIL + 1))
    REPORT+="| $label | ❌ fail | $detail |\n"
  fi
}

file_check() {
  local label="$1"
  local path="$2"
  local category="${3:-important}"
  if [[ -f "$REPO_ROOT/$path" ]]; then
    check "$label" "pass" "$path"
  elif [[ "$category" == "critical" ]]; then
    check "$label" "fail" "missing: $path"
  else
    check "$label" "warn" "missing: $path"
  fi
}

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  CARSI Starter — Self-Audit${NC}"
echo -e "${BLUE}  $(date '+%d/%m/%Y %H:%M') AEST${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── Governance Files ──────────────────────────────
echo -e "${BLUE}[1/5] Governance Files${NC}"
file_check "memory.md" "memory.md" "critical"
file_check "CLAUDE.md" "CLAUDE.md" "critical"
file_check "Agent hierarchy — Senior PM" "docs/agent-framework/SENIOR_PM_AGENT.md"
file_check "Agent hierarchy — Orchestrator" "docs/agent-framework/SENIOR_ORCHESTRATOR_AGENT.md"
file_check "Agent hierarchy — Specialists" "docs/agent-framework/SENIOR_SPECIALIST_AGENTS.md"
file_check "Agent hierarchy — Sub-Agent" "docs/agent-framework/SUB_AGENT_PROTOCOL.md"
file_check "Governance framework template" "templates/governance-framework/README.md"

# ── Custom Skills ─────────────────────────────────
echo ""
echo -e "${BLUE}[2/5] Custom Skills${NC}"
SKILLS_DIR="$REPO_ROOT/.skills/custom"
EXPECTED_SKILLS=(
  "outcome-translator"
  "blueprint-first"
  "finished-audit"
  "evidence-verifier"
  "definition-of-done-builder"
  "model-currency-checker"
  "visual-excellence-enforcer"
  "delegation-planner"
)
for skill in "${EXPECTED_SKILLS[@]}"; do
  if [[ -f "$SKILLS_DIR/$skill/SKILL.md" ]]; then
    check "Skill: $skill" "pass"
  else
    check "Skill: $skill" "fail" "missing: .skills/custom/$skill/SKILL.md"
  fi
done

# ── AI Module ─────────────────────────────────────
echo ""
echo -e "${BLUE}[3/5] AI Module (TypeScript)${NC}"
file_check "Model registry" "src/ai/model-registry/index.ts" "critical"
file_check "Gemini provider" "src/ai/model-registry/providers/gemini.ts"
file_check "Model currency check" "src/ai/version-checks/check-model-currency.ts"
file_check "Visual routing policy" "src/ai/graphics/routing-policy.ts"
file_check "Visual audit" "src/ai/audits/visual-audit.ts"

# ── Package Scripts ───────────────────────────────
echo ""
echo -e "${BLUE}[4/5] Package Scripts${NC}"
PKG="$REPO_ROOT/package.json"
for script in "ai:models:check" "ai:visual:audit" "ai:finished:audit" "ai:governance:check" "starter:audit" "starter:adopt"; do
  if grep -q "\"$script\"" "$PKG" 2>/dev/null; then
    check "Script: $script" "pass"
  else
    check "Script: $script" "warn" "not in package.json"
  fi
done

# ── CLAUDE.md Governance Directive ───────────────
echo ""
echo -e "${BLUE}[5/5] CLAUDE.md Governance Directive${NC}"
if grep -q "GOVERNANCE" "$REPO_ROOT/CLAUDE.md" 2>/dev/null; then
  check "GOVERNANCE directive in CLAUDE.md" "pass"
else
  check "GOVERNANCE directive in CLAUDE.md" "fail" "Add: > **GOVERNANCE:** Load memory.md before any reasoning."
fi

if grep -q "memory.md" "$REPO_ROOT/CLAUDE.md" 2>/dev/null; then
  check "memory.md referenced in CLAUDE.md" "pass"
else
  check "memory.md referenced in CLAUDE.md" "warn"
fi

# ── Summary ───────────────────────────────────────
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
TOTAL=$((PASS + FAIL + WARN))
echo -e "  Checks: $TOTAL  |  ${GREEN}✅ $PASS passed${NC}  |  ${YELLOW}⚠️  $WARN warnings${NC}  |  ${RED}❌ $FAIL failed${NC}"
echo ""

if [[ $FAIL -gt 0 ]]; then
  echo -e "${RED}  AUDIT FAILED — $FAIL critical issues must be resolved.${NC}"
  echo ""
  exit 1
elif [[ $WARN -gt 0 ]]; then
  echo -e "${YELLOW}  AUDIT CONDITIONAL PASS — $WARN warnings. Review before claiming adoption-ready.${NC}"
  echo ""
  exit 0
else
  echo -e "${GREEN}  AUDIT PASSED — repo is governance-ready. ✅${NC}"
  echo ""
  exit 0
fi
