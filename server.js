app.post("/incoming-call", (req, res) => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="it-IT" voice="alice">
    Server collegato correttamente. Benvenuta al ristorante Trevisago.
  </Say>
</Response>`;
  res.type("text/xml");
  res.send(twiml);
});
