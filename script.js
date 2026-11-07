// Auto-resize input box like Gemini
const textarea = document.getElementById('userInput');
const chatContainer = document.getElementById('chatContainer');
const sendBtn = document.getElementById('sendBtn');

textarea.addEventListener('input', () => {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
});

// Helper to prevent HTML injection
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Send Message Functionality via Secure Vercel Backend Proxy
async function handleSendMessage() {
  const messageText = textarea.value.trim();
  if (messageText === "") return;

  // Welcome screen hata do jab pehla message bheja jaye
  const welcomeScreen = chatContainer.querySelector('.welcome-screen');
  if (welcomeScreen) {
    welcomeScreen.style.display = 'none';
  }

  // User message bubble create karo
  const userBubble = document.createElement('div');
  userBubble.style.cssText = "margin: 16px 0; display: flex; justify-content: flex-end;";
  userBubble.innerHTML = `
    <div style="background: #2b2c2f; color: #fff; padding: 12px 18px; border-radius: 20px; max-width: 70%; word-break: break-word; font-size: 15px;">
      ${escapeHtml(messageText)}
    </div>
  `;
  chatContainer.appendChild(userBubble);

  // Input clear karo aur height reset karo
  textarea.value = '';
  textarea.style.height = 'auto';
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // AI Invisible Pulsing / Thinking Animation State
  const aiBubble = document.createElement('div');
  aiBubble.className = 'thinking-container';
  aiBubble.innerHTML = `
    <img src="logo.png" class="rotating-icon" />
    <span style="opacity: 0.6; animation: pulse 1.5s infinite;">Velox is thinking...</span>
  `;
  chatContainer.appendChild(aiBubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    // Requesting secure backend proxy (No API key exposed in frontend)
    const response = await fetch('/api/', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: messageText })
    });

    const data = await response.json();
    let aiReply = data.reply || data.error || "Maaf kijiyega, response hasil karne mein masla hua.";

    // Thinking state ko real AI response se aik sath (smoothly) replace karo
    aiBubble.className = '';
    aiBubble.style.cssText = "margin: 16px 0; display: flex; align-items: flex-start; gap: 12px; opacity: 0; transition: opacity 0.4s ease-in;";
    aiBubble.innerHTML = `
      <img src="logo.png" style="width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px; object-fit: contain;" />
      <div style="background: transparent; color: #e3e3e3; max-width: 80%; word-break: break-word; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">
        ${escapeHtml(aiReply)}
      </div>
    `;
    
    // Fade-in smooth transition trigger karo
    setTimeout(() => {
      aiBubble.style.opacity = '1';
    }, 50);

    chatContainer.scrollTop = chatContainer.scrollHeight;

  } catch (error) {
    console.error("Fetch Error:", error);
    aiBubble.className = '';
    aiBubble.style.cssText = "margin: 16px 0; display: flex; align-items: flex-start; gap: 12px;";
    aiBubble.innerHTML = `
      <img src="logo.png" style="width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px; object-fit: contain;" />
      <div style="background: transparent; color: #f87171; max-width: 80%; word-break: break-word; font-size: 15px; line-height: 1.5;">
        Connection error! Please check your network or server configuration.
      </div>
    `;
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

// Event listeners for send button and Enter key
sendBtn.addEventListener('click', handleSendMessage);

textarea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
});

// Plus Icon Dropdown Toggle
const plusBtn = document.getElementById('plusBtn');
const plusDropdown = document.getElementById('plusDropdown');

plusBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  plusDropdown.classList.toggle('active');
});

document.addEventListener('click', () => {
  plusDropdown.classList.remove('active');
});

// Voice-to-Text (Speech Recognition)
const micBtn = document.getElementById('micBtn');

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  micBtn.addEventListener('click', () => {
    micBtn.style.color = '#ef4444';
    recognition.start();
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    textarea.value += transcript;
    micBtn.style.color = '#c4c7c5';
  };

  recognition.onerror = () => { micBtn.style.color = '#c4c7c5'; };
  recognition.onend = () => { micBtn.style.color = '#c4c7c5'; };
} else {
  micBtn.style.display = 'none';
}

// Camera Action Example
document.getElementById('cameraBtn').addEventListener('click', async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
    alert("Camera access granted!");
  } catch (err) {
    alert("Camera access denied or not supported.");
  }
});
      
