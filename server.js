const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// fetch (آمن لكل إصدارات Node)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// 🟢 Home route
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// 🔥 Process YouTube API
app.get("/process", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.json({ error: "No URL provided" });
  }

  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${url}&format=json`
    );

    const data = await response.json();

    res.json({
      title: data.title,
      author: data.author_name,
      idea: "Turn this into a viral short video",
      script: "Start with a hook, then build curiosity, then payoff",
      hashtags: "#shorts #viral #ai"
    });

  } catch (err) {
    res.json({ error: "Failed to fetch video data" });
  }
});

// 🔵 PORT (مهم لـ Render)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});