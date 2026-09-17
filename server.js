require("dotenv").config();

const express = require("express");
const path = require("path");
const { mountMcp } = require("./mcp");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", (req, res) => {
  const message =
    typeof req.body?.message === "string" ? req.body.message.trim() : "";

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  res.json({
    reply:
      "Athena is provisioned on this project, but the shopping assistant is not connected to the agent API yet. Your message was received and a live response will appear here after we confirm the Athena API contract.",
    placeholder: true,
  });
});

mountMcp(app);

app.listen(port, () => {
  console.log(`AI Shopping Assistant running at http://localhost:${port}`);
  console.log(`MCP endpoint: http://localhost:${port}/mcp`);
});
