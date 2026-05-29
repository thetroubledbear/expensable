---
type: community
cohesion: 0.07
members: 49
---

# AI Transaction Parser

**Cohesion:** 0.07 - loosely connected
**Members:** 49 nodes

## Members
- [[ALLOWED_MIME]] - code - apps/web/app/api/user/avatar/route.ts
- [[DELETE()_3]] - code - apps/web/app/api/files/[id]/route.ts
- [[DELETE()_8]] - code - apps/web/app/api/user/avatar/route.ts
- [[GET()_25]] - code - apps/web/app/api/user/avatar/route.ts
- [[GET()_7]] - code - apps/web/app/api/files/route.ts
- [[GET()_8]] - code - apps/web/app/api/files/[id]/route.ts
- [[GET()_9]] - code - apps/web/app/api/files/[id]/url/route.ts
- [[INJECTION_PATTERNS]] - code - apps/web/lib/ai/sanitize.ts
- [[MIME_TO_TYPE]] - code - apps/web/app/api/files/route.ts
- [[NotificationInput]] - code - apps/web/lib/anomalies.ts
- [[POST()_17]] - code - apps/web/app/api/user/avatar/route.ts
- [[POST()_6]] - code - apps/web/app/api/files/route.ts
- [[ParseInput]] - code - apps/web/lib/ai/parser.ts
- [[ParseResult]] - code - apps/web/lib/ai/parser.ts
- [[ParsedTransaction]] - code - apps/web/lib/ai/parser.ts
- [[STRIP_PATTERNS]] - code - apps/web/lib/merchant-normalize.ts
- [[XLSX_MIMES]] - code - apps/web/app/api/files/route.ts
- [[anomalies.ts]] - code - apps/web/lib/anomalies.ts
- [[avatarKey()]] - code - apps/web/app/api/user/avatar/route.ts
- [[buildStorageKey()]] - code - apps/web/lib/storage/index.ts
- [[deleteFile()]] - code - apps/web/lib/storage/index.ts
- [[detectAnomalies()]] - code - apps/web/lib/anomalies.ts
- [[detectFrequency()]] - code - apps/web/lib/subscriptions.ts
- [[detectSubscriptions()]] - code - apps/web/lib/subscriptions.ts
- [[extractJson()]] - code - apps/web/lib/ai/parser.ts
- [[getBucket()]] - code - apps/web/lib/storage/index.ts
- [[getFileBuffer()]] - code - apps/web/lib/storage/index.ts
- [[getPresignedUrl()]] - code - apps/web/lib/storage/index.ts
- [[index.ts]] - code - apps/web/lib/storage/index.ts
- [[isRateLimited()]] - code - apps/web/app/api/files/route.ts
- [[isSuspiciousCell()]] - code - apps/web/lib/ai/sanitize.ts
- [[merchant-normalize.ts]] - code - apps/web/lib/merchant-normalize.ts
- [[normalizeMerchant()]] - code - apps/web/lib/merchant-normalize.ts
- [[parseFileContent()]] - code - apps/web/lib/ai/parser.ts
- [[parser.ts]] - code - apps/web/lib/ai/parser.ts
- [[processFile()]] - code - apps/web/app/api/files/route.ts
- [[redactCell()]] - code - apps/web/lib/ai/sanitize.ts
- [[route.ts_16]] - code - apps/web/app/api/files/[id]/route.ts
- [[route.ts_17]] - code - apps/web/app/api/files/[id]/url/route.ts
- [[route.ts_15]] - code - apps/web/app/api/files/route.ts
- [[route.ts_44]] - code - apps/web/app/api/user/avatar/route.ts
- [[sanitize.ts]] - code - apps/web/lib/ai/sanitize.ts
- [[sanitizeForAI()]] - code - apps/web/lib/ai/sanitize.ts
- [[splitCsvChunks()]] - code - apps/web/app/api/files/route.ts
- [[subscriptions.ts]] - code - apps/web/lib/subscriptions.ts
- [[uploadFile()]] - code - apps/web/lib/storage/index.ts
- [[uploadTimestamps]] - code - apps/web/app/api/files/route.ts
- [[validateMagicBytes()_1]] - code - apps/web/app/api/user/avatar/route.ts
- [[validateMagicBytes()]] - code - apps/web/app/api/files/route.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/AI_Transaction_Parser
SORT file.name ASC
```

## Connections to other communities
- 4 edges to [[_COMMUNITY_Auth & User API Routes]]
- 4 edges to [[_COMMUNITY_Budgets & Accounts API]]
- 3 edges to [[_COMMUNITY_Web Auth & Layout]]
- 3 edges to [[_COMMUNITY_Household & Categories API]]
- 2 edges to [[_COMMUNITY_Settings Page & Profile]]
- 1 edge to [[_COMMUNITY_AI Budget Suggestions & Ollama]]
- 1 edge to [[_COMMUNITY_AI Query Route & Ollama Client]]

## Top bridge nodes
- [[route.ts_15]] - degree 28, connects to 5 communities
- [[getPresignedUrl()]] - degree 11, connects to 3 communities
- [[index.ts]] - degree 12, connects to 2 communities
- [[route.ts_44]] - degree 11, connects to 1 community
- [[processFile()]] - degree 8, connects to 1 community