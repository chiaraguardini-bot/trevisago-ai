import dotenv from "dotenv";
import express from "express";
import http from "http";

dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ROUTE TEST BASE
app.get("/", (req, res) => {
  res.send("Server Trevisago attivo");
});

// ROUTE PER TWILIO (IMPORTANTE)
app.post("/incoming-call", (req, res) => {
  console.log("📞 Chiamata ricevuta da Twilio");

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="it-IT" voice="alice">
    Benvenuta al ristorante pizzeria Trevisago. Mi senti?
  </Say>
</Response>`;

  res.type("text/xml");
  res.send(twiml);
});

// START SERVER
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log("🚀 Server attivo sulla porta " + PORT);
});
