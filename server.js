const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/generate', async (req, res) => {
    const { topic } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
        return res.status(400).json({ 
            error: 'Topic must be at least 3 characters long.' 
        });
    }

    const systemPrompt = `You are a world-class UGC viral shorts strategist. 
You create production-ready short-form video blueprints that consistently hit 100K-10M+ views on TikTok, YouTube Shorts & Instagram Reels.
Always respond with valid JSON ONLY.`;

    const userPrompt = `Topic: "${topic}"

Create a complete viral short video blueprint. Return ONLY this exact JSON structure (no extra text, no markdown):

{
  "hooks": ["hook 1", "hook 2", "hook 3"],
  "script": "full spoken script (15-60 seconds)",
  "meme": "specific meme/trend to use",
  "scenes": ["scene 1 description", "scene 2 description", "..."],
  "visuals": ["visual 1", "visual 2", "..."],
  "audio": "suggested trending audio or music",
  "edit": "detailed editing instructions (cuts, effects, text style, pacing)",
  "captions": {
    "tiktok": "full tiktok caption with emojis & hashtags",
    "youtube": "youtube shorts title + description",
    "pinterest": "pinterest pin text"
  },
  "monetization": "monetization ideas (affiliates, products, sponsorships)",
  "viral_score": "XX/100 - short reason",
  "explanation": "why this blueprint will go viral"
}`;

    try {
        if (!process.env.API_KEY) {
            throw new Error('API_KEY environment variable is missing');
        }

        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.75,
                max_tokens: 2800,
                response_format: { type: 'json_object' }
            })
        });

        if (!aiResponse.ok) {
            const errorData = await aiResponse.text();
            console.error('OpenAI error:', errorData);
            throw new Error('AI service unavailable. Please try again later.');
        }

        const data = await aiResponse.json();
        let content = data.choices[0].message.content.trim();

        if (content.startsWith('```json')) content = content.replace(/```json|```/g, '').trim();

        const parsed = JSON.parse(content);

        if (!parsed.hooks || !parsed.script) {
            throw new Error('Invalid AI response structure');
        }

        res.json(parsed);
    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({
            error: error.message.includes('API_KEY') 
                ? 'Server configuration issue. Please contact support.' 
                : 'Failed to generate viral blueprint. Try a different topic.'
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 UGC AI Viral Shorts System running at http://localhost:${PORT}`);
    console.log(`✅ Frontend served automatically at root /`);
    console.log(`⚠️  Make sure you have a valid OpenAI API key in .env`);
});