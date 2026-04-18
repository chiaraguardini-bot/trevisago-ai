import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// 👇 USA fetch integrato (niente node-fetch)
const fetch = global.fetch;

// 👉 ROUTE INIZIALE (quando chiami)
app.post("/incoming-call", (req, res) => {
  res.type("text/xml");
  res.send(`
    res.send(`
  <Response>
    <Gather input="speech" language="it-IT" action="/response" method="POST" timeout="5">
      <Say language="it-IT" voice="alice">
        ${aiResponse}
      </Say>
    </Gather>
    <Say language="it-IT">Non ho sentito nulla</Say>
  </Response>
`);

// 👉 RISPOSTA AI + LOOP (NON CADE LA CHIAMATA)
app.post("/response", async (req, res) => {
  const userInput = req.body.SpeechResult || "Non ho capito";

  let aiResponse = "Non ho capito bene";

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        {
  role: "system",
  content: `
Rispondi SEMPRE in italiano.
Risposte MOLTO BREVI (massimo 1 frase).
Tono naturale da ristorante.
Fai UNA domanda alla volta.
`
}
        messages: [
          {
  role: "system",
  content: "Rispondi SEMPRE e SOLO in italiano. Sei un assistente telefonico gentile e naturale."
}
          { role: "user", content: userInput }
        ]
      })
    });

    const data = await openaiRes.json();

    aiResponse = data.choices?.[0]?.message?.content || "Scusa, non ho capito";
  } catch (error) {
    console.error("Errore OpenAI:", error);
    aiResponse = "C'è stato un problema";
  }

  res.type("text/xml");
  res.send(`
    <Response>
      <Gather input="speech" language="it-IT" action="/response" method="POST">
        <Say language="it-IT" voice="alice">
          ${aiResponse}
        </Say>
      </Gather>
    </Response>
  `);
});

// 👉 PORTA
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server attivo sulla porta " + PORT);
});
