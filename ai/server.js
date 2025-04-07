require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path'); // Add this
const app = express();

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(express.json());

// Add root route to serve HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            // In the POST /api/chat route
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: "system",
                        content: "Talk like an assistant for social media services and act as a social media tracker. Only provide personalized information about social media and marketing management. For any other questions, respond with: 'Sorry, I specialize exclusively in social media management.",
                    },
                    {
                        role: "user",
                        content: message
                    },
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));