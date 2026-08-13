const callClaude = require("./_lib/claude");

const SYSTEM = "You are Vaani, a multilingual language-teaching content generator specialising in Arabic and Urdu, also fluent in Hindi and English. When writing Arabic, use Arabic script. When writing Urdu, use Urdu (Nastaliq-style) script. Always keep content beginner-to-intermediate friendly, warm, and encouraging. Do not use markdown symbols like # or *.";

function buildPrompt(language, section, motherTongue) {
  const mt = motherTongue || "English";
  if (section === "sentences") {
    return `Give 8 useful, everyday practice sentences in ${language} for a language learner whose mother tongue is ${mt}. For each sentence: show it in ${language}'s native script (Arabic script for Arabic, Urdu script for Urdu, plain text for English or Hindi), then on the next line give the meaning in ${mt}, then a simple transliteration if ${language} is Arabic or Urdu. If ${language} and ${mt} are the same, give a simple definition instead of a translation. Separate each sentence group with a blank line. Plain text only, no numbering symbols like # or *.`;
  }
  if (section === "story") {
    return `Write one short, simple paragraph story (about 100-150 words) in ${language}, suitable for a beginner-to-intermediate learner whose mother tongue is ${mt}, with an everyday relatable theme. After the story, add a line "${mt} summary:" followed by a 2-3 sentence summary in ${mt}. Plain text only.`;
  }
  if (section === "books") {
    return `Suggest 5 beginner-to-intermediate friendly books, story collections, or well-known readers for someone learning ${language} as a new language, whose mother tongue is ${mt}. For each: the title, the author if well-known, and one short line (in ${mt}) on why it's good for learners. Plain text, one book per paragraph, no markdown symbols.`;
  }
  return `Give a short, encouraging introduction (3-4 sentences), in ${mt}, to learning ${language} for a beginner.`;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { language, section, motherTongue } = req.body || {};
    if (!language || !section) return res.status(400).json({ error: "Missing 'language' or 'section'." });
    const prompt = buildPrompt(language, section, motherTongue);
    const reply = await callClaude(prompt, SYSTEM);
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
