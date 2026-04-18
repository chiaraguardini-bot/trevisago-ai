import dotenv from "dotenv";
import express from "express";
import http from "http";
const fetch = global.fetch;

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// TEST BASE
app.get("/", (req, res) => {
  res.send("Trevisago AI attivo");
});

// PRIMA RISPOSTA
app.post("/incoming-call", (req, res) => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" language="it-IT" action="/response" method="POST">
    <Say language="it-IT" voice="alice">
      Benvenuto al ristorante pizzeria Trevisago. Come posso aiutarti?
    </Say>
  </Gather>
</Response>`;

  res.type("text/xml");
  res.send(twiml);
});

// RISPOSTA AI
app.post("/response", async (req, res) => {
  const userSpeech = req.body.SpeechResult || "";

  console.log("Utente:", userSpeech);

  let aiReply = "Non ho capito, puoi ripetere?";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Sei l'assistente del ristorante Trevisago.
Parla in italiano, in modo naturale e cordiale.
Aiuta con prenotazioni tavoli.

Orari:
- Pranzo 12-14
- Cena 18-22:30
- Chiuso martedì a pranzo

Fai UNA domanda alla volta.`
          },
          {
            role: "user",
            content: userSpeech
          }
        ]
      })
    });

    const data = await response.json();
    aiReply = data.choices?.[0]?.message?.content || aiReply;

  } catch (err) {
    console.error(err);
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="/response" method="POST">
    <Say language="it-IT" voice="alice">
      ${aiReply}
    </Say>
  </Gather>
</Response>`;

  res.type("text/xml");
  res.send(twiml);
});

// START SERVER
http.createServer(app).listen(PORT, () => {
  console.log("Server AI attivo su porta " + PORT);
});
