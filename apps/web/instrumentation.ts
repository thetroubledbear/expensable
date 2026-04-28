export async function register() {
  // Payload CMS initializes lazily on first request to /expcms
  // pushDevSchema cannot run in serverless (interactive prompts hang)
}
