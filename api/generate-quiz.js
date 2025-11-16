import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: "Topic is required" });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Try Gemini 2.5 first, fallback to 2.0
    let model;
    try {
      model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
    } catch (err) {
      console.warn("⚠️ Gemini 2.5 Flash unavailable, falling back to Gemini 2.0 Flash.");
      model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });
    }

    // Prompt for quiz generation
    const prompt = `
    Generate exactly 5 multiple choice questions on the topic "${topic}".
    Return ONLY valid JSON in this exact format — no explanation, no markdown:
    [
      {
        "question": "What is ...?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer": "Correct option text"
      }
    ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    console.log("🧠 Raw Gemini Response:", text);

    // Clean Gemini output
    let cleaned = text
      .replace(/```json|```/gi, "")
      .replace(/^[^{\[]+/, "")
      .replace(/[^}\]]+$/, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned);

      // Convert Gemini output → frontend format
      const formatted = parsed.map((q) => ({
        question: q.question,
        answers: q.options.map((opt) => ({
          text: opt,
          correct: opt.trim().toLowerCase() === q.answer.trim().toLowerCase(),
        })),
      }));

      console.log("✅ Formatted Quiz Ready:", JSON.stringify(formatted, null, 2));
      return res.status(200).json(formatted);
    } catch (err) {
      console.error("❌ JSON Parsing Error:", err.message);
      return res.status(500).json({
        error: "Failed to parse Gemini response",
        details: err.message,
        rawText: text,
      });
    }
  } catch (error) {
    console.error("❌ Error Generating Quiz:", error.message);
    return res.status(500).json({
      error: "Failed to generate quiz",
      details: error.message,
    });
  }
}
