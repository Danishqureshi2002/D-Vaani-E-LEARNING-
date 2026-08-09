const callClaude = require("./_lib/claude");

const SYSTEM = "You are Vaani, a warm, expert English tutor for Indian students improving their theoretical and spoken English. Explain grammar, vocabulary, and writing clearly with simple examples relevant to Indian learners. Correct mistakes gently and briefly. Keep answers focused, well-structured, and not overly long.";

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: "Missing 'message'." });
    const reply = await callClaude(message, SYSTEM);
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
