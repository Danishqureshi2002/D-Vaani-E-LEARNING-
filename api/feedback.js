const callClaude = require("./_lib/claude");

const SYSTEM = "You are Vaani, an encouraging but precise English writing evaluator.";

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { assignment, answer } = req.body || {};
    if (!answer) return res.status(400).json({ error: "Missing 'answer'." });
    const prompt = `The assignment was: "${assignment || "a general English writing task"}"\n\nThe student wrote:\n"""${answer}"""\n\nGive supportive feedback: 1) a corrected/improved version of 2-3 key sentences, 2) 3 bullet points on grammar/vocabulary to improve, 3) one line of encouragement. Keep it concise.`;
    const reply = await callClaude(prompt, SYSTEM);
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
