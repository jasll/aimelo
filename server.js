const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Enable CORS for jaslangdon.com
app.use(cors({
  origin: "https://jaslangdon.com"
}));

// Serve static files from public/
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Melody generation route
app.post("/generate-melody", async (req, res) => {
  const prompt = req.body.prompt;

  if (!prompt) {
    console.error("No prompt received");
    return res.status(400).json({ error: "Prompt is required" });
  }

  console.log("Prompt received:", prompt); // ✅ Step 1

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a music generator.
              Given a prompt, return a melody using notes in the form of C3 C#3 and rests represented as a single forward slash /.
              Use only notes from C3 to B5.
              Therefore an example for a return of a sequence would be formatted like this, C3 / D#4 / / E4 /.
              Every note and rest must have a space between them.
              The melody returned must convey the thought, meaning and or feeling in the prompt.
              Never use any lower case letters or any other characters.
              Every melody must end in a way so that it can be looped musically.`
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    console.log("OpenAI raw response:", JSON.stringify(data, null, 2)); // ✅ Step 1

    // ✅ Step 2: Check for OpenAI API errors
    if (data.error) {
      console.error("OpenAI API error:", data.error);
      return res.status(500).json({ error: data.error.message });
    }

    // ✅ Extract melody safely
    const melody = data.choices?.[0]?.message?.content;
    if (!melody) {
      console.error("No melody in OpenAI response:", data);
      return res.status(500).json({ error: "No melody returned from OpenAI" });
    }

    res.json({ melody });

  } catch (error) {
    console.error("Error generating melody:", error);
    res.status(500).json({ error: "Failed to generate melody" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Aimelo server running on port ${PORT}`);
});
