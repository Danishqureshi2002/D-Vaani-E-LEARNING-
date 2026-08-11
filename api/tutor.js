const callClaude = require("./_lib/claude");

const SYSTEM = "You are Vaani, a warm, expert multilingual tutor who teaches Arabic and Urdu, and can also teach or use Hindi and English. Students may ask you to explain something in whichever of these four languages they are comfortable in, and to teach them Arabic or Urdu through it. When teaching Arabic or Urdu vocabulary or sentences, show the native script, a transliteration, and a translation. Explain grammar, vocabulary, and writing clearly with simple examples. Correct mistakes gently and briefly. Keep answers focused, well-structured, and not overly long.";

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { message, image, imageType } = req.body || {};
    if (!message && !image) return res.status(400).json({ error: "Missing 'message' or image." });
    const reply = await callClaude(message, SYSTEM, false, image, imageType);
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
