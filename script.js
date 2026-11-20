(function () {
  const textarea = document.getElementById('userInput');
  const chatContainer = document.getElementById('chatContainer');
  const sendBtn = document.getElementById('sendBtn');

  const STORAGE_KEY = 'velox_ai_chat_sessions_v1';
  let sessions = [];
  let activeSessionId = '';
  let selectedActionSessionId = null;

  function safeGetStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map(s => ({ ...s, pinned: Boolean(s.pinned) })) : [];
    } catch {
      return [];
    }
  }

  function safeSetStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {}
  }

  function createNewSessionObject() {
    const id = 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const obj = { id, title: 'Current Session', pinned: false, messages: [], updatedAt: Date.now() };
    sessions.unshift(obj);
    safeSetStorage();
    return id;
  }

  function getActiveSession() {
    let s = sessions.find(item => item.id === activeSessionId);
    if (!s) {
      activeSessionId = createNewSessionObject();
      s = sessions.find(item => item.id === activeSessionId);
    }
    return s;
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
          <button type="button" class="chip" data-prompt="Write a clean, modern Python Flask API script">
            <i class="fa-solid fa-code"></i> Write Python Code
          </button>
          <button type="button" class="chip" data-prompt="Give me 5 futuristic neon logo ideas for my tech brand">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Neon Logo Ideas
          </button>
          <button type="button" class="chip" data-prompt="Debug this JavaScript code and explain the fix">
            <i class="fa-solid fa-bug"></i> Fix My Script
          </button>
          <button type="button" class="chip" data-prompt="Draft a professional freelance proposal for a web app">
            <i class="fa-solid fa-rocket"></i> Client Proposal
          </button>
        </div>
      </div>
    `;
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatAiMarkdown(rawText) {
    const codeBlocks = [];
    let processed = String(rawText || '').replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, function (_, lang, code) {
      const idx = codeBlocks.length;
      const safeLang = escapeHtml((lang || 'code').trim());
      const safeCode = escapeHtml(String(code || '').replace(/\n$/, ''));
      codeBlocks.push(
        '<div style="margin:12px 0;border:1px solid #3c4043;border-radius:14px;overflow:hidden;background:#0d0e10;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 14px;background:#1e1f20;border-bottom:1px solid #2b2c2f;font-size:12px;color:#c4c7c5;">' +
            '<span style="font-family:monospace;color:#a8c7fa;">' + safeLang + '</span>' +
            '<button type="button" class="copy-code-btn" style="background:#2b2c2f;color:#e3e3e3;border:1px solid #3c4043;padding:4px 10px;border-radius:10px;font-size:11px;cursor:pointer;">Copy code</button>' +
          '</div>' +
          '<pre style="margin:0;padding:14px;overflow-x:auto;font-family:monospace;font-size:13px;line-height:1.5;color:#e3e3e3;"><code>' + safeCode + '</code></pre>' +
        '</div>'
      );
      return '@@CODEBLOCK_' + idx + '@@';
    });

    processed = escapeHtml(processed);
    processed = processed.replace(/`([^`\n]+)`/g, '<code style="background:#2b2c2f;color:#a8c7fa;padding:2px 6px;border-radius:6px;font-family:monospace;font-size:13px;">$1</code>');
    processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#ffffff;font-weight:600;">$1</strong>');
    processed = processed.replace(/\n/g, '<br>');
    processed = processed.replace(/@@CODEBLOCK_(\d+)@@/g, function (_, idx) {
      return codeBlocks[Number(idx)] || '';
    });

    return processed;
  }

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }

  function createActionButtons(responseText) {
    const actionsDiv = document.createElement('div');
    actionsDiv.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap;';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.textContent = '📋 Copy';
    copyBtn.style.cssText = 'background:#1e1f20;color:#c4c7c5;border:1px solid #3c4043;padding:6px 12px;border-radius:14px;font-size:12px;cursor:pointer;';
    copyBtn.addEventListener('click', async function () {
      const ok = await copyToClipboard(responseText);
      copyBtn.textContent = ok ? '✅ Copied' : '⚠️ Failed';
      setTimeout(function () { copyBtn.textContent = '📋 Copy'; }, 1500);
    });

    const exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.textContent = '⬇️ Export .txt';
    exportBtn.style.cssText = 'background:#1e1f20;color:#a8c7fa;border:1px solid #3c4043;padding:6px 12px;border-radius:14px;font-size:12px;cursor:pointer;';
    exportBtn.addEventListener('click', function () {
      try {
        const blob = new Blob([responseText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'velox-ai-' + Date.now() + '.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {}
    });

    actionsDiv.appendChild(copyBtn);
    actionsDiv.appendChild(exportBtn);
    return actionsDiv;
  }

  function appendUserBubble(messageText) {
    if (!chatContainer) return;
    const div = document.createElement('div');
    div.style.cssText = 'margin:16px 0;display:flex;justify-content:flex-end;';
    div.innerHTML = '<div style="background:#2b2c2f;color:#fff;padding:12px 18px;border-radius:20px;max-width:80%;word-break:break-word;font-size:15px;">' + escapeHtml(messageText) + '</div>';
    chatContainer.appendChild(div);
  }

  function appendStaticAiBubble(aiReply, isErrorResponse) {
    if (!chatContainer) return;
    const div = document.createElement('div');
    div.style.cssText = 'margin:16px 0;display:flex;align-items:flex-start;gap:12px;';
    div.innerHTML =
      '<img src="logo.png" alt="Velox" style="width:24px;height:24px;flex-shrink:0;margin-top:2px;object-fit:contain;" />' +
      '<div class="ai-content-col" style="flex:1;max-width:88%;min-width:0;">' +
        '<div style="background:transparent;color:' + (isErrorResponse ? '#f87171' : '#e3e3e3') + ';word-break:break-word;font-size:15px;line-height:1.65;">' + formatAiMarkdown(aiReply) + '</div>' +
      '</div>';
    const col = div.querySelector('.ai-content-col');
    if (!isErrorResponse && col) {
      col.appendChild(createActionButtons(aiReply));
    }
    chatContainer.appendChild(div);
  }

  function ensureBottomActionBar() {
    if (document.getElementById('veloxBottomBarOverlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'veloxBottomBarOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);display:none;align-items:flex-end;justify-content:center;z-index:9999;';
    overlay.innerHTML =
      '<div style="width:100%;max-width:520px;background:#18191c;border-top:1px solid #2f3136;border-radius:22px 22px 0 0;padding:14px 16px 24px;color:#e3e3e3;">' +
        '<div style="width:40px;height:4px;background:#3c4043;border-radius:999px;margin:0 auto 12px;"></div>' +
        '<div id="veloxSheetTitle" style="font-size:13px;color:#9ca3af;margin-bottom:12px;padding:0 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Chat Options</div>' +
        '<div style="display:flex;flex-direction:column;gap:6px;">' +
          '<button type="button" id="sheetRenameBtn" style="display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:#222428;color:#e3e3e3;border:1px solid #2f3136;padding:13px 14px;border-radius:14px;font-size:14px;cursor:pointer;">✏️ <span>Rename</span></button>' +
          '<button type="button" id="sheetPinBtn" style="display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:#222428;color:#e3e3e3;border:1px solid #2f3136;padding:13px 14px;border-radius:14px;font-size:14px;cursor:pointer;">📌 <span id="sheetPinLabel">Pin</span></button>' +
          '<button type="button" id="sheetShareBtn" style="display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:#222428;color:#a8c7fa;border:1px solid #2f3136;padding:13px 14px;border-radius:14px;font-size:14px;cursor:pointer;">📤 <span>Share</span></button>' +
          '<button type="button" id="sheetDeleteBtn" style="display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:rgba(239,68,68,0.12);color:#ef4444;border:1px solid rgba(239,68,68,0.35);padding:13px 14px;border-radius:14px;font-size:14px;font-weight:600;cursor:pointer;">🗑️ <span style="color:#ef4444;">Delete</span></button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeBottomActionBar();
    });

    document.getElementById('sheetRenameBtn').addEventListener('click', function () {
      const s = sessions.find(item => item.id === selectedActionSessionId);
      closeBottomActionBar();
      if (!s) return;
      const next = prompt('New chat name:', s.title || 'Current Session');
      if (next && next.trim()) {
        s.title = next.trim();
        s.updatedAt = Date.now();
        safeSetStorage();
        renderHistoryList();
      }
    });

    document.getElementById('sheetPinBtn').addEventListener('click', function () {
      const s = sessions.find(item => item.id === selectedActionSessionId);
      closeBottomActionBar();
      if (!s) return;
      s.pinned = !s.pinned;
      s.updatedAt = Date.now();
      safeSetStorage();
      renderHistoryList();
    });

    document.getElementById('sheetShareBtn').addEventListener('click', async function () {
      const s = sessions.find(item => item.id === selectedActionSessionId);
      closeBottomActionBar();
      if (!s) return;
      const text = (s.messages || []).map(m => (m.role === 'user' ? 'You: ' : 'Velox AI: ') + m.text).join('\n\n') || s.title;
      try {
        if (navigator.share) {
          await navigator.share({ title: s.title, text: text });
          return;
        }
      } catch {}
      const ok = await copyToClipboard(text);
      alert(ok ? 'Chat copied!' : 'Share not supported.');
    });

    document.getElementById('sheetDeleteBtn').addEventListener('click', function () {
      const targetId = selectedActionSessionId;
      closeBottomActionBar();
      if (targetId) deleteSession(targetId);
    });
  }

  function openBottomActionBar(sessionId) {
    ensureBottomActionBar();
    const s = sessions.find(item => item.id === sessionId);
    if (!s) return;
    selectedActionSessionId = sessionId;
    const overlay = document.getElementById('veloxBottomBarOverlay');
    const titleEl = document.getElementById('veloxSheetTitle');
    const pinLabel = document.getElementById('sheetPinLabel');
    if (titleEl) titleEl.textContent = s.title || 'Current Session';
    if (pinLabel) pinLabel.textContent = s.pinned ? 'Unpin' : 'Pin';
    if (overlay) overlay.style.display = 'flex';
  }

  function closeBottomActionBar() {
    const overlay = document.getElementById('veloxBottomBarOverlay');
    if (overlay) overlay.style.display = 'none';
    selectedActionSessionId = null;
  }

  function renderHistoryList() {
    const sidebarEl = document.getElementById('sidebar');
    if (!sidebarEl) return;

    let box = document.getElementById('chatHistoryList');
    if (!box) {
      box = document.createElement('div');
      box.id = 'chatHistoryList';
      box.style.cssText = 'margin-top:12px;display:flex;flex-direction:column;gap:6px;overflow-y:auto;max-height:65vh;padding-right:4px;user-select:none;-webkit-user-select:none;';
      sidebarEl.appendChild(box);
    }
    box.innerHTML = '';

    const list = sessions
      .filter(s => (s.messages && s.messages.length > 0) || s.id === activeSessionId)
      .sort(function (a, b) {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });

    list.forEach(function (s) {
      const isActive = s.id === activeSessionId;
      const row = document.createElement('div');
      row.style.cssText =
        'display:flex;align-items:center;justify-content:space-between;gap:8px;padding:11px 12px;border-radius:12px;cursor:pointer;' +
        'background:' + (isActive ? '#2b2c2f' : '#1b1c1e') + ';' +
        'border:1px solid ' + (s.pinned ? '#6366f1' : (isActive ? '#4b5563' : '#2b2c2f')) + ';' +
        'color:' + (isActive ? '#ffffff' : '#c4c7c5') + ';font-size:13px;touch-action:pan-y;';

      const titleSpan = document.createElement('span');
      titleSpan.textContent = (s.pinned ? '📌 ' : '') + (s.title || 'Current Session');
      titleSpan.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      row.appendChild(titleSpan);

      let timer = null;
      let longPressed = false;

      function startHold() {
        longPressed = false;
        clearTimeout(timer);
        timer = setTimeout(function () {
          longPressed = true;
          try { if (navigator.vibrate) navigator.vibrate(25); } catch {}
          openBottomActionBar(s.id);
        }, 480);
      }

      function cancelHold() {
        clearTimeout(timer);
      }

      row.addEventListener('touchstart', startHold, { passive: true });
      row.addEventListener('touchend', cancelHold);
      row.addEventListener('touchmove', cancelHold, { passive: true });
      row.addEventListener('touchcancel', cancelHold);
      row.addEventListener('mousedown', function (e) { if (e.button === 0) startHold(); });
      row.addEventListener('mouseup', cancelHold);
      row.addEventListener('mouseleave', cancelHold);
      row.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        cancelHold();
        longPressed = true;
        openBottomActionBar(s.id);
      });
      row.addEventListener('click', function () {
        if (longPressed) {
          longPressed = false;
          return;
        }
        switchToSession(s.id);
      });

      box.appendChild(row);
    });
  }

  function switchToSession(sessionId) {
    const target = sessions.find(item => item.id === sessionId);
    if (!target || !chatContainer) return;
    activeSessionId = target.id;
    chatContainer.innerHTML = '';

    if (!target.messages || target.messages.length === 0) {
      chatContainer.innerHTML = getWelcomeHtml();
    } else {
      target.messages.forEach(function (m) {
        if (m.role === 'user') appendUserBubble(m.text);
        else appendStaticAiBubble(m.text, Boolean(m.isError));
      });
    }
    chatContainer.scrollTop = chatContainer.scrollHeight;
    renderHistoryList();
    document.getElementById('sidebar')?.classList.remove('open');
  }

  function deleteSession(sessionId) {
    sessions = sessions.filter(item => item.id !== sessionId);
    if (sessions.length === 0) activeSessionId = createNewSessionObject();
    else if (activeSessionId === sessionId) activeSessionId = sessions[0].id;
    safeSetStorage();
    switchToSession(activeSessionId);
  }

  function typeFormattedResponse(element, rawText, callback) {
    const fullText = String(rawText || '');
    element.style.whiteSpace = 'pre-wrap';
    element.textContent = '';

    let idx = 0;
    let step = 0;
    const chunk = fullText.length > 1500 ? 36 : (fullText.length > 500 ? 18 : 8);

    function tick() {
      if (idx < fullText.length) {
        idx = Math.min(fullText.length, idx + chunk);
        element.textContent = fullText.slice(0, idx);
        step++;
        if (step % 3 === 0 || idx >= fullText.length) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        setTimeout(tick, 18);
      } else {
        element.style.whiteSpace = 'normal';
        element.innerHTML = formatAiMarkdown(fullText);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        if (typeof callback === 'function') callback();
      }
    }
    tick();
  }

  async function handleSendMessage(customPrompt) {
    const rawInput = typeof customPrompt === 'string' ? customPrompt : (textarea ? textarea.value : '');
    const messageText = String(rawInput || '').trim();
    if (!messageText || !chatContainer) return;

    if (sendBtn) sendBtn.disabled = true;

    const currentSession = getActiveSession();
    if (currentSession.messages.length === 0 || currentSession.title === 'Current Session') {
      currentSession.title = generateAutoTitle(messageText);
    }
    currentSession.messages.push({ role: 'user', text: messageText });
    currentSession.updatedAt = Date.now();
    safeSetStorage();
    renderHistoryList();

    const welcome = chatContainer.querySelector('.welcome-screen');
    if (welcome) welcome.style.display = 'none';

    appendUserBubble(messageText);

    if (textarea && typeof customPrompt !== 'string') {
      textarea.value = '';
      textarea.style.height = 'auto';
    }
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const aiBubble = document.createElement('div');
    aiBubble.style.cssText = 'margin:16px 0;display:flex;align-items:flex-start;gap:12px;';
    aiBubble.innerHTML =
      '<img src="logo.png" alt="Velox" style="width:24px;height:24px;flex-shrink:0;margin-top:2px;object-fit:contain;" />' +
      '<span style="opacity:0.65;color:#e3e3e3;font-size:15px;">Velox is thinking...</span>';
    chatContainer.appendChild(aiBubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
      const response = await fetch('/api/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      });
      const data = await response.json();
      const aiReply = data.reply || data.error || 'Maaf kijiyega, response hasil karne mein masla hua.';
      const isErrorResponse = Boolean(data.error) || !response.ok;

      aiBubble.innerHTML =
        '<img src="logo.png" alt="Velox" style="width:24px;height:24px;flex-shrink:0;margin-top:2px;object-fit:contain;" />' +
        '<div class="ai-content-col" style="flex:1;max-width:88%;min-width:0;">' +
          '<div class="ai-response-text" style="background:transparent;color:' + (isErrorResponse ? '#f87171' : '#e3e3e3') + ';word-break:break-word;font-size:15px;line-height:1.65;"></div>' +
        '</
