---
source_file: "CLAUDE.md"
type: "rationale"
community: "CLAUDE.md: AI Pipeline Docs"
location: "line 63"
tags:
  - graphify/rationale
  - graphify/EXTRACTED
  - community/CLAUDEmd_AI_Pipeline_Docs
---

# File Processing Pipeline

## Connections
- [[AI Parser (libaiparser.ts)]] - `calls` [EXTRACTED]
- [[Files Poller Component (componentsfiles-poller.tsx)]] - `references` [EXTRACTED]
- [[Magic-Byte File Validation]] - `implements` [EXTRACTED]
- [[POST apifiles Upload Endpoint]] - `references` [EXTRACTED]
- [[Transaction DB Model]] - `references` [EXTRACTED]
- [[UploadedFile DB Model]] - `references` [EXTRACTED]
- [[processFile() Function]] - `calls` [EXTRACTED]

#graphify/rationale #graphify/EXTRACTED #community/CLAUDEmd_AI_Pipeline_Docs