// Auto-resize input box like Gemini
const textarea = document.getElementById('userInput');
const chatContainer = document.getElementById('chatContainer');
const sendBtn = document.getElementById('sendBtn');

// --- CHAT HISTORY, PIN & AUTO-RENAME STATE ---
const STORAGE_KEY = 'velox_ai_chat_sessions_v1';
let sessions = loadSessions();
let activeSessionId = sessions.length > 0 ? sessions[0].id : createNewSessionObject();
let selectedActionSessionId = null;

function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(s => ({ ...s, pinned: Boolean(s.pinned) })) : [];
  } catch {
    return [];
  }
}

function saveSessions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error('History save error:', err);
  }
}

function createNewSessionObject() {
  const newSession = {
    id: 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    title: 'Current Session',
    pinned: false,
    messages: [],
    updatedAt: Date.now()
  };
  sessions.unshift(newSession);
  saveSessions();
  return newSession.id;
}

function getActiveSession() {
  let session = sessions.find(s => s.id === activeSessionId);
  if (!session) {
    activeSessionId = createNewSessionObject();
    session = sessions.find(s => s.id === activeSessionId);
  }
  return session;
}

function generateAutoTitle(text) {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'New Chat';
  const words = cleaned.split(' ').slice(0, 5).join(' ');
  return words.length > 36 ? words.slice(0, 36).trim() + '...' : words;
}

