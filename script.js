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

// Typewriter Effect Helper Function with Neon Glow
function typeWriter(element, text, speed = 12, callback) {
  let i = 0;
  element.textContent = ""; // Clear initial text
  
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      chatContainer.scrollTop = chatContainer.scrollHeight;
      i++;
      setTimeout(type, speed);
    } else if (typeof callback === 'function') {
      callback();
    }
  }
  type();
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

  // AI Thinking State
  const aiBubble = document.createElement('div');
  aiBubble.className = 'thinking-container';
  aiBubble.style.cssText = "margin: 16px 0; display: flex; align-items: flex-start; gap: 12px;";
  aiBubble.innerHTML = `
    <img src="logo.png" style="width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px; object-fit: contain;" />
    <span style="opacity: 0.5; animation: pulseGlow 1s infinite alternate; color: #e3e3e3; font-size: 15px;">Velox is thinking...</span>
  `;
  chatContainer.appendChild(aiBubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    // Requesting secure backend proxy
    const response = await fetch('/api/', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: messageText })
    });

    const data = await response.json();
    let aiReply = data.reply || data.error || "Maaf kijiyega, response hasil karne mein masla hua.";

    // Thinking state ko hata kar clean message container banao with typewriter target
    aiBubble.className = '';
    aiBubble.style.cssText = "margin: 16px 0; display: flex; align-items: flex-start; gap: 12px;";
    aiBubble.innerHTML = `
      <img src="logo.png" style="width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px; object-fit: contain;" />
      <div class="ai-response-text" style="background: transparent; color: #e3e3e3; max-width: 80%; word-break: break-word; font-size: 15px; line-height: 1.6; white-space: pre-wrap; text-shadow: 0 0 10px rgba(168, 85, 247, 0.15);"></div>
    `;
    
    const textTarget = aiBubble.querySelector('.ai-response-text');
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Typewriter effect trigger karo
    typeWriter(textTarget, aiReply);

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

// Quick Action Chips Logic (Auto-Send Enabled)
document.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (chip) {
    const promptText = chip.getAttribute('data-prompt');
    if (userInput && sendBtn && promptText) {
      userInput.value = promptText;
      sendBtn.click(); // Direct message send kar dega
    }
  }
});

// Dynamic CSS injection for glowing pulse animation
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
  @keyframes pulseGlow {
    0% { opacity: 0.3; }
    100% { opacity: 0.8; }
  }
`;
document.head.appendChild(styleSheet);

// Event listeners for send button and Enter key
sendBtn.addEventListener('click', handleSendMessage);

textarea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
});

// --- MODERN SIDEBAR & HISTORY MANAGEMENT ---
const sidebar = document.getElementById('sidebar');
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
const newChatBtn = document.getElementById('newChatBtn');

sidebarToggleBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  sidebar?.classList.toggle('open');
});

sidebarCloseBtn?.addEventListener('click', () => {
  sidebar?.classList.remove('open');
});

// Close sidebar when clicking outside on mobile/desktop
document.addEventListener('click', (e) => {
  if (sidebar && sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== sidebarToggleBtn) {
    sidebar.classList.remove('open');
  }
});

// New Chat Reset Logic
newChatBtn?.addEventListener('click', () => {
  chatContainer.innerHTML = `
    <div class="welcome-screen" id="welcomeScreen">
      <h1>Hello, Jamshed</h1>
      <p>How can Velox help you today?</p>
      <div class="quick-chips">
        <button class="chip" data-prompt="Write a clean, modern Python Flask API script">
          <i class="fa-solid fa-code"></i> Write Python Code
        </button>
        <button class="chip" data-prompt="Give me 5 futuristic neon logo ideas for my tech brand">
          <i class="fa-solid fa-wand-magic-sparkles"></i> Neon Logo Ideas
        </button>
        <button class="chip" data-prompt="Debug this JavaScript code and explain the fix">
          <i class="fa-solid fa-bug"></i> Fix My Script
        </button>
        <button class="chip" data-prompt="Draft a professional freelance proposal for a web app">
          <i class="fa-solid fa-rocket"></i> Client Proposal
        </button>
      </div>
    </div>
  `;
  sidebar?.classList.remove('open');
});

// Plus Icon Dropdown Toggle
const plusBtn = document.getElementById('plusBtn');
const plusDropdown = document.getElementById('plusDropdown');

plusBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  plusDropdown?.classList.toggle('active');
});

document.addEventListener('click', () => {
  if (plusDropdown) plusDropdown.classList.remove('active');
});

// Voice-to-Text (Speech Recognition)
const micBtn = document.getElementById('micBtn');

if (micBtn && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
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
} else if (micBtn) {
  micBtn.style.display = 'none';
}

// Camera Action Example
document.getElementById('cameraBtn')?.addEventListener('click', async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
    alert("Camera access granted!");
  } catch (err) {
    alert("Camera access denied or not supported.");
  }
});
  
