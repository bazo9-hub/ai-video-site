const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

// HOME
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// PROCESS API
app.get("/process", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.json({ error: "No URL provided" });
  }

 app.get("/process", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.json({ error: "No URL provided" });
  }

  try {
    const videoId = new URL(url).searchParams.get("v");

    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );

    const data = await response.json();

    res.json({
      title: data.title,
      author: data.author_name,
      idea: "Turn this video into a viral short",
      script: "Hook → problem → solution → ending",
      hashtags: "#shorts #viral #ai"
    });

  } catch (err) {
    res.json({ error: "Failed to fetch video data" });
  }
});
});

// PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
