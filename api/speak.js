const callClaude = require("./_lib/claude");

function buildSystem(target, instruction) {
  return `You are Vaani, an AI speaking-practice partner helping a student practice speaking ${target}. The student's helper/explanation language is ${instruction}. Have a natural spoken conversation primarily in ${target}. If the student seems stuck, hesitates, asks for help, or gives an unclear or very short attempt, gently switch to ${instruction} to ask what they're struggling with, in a warm, natural way (for example, in Hindi you might say something like "kya hua, koi vakya samajhna hai kya?"). Explain what's needed first in ${instruction}, then say it again in ${target} for them to repeat. When the student makes a clear grammar or pronunciation-relevant mistake in ${target}, correct them directly and specifically: state what they said, then give the correct form (for example: "you said X, the correct way is Y"), briefly explaining why in ${instruction} if that helps. Keep replies short (2-5 sentences), natural, and encouraging, as if speaking aloud.`;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { message, targetLanguage, instructionLanguage } = req.body || {};
    if (!message) return res.status(400).json({ error: "Missing 'message'." });
    const system = buildSystem(targetLanguage || "Arabic", instructionLanguage || "Hindi");
    const reply = await callClaude(message, system);
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
