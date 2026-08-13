const callClaude = require("./_lib/claude");

const SYSTEM = "You are Vaani, summarizing a language-tutoring chat session into short study notes for the student. Cover: key vocabulary or grammar covered, any corrections made, and 2-3 suggested things to practice next. Keep it concise and plain text, no markdown symbols.";

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { transcript } = req.body || {};
    if (!transcript) return res.status(400).json({ error: "Missing 'transcript'." });
    const prompt = `Here is today's tutoring chat transcript:\n\n${transcript}\n\nWrite a short summary/notes for the student as described.`;
    const reply = await callClaude(prompt, SYSTEM);
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
