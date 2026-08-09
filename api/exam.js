const callClaude = require("./_lib/claude");

const SYSTEM = "You produce only strict JSON output for an exam question generator. Never include markdown code fences or commentary.";

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { exam, topic } = req.body || {};
    if (!exam || !topic) return res.status(400).json({ error: "Missing 'exam' or 'topic'." });
    const prompt = `Create 4 multiple-choice English-section practice questions for the ${exam} exam, topic: ${topic}, at real exam difficulty.
Return ONLY valid JSON, no markdown fences, no extra text, in this exact shape:
{"questions":[{"question":"...","options":["A ...","B ...","C ...","D ..."],"correctIndex":0,"explanation":"..."}]}`;
    const reply = await callClaude(prompt, SYSTEM);
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
