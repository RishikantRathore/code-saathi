/* ═════════════════════════════════════════════════════════════
   APP.JS — Application Controller, Resizer & Analysis Pipeline
   ═════════════════════════════════════════════════════════════ */

const Toast = (() => {
  let _t = null;
  function show(msg, type = '') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast show' + (type ? ' ' + type : '');
    if (_t) clearTimeout(_t);
    _t = setTimeout(() => el.classList.remove('show'), 3200);
  }
  return { show };
})();

const App = (() => {
  const TIPS = [
    'Checking your code & syntax…',
    'Analyzing algorithmic bugs…',
    'Estimating Big-O time & space complexity…',
    'Generating optimized solution…',
    'Creating interview questions & roadmap…'
  ];

  function init() {
    Editor.init();
    Auth.init();
    _initResizer();
    _initGlobalShortcuts();

    const token = localStorage.getItem('cs_token');
    if (token) {
      document.getElementById('splash').style.display = 'none';
      document.getElementById('app').style.display = 'block';
    }
  }

  function switchTab(tab) {
    ['review', 'history', 'progress'].forEach(t => {
      document.getElementById('tab-' + t).style.display = 'none';
      document.getElementById('htab-' + t)?.classList.remove('active');
    });
    document.getElementById('tab-' + tab).style.display = 'block';
    document.getElementById('htab-' + tab)?.classList.add('active');
    if (tab === 'progress') Progress.loadAndRender();
    if (tab === 'history') Progress.loadHistory();
  }

  async function doAnalyze() {
    const code = Editor.getCode();
    const lang = Editor.getLang();
    const options = Editor.getOptions();

    if (!code) {
      Toast.show('Please paste or write some code first!', 'err');
      return;
    }

    if (!Auth.isLoggedIn()) {
      Toast.show('Sign in to save reviews & build your streak! 🔥');
    }

    const btn = document.getElementById('analyze-btn');
    btn.disabled = true;
    Results.showLoading(TIPS[0]);

    let tipIdx = 0;
    const tipTimer = setInterval(() => {
      tipIdx = (tipIdx + 1) % TIPS.length;
      Results.setTip(TIPS[tipIdx]);
    }, 1800);

    try {
      let result;

      if (Auth.isLoggedIn()) {
        // Authenticated — saves to DB & tracks streak
        const data = await Api.analyze(code, lang, options);
        result = data.result;
        const stats = await Api.stats().catch(() => null);
        if (stats) document.getElementById('streak-num').textContent = stats.currentStreak || 0;
      } else {
        // Guest mode — uses backend guest route
        result = await _guestAnalyze(code, lang, options);
      }

      clearInterval(tipTimer);
      Results.render(result, lang);
      Toast.show('Analysis complete! ✨', 'ok');

    } catch (err) {
      clearInterval(tipTimer);
      Results.showError(err.message);
      Toast.show(err.message, 'err');
    } finally {
      btn.disabled = false;
    }
  }

  // Guest endpoint call
  async function _guestAnalyze(code, language, options = {}) {
    const res = await fetch('/api/review/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        language,
        mode: options.mode,
        languageStyle: options.languageStyle,
        customInstruction: options.customInstruction
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Analysis failed');
    return data.result;
  }

  // Draggable Split-Pane Resizer
  function _initResizer() {
    const resizer = document.getElementById('layout-resizer');
    const editorCol = document.getElementById('editor-col');
    const layout = document.getElementById('review-layout');
    if (!resizer || !editorCol || !layout) return;

    let isResizing = false;

    resizer.addEventListener('mousedown', e => {
      isResizing = true;
      resizer.classList.add('resizing');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', e => {
      if (!isResizing) return;
      const layoutRect = layout.getBoundingClientRect();
      const newWidth = ((e.clientX - layoutRect.left) / layoutRect.width) * 100;
      if (newWidth >= 20 && newWidth <= 80) {
        editorCol.style.width = newWidth + '%';
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        resizer.classList.remove('resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  }

  // Global Keyboard Shortcuts
  function _initGlobalShortcuts() {
    document.addEventListener('keydown', e => {
      // Escape closes open modals & drawers
      if (e.key === 'Escape') {
        const layout = document.getElementById('review-layout');
        if (layout && layout.classList.contains('editor-expanded')) {
          Editor.toggleFocus();
          return;
        }
        const presetsModal = document.getElementById('presets-modal');
        if (presetsModal && presetsModal.style.display !== 'none') {
          Editor.closePresetsModal();
          return;
        }
        const authModal = document.getElementById('auth-modal');
        if (authModal && authModal.style.display !== 'none') {
          if (window.closeModal) window.closeModal();
          return;
        }
      }

      // Ctrl+T or Cmd+T (while focused on editor) -> new tab
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't' && document.activeElement?.id === 'code-ta') {
        e.preventDefault();
        Editor.addTab();
      }
    });
  }

  function onLogin() {
    document.getElementById('splash').style.display = 'none';
    document.getElementById('app').style.display = 'block';
  }

  function onLogout() {
    Results.clear();
  }

  return { init, switchTab, doAnalyze, onLogin, onLogout };
})();

function switchTab(t) { App.switchTab(t); }
function doAnalyze() { App.doAnalyze(); }

document.addEventListener('DOMContentLoaded', () => App.init());
