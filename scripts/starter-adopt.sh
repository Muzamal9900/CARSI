#!/usr/bin/env bash
# starter:adopt — Copy governance framework from this repo into a target project.
# Usage: pnpm starter:adopt "<target-project-path>" [--full-audit]
#
# Copies:
#   memory.md (from template, with placeholder substitution prompts)
#   .skills/custom/* governance skills (8 skills)
#   docs/agent-framework/* agent hierarchy docs
#   src/ai/* TypeScript AI module
#   templates/governance-framework/* scaffold
#   Appends governance package.json scripts
#
# --full-audit  Run starter:audit on the target after copying.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ── Args ──────────────────────────────────────────
TARGET="${1:-}"
FULL_AUDIT=false
for arg in "$@"; do
  [[ "$arg" == "--full-audit" ]] && FULL_AUDIT=true
done

if [[ -z "$TARGET" ]]; then
  echo -e "${RED}ERROR: target project path required.${NC}"
  echo "  Usage: pnpm starter:adopt \"<target-project-path>\" [--full-audit]"
  exit 1
fi

if [[ ! -d "$TARGET" ]]; then
  echo -e "${RED}ERROR: target path does not exist: $TARGET${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  CARSI Starter — Adopt Governance Framework${NC}"
echo -e "${BLUE}  Source: $REPO_ROOT${NC}"
echo -e "${BLUE}  Target: $TARGET${NC}"
echo -e "${BLUE}  $(date '+%d/%m/%Y %H:%M') AEST${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

COPIED=0
SKIPPED=0

copy_file() {
  local src="$1"
  local dst_rel="$2"
  local dst="$TARGET/$dst_rel"
  local dst_dir
  dst_dir="$(dirname "$dst")"
  mkdir -p "$dst_dir"
  if [[ -f "$dst" ]]; then
    echo -e "  ${YELLOW}⚠️  SKIP${NC}  $dst_rel  (already exists — won't overwrite)"
    ((SKIPPED++))
  else
    cp "$src" "$dst"
    echo -e "  ${GREEN}✅ COPY${NC}  $dst_rel"
    ((COPIED++))
  fi
}

copy_dir() {
  local src_dir="$1"
  local dst_dir_rel="$2"
  local dst_dir="$TARGET/$dst_dir_rel"
  if [[ ! -d "$src_dir" ]]; then
    echo -e "  ${YELLOW}⚠️  SKIP${NC}  $dst_dir_rel/  (source dir missing)"
    return
  fi
  mkdir -p "$dst_dir"
  # Copy files (not subdirs) — caller handles recursion if needed
  find "$src_dir" -maxdepth 1 -type f | while read -r f; do
    fname="$(basename "$f")"
    dst_file="$dst_dir/$fname"
    rel="$dst_dir_rel/$fname"
    if [[ -f "$dst_file" ]]; then
      echo -e "  ${YELLOW}⚠️  SKIP${NC}  $rel  (already exists)"
      ((SKIPPED++)) || true
    else
      cp "$f" "$dst_file"
      echo -e "  ${GREEN}✅ COPY${NC}  $rel"
      ((COPIED++)) || true
    fi
  done
}

# ── 1. memory.md (from template) ─────────────────
echo -e "${BLUE}[1/6] memory.md${NC}"
TMPL="$REPO_ROOT/templates/governance-framework/memory.template.md"
if [[ -f "$TMPL" ]]; then
  copy_file "$TMPL" "memory.md"
  echo -e "        ${YELLOW}↳ Edit memory.md — replace all [PROJECT-SPECIFIC] placeholders.${NC}"
else
  echo -e "  ${RED}❌ FAIL${NC}  Template missing: templates/governance-framework/memory.template.md"
fi

# ── 2. CLAUDE.md governance directive ────────────
echo ""
echo -e "${BLUE}[2/6] CLAUDE.md governance directive${NC}"
TARGET_CLAUDE="$TARGET/CLAUDE.md"
DIRECTIVE="> **GOVERNANCE:** Load memory.md before performing any reasoning. See docs/agent-framework/ for agent hierarchy."
if [[ -f "$TARGET_CLAUDE" ]]; then
  if grep -q "GOVERNANCE" "$TARGET_CLAUDE"; then
    echo -e "  ${YELLOW}⚠️  SKIP${NC}  CLAUDE.md — GOVERNANCE directive already present"
    ((SKIPPED++))
  else
    # Prepend directive after first line (project title)
    TMPF=$(mktemp)
    head -1 "$TARGET_CLAUDE" > "$TMPF"
    echo "" >> "$TMPF"
    echo "$DIRECTIVE" >> "$TMPF"
    echo "" >> "$TMPF"
    tail -n +2 "$TARGET_CLAUDE" >> "$TMPF"
    mv "$TMPF" "$TARGET_CLAUDE"
    echo -e "  ${GREEN}✅ PATCH${NC} CLAUDE.md — governance directive prepended"
    ((COPIED++))
  fi
else
  echo -e "  ${YELLOW}⚠️  NOTE${NC}  No CLAUDE.md found in target — create one and add the governance directive manually."
fi

