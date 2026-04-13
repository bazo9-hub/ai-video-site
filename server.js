const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const fetch = global.fetch;

// 🟢 Home route
app.get("/", (req, res) => {
  res.send("OK");
});

// 🔥 Process API (YouTube)
app.get("/process", async (req, res) => {

  const url = req.query.url;

  if (!url) {
    return res.json({ error: "No URL" });
  }

  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${url}&format=json`);
    const data = await response.json();

   res.json({
  title: data.title,
  author: data.author_name,
  idea: "Turn this into a viral 15s short",
  script: "Start with a hook, then reveal, then punchline",
  hashtags: "#shorts #viral #ai"
});

  } catch (err) {
    res.json({ error: "API failed" });
  }

});

app.listen(3000, () => {
  console.log("Server running");
});