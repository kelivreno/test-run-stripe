# AI Shopping Assistant

Local Express app with a shopping chat UI and an Athena-compatible MCP server. Athena is **not** configured in this version.

## Start the server

From the project root:

```bash
npm install
npm start
```

Then open:

- Shopping UI: http://localhost:3000
- MCP URL: http://localhost:3000/mcp

Environment variables are loaded on the server with `dotenv`. Athena credentials stay on the server and are never sent to browser JavaScript.

## MCP tools

Read-only tools on `/mcp`:

- `search_products` — `query` (string), optional `maxPrice` (number)
- `compare_products` — `product1` (string), `product2` (string)

The catalog is a small hardcoded sample (headphones, keyboards, coffee gear, desk accessories, speakers).

## Test the MCP server

With the app running (`npm start`), in another terminal:

```bash
npm run test:mcp
```

That uses the official MCP client SDK against `http://localhost:3000/mcp` and calls both tools.

You can also initialize a session with curl. Send JSON and include `Accept: application/json, text/event-stream`.

```bash
curl -sS http://localhost:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -D - \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl","version":"0.0.1"}}}'
```

Copy the `mcp-session-id` response header, then list tools:

```bash
curl -sS http://localhost:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'mcp-session-id: SESSION_ID' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

Call a tool:

```bash
curl -sS http://localhost:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'mcp-session-id: SESSION_ID' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search_products","arguments":{"query":"coffee","maxPrice":50}}}'
```

Do not point Athena at this URL until you are ready to configure the agent.
