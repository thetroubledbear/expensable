---
type: community
cohesion: 0.25
members: 16
---

# Stripe Payment Routes

**Cohesion:** 0.25 - loosely connected
**Members:** 16 nodes

## Members
- [[GET()_22]] - code - route.ts
- [[POST()_9]] - code - apps/web/app/api/stripe/change-plan/route.ts
- [[POST()_10]] - code - apps/web/app/api/stripe/checkout/route.ts
- [[POST()_12]] - code - apps/web/app/api/stripe/webhook/route.ts
- [[getPriceId()]] - code - apps/web/lib/stripe.ts
- [[getStripe()]] - code - apps/web/lib/stripe.ts
- [[route.ts_33]] - code - apps/web/app/api/stripe/change-plan/route.ts
- [[route.ts_34]] - code - apps/web/app/api/stripe/checkout/route.ts
- [[route.ts_36]] - code - apps/web/app/api/stripe/session-complete/route.ts
- [[route.ts_37]] - code - apps/web/app/api/stripe/webhook/route.ts
- [[route.ts_46]] - code - route.ts
- [[schema_1]] - code - apps/web/app/api/stripe/change-plan/route.ts
- [[schema_2]] - code - apps/web/app/api/stripe/checkout/route.ts
- [[stripe.ts]] - code - apps/web/lib/stripe.ts
- [[tierFromPriceId()]] - code - route.ts
- [[tierFromPriceId()_1]] - code - apps/web/app/api/stripe/webhook/route.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Stripe_Payment_Routes
SORT file.name ASC
```

## Connections to other communities
- 9 edges to [[_COMMUNITY_Budgets & Accounts API]]
- 2 edges to [[_COMMUNITY_Auth & User API Routes]]

## Top bridge nodes
- [[route.ts_33]] - degree 8, connects to 2 communities
- [[route.ts_34]] - degree 8, connects to 2 communities
- [[getStripe()]] - degree 11, connects to 1 community
- [[stripe.ts]] - degree 7, connects to 1 community
- [[POST()_9]] - degree 4, connects to 1 community