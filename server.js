app.post("/incoming-call", (req, res) => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="it-IT" voice="alice">
    Benvenuto al ristorante pizzeria Trevisago. Mi senti?
  </Say>
</Response>`;
  res.type("text/xml");
  res.send(twiml);
});