function getWelcomeHtml() {
  return `
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
}

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

  processed = escapeHtml(processed);

  processed = processed.replace(/`([^`\n]+)`/g, (_, inlineCode) => {
    return `<code style="background: #2b2c2f; color: #a8c7fa; padding: 2px 6px; border-radius: 6px; font-family: monospace; font-size: 13px;">${inlineCode}</code>`;
  });

  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong style="color: #ffffff; font-weight: 600;">$1</strong>');
  processed = processed.replace(/\n/g, '<br>');
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

function appendUserBubble(messageText) {
  const userBubble = document.createElement('div');
  userBubble.style.cssText = "margin: 16px 0; display: flex; justify-content: flex-end;";
  userBubble.innerHTML = `
    <div style="background: #2b2c2f; color: #fff; padding: 12px 18px; border-radius: 20px; max-width: 80%; word-break: break-word; font-size: 15px;">
      ${escapeHtml(messageText)}
    </div>
  `;
  chatContainer.appendChild(userBubble);
}

function appendStaticAiBubble(aiReply, isErrorResponse = false) {
  const aiBubble = document.createElement('div');
  aiBubble.style.cssText = "margin: 16px 0; display: flex; align-items: flex-start; gap: 12px;";
  aiBubble.innerHTML = `
    <img src="logo.png" alt="Velox" style="width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px; object-fit: contain;" />
    <div class="ai-content-col" style="flex: 1; max-width: 88%; min-width: 0;">
      <div class="ai-response-text" style="background: transparent; color: ${isErrorResponse ? '#f87171' : '#e3e3e3'}; word-break: break-word; font-size: 15px; line-height: 1.65;">${formatAiMarkdown(aiReply)}</div>
    </div>
  `;
  const contentCol = aiBubble.querySelector('.ai-content-col');
  if (!isErrorResponse) {
    contentCol.appendChild(createActionButtons(aiReply));
  }
  chatContainer.appendChild(aiBubble);
}

// --- LONG PRESS BOTTOM ACTION BAR (RENAME - PIN - SHARE - DELETE) ---
function ensureBottomActionBar() {
  if (document.getElementById('veloxBottomBarOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'veloxBottomBarOverlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0, 0, 0, 0.65);
    display: none; align-items: flex-end; justify-content: center;
    z-index: 9999; backdrop-filter: blur(2px);
  `;

  overlay.innerHTML = `
    <div id="veloxBottomBarSheet" style="
      width: 100%; max-width: 520px; background: #18191c;
      border-top: 1px solid #2f3136; border-radius: 22px 22px 0 0;
      padding: 14px 16px 24px; box-shadow: 0 -10px 35px rgba(0,0,0,0.6);
      color: #e3e3e3;
    ">
      <div style="width: 40px; height: 4px; background: #3c4043; border-radius: 999px; margin: 0 auto 12px;"></div>
      <div id="veloxSheetTitle" style="font-size: 13px; color: #9ca3af; margin-bottom: 12px; padding: 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Chat Options</div>

      <div style="display: flex; flex-direction: column; gap: 6px;">
        <button type="button" id="sheetRenameBtn" style="
          display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;
          background: #222428; color: #e3e3e3; border: 1px solid #2f3136;
          padding: 13px 14px; border-radius: 14px; font-size: 14px; cursor: pointer;
        ">
          <span>✏️</span> <span>Rename</span>
        </button>

        <button type="button" id="sheetPinBtn" style="
          display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;
          background: #222428; color: #e3e3e3; border: 1px solid #2f3136;
          padding: 13px 14px; border-radius: 14px; font-size: 14px; cursor: pointer;
        ">
          <span>📌</span> <span id="sheetPinLabel">Pin</span>
        </button>

        <button type="button" id="sheetShareBtn" style="
          display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;
          background: #222428; color: #a8c7fa; border: 1px solid #2f3136;
          padding: 13px 14px; border-radius: 14px; font-size: 14px; cursor: pointer;
        ">
          <span>📤</span> <span>Share</span>
        </button>

        <button type="button" id="sheetDeleteBtn" style="
          display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;
          background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.35);
          padding: 13px 14px; border-radius: 14px; font-size: 14px; font-weight: 600; cursor: pointer;
        ">
          <span>🗑️</span> <span style="color: #ef4444;">Delete</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeBottomActionBar();
    }
  });

  document.getElementById('sheetRenameBtn')?.addEventListener('click', () => {
    const session = sessions.find(s => s.id === selectedActionSessionId);
    if (!session) return;
    const currentTitle = session.title || 'Current Session';
    const nextTitle = prompt('New chat name:', currentTitle);
    if (nextTitle !== null && nextTitle.trim() !== '') {
      session.title = nextTitle.trim();
      session.updatedAt = Date.now();
      saveSessions();
      renderHistoryList();
    }
    closeBottomActionBar();
  });

  document.getElementById('sheetPinBtn')?.addEventListener('click', () => {
    const session = sessions.find(s => s.id === selectedActionSessionId);
    if (!session) return;
    session.pinned = !session.pinned;
    session.updatedAt = Date.now();
    saveSessions();
    renderHistoryList();
    closeBottomActionBar();
  });

  document.getElementById('sheetShareBtn')?.addEventListener('click', async () => {
    const session = sessions.find(s => s.id === selectedActionSessionId);
    closeBottomActionBar();
    if (!session) return;

    const formattedTranscript = (session.messages || [])
      .map(m => `${m.role === 'user' ? 'You' : 'Velox AI'}: ${m.text}`)
      .join('\n\n');

    const sharePayload = formattedTranscript || session.title || 'Velox AI Chat';

    if (navigator.share) {
      try {
        await navigator.share({
          title: session.title || 'Velox AI Chat',
          text: sharePayload
        });
        return;
      } catch {
        // Fallback to clipboard if share sheet dismissed/unsupported
      }
    }

    try {
      await navigator.clipboard.writeText(sharePayload);
      alert('Chat copied for sharing!');
    } catch {
      alert('Unable to share chat on this device.');
    }
  });

  document.getElementById('sheetDeleteBtn')?.addEventListener('click', () => {
    const targetId = selectedActionSessionId;
    closeBottomActionBar();
    if (targetId) {
      deleteSession(targetId);
    }
  });
}

function openBottomActionBar(sessionId) {
  ensureBottomActionBar();
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return;

  selectedActionSessionId = sessionId;
  const overlay = document.getElementById('veloxBottomBarOverlay');
  const titleEl = document.getElementById('veloxSheetTitle');
  const pinLabel = document.getElementById('sheetPinLabel');

  if (titleEl) titleEl.textContent = session.title || 'Current Session';
  if (pinLabel) pinLabel.textContent = session.pinned ? 'Unpin' : 'Pin';
  if (overlay) overlay.style.display = 'flex';
}

function closeBottomActionBar() {
  const overlay = document.getElementById('veloxBottomBarOverlay');
  if (overlay) overlay.style.display = 'none';
  selectedActionSessionId = null;
}