# ── 3. Governance skills ──────────────────────────
echo ""
echo -e "${BLUE}[3/6] Custom Governance Skills (.skills/custom/)${NC}"
SKILLS_SRC="$REPO_ROOT/.skills/custom"
GOVERNANCE_SKILLS=(
  "outcome-translator"
  "blueprint-first"
  "finished-audit"
  "evidence-verifier"
  "definition-of-done-builder"
  "model-currency-checker"
  "visual-excellence-enforcer"
  "delegation-planner"
)
for skill in "${GOVERNANCE_SKILLS[@]}"; do
  src_skill="$SKILLS_SRC/$skill"
  dst_skill=".skills/custom/$skill"
  if [[ -d "$src_skill" ]]; then
    mkdir -p "$TARGET/$dst_skill"
    for f in "$src_skill"/*; do
      [[ -f "$f" ]] && copy_file "$f" "$dst_skill/$(basename "$f")"
    done
  else
    echo -e "  ${YELLOW}⚠️  SKIP${NC}  $skill — source skill missing"
  fi
done

# ── 4. Agent framework docs ───────────────────────
echo ""
echo -e "${BLUE}[4/6] Agent Framework Docs (docs/agent-framework/)${NC}"
AGENT_DOCS_SRC="$REPO_ROOT/docs/agent-framework"
if [[ -d "$AGENT_DOCS_SRC" ]]; then
  mkdir -p "$TARGET/docs/agent-framework"
  for f in "$AGENT_DOCS_SRC"/*.md; do
    [[ -f "$f" ]] && copy_file "$f" "docs/agent-framework/$(basename "$f")"
  done
else
  echo -e "  ${YELLOW}⚠️  SKIP${NC}  docs/agent-framework/ — not found in source"
fi

# ── 5. TypeScript AI module ───────────────────────
echo ""
echo -e "${BLUE}[5/6] TypeScript AI Module (src/ai/)${NC}"
AI_SRC="$REPO_ROOT/src/ai"
if [[ -d "$AI_SRC" ]]; then
  # model-registry
  mkdir -p "$TARGET/src/ai/model-registry/providers"
  for f in "$AI_SRC/model-registry"/*.ts; do
    [[ -f "$f" ]] && copy_file "$f" "src/ai/model-registry/$(basename "$f")"
  done
  for f in "$AI_SRC/model-registry/providers"/*.ts; do
    [[ -f "$f" ]] && copy_file "$f" "src/ai/model-registry/providers/$(basename "$f")"
  done
  # version-checks
  mkdir -p "$TARGET/src/ai/version-checks"
  for f in "$AI_SRC/version-checks"/*.ts; do
    [[ -f "$f" ]] && copy_file "$f" "src/ai/version-checks/$(basename "$f")"
  done
  # graphics
  mkdir -p "$TARGET/src/ai/graphics"
  for f in "$AI_SRC/graphics"/*.ts; do
    [[ -f "$f" ]] && copy_file "$f" "src/ai/graphics/$(basename "$f")"
  done
  # audits
  mkdir -p "$TARGET/src/ai/audits"
  for f in "$AI_SRC/audits"/*.ts; do
    [[ -f "$f" ]] && copy_file "$f" "src/ai/audits/$(basename "$f")"
  done
else
  echo -e "  ${YELLOW}⚠️  SKIP${NC}  src/ai/ — not found in source"
fi

# ── 6. Package scripts ────────────────────────────
echo ""
echo -e "${BLUE}[6/6] Package Scripts${NC}"
TARGET_PKG="$TARGET/package.json"
if [[ -f "$TARGET_PKG" ]]; then
  SCRIPTS_TO_ADD=(
    '"ai:models:check": "npx ts-node src/ai/version-checks/check-model-currency.ts"'
    '"ai:visual:audit": "npx ts-node src/ai/audits/visual-audit.ts"'
    '"ai:governance:check": "bash templates/governance-framework/governance-check.sh"'
    '"starter:audit": "bash scripts/starter-audit.sh"'
  )
  ADDED_ANY=false
  for script_line in "${SCRIPTS_TO_ADD[@]}"; do
    script_key="${script_line%%\":*}"
    script_key="${script_key#\"}"
    if grep -q "\"$script_key\"" "$TARGET_PKG"; then
      echo -e "  ${YELLOW}⚠️  SKIP${NC}  Script already exists: $script_key"
      ((SKIPPED++))
    else
      echo -e "  ${YELLOW}ℹ️  NOTE${NC}  Add to $TARGET/package.json scripts:"
      echo -e "          $script_line"
      ADDED_ANY=true
    fi
  done
  if [[ "$ADDED_ANY" == "true" ]]; then
    echo ""
    echo -e "  ${YELLOW}↳ Add the above lines to the \"scripts\" block in package.json manually.${NC}"
    echo -e "  ${YELLOW}↳ Also copy scripts/starter-audit.sh to the target repo's scripts/ directory.${NC}"
  fi
else
  echo -e "  ${YELLOW}⚠️  NOTE${NC}  No package.json found at target — add scripts manually."
fi

# ── Summary ───────────────────────────────────────
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${GREEN}✅ Copied: $COPIED${NC}  |  ${YELLOW}⚠️  Skipped: $SKIPPED${NC}"
echo ""
echo -e "  Next steps for target project:"
echo -e "  1. Edit ${YELLOW}memory.md${NC} — replace all [PROJECT-SPECIFIC] placeholders"
echo -e "  2. Update ${YELLOW}src/ai/model-registry/index.ts${NC} — adjust approved models"
echo -e "  3. Add governance scripts to ${YELLOW}package.json${NC} (see output above)"
echo -e "  4. Commit the framework files on a dedicated branch"
echo ""

# ── Full Audit ────────────────────────────────────
if [[ "$FULL_AUDIT" == "true" ]]; then
  echo -e "${BLUE}Running full audit on target...${NC}"
  echo ""
  AUDIT_SCRIPT="$REPO_ROOT/scripts/starter-audit.sh"
  if [[ -f "$AUDIT_SCRIPT" ]]; then
    # Run audit in the context of the target dir
    cd "$TARGET" && bash "$AUDIT_SCRIPT" || true
  else
    echo -e "${YELLOW}⚠️  starter-audit.sh not found — copy it to the target first.${NC}"
  fi
fi
