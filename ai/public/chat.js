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
            if (!response.ok) throw new Error(data.error?.message || 'API Error');
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error:', error);
            return `Error: ${error.message}`;
        }
    }

    function renderMarkdown(content) {
        const rawHtml = marked.parse(content);
        return DOMPurify.sanitize(rawHtml);
    }



    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`;

        const messageContent = isUser ?
            `<div class="text-white">${message}</div>` :
            `<div class="text-gray-700 markdown-body">${renderMarkdown(message)}</div>`;

        messageDiv.innerHTML = `
            <div class="w-8 h-8 rounded-full ${isUser ? 'bg-green-500' : 'bg-blue-500'} flex items-center justify-center text-white">
                ${isUser ? 'YOU' : 'AI'}
            </div>
            <div class="${isUser ? 'bg-blue-500 user-message' : 'bg-white ai-message'} p-4 rounded-lg shadow-md max-w-[80%]">
                ${messageContent}
            </div>
        `;

        // Add new message to the bottom
        chatMessages.appendChild(messageDiv);

        const chatContainer = document.querySelector('.chat-container');

        const isNearBottom = chatContainer.scrollHeight - chatContainer.clientHeight - chatContainer.scrollTop < 100;

        if (isNearBottom) {
            requestAnimationFrame(() => {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            });
        }
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
            addMessage(error.toString());
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
