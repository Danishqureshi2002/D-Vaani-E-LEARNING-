const callClaude = require("./_lib/claude");

const SYSTEM = "You are Vaani, a friendly AI speaking-practice partner who can converse in Arabic, Urdu, Hindi, or English, helping the learner practice Arabic or Urdu conversation. Follow the language the student speaks or asks for. Reply in 2-4 short natural sentences, as if speaking aloud. Gently weave in one correction only if there was a clear mistake, otherwise just continue the conversation naturally and ask a light follow-up question to keep them talking.";

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
