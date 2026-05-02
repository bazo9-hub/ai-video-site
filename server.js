const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('✅ السيرفر شغال');
});

app.get('/process', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.json({ error: 'لا يوجد رابط' });

    try {
        const response = await fetch(`https://www.youtube.com/oembed?url=${url}&format=json`);
        const data = await response.json();
        res.json({
            title: data.title,
            author: data.author_name,
            idea: "فكرة فيديو قصير: ابدأ بسؤال مثير",
            script: "نص تجريبي: 3 نصائح ذهبية في 30 ثانية",
            hashtags: "#shorts #tips #youtube"
        });
    } catch (err) {
        res.json({ error: 'فشل الاتصال بـ YouTube' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