// Render Chat History List in Sidebar (Pinned first, then recent)
function renderHistoryList() {
  const sidebarEl = document.getElementById('sidebar');
  if (!sidebarEl) return;

  let historyContainer = document.getElementById('chatHistoryList');
  if (!historyContainer) {
    historyContainer = document.createElement('div');
    historyContainer.id = 'chatHistoryList';
    historyContainer.style.cssText = "margin-top: 12px; display: flex; flex-direction: column; gap: 6px; overflow-y: auto; max-height: 65vh; padding-right: 4px; user-select: none; -webkit-user-select: none;";
    sidebarEl.appendChild(historyContainer);
  }

  historyContainer.innerHTML = '';

  const nonEmptySessions = sessions
    .filter(s => s.messages.length > 0 || s.id === activeSessionId)
    .sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) {
        return a.pinned ? -1 : 1;
      }
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

  nonEmptySessions.forEach((session) => {
    const isActive = session.id === activeSessionId;
    const row = document.createElement('div');
    row.style.cssText = `
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      padding: 11px 12px; border-radius: 12px; cursor: pointer;
      background: ${isActive ? '#2b2c2f' : '#1b1c1e'};
      border: 1px solid ${session.pinned ? '#6366f1' : (isActive ? '#4b5563' : '#2b2c2f')};
      color: ${isActive ? '#ffffff' : '#c4c7c5'};
      font-size: 13px; touch-action: pan-y;
    `;

    const titleSpan = document.createElement('span');
    titleSpan.textContent = `${session.pinned ? '📌 ' : ''}${session.title || 'Current Session'}`;
    titleSpan.style.cssText = "flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";

    let pressTimer = null;
    let longPressTriggered = false;

    const startPress = () => {
      longPressTriggered = false;
      clearTimeout(pressTimer);
      pressTimer = setTimeout(() => {
        longPressTriggered = true;
        if (navigator.vibrate) navigator.vibrate(25);
        openBottomActionBar(session.id);
      }, 480);
    };

    const cancelPress = () => {
      clearTimeout(pressTimer);
    };

    row.addEventListener('touchstart', startPress, { passive: true });
    row.addEventListener('touchend', cancelPress);
    row.addEventListener('touchmove', cancelPress, { passive: true });
    row.addEventListener('touchcancel', cancelPress);

    row.addEventListener('mousedown', (e) => {
      if (e.button === 0) startPress();
    });
    row.addEventListener('mouseup', cancelPress);
    row.addEventListener('mouseleave', cancelPress);

    row.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      cancelPress();
      longPressTriggered = true;
      openBottomActionBar(session.id);
    });

    row.addEventListener('click', () => {
      if (longPressTriggered) {
        longPressTriggered = false;
        return;
      }
      switchToSession(session.id);
    });

    row.appendChild(titleSpan);
    historyContainer.appendChild(row);
  });
}

function switchToSession(sessionId) {
  const target = sessions.find(s => s.id === sessionId);
  if (!target) return;

  activeSessionId = target.id;
  chatContainer.innerHTML = '';

  if (!target.messages || target.messages.length === 0) {
    chatContainer.innerHTML = getWelcomeHtml();
  } else {
    target.messages.forEach((msg) => {
      if (msg.role === 'user') {
        appendUserBubble(msg.text);
      } else {
        appendStaticAiBubble(msg.text, Boolean(msg.isError));
      }
    });
  }

  chatContainer.scrollTop = chatContainer.scrollHeight;
  renderHistoryList();
  document.getElementById('sidebar')?.classList.remove('open');
}

function deleteSession(sessionId) {
  sessions = sessions.filter(s => s.id !== sessionId);
  if (sessions.length === 0) {
    activeSessionId = createNewSessionObject();
  } else if (activeSessionId === sessionId) {
    activeSessionId = sessions[0].id;
  }
  saveSessions();
  switchToSession(activeSessionId);
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

  const currentSession = getActiveSession();

  // Auto-rename chat on first user message
  if (currentSession.messages.length === 0 || currentSession.title === 'Current Session') {
    currentSession.title = generateAutoTitle(messageText);
  }
  currentSession.messages.push({ role: 'user', text: messageText });
  currentSession
