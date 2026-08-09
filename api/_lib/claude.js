// Shared helper: calls Anthropic's Messages API from the server, using a
// secret key stored in an environment variable — never exposed to the browser.

module.exports = async function callClaude(userText, system, useSearch = false) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Server is missing ANTHROPIC_API_KEY. Set it in your hosting provider's environment variables.");
  }

  const body = {
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system,
    messages: [{ role: "user", content: userText }],
  };

  if (useSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  }

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  const data = await r.json();

  if (data.error) {
    throw new Error(data.error.message || "Anthropic API error");
  }

  const textBlocks = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text);

  return textBlocks.join("\n").trim() || "Sorry, I couldn't generate a response just now.";
};
