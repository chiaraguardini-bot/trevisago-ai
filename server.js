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

app.get("/", (req, res) => {
  res.send("OK");
});

app.post("/incoming-call", (req, res) => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="it-IT" voice="alice">
Benvenuto al ristorante pizzeria Trevisago. Come posso aiutarti?
</Say>
</Response>`;
  res.type("text/xml");
  res.send(twiml);
});

const server = http.createServer(app);
server.listen(PORT, () => {
  console.log("Server attivo");
});
