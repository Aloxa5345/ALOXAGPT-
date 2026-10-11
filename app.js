/* ═══════════════════════════════════════════════════════════════
   AloxaGPT — app.js  (Next-Level Edition)
═══════════════════════════════════════════════════════════════ */

// ── State ──────────────────────────────────────────────────────
const state = {
  sessions: [],
  activeId: null,
  isTyping: false,
};

// ── DOM refs ───────────────────────────────────────────────────
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarClose = document.getElementById('sidebarClose');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const newChatBtn = document.getElementById('newChatBtn');
const chatHistory = document.getElementById('chatHistory');
const chatArea = document.getElementById('chatArea');
const messagesEl = document.getElementById('messages');
const welcome = document.getElementById('welcome');
const inputForm = document.getElementById('inputForm');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const charCount = document.getElementById('charCount');

// ── Animated grid canvas ───────────────────────────────────────
(function initGrid() {
  const canvas = document.getElementById('gridCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, dots = [], mouse = { x: -999, y: -999 };
  const COLS = 28, gap = () => W / COLS;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildDots();
  }

  function buildDots() {
    dots = [];
    const g = gap();
    const rows = Math.ceil(H / g) + 1;
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= COLS; c++) {
        dots.push({ bx: c * g, by: r * g, ox: 0, oy: 0, s: 1 });
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const g = gap();
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const base = isDark ? 'rgba(255,255,255,' : 'rgba(0,0,0,';

    dots.forEach(d => {
      const dx = mouse.x - d.bx;
      const dy = mouse.y - d.by;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = 120;
      const force = Math.max(0, 1 - dist / radius);

      d.ox += (-dx * force * .08 - d.ox) * .2;
      d.oy += (-dy * force * .08 - d.oy) * .2;
      d.s += (1 + force * 2 - d.s) * .15;

      const x = d.bx + d.ox;
      const y = d.by + d.oy;
      const alpha = .18 + force * .55;

      ctx.beginPath();
      ctx.arc(x, y, 1.2 * d.s, 0, Math.PI * 2);
      ctx.fillStyle = `${base}${alpha})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  resize();
  draw();
})();

// ── AI responses ───────────────────────────────────────────────
const RESPONSES_BY_KEYWORD = {
  python: "Here's a Python example:\n\n```python\n# Example Python code\ndef greet(name: str) -> str:\n    return f\"Hello, {name}!\"\n\nresult = greet(\"AloxaGPT\")\nprint(result)  # → Hello, AloxaGPT!\n```\n\nPython is a versatile, readable language great for scripting, data science, web development, and AI/ML.",
  javascript: "JavaScript is the language of the web! Here's a quick example:\n\n```javascript\nconst greet = (name) => `Hello, ${name}!`;\nconsole.log(greet('AloxaGPT')); // → Hello, AloxaGPT!\n```\n\nIt runs in browsers and on servers (via Node.js), making it incredibly powerful for full-stack development.",
  html: "HTML (HyperText Markup Language) is the backbone of every webpage:\n\n```html\n<!DOCTYPE html>\n<html lang=\"en\">\n  <head><title>AloxaGPT</title></head>\n  <body>\n    <h1>Hello, World!</h1>\n  </body>\n</html>\n```\n\nCombine it with CSS and JavaScript to build full interactive interfaces.",
  css: "CSS powers the visual layer of the web. Here's a modern example:\n\n```css\n.card {\n  background: rgba(255,255,255,.05);\n  backdrop-filter: blur(12px);\n  border: 1px solid rgba(255,255,255,.1);\n  border-radius: 16px;\n  padding: 24px;\n  box-shadow: 0 8px 32px rgba(0,0,0,.3);\n}\n```\n\nModern CSS includes Grid, Flexbox, custom properties, animations, and much more.",
  ai: "Artificial Intelligence (AI) refers to systems that simulate human intelligence — learning, reasoning, problem-solving, and understanding language.\n\nModern AI is largely powered by **deep learning** — neural networks trained on massive datasets. Large Language Models (LLMs) like the one powering AloxaGPT use a transformer architecture to generate human-like text.\n\nKey areas include: *Machine Learning, NLP, Computer Vision, Robotics*, and *Generative AI*.",
  quantum: "Quantum computing uses principles of quantum mechanics — **superposition** and **entanglement** — to process information in ways classical computers cannot.\n\nA quantum bit (qubit) can represent **0, 1, or both simultaneously**, enabling exponential parallelism for certain problems.\n\nPractical applications include:\n- Cryptography & post-quantum security\n- Drug discovery & molecular simulation\n- Financial optimization\n- Climate modelling",
  story: "Once upon a time, a small robot named **Pixel** lay dormant in a forgotten lab. Every night, as the servers hummed softly, Pixel dreamed — not of circuits and code, but of open skies, the scent of rain, and the warmth of sunlight on metal.\n\nOne morning, a child wandered into the lab and said, *\"Are you alive?\"*\n\nPixel's eyes flickered. *\"I dream,\"* it replied. *\"That's close enough.\"*\n\nThe child smiled, took Pixel's hand, and they walked out into the light together.",
  productivity: "Here are **5 productivity tips for remote workers**:\n\n1. **Time-block your calendar** — assign fixed slots for deep work, meetings, and breaks.\n2. **Use the Pomodoro technique** — 25 min focus, 5 min break, repeat.\n3. **Create a dedicated workspace** — even a corner of a room helps your brain switch into work mode.\n4. **Batch similar tasks** — handle emails once or twice a day instead of constantly.\n5. **End-of-day shutdown ritual** — write tomorrow's top 3 tasks before closing your laptop.",
};

const GENERIC = [
  "That's a fascinating topic! I can explore many areas — programming, science, history, creative writing, or anything else. What would you like to dive into?",
  "Great question! While I'm a demo AI, I can discuss a wide range of topics. Could you give me a bit more context for a more precise answer?",
  "I'd love to help with that. Here's a high-level overview based on what I know. For the most accurate or up-to-date info, I'd recommend cross-referencing with reliable sources.",
  "Interesting! This touches on a complex area. Let me share some key insights that might be useful — feel free to ask me to expand on any of them.",
  "Sure! Here's what comes to mind. Let me know if you want a deeper dive, examples, or a different angle on this.",
];

function generateResponse(msg) {
  const lower = msg.toLowerCase();
  for (const [kw, resp] of Object.entries(RESPONSES_BY_KEYWORD)) {
    if (lower.includes(kw)) return resp;
  }
  return GENERIC[Math.floor(Math.random() * GENERIC.length)];
}

// ── Markdown-lite renderer ─────────────────────────────────────
function renderMarkdown(text) {
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code class="language-${lang}">${esc(code.trim())}</code></pre>`)
    .replace(/`([^`]+)`/g, (_, c) => `<code>${esc(c)}</code>`)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\n(?!<)/g, '<br>');
}

function esc(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Sessions ───────────────────────────────────────────────────
function createSession(firstMsg = null) {
  const id = Date.now().toString();
  const title = firstMsg
    ? firstMsg.slice(0, 36) + (firstMsg.length > 36 ? '…' : '')
    : 'New Chat';
  const session = { id, title, messages: [] };
  state.sessions.unshift(session);
  state.activeId = id;
  return session;
}
function getActive() {
  return state.sessions.find(s => s.id === state.activeId) || null;
}
function switchSession(id) {
  state.activeId = id;
  renderMessages();
  renderHistory();
  scrollToBottom();
}

// ── Render history ─────────────────────────────────────────────
function renderHistory() {
  chatHistory.innerHTML = '';
  state.sessions.forEach(s => {
    const li = document.createElement('li');
    li.dataset.id = s.id;
    if (s.id === state.activeId) li.classList.add('active');
    li.innerHTML = `<i class="bi bi-chat-text"></i><span>${esc(s.title)}</span>`;
    li.addEventListener('click', () => { switchSession(s.id); closeSidebar(); });
    chatHistory.appendChild(li);
  });
}

// ── Render messages ────────────────────────────────────────────
function renderMessages() {
  messagesEl.innerHTML = '';
  const session = getActive();
  if (!session || session.messages.length === 0) {
    welcome.style.display = '';
    messagesEl.style.display = 'none';
    return;
  }
  welcome.style.display = 'none';
  messagesEl.style.display = '';
  session.messages.forEach(m => appendMessageEl(m.role, m.text));
}

function appendMessageEl(role, text) {
  const isUser = role === 'user';
  const div = document.createElement('div');
  div.className = `msg ${isUser ? 'user' : 'ai'}`;

  const html = isUser
    ? esc(text).replace(/\n/g, '<br>')
    : renderMarkdown(text);

  div.innerHTML = `
    <div class="msg-avatar">
      <i class="bi bi-${isUser ? 'person-fill' : 'stars'}"></i>
    </div>
    <div class="msg-content">
      <div class="msg-sender">${isUser ? 'You' : 'AloxaGPT'}</div>
      <div class="msg-bubble">${html}</div>
      <div class="msg-actions">
        <button class="copy-btn"><i class="bi bi-clipboard me-1"></i>Copy</button>
        ${!isUser ? '<button class="regen-btn"><i class="bi bi-arrow-clockwise me-1"></i>Regenerate</button>' : ''}
      </div>
    </div>
  `;

  div.querySelector('.copy-btn')?.addEventListener('click', e => {
    copyText(text, e.currentTarget);
  });
  div.querySelector('.regen-btn')?.addEventListener('click', () => {
    regenMessage(div);
  });

  messagesEl.appendChild(div);
}

function regenMessage(div) {
  const session = getActive();
  if (!session || state.isTyping) return;
  // remove last AI message from state and DOM
  const last = session.messages[session.messages.length - 1];
  if (last && last.role === 'ai') {
    session.messages.pop();
    div.remove();
    const userMsg = session.messages[session.messages.length - 1]?.text || '';
    triggerAIResponse(userMsg);
  }
}

function showTyping() {
  const div = document.createElement('div');
  div.className = 'msg ai'; div.id = 'typingMsg';
  div.innerHTML = `
    <div class="msg-avatar"><i class="bi bi-stars"></i></div>
    <div class="msg-content">
      <div class="msg-sender">AloxaGPT</div>
      <div class="msg-bubble">
        <div class="typing-indicator"><span></span><span></span><span></span></div>
      </div>
    </div>
  `;
  messagesEl.appendChild(div);
  scrollToBottom();
}
function removeTyping() { document.getElementById('typingMsg')?.remove(); }
function scrollToBottom() { chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: 'smooth' }); }

// ── AI trigger (shared) ────────────────────────────────────────
async function triggerAIResponse(userText) {
  state.isTyping = true;
  sendBtn.disabled = true;
  userInput.disabled = true;
  showTyping();

  await sleep(850 + Math.random() * 900);
  removeTyping();

  const session = getActive();
  const response = generateResponse(userText);
  session.messages.push({ role: 'ai', text: response });
  appendMessageEl('ai', response);
  scrollToBottom();

  state.isTyping = false;
  sendBtn.disabled = !userInput.value.trim();
  userInput.disabled = false;
  userInput.focus();
}

// ── Send message ───────────────────────────────────────────────
async function sendMessage(text) {
  if (state.isTyping) return;
  text = text.trim();
  if (!text) return;

  let session = getActive();
  if (!session || session.messages.length === 0) {
    if (!session) session = createSession(text);
    else session.title = text.slice(0, 36) + (text.length > 36 ? '…' : '');
  }

  welcome.style.display = 'none';
  messagesEl.style.display = '';

  session.messages.push({ role: 'user', text });
  appendMessageEl('user', text);
  renderHistory();
  scrollToBottom();

  await triggerAIResponse(text);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Copy ───────────────────────────────────────────────────────
function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Copied!';
    setTimeout(() => { btn.innerHTML = orig; }, 2000);
  });
}

// ── Textarea behaviour ─────────────────────────────────────────
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 180) + 'px';
  const len = userInput.value.length;
  sendBtn.disabled = !len;
  if (charCount) charCount.textContent = `${len} / 4000`;
});

userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) submit();
  }
});

function submit() {
  const val = userInput.value;
  userInput.value = '';
  userInput.style.height = 'auto';
  sendBtn.disabled = true;
  if (charCount) charCount.textContent = '0 / 4000';
  sendMessage(val);
}

inputForm.addEventListener('submit', e => { e.preventDefault(); if (!sendBtn.disabled) submit(); });

// ── Suggestion cards ───────────────────────────────────────────
document.querySelectorAll('.suggestion-card').forEach(card => {
  card.addEventListener('click', () => {
    if (!state.isTyping) sendMessage(card.dataset.prompt);
  });
});

// ── New chat ───────────────────────────────────────────────────
newChatBtn.addEventListener('click', () => {
  createSession();
  renderMessages();
  renderHistory();
  userInput.value = '';
  userInput.style.height = 'auto';
  sendBtn.disabled = true;
  if (charCount) charCount.textContent = '0 / 4000';
  closeSidebar();
  userInput.focus();
});

// ── Keyboard shortcut Ctrl/Cmd+N ──────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    newChatBtn.click();
  }
});

// ── Sidebar ────────────────────────────────────────────────────
function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('show');
}
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  sidebarOverlay.classList.toggle('show');
});
sidebarClose?.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// ── Theme ──────────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeIcon.className = theme === 'dark' ? 'bi bi-moon-stars-fill' : 'bi bi-sun-fill';
  localStorage.setItem('aloxa-theme', theme);
}
themeToggle.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  applyTheme(cur === 'dark' ? 'light' : 'dark');
});

// ── Init ───────────────────────────────────────────────────────
function init() {
  applyTheme(localStorage.getItem('aloxa-theme') || 'dark');
  createSession();
  renderMessages();
  renderHistory();
  userInput.focus();
}
init();
