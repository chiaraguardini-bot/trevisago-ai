import express from "express";

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const fetch = global.fetch;

app.get("/", (_req, res) => {
  res.send("Trevisago AI attivo");
});

app.post("/incoming-call", (_req, res) => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather
    input="speech"
    language="it-IT"
    action="/response"
    method="POST"
    timeout="4"
    speechTimeout="auto"
    actionOnEmptyResult="true">
    <Say language="it-IT" voice="alice">
      Buongiorno, Ristorante Pizzeria Trevisago. Come posso aiutarla?
    </Say>
  </Gather>
  <Redirect method="POST">/incoming-call</Redirect>
</Response>`;

  res.type("text/xml");
  res.send(twiml);
});

app.post("/response", async (req, res) => {
  const userInput = (req.body.SpeechResult || "").trim();

  let aiResponse = "Mi scusi, non ho capito bene. Può ripetere?";

  if (!userInput) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather
    input="speech"
    language="it-IT"
    action="/response"
    method="POST"
    timeout="4"
    speechTimeout="auto"
    actionOnEmptyResult="true">
    <Say language="it-IT" voice="alice">
      Mi scusi, non ho sentito bene. Può ripetere?
    </Say>
  </Gather>
  <Redirect method="POST">/incoming-call</Redirect>
</Response>`;
    res.type("text/xml");
    return res.send(twiml);
  }

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 70,
        messages: [
          {
            role: "system",
            content: `
Rispondi SEMPRE e SOLO in italiano.
Non usare MAI l'inglese.
Sei l'assistente telefonico del Ristorante Pizzeria Trevisago.

Parla in modo naturale, cordiale e molto breve.
Massimo una frase o due frasi corte.
Fai una sola domanda alla volta.
Non usare elenchi.
Non dire mai di essere un'intelligenza artificiale.

ORARI:
- Pranzo: 12:00-14:00
- Cena: 18:00-22:30
- Aperto tutti i giorni
- Chiuso il martedì a pranzo

REGOLE:
- Se il cliente vuole prenotare, raccogli un dato per volta.
- Se chiede un orario fuori fascia, proponi un'alternativa vicina.
- Se chiede il martedì a pranzo, spiega che siete chiusi.
- Se non capisci, chiedi gentilmente di ripetere.
- Dai risposte brevi e veloci, adatte a una telefonata.
`
          },
          {
            role: "user",
            content: userInput
          }
        ]
      })
    });

    const data = await openaiRes.json();

    if (data.error) {
      console.error("Errore OpenAI:", data.error);
      aiResponse = "Mi scusi, ho un piccolo problema tecnico. Può ripetere?";
    } else {
      aiResponse =
        data.choices?.[0]?.message?.content?.trim() ||
        "Mi scusi, non ho capito bene. Può ripetere?";

      aiResponse = aiResponse.replace(/\s+/g, " ").trim();

      if (aiResponse.length > 180) {
        aiResponse = aiResponse.slice(0, 180);
      }
    }
  } catch (error) {
    console.error("Errore server/OpenAI:", error);
    aiResponse = "Mi scusi, c'è stato un problema tecnico. Può ripetere?";
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather
    input="speech"
    language="it-IT"
    action="/response"
    method="POST"
    timeout="4"
    speechTimeout="auto"
    actionOnEmptyResult="true">
    <Say language="it-IT" voice="alice">
      ${escapeForXml(aiResponse)}
    </Say>
  </Gather>
  <Redirect method="POST">/incoming-call</Redirect>
</Response>`;

  res.type("text/xml");
  res.send(twiml);
});

function escapeForXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

app.listen(PORT, () => {
  console.log(`Server attivo sulla porta ${PORT}`);
});
