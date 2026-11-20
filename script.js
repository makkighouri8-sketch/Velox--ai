// Auto-resize input box like Gemini
const textarea = document.getElementById('userInput');
const chatContainer = document.getElementById('chatContainer');
const sendBtn = document.getElementById('sendBtn');

textarea?.addEventListener('input', () => {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
});

// Helper to prevent HTML injection
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Convert basic Markdown (code blocks, inline code, bold, line breaks) to safe HTML
function formatAiMarkdown(rawText) {
  const codeBlocks = [];

  // Extract fenced code blocks ```lang ... ```
  let processed = String(rawText).replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length;
    const safeLang = escapeHtml((lang || 'code').trim());
    const safeCode = escapeHtml(code.replace(/\n$/, ''));
    codeBlocks.push(`
      <div style="margin: 12px 0; border: 1px solid #3c4043; border-radius: 14px; overflow: hidden; background: #0d0e10;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; background: #1e1f20; border-bottom: 1px solid #2b2c2f; font-size: 12px; color: #c4c7c5;">
          <span style="font-family: monospace; color: #a8c7fa;">${safeLang}</span>
          <button type="button" class="copy-code-btn" data-code-index="${idx}" style="background: #2b2c2f; color: #e3e3e3; border: 1px solid #3c4043; padding: 4px 10px; border-radius: 10px; font-size: 11px; cursor: pointer;">Copy code</button>
        </div>
        <pre style="margin: 0; padding: 14px; overflow-x: auto; font-family: Consolas, Monaco, monospace; font-size: 13px; line-height: 1.5; color: #e3e3e3;"><code>${safeCode}</code></pre>
      </div>
    `);
    return `@@CODEBLOCK_${idx}@@`;
  });

  // Escape remaining text
  processed = escapeHtml(processed);

  // Inline code `...`
  processed = processed.replace(/`([^`\n]+)`/g, (_, inlineCode) => {
    return `<code style="background: #2b2c2f; color: #a8c7fa; padding: 2px 6px; border-radius: 6px; font-family: monospace; font-size: 13px;">${inlineCode}</code>`;
  });

  // Bold **...**
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong style="color: #ffffff; font-weight: 600;">$1</strong>');

  // Newlines to <br>
  processed = processed.replace(/\n/g, '<br>');

  // Restore code blocks
  processed = processed.replace(/@@CODEBLOCK_(\d+)@@/g, (_, idx) => codeBlocks[Number(idx)] || '');

  return processed;
}

// Handle Copy Code button clicks inside code blocks
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.copy-code-btn');
  if (!btn) return;
  const headerBar = btn.closest('div');
  const codeBlockWrapper = headerBar ? headerBar.parentElement : null;
  const codeEl = codeBlockWrapper ? codeBlockWrapper.querySelector('code') : null;
  const codeText = codeEl ? codeEl.textContent : '';
  try {
    await navigator.clipboard.writeText(codeText);
    btn.textContent = 'Copied!';
    setTimeout(() => (btn.textContent = 'Copy code'), 1500);
  } catch {
    btn.textContent = 'Failed';
    setTimeout(() => (btn.textContent = 'Copy code'), 1500);
  }
});

// Create 1-Click Copy & Export (.txt) Buttons for AI Response
function createActionButtons(responseText) {
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'response-actions';
  actionsDiv.style.cssText = "display: flex; align-items: center; gap: 8px; margin-top: 10px; flex-wrap: wrap;";

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.innerHTML = '📋 Copy';
  copyBtn.style.cssText = "background: #1e1f20; color: #c4c7c5; border: 1px solid #3c4043; padding: 6px 12px; border-radius: 14px; font-size: 12px; cursor: pointer;";

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(responseText);
      copyBtn.innerHTML = '✅ Copied';
      setTimeout(() => (copyBtn.innerHTML = '📋 Copy'), 1500);
    } catch {
      const tempArea = document.createElement('textarea');
      tempArea.value = responseText;
      document.body.appendChild(tempArea);
      tempArea.select();
      document.execCommand('copy');
      document.body.removeChild(tempArea);
      copyBtn.innerHTML = '✅ Copied';
      setTimeout(() => (copyBtn.innerHTML = '📋 Copy'), 1500);
    }
  });

  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.innerHTML = '⬇️ Export .txt';
  exportBtn.style.cssText = "background: #1e1f20; color: #a8c7fa; border: 1px solid #3c4043; padding: 6px 12px; border-radius: 14px; font-size: 12px; cursor: pointer;";

  exportBtn.addEventListener('click', () => {
    const blob = new Blob([responseText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `velox-ai-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  actionsDiv.appendChild(copyBtn);
  actionsDiv.appendChild(exportBtn);
  return actionsDiv;
}

