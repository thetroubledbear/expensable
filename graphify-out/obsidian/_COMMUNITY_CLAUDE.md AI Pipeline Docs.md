---
type: community
cohesion: 0.24
members: 10
---

# CLAUDE.md: AI Pipeline Docs

**Cohesion:** 0.24 - loosely connected
**Members:** 10 nodes

## Members
- [[AI Parser (libaiparser.ts)]] - code - CLAUDE.md
- [[AI Sanitizer (libaisanitize.ts)]] - code - CLAUDE.md
- [[File Processing Pipeline]] - rationale - CLAUDE.md
- [[Gemma 4 AI Model]] - rationale - CLAUDE.md
- [[HouseholdMember DB Model]] - code - CLAUDE.md
- [[IDOR Protection Pattern]] - rationale - CLAUDE.md
- [[Magic-Byte File Validation]] - rationale - CLAUDE.md
- [[Ollama Cloud API]] - rationale - CLAUDE.md
- [[POST apifiles Upload Endpoint]] - code - CLAUDE.md
- [[Security Layer (SuperSecGuy)]] - rationale - CLAUDE.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/CLAUDEmd_AI_Pipeline_Docs
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_CLAUDE.md API & DB Docs]]
- 1 edge to [[_COMMUNITY_CLAUDE.md UI Component Docs]]
- 1 edge to [[_COMMUNITY_CLAUDE.md Categories Docs]]

## Top bridge nodes
- [[File Processing Pipeline]] - degree 7, connects to 3 communities
- [[HouseholdMember DB Model]] - degree 2, connects to 1 community