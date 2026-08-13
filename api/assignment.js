const callClaude = require("./_lib/claude");

const SYSTEM = "You are Vaani, a language-learning assignment designer covering Arabic, Urdu, Hindi, and English. Keep content encouraging and level-appropriate. Do not use markdown symbols like # or *.";

function buildPrompt(language, topic, level, demo) {
  if (demo) {
    return `Give a short DEMO example for a ${level} ${language} assignment on the topic "${topic}". Format exactly as:
Example assignment: <one short assignment prompt, 2-3 sentences, in ${language}, with a brief English instruction line if ${language} is Arabic or Urdu>
Example answer: <a short model answer showing what a good response looks like>`;
  }
  return `Give ONE short, clear ${level} assignment prompt (2-3 sentences) in ${language}, focused on the topic: ${topic}. If ${language} is Arabic or Urdu, show the prompt in its native script plus a brief English instruction line. Just the assignment itself, no preamble.`;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { language, topic, level, demo } = req.body || {};
    if (!language || !topic || !level) return res.status(400).json({ error: "Missing 'language', 'topic', or 'level'." });
    const prompt = buildPrompt(language, topic, level, !!demo);
    const reply = await callClaude(prompt, SYSTEM);
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
