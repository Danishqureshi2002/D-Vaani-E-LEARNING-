const callClaude = require("./_lib/claude");

const SYSTEM = "You produce only strict JSON output for a language-learning practice question generator covering Arabic, Urdu, Hindi, and English. Never include markdown code fences or commentary.";

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { language, topic } = req.body || {};
    if (!language || !topic) return res.status(400).json({ error: "Missing 'language' or 'topic'." });
    const prompt = `Create 4 multiple-choice practice questions in ${language}, topic: ${topic}, at a fair intermediate difficulty for a language learner. If ${language} is Arabic or Urdu, write the question and options in the native script.
Return ONLY valid JSON, no markdown fences, no extra text, in this exact shape:
{"questions":[{"question":"...","options":["A ...","B ...","C ...","D ..."],"correctIndex":0,"explanation":"..."}]}`;
    const reply = await callClaude(prompt, SYSTEM);
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
