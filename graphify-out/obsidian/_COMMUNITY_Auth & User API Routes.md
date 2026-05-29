---
type: community
cohesion: 0.11
members: 19
---

# Auth & User API Routes

**Cohesion:** 0.11 - loosely connected
**Members:** 19 nodes

## Members
- [[DELETE()_7]] - code - apps/web/app/api/transactions/route.ts
- [[GET()_6]] - code - apps/web/app/api/dashboard/layout/route.ts
- [[GET()_24]] - code - apps/web/app/api/transactions/route.ts
- [[PATCH()_7]] - code - apps/web/app/api/transactions/[id]/route.ts
- [[PATCH()_2]] - code - apps/web/app/api/dashboard/layout/route.ts
- [[POST()_18]] - code - apps/web/app/api/user/complete-onboarding/route.ts
- [[POST()_14]] - code - apps/web/app/api/transactions/route.ts
- [[SUPPORTED_CURRENCIES_4]] - code - apps/web/app/api/transactions/route.ts
- [[config.ts_1]] - code - apps/web/lib/auth/config.ts
- [[createSchema_4]] - code - apps/web/app/api/transactions/route.ts
- [[credentialsSchema]] - code - apps/web/lib/auth/config.ts
- [[deleteSchema]] - code - apps/web/app/api/transactions/route.ts
- [[patchSchema_2]] - code - apps/web/app/api/transactions/[id]/route.ts
- [[route.ts_8]] - code - apps/web/app/api/auth/[...nextauth]/route.ts
- [[route.ts_14]] - code - apps/web/app/api/dashboard/layout/route.ts
- [[route.ts_43]] - code - apps/web/app/api/transactions/[id]/route.ts
- [[route.ts_40]] - code - apps/web/app/api/transactions/route.ts
- [[route.ts_45]] - code - apps/web/app/api/user/complete-onboarding/route.ts
- [[{ handlers, signIn, signOut, auth }]] - code - apps/web/lib/auth/config.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Auth__User_API_Routes
SORT file.name ASC
```

## Connections to other communities
- 18 edges to [[_COMMUNITY_Budgets & Accounts API]]
- 4 edges to [[_COMMUNITY_AI Transaction Parser]]
- 3 edges to [[_COMMUNITY_AI Budget Suggestions & Ollama]]
- 3 edges to [[_COMMUNITY_AI Query Route & Ollama Client]]
- 3 edges to [[_COMMUNITY_Household & Categories API]]
- 2 edges to [[_COMMUNITY_Stripe Payment Routes]]
- 1 edge to [[_COMMUNITY_Web Proxy Middleware]]
- 1 edge to [[_COMMUNITY_Accounts API Routes]]
- 1 edge to [[_COMMUNITY_Account CRUD API]]
- 1 edge to [[_COMMUNITY_Financial Health Score]]
- 1 edge to [[_COMMUNITY_Social & Spending Insights]]
- 1 edge to [[_COMMUNITY_Trade-offs API & Logic]]
- 1 edge to [[_COMMUNITY_Household Invite API]]

## Top bridge nodes
- [[config.ts_1]] - degree 42, connects to 13 communities
- [[route.ts_40]] - degree 9, connects to 1 community
- [[DELETE()_7]] - degree 2, connects to 1 community
- [[GET()_24]] - degree 2, connects to 1 community
- [[POST()_14]] - degree 2, connects to 1 community