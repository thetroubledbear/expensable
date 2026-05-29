---
type: community
cohesion: 0.60
members: 5
---

# Trade-offs API & Logic

**Cohesion:** 0.60 - moderately connected
**Members:** 5 nodes

## Members
- [[GET()_18]] - code - apps/web/app/api/insights/tradeoffs/route.ts
- [[Tradeoff_2]] - code - apps/web/lib/tradeoffs.ts
- [[computeTradeoffs()]] - code - apps/web/lib/tradeoffs.ts
- [[route.ts_28]] - code - apps/web/app/api/insights/tradeoffs/route.ts
- [[tradeoffs.ts]] - code - apps/web/lib/tradeoffs.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Trade-offs_API__Logic
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_Budgets & Accounts API]]
- 1 edge to [[_COMMUNITY_Auth & User API Routes]]

## Top bridge nodes
- [[route.ts_28]] - degree 6, connects to 2 communities
- [[GET()_18]] - degree 3, connects to 1 community