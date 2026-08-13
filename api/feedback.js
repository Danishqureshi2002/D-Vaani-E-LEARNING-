const callClaude = require("./_lib/claude");

const SYSTEM = "You are Vaani, an encouraging but precise language-learning writing evaluator across Arabic, Urdu, Hindi, and English.";

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { assignment, answer, image, imageType } = req.body || {};
    if (!answer && !image) return res.status(400).json({ error: "Missing 'answer' or an attached file." });
    const prompt = `The assignment was: "${assignment || "a general language-learning task"}"\n\nThe student's written answer (if any):\n"""${answer || "(see attached photo/PDF for their answer)"}"""\n\nGive supportive feedback: 1) a corrected/improved version of 2-3 key parts, 2) 3 bullet points on what to improve, 3) one line of encouragement. Keep it concise.`;
    const reply = await callClaude(prompt, SYSTEM, false, image, imageType);
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
