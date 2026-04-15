const express = require("express");
const cors = require("cors");

app.get("/process", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.json({ error: "No URL provided" });
  }

  try {
    // استخراج فيديو ID
    const videoId = new URL(url).searchParams.get("v");

    if (!videoId) {
      return res.json({ error: "Invalid YouTube URL" });
    }

    // رد ثابت (يشتغل 100%)
    res.json({
      title: "AI Video Title",
      author: "YouTube Creator",
      idea: "Turn this video into a viral short",
      script: "Hook → Problem → Solution → Ending",
      hashtags: "#shorts #viral #ai"
    });

  } catch (err) {
    console.log(err);
    res.json({ error: "Server error" });
  }
});
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
