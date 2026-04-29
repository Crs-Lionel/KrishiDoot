# MCP Setup For KrishiDoot

This repo now carries a project-scoped `.mcp.json` so Codex-compatible MCP clients can load the same browser and UI-generation tools for everyone working here.

## Included servers

- `browsermcp`
  - Package: `@browsermcp/mcp`
  - Use this for browser control, screenshots, tab inspection, console logs, and visual QA.
- `21st-magic`
  - Package: `@21st-dev/magic`
  - Use this for component generation and UI exploration.

## What still needs one manual step

### Browser MCP

1. Install the Browser MCP extension:
   [Chrome Web Store](https://chromewebstore.google.com/detail/browser-mcp-automate-your/bjfgambnhccakkhmkepdoekmckoijdlc)
2. Open the page you want to inspect.
3. Click the extension and press `Connect` on the active tab.

Official docs:

- [Browser MCP server setup](https://docs.browsermcp.io/setup-server)
- [Browser MCP extension setup](https://docs.browsermcp.io/setup-extension)

### 21st Magic

1. Generate a Magic API key from [21st.dev Magic Console](https://21st.dev/magic/console).
2. Make that key available to the MCP process before launching the client.

The 21st docs show two supported patterns:

- pass the key directly in MCP config
- or launch the server with `API_KEY` available in the process environment

Official references:

- [21st Magic MCP repository](https://github.com/21st-dev/magic-mcp)
- [21st CLI installer](https://github.com/21st-dev/cli)

## Notes

- Both MCP packages were downloaded and verified from npm during setup.
- Browser MCP is the important one for visual review of this landing page.
- 21st Magic is better used as a generation and variation tool, not the final judge of visual quality.
