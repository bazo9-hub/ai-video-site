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

  try {
    let videoId = "";

    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("v=")) {
      videoId = new URL(url).searchParams.get("v");
    } else {
      videoId = url;
    }

    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );

    const data = await response.json();

    res.json({
      title: data.title || "No title",
      author: data.author_name || "Unknown",
      idea: "Turn this video into a viral short",
      script: "Hook → build → payoff",
      hashtags: "#shorts #viral #ai"
    });

  } catch (err) {
    res.json({
      error: "Failed to fetch video data",
      details: err.message
    });
  }
});

// PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
