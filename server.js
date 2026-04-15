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

  res.json({
    title: "AI Video Title",
    author: "YouTube Creator",
    idea: "Turn video into viral short",
    script: "Hook → Build → Payoff",
    hashtags: "#shorts #viral #ai"
  });
});

// PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
