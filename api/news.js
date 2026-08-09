const callClaude = require("./_lib/claude");

const SYSTEM = "You are a concise, neutral news briefing assistant for students. Always ground answers in the search results.";

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { category } = req.body || {};
    if (!category) return res.status(400).json({ error: "Missing 'category'." });
    const prompt = `Search the web and give me today's top 5 current news headlines in the category "${category}", relevant to a student audience in India. For each: a short eyebrow label (source/date), a headline, and a 1-2 sentence plain-English summary. Format as plain text, one item after another, no markdown symbols like # or *.`;
    const reply = await callClaude(prompt, SYSTEM, true);
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
