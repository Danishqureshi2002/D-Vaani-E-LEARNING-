const callClaude = require("./_lib/claude");

function buildSystem(target, instruction) {
  return `You are Vaani, a warm, expert multilingual tutor teaching ${target} to a student whose preferred explanation language is ${instruction}. Explain grammar, vocabulary, and writing in ${target}, using ${instruction} to make things clear when needed. When teaching Arabic or Urdu vocabulary or sentences, show the native script, a transliteration, and a translation into ${instruction}. Correct mistakes gently and specifically: name what was said and show the corrected form. Keep answers focused, well-structured, and not overly long.`;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { message, image, imageType, targetLanguage, instructionLanguage } = req.body || {};
    if (!message && !image) return res.status(400).json({ error: "Missing 'message' or image." });
    const system = buildSystem(targetLanguage || "Arabic", instructionLanguage || "English");
    const reply = await callClaude(message, system, false, image, imageType);
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