// Smooth Typewriter over formatted HTML chunks
function typeFormattedResponse(element, rawText, callback) {
  const formattedHtml = formatAiMarkdown(rawText);
  const tokens = formattedHtml.split(/(<[^>]+>|&[^;\s]+;|\s+)/g).filter(Boolean);
  let idx = 0;
  element.innerHTML = '';

  const stepSize = tokens.length > 180 ? 6 : 2;

  function tick() {
    if (idx < tokens.length) {
      element.innerHTML += tokens.slice(idx, idx + stepSize).join('');
      idx += stepSize;
      chatContainer.scrollTop = chatContainer.scrollHeight;
      setTimeout(tick, 14);
    } else {
      element.innerHTML = formattedHtml;
      chatContainer.scrollTop = chatContainer.scrollHeight;
      if (typeof callback === 'function') callback();
    }
  }
  tick();
}

// Send Message Functionality via Secure Vercel Backend Proxy
async function handleSendMessage() {
  const messageText = textarea.value.trim();
  if (!messageText) return;

  if (sendBtn) sendBtn.disabled = true;

  const welcomeScreen = chatContainer.querySelector('.welcome-screen');
  if (welcomeScreen) {
    welcomeScreen.style.display = 'none';
  }

  // User message bubble
  const userBubble = document.createElement('div');
  userBubble.style.cssText = "margin: 16px 0; display: flex; justify-content: flex-end;";
  userBubble.innerHTML = `
    <div style="background: #2b2c2f; color: #fff; padding: 12px 18px; border-radius: 20px; max-width: 80%; word-break: break-word; font-size: 15px;">
      ${escapeHtml(messageText)}
    </div>
  `;
  chatContainer.appendChild(userBubble);

  textarea.value = '';
  textarea.style.height = 'auto';
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // Thinking state
  const aiBubble = document.createElement('div');
  aiBubble.className = 'thinking-container';
  aiBubble.style.cssText = "margin: 16px 0; display: flex; align-items: flex-start; gap: 12px;";
  aiBubble.innerHTML = `
    <img src="logo.png" alt="Velox" style="width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px; object-fit: contain;" />
    <span style="opacity: 0.65; animation: pulseGlow 1s infinite alternate; color: #e3e3e3; font-size: 15px;">Velox is thinking...</span>
  `;
  chatContainer.appendChild(aiBubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    const response = await fetch('/api/', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: messageText })
    });

    const data = await response.json();
    const aiReply = data.reply || data.error || "Maaf kijiyega, response hasil karne mein masla hua.";
    const isErrorResponse = Boolean(data.error) || !response.ok;

    aiBubble.className = '';
    aiBubble.style.cssText = "margin: 16px 0; display: flex; align-items: flex-start; gap: 12px;";
    aiBubble.innerHTML = `
      <img src="logo.png" alt="Velox" style="width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px; object-fit: contain;" />
      <div class="ai-content-col" style="flex: 1; max-width: 88%; min-width: 0;">
        <div class="ai-response-text" style="background: transparent; color: ${isErrorResponse ? '#f87171' : '#e3e3e3'}; word-break: break-word; font-size: 15px; line-height: 1.65;"></div>
      </div>
    `;

    const contentCol = aiBubble.querySelector('.ai-content-col');
    const textTarget = aiBubble.querySelector('.ai-response-text');

    typeFormattedResponse(textTarget, aiReply, () => {
      if (!isErrorResponse) {
        contentCol.appendChild(createActionButtons(aiReply));
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
      if (sendBtn) sendBtn.disabled = false;
    });

  } catch (error) {
    console.error("Fetch Error:", error);
    aiBubble.className = '';
    aiBubble.style.cssText = "margin: 16px 0; display: flex; align-items: flex-start; gap: 12px;";
    aiBubble.innerHTML = `
      <img src="logo.png" alt="Velox" style="width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px; object-fit: contain;" />
      <div style="background: transparent; color: #f87171; max-width: 85%; word-break: break-word; font-size: 15px; line-height: 1.5;">
        Connection error! Please check your network or server configuration.
      </div>
    `;
    chatContainer.scrollTop = chatContainer.scrollHeight;
    if (sendBtn) sendBtn.disabled = false;
  }
}

// Quick Action Chips Logic (Auto-Send Enabled)
document.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (chip) {
    const promptText = chip.getAttribute('data-prompt');
    if (textarea && sendBtn && promptText) {
      textarea.value = promptText;
      sendBtn.click();
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
sendBtn?.addEventListener('click', handleSendMessage);

textarea?.addEventListener('keydown', (e) => {
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

document.addEventListener('click', (e) => {
  if (sidebar && sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== sidebarToggleBtn) {
    sidebar.classList.remove('open');
  }
});

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
    
