const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
let port = 3000;
app.use(express.static(path.join(__dirname , "public")));
// -------------------------------------
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");


app.use(cors());
app.use(bodyParser.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//-------------------------------------------------------------------------

app.get("/",(req,res)=>{
    res.sendFile(path.join(__dirname,"public","index.html"));
});

app.get("/quiz-data/:topic" , (req,res)=>{
    const topic = req.params.topic;
    const filePath = path.join(__dirname , "data",`${topic}.json`);

if(!fs.existsSync(filePath)){
    return res.status(404).json({error:"Quiz topic not found"});
}
try{
    const data = fs.readFileSync(filePath,"utf-8");
    res.json(JSON.parse(data));
} catch(e){
    res.status(500).json({error:"failed to read quiz file"})
}
});


//------------------------------------------------------------------------------------------------------------------------------–-

app.post("/generate-quiz", async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: "Topic is required" });

  try {
    // ✅ Choose Gemini model (fast + accurate)
   /*  const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
 */

  let model;
try {
  model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
} catch (err) {
  console.warn("⚠️ Gemini 2.5 Flash unavailable, falling back to Gemini 2.0 Flash.");
  model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });
}

    // ✅ Strict prompt to ensure clean JSON
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

    // 🔹 Get Gemini response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    console.log("🧠 Raw Gemini Response:", text);

    // 🔹 Clean Gemini output (remove extra formatting)
    let cleaned = text
      .replace(/```json|```/gi, "")   // remove code block markers
      .replace(/^[^{\[]+/, "")        // remove anything before JSON
      .replace(/[^}\]]+$/, "")        // remove anything after JSON
      .trim();

    try {
      // 🔹 Try parsing the JSON safely
      const parsed = JSON.parse(cleaned);

      // 🔹 Convert Gemini format → your quiz format
      const formatted = parsed.map(q => ({
        question: q.question,
        answers: q.options.map(opt => ({
          text: opt,
          correct: opt.trim().toLowerCase() === q.answer.trim().toLowerCase()
        }))
      }));

      console.log("✅ Formatted Quiz Ready:", JSON.stringify(formatted, null, 2));

      res.json(formatted);

    } catch (err) {
      console.error("❌ JSON Parsing Error:", err.message);
      console.error("🧾 Raw Output:\n", text);

      // 🔹 Send error response (safe for frontend)
      res.status(500).json({
        error: "Failed to parse Gemini response",
        details: err.message,
        rawText: text
      });
    }

  } catch (error) {
    console.error("❌ Error Generating Quiz:", error.message);
    res.status(500).json({
      error: "Failed to generate quiz",
      details: error.message,
    });
  }
});
//-----------------------------------------------------------------------------------------------------------------

/* const axios = require("axios");

app.get("/list-models", async (req, res) => {
  try {
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    console.error("❌ Error listing models:", error.response?.data || error.message);
    res.status(500).send(error.response?.data || error.message);
  }
}); */






app.listen(port,()=>{
    console.log("listening on port",port);
})