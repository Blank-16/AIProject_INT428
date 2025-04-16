document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    marked.setOptions({
        breaks: true,
        highlight: (code) => hljs.highlightAuto(code).value
    });

    userInput.addEventListener('input', () => {
        sendBtn.disabled = userInput.value.trim() === '';
    });

    async function callGroqAPI(userMessage) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: userMessage })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('API Error:', data);
                throw new Error(data.error || 'API Error');
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error:', error);
            return `Error: ${error.message}`;
        }
    }

    function renderMarkdown(content) {
        try {
            // Configure marked options
            marked.setOptions({
                gfm: true, // GitHub Flavored Markdown
                breaks: true, // Add <br> on single line breaks
                headerIds: false, // Disable header IDs
                highlight: function (code, language) {
                    if (language && hljs.getLanguage(language)) {
                        try {
                            return hljs.highlight(code, { language }).value;
                        } catch (err) { }
                    }
                    return hljs.highlightAuto(code).value;
                }
            });

            // Parse markdown and sanitize the output
            const rawHtml = marked.parse(content);
            return DOMPurify.sanitize(rawHtml, {
                ALLOWED_TAGS: [
                    'p', 'br', 'strong', 'em', 'code', 'pre', 'blockquote',
                    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    'ul', 'ol', 'li', 'a'
                ],
                ALLOWED_ATTR: ['href', 'class']
            });
        } catch (error) {
            console.error('Markdown parsing error:', error);
            return DOMPurify.sanitize(content);
        }
    }

    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex items-start gap-3';

        if (isUser) {
            // User message - positioned on the right
            messageDiv.className += ' justify-end';
            messageDiv.innerHTML = `
                <div class="chat-bubble user-message p-4">
                    <div>${DOMPurify.sanitize(message)}</div>
                </div>
                <div class="avatar user-avatar">YOU</div>
            `;
        } else {
            // AI message - positioned on the left
            messageDiv.innerHTML = `
                <div class="avatar ai-avatar">AI</div>
                <div class="chat-bubble ai-message p-4">
                    <div class="markdown-body">${renderMarkdown(message)}</div>
                </div>
            `;
        }

        chatMessages.appendChild(messageDiv);

        // Highlight code blocks in the new message
        messageDiv.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });

        // Scroll to bottom
        const chatContainer = document.querySelector('.chat-container');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function handleSend() {
        const message = userInput.value.trim();
        if (!message) return;

        userInput.disabled = true;
        sendBtn.disabled = true;

        addMessage(message, true);
        userInput.value = '';

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'flex items-start gap-3';
        loadingDiv.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">AI</div>
            <div class="bg-white p-4 rounded-lg shadow-md max-w-[80%] animate-pulse">
                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
        `;
        chatMessages.appendChild(loadingDiv);

        // Scroll to bottom after adding loading indicator
        const chatContainer = document.querySelector('.chat-container');
        chatContainer.scrollTop = chatContainer.scrollHeight;

        try {
            const response = await callGroqAPI(message);
            chatMessages.removeChild(loadingDiv);
            addMessage(response);
        } catch (error) {
            chatMessages.removeChild(loadingDiv);
            addMessage('Sorry, there was an error connecting to the AI service. Please try again later.');
        } finally {
            userInput.disabled = false;
            userInput.focus();

            // Final scroll to ensure bottom alignment
            requestAnimationFrame(() => {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            });
        }
    }

    sendBtn.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
});