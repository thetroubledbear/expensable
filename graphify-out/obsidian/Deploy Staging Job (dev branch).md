---
source_file: ".github/workflows/deploy.yml"
type: "code"
community: "CI/CD Deploy Workflow"
location: "line 62"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/CI/CD_Deploy_Workflow
---

# Deploy: Staging Job (dev branch)

## Connections
- [[Deploy Change Detection Job]] - `references` [EXTRACTED]
- [[Deploy Production Job (approval gate)]] - `references` [EXTRACTED]
- [[EAS (Expo Application Services) BuildUpdate]] - `calls` [EXTRACTED]
- [[GitHub Actions Deploy Workflow]] - `references` [EXTRACTED]
- [[Vercel Deployment Platform]] - `calls` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/CI/CD_Deploy_Workflow