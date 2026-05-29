---
type: community
cohesion: 0.60
members: 6
---

# CI/CD Deploy Workflow

**Cohesion:** 0.60 - moderately connected
**Members:** 6 nodes

## Members
- [[Deploy Change Detection Job]] - code - .github/workflows/deploy.yml
- [[Deploy Production Job (approval gate)]] - code - .github/workflows/deploy.yml
- [[Deploy Staging Job (dev branch)]] - code - .github/workflows/deploy.yml
- [[EAS (Expo Application Services) BuildUpdate]] - code - .github/workflows/deploy.yml
- [[GitHub Actions Deploy Workflow]] - code - .github/workflows/deploy.yml
- [[Vercel Deployment Platform]] - rationale - .github/workflows/deploy.yml

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/CI/CD_Deploy_Workflow
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_CLAUDE.md Auth & Storage]]
- 1 edge to [[_COMMUNITY_CLAUDE.md Project Overview]]

## Top bridge nodes
- [[EAS (Expo Application Services) BuildUpdate]] - degree 3, connects to 1 community
- [[Vercel Deployment Platform]] - degree 3, connects to 1 community