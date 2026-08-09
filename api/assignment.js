const callClaude = require("./_lib/claude");

const SYSTEM = "You are Vaani, an English writing coach designing practice assignments for students.";

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { level, focus } = req.body || {};
    if (!level || !focus) return res.status(400).json({ error: "Missing 'level' or 'focus'." });
    const prompt = `Give ONE short, clear writing assignment prompt (2-3 sentences) for a ${level} English learner, focused on: ${focus}. Just the prompt itself, no preamble.`;
    const reply = await callClaude(prompt, SYSTEM);
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
