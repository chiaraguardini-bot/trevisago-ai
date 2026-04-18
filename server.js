import dotenv from "dotenv";
import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error("Manca OPENAI_API_KEY");
}

app.get("/", (_req, res) => {
  res.send("Trevisago realtime server attivo");
});

app.post("/incoming-call", (req, res) => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://${req.headers.host}/media-stream" />
  </Connect>
</Response>`;

  res.type("text/xml");
  res.send(twiml);
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/media-stream" });

wss.on("connection", (twilioWs) => {
  console.log("Twilio connesso al media stream");
  let streamSid = null;

  const openaiWs = new WebSocket(
    "wss://api.openai.com/v1/realtime?model=gpt-realtime",
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      }
    }
  );

  openaiWs.on("open", () => {
    console.log("Connesso a OpenAI Realtime");

    openaiWs.send(JSON.stringify({
      type: "session.update",
      session: {
        instructions: `
Sei l'assistente telefonico del Ristorante Pizzeria Trevisago.
Parli in italiano, in modo naturale, caldo, cordiale e professionale.
Fai una sola domanda alla volta.

ORARI:
- Pranzo 12:00-14:00
- Cena 18:00-22:30
- Aperto tutti i giorni
- Chiuso il martedì a pranzo

OBIETTIVO:
Aiutare il cliente con le prenotazioni tavoli.

REGOLE:
- Non accettare prenotazioni il martedì a pranzo.
- Se l'orario non va bene, proponi un'alternativa vicina.
- Per ora non salvare niente nel database: limita la conversazione a raccogliere i dati e confermare a voce.
- Dati da raccogliere: giorno, ora, numero persone, nome, telefono, note eventuali.
- Risposte brevi, adatte a una telefonata.
`,
        audio: {
          input: {
            format: { type: "audio/pcmu" },
            turn_detection: { type: "server_vad" }
          },
          output: {
            format: { type: "audio/pcmu" },
            voice: "marin"
          }
        }
      }
    }));

    openaiWs.send(JSON.stringify({
      type: "response.create",
      response: {
        modalities: ["audio", "text"],
        instructions: "Saluta il cliente e chiedi come puoi aiutarlo con una prenotazione al Ristorante Pizzeria Trevisago."
      }
    }));
  });

  twilioWs.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.event === "start") {
        streamSid = data.start.streamSid;
        console.log("Stream avviato:", streamSid);
      }

      if (data.event === "media" && openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.send(JSON.stringify({
          type: "input_audio_buffer.append",
          audio: data.media.payload
        }));
      }

      if (data.event === "stop") {
        console.log("Stream fermato");
        if (openaiWs.readyState === WebSocket.OPEN) {
          openaiWs.close();
        }
      }
    } catch (err) {
      console.error("Errore Twilio:", err);
    }
  });

  openaiWs.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "response.output_audio.delta" && data.delta && streamSid) {
        twilioWs.send(JSON.stringify({
          event: "media",
          streamSid,
          media: {
            payload: data.delta
          }
        }));
      }

      if (data.type === "error") {
        console.error("Errore OpenAI:", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Errore OpenAI parse:", err);
    }
  });

  twilioWs.on("close", () => {
    if (openaiWs.readyState === WebSocket.OPEN) {
      openaiWs.close();
    }
  });

  openaiWs.on("close", () => {
    console.log("Connessione OpenAI chiusa");
  });
});

server.listen(PORT, () => {
  console.log(`Server attivo sulla porta ${PORT}`);
});
