// Shared helper: calls Google's Gemini API from the server, using a
// secret key stored in an environment variable — never exposed to the browser.

module.exports = async function callClaude(userText, system, useSearch = false, image = null, imageType = null) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Server is missing GEMINI_API_KEY. Set it in your hosting provider's environment variables.");
  }

  const model = "gemini-3.6-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const parts = [];
  if (userText) parts.push({ text: userText });
  if (image) parts.push({ inline_data: { mime_type: imageType || "image/jpeg", data: image } });

  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts }],
  };

  if (useSearch) {
    body.tools = [{ google_search: {} }];
  }

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await r.json();

  if (data.error) {
    throw new Error(data.error.message || "Gemini API error");
  }

  const responseParts = data.candidates?.[0]?.content?.parts || [];
  const text = responseParts.map((p) => p.text || "").join("\n").trim();

  return text || "Sorry, I couldn't generate a response just now.";
};
