require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const app = express();

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(express.json());

// Add root route to serve HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './public', 'smm1.html'));
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Log to confirm the API key is loaded correctly
        console.log("Using API key:", process.env.API_KEY ? "API key is present" : "API key is missing");

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: "system",
                        content: "Talk like an assistant for social media services and act as a social media tracker. Only provide personalized information about social media and marketing management. For any other questions, respond with: 'Sorry, I specialize exclusively in social media management.'. Do not provide any other information and if user writes something inappropriate flag them.",
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        // Log response status for debugging
        console.log("API response status:", response.status);

        if (!response.ok) {
            console.error("API error:", data);
            return res.status(response.status).json({ error: data.error?.message || 'API Error' });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));