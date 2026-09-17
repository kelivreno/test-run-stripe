const { randomUUID } = require("node:crypto");
const { z } = require("zod");
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StreamableHTTPServerTransport } = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const { isInitializeRequest } = require("@modelcontextprotocol/sdk/types.js");
const { searchProducts, findProduct } = require("./catalog");

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  price: z.number(),
  description: z.string(),
});

const searchOutputSchema = z.object({
  query: z.string(),
  maxPrice: z.number().optional(),
  count: z.number().int(),
  products: z.array(productSchema),
});

const compareOutputSchema = z.object({
  product1: productSchema,
  product2: productSchema,
  comparison: z.object({
    cheaperId: z.string().nullable(),
    priceDifference: z.number(),
    sameCategory: z.boolean(),
  }),
});

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

function createShoppingMcpServer() {
  const server = new McpServer({
    name: "ai-shopping-assistant",
    version: "1.0.0",
  });

  server.registerTool(
    "search_products",
    {
      title: "Search products",
      description:
        "Search the sample shopping catalog by keyword and optionally cap results by maxPrice. Read-only.",
      inputSchema: z.object({
        query: z.string().describe("Search text for name, category, or description"),
        maxPrice: z
          .number()
          .optional()
          .describe("Optional maximum price in USD inclusive"),
      }),
      outputSchema: searchOutputSchema,
      annotations: {
        title: "Search products",
        ...readOnlyAnnotations,
      },
    },
    async ({ query, maxPrice }) => {
      const products = searchProducts(query, maxPrice);
      const structuredContent = {
        query,
        ...(typeof maxPrice === "number" ? { maxPrice } : {}),
        count: products.length,
        products,
      };

      const summary =
        products.length === 0
          ? `No products matched "${query}"${typeof maxPrice === "number" ? ` at or below $${maxPrice}` : ""}.`
          : `Found ${products.length} product${products.length === 1 ? "" : "s"} for "${query}"${
              typeof maxPrice === "number" ? ` at or below $${maxPrice}` : ""
            }: ${products.map((product) => `${product.name} ($${product.price})`).join("; ")}.`;

      return {
        content: [{ type: "text", text: summary }],
        structuredContent,
      };
    }
  );

  server.registerTool(
    "compare_products",
    {
      title: "Compare products",
      description:
        "Look up two products in the sample catalog by name or id and return a side-by-side comparison. Read-only.",
      inputSchema: z.object({
        product1: z.string().describe("First product name or id"),
        product2: z.string().describe("Second product name or id"),
      }),
      outputSchema: compareOutputSchema,
      annotations: {
        title: "Compare products",
        ...readOnlyAnnotations,
      },
    },
    async ({ product1, product2 }) => {
      const first = findProduct(product1);
      const second = findProduct(product2);

      if (!first || !second) {
        const missing = [
          first ? null : product1,
          second ? null : product2,
        ].filter(Boolean);
        const message = `Could not find: ${missing.join(" and ")}.`;
        return {
          isError: true,
          content: [{ type: "text", text: message }],
        };
      }

      const priceDifference = Number(Math.abs(first.price - second.price).toFixed(2));
      const cheaperId =
        first.price === second.price ? null : first.price < second.price ? first.id : second.id;

      const structuredContent = {
        product1: first,
        product2: second,
        comparison: {
          cheaperId,
          priceDifference,
          sameCategory: first.category === second.category,
        },
      };

      const cheaperLabel = cheaperId
        ? cheaperId === first.id
          ? first.name
          : second.name
        : "neither (same price)";

      const summary = `${first.name} ($${first.price}) vs ${second.name} ($${second.price}). Cheaper: ${cheaperLabel}. Price difference: $${priceDifference}. ${
        first.category === second.category ? "Same category." : "Different categories."
      }`;

      return {
        content: [{ type: "text", text: summary }],
        structuredContent,
      };
    }
  );

  return server;
}

function mountMcp(app) {
  const transports = Object.create(null);

  app.post("/mcp", async (req, res) => {
    try {
      const sessionId = req.headers["mcp-session-id"];
      let transport;

      if (sessionId && transports[sessionId]) {
        transport = transports[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          enableJsonResponse: true,
          onsessioninitialized: (id) => {
            transports[id] = transport;
          },
          onsessionclosed: (id) => {
            delete transports[id];
          },
        });

        const server = createShoppingMcpServer();
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      } else {
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: No valid session ID provided",
          },
          id: null,
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
          },
          id: null,
        });
      }
    }
  });

  app.get("/mcp", (_req, res) => {
    res.status(405).set("Allow", "POST, DELETE").send("Method Not Allowed");
  });

  app.delete("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"];
    const transport = sessionId ? transports[sessionId] : undefined;
    if (!transport) {
      res.status(404).json({
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: "Session not found",
        },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res);
  });
}

module.exports = {
  createShoppingMcpServer,
  mountMcp,
};
