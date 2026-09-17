const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StreamableHTTPClientTransport } = require("@modelcontextprotocol/sdk/client/streamableHttp.js");

async function main() {
  const url = new URL(process.env.MCP_URL || "http://localhost:3000/mcp");
  const client = new Client({ name: "local-mcp-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(url);

  await client.connect(transport);

  const listed = await client.listTools();
  console.log(
    "tools:",
    listed.tools.map((tool) => ({
      name: tool.name,
      readOnlyHint: tool.annotations?.readOnlyHint,
    }))
  );

  const search = await client.callTool({
    name: "search_products",
    arguments: { query: "keyboard", maxPrice: 100 },
  });
  console.log("search_products text:", search.content);
  console.log("search_products structured:", search.structuredContent);

  const compare = await client.callTool({
    name: "compare_products",
    arguments: {
      product1: "City Buds Mini",
      product2: "Aurora ANC",
    },
  });
  console.log("compare_products text:", compare.content);
  console.log("compare_products structured:", compare.structuredContent);

  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
