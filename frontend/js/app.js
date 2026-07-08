/* app.js — Bootstrap, tab switching, analyze (Gemini version) */

const Toast = (() => {
  let _t = null;
  function show(msg, type='') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast show' + (type ? ' ' + type : '');
    if (_t) clearTimeout(_t);
    _t = setTimeout(() => el.classList.remove('show'), 3000);
  }
  return { show };
})();

const App = (() => {
  const TIPS = [
    'Checking your code…',
    'Finding mistakes…',
    'Estimating complexity…',
    'Generating optimized code…',
    'Building your roadmap…'
  ];

  function init() {
    Editor.init();
    Auth.init();
    const token = localStorage.getItem('cs_token');
    if (token) {
      document.getElementById('splash').style.display = 'none';
      document.getElementById('app').style.display    = 'block';
    }
  }

  function switchTab(tab) {
    ['review','history','progress'].forEach(t => {
      document.getElementById('tab-'+t).style.display   = 'none';
      document.getElementById('htab-'+t).classList.remove('active');
    });
    document.getElementById('tab-'+tab).style.display = 'block';
    document.getElementById('htab-'+tab).classList.add('active');
    if (tab === 'progress') Progress.loadAndRender();
    if (tab === 'history')  Progress.loadHistory();
  }

  async function doAnalyze() {
    const code = Editor.getCode();
    const lang = Editor.getLang();
    if (!code) { Toast.show('Please paste some code first!', 'err'); return; }

    if (!Auth.isLoggedIn()) {
      Toast.show('Sign in to save your review history!');
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
        // Use backend (saves to DB, manages streak)
        const data = await Api.analyze(code, lang);
        result = data.result;
        const stats = await Api.stats().catch(() => null);
        if (stats) document.getElementById('streak-num').textContent = stats.currentStreak || 0;
      } else {
        // Guest mode — calls backend but without saving
        result = await _guestAnalyze(code, lang);
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

  // Guest: use Gemini directly from browser (no persistence)
  async function _guestAnalyze(code, lang) {
    // Call our backend guest endpoint instead
    const res = await fetch('/api/review/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language: lang })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Analysis failed');
    return data.result;
  }

  function onLogin() {
    document.getElementById('splash').style.display = 'none';
    document.getElementById('app').style.display    = 'block';
  }

  function onLogout() {
    Results.clear();
  }

  return { init, switchTab, doAnalyze, onLogin, onLogout };
})();

function switchTab(t) { App.switchTab(t); }
function doAnalyze()  { App.doAnalyze(); }

document.addEventListener('DOMContentLoaded', () => App.init());
