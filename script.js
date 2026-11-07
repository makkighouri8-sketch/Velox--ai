// Auto-resize input box like Gemini
const textarea = document.getElementById('userInput');
const chatContainer = document.getElementById('chatContainer');
const sendBtn = document.getElementById('sendBtn');

// Gemini Model Configuration (Fastest model for chat)
const GEMINI_MODEL = "gemini-2.5-flash"; 

// NOTE: Agar aapne Vercel environment variable mein GEMINI_API_KEY di hai 
// aur static frontend build use kar rahe hain, toh yahan apni key string mein daal dein 
// ya Vercel build injection use karein. (Yahan apni key rakh lein ya test ke liye paste kar dein)
const GEMINI_API_KEY = "YAHAN_APNI_API_KEY_PASTE_KARO"; 

textarea.addEventListener('input', () => {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
});

// Helper to prevent HTML injection
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Send Message Functionality with Real Gemini API Integration
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

  // AI Thinking State (Using CSS class for perfect size and alignment)
  const aiBubble = document.createElement('div');
  aiBubble.className = 'thinking-container';
  aiBubble.innerHTML = `
    <img src="logo.png" class="rotating-icon" />
    <span>Velox is thinking...</span>
  `;
  chatContainer.appendChild(aiBubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    // Real Gemini API Request with gemini-2.5-flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: messageText }]
          }
        ]
      })
    });

    const data = await response.json();
    
    let aiReply = "Maaf kijiyega, response hasil karne mein masla hua.";
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      aiReply = data.candidates[0].content.parts[0].text;
    } else if (data.error) {
      aiReply = "API Error: " + data.error.message;
    }

    // Thinking state ko real AI response se replace karo
    aiBubble.className = '';
    aiBubble.style.cssText = "margin: 16px 0; display: flex; align-items: flex-start; gap: 12px;";
    aiBubble.innerHTML = `
      <img src="logo.png" style="width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px; object-fit: contain;" />
      <div style="background: transparent; color: #e3e3e3; max-width: 80%; word-break: break-word; font-size: 15px; line-height: 1.5;">
        ${escapeHtml(aiReply)}
      </div>
    `;
    chatContainer.scrollTop = chatContainer.scrollHeight;

  } catch (error) {
    console.error("Fetch Error:", error);
    aiBubble.className = '';
    aiBubble.style.cssText = "margin: 16px 0; display: flex; align-items: flex-start; gap: 12px;";
    aiBubble.innerHTML = `
      <img src="logo.png" style="width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px; object-fit: contain;" />
      <div style="background: transparent; color: #f87171; max-width: 80%; word-break: break-word; font-size: 15px; line-height: 1.5;">
        Connection error! Please check your network or API key configuration.
      </div>
    `;
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

// Event listeners for send button and Enter key
sendBtn.button?.addEventListener?.('click', async () => {});
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
      
