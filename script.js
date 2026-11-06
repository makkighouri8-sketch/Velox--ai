// Auto-resize input box like Gemini
const textarea = document.getElementById('userInput');
const chatContainer = document.getElementById('chatContainer');
const sendBtn = document.getElementById('sendBtn');

textarea.addEventListener('input', () => {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
});

// Send Message Functionality
function handleSendMessage() {
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

  // Simulate AI response (Aap yahan apni Gemini API laga sakte hain)
  setTimeout(() => {
    const aiBubble = document.createElement('div');
    aiBubble.style.cssText = "margin: 16px 0; display: flex; justify-content: flex-start;";
    aiBubble.innerHTML = `
      <div style="background: transparent; color: #e3e3e3; padding: 12px 0; max-width: 80%; word-break: break-word; font-size: 15px; line-height: 1.5;">
        <b style="color: #a855f7; display: block; margin-bottom: 4px;">Velox AI</b>
        Aapne kaha: "${escapeHtml(messageText)}" — Yeh ek testing response hai. Abhi yahan hum Gemini API connect karenge!
      </div>
    `;
    chatContainer.appendChild(aiBubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }, 1000);
}

// Helper to prevent HTML injection
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
