/* ═════════════════════════════════════════════════════════════
   RESULTS.JS — Modern AI Review, Diff Comparison & Voice Mentor
   ═════════════════════════════════════════════════════════════ */

const Results = (() => {
  let _last = null;
  let _currentView = 'report'; // 'report' or 'diff'
  let _isSpeaking = false;
  let _speechUtterance = null;

  function showLoading(tip) {
    _stopAudio();
    document.getElementById('exp-bar').style.display = 'none';
    const topBar = document.getElementById('results-top-bar');
    if (topBar) topBar.style.display = 'none';

    document.getElementById('results-body').innerHTML = `
      <div class="gpt-loading-view">
        <div class="gpt-avatar pulse">
          <i class="ti ti-sparkles"></i>
        </div>
        <div class="gpt-typing-indicator">
          <span></span><span></span><span></span>
        </div>
        <div class="gpt-loading-tip" id="ltip">${esc(tip || 'Code Saathi is reviewing your code…')}</div>
      </div>`;
  }

  function setTip(t) {
    const e = document.getElementById('ltip');
    if (e) e.textContent = t;
  }

  function showError(msg) {
    _stopAudio();
    document.getElementById('exp-bar').style.display = 'none';
    const topBar = document.getElementById('results-top-bar');
    if (topBar) topBar.style.display = 'none';

    document.getElementById('results-body').innerHTML = `
      <div class="gpt-empty-view">
        <div class="gpt-avatar error">
          <i class="ti ti-alert-circle"></i>
        </div>
        <h3 style="color:var(--red); font-size:16px; margin-top:10px;">Analysis Failed</h3>
        <p class="gpt-error-msg" style="color:var(--t2); font-size:13px; max-width:360px; line-height:1.6;">${esc(msg)}</p>
      </div>`;
  }

  function clear() {
    _stopAudio();
    _last = null;
    document.getElementById('exp-bar').style.display = 'none';
    const topBar = document.getElementById('results-top-bar');
    if (topBar) topBar.style.display = 'none';

    document.getElementById('results-body').innerHTML = `
      <div class="gpt-empty-view">
        <div class="gpt-avatar">
          <i class="ti ti-brain"></i>
        </div>
        <h3 style="font-size:16px; margin-top:8px;">Ready to review your code</h3>
        <p style="color:var(--t3); font-size:13px; max-width:340px; line-height:1.6;">
          Paste your code on the left and click <strong>Analyze Code</strong> to get instant feedback, Big-O complexity, optimized code, and interview prep.
        </p>
      </div>`;
  }

  function getLast() { return _last; }

  function render(r, lang) {
    const origCode = Editor.getCode();
    _last = { r, lang, origCode };
    _currentView = 'report';

    const topBar = document.getElementById('results-top-bar');
    if (topBar) topBar.style.display = 'flex';

    _renderReportView();
    document.getElementById('exp-bar').style.display = 'flex';
  }

  function switchView(view) {
    if (!_last) return;
    _currentView = view;

    document.getElementById('rt-tab-report')?.classList.toggle('active', view === 'report');
    document.getElementById('rt-tab-diff')?.classList.toggle('active', view === 'diff');

    if (view === 'report') {
      _renderReportView();
    } else {
      _renderDiffView();
    }
  }

  function _renderReportView() {
    if (!_last) return;
    const { r, lang } = _last;
    const langLower = (lang || 'plaintext').toLowerCase();

    // Score badge colors
    const isHigh = r.score >= 80;
    const isMid = r.score >= 60 && r.score < 80;
    const scColor = isHigh ? 'var(--ac)' : isMid ? 'var(--amb)' : 'var(--red)';
    const scBg = isHigh ? 'var(--acd)' : isMid ? 'var(--ambd)' : 'var(--redd)';
    const scGrad = isHigh ? 'linear-gradient(90deg, #059669, #10b981)' :
      isMid ? 'linear-gradient(90deg, #d97706, #f59e0b)' :
        'linear-gradient(90deg, #dc2626, #f43f5e)';

    // 1. Mistakes list
    const mkHtml = r.mistakes && r.mistakes.length
      ? r.mistakes.map((m, i) => `
        <div class="gpt-callout gpt-callout-warning">
          <div class="gpt-callout-title">
            <i class="ti ti-alert-triangle"></i>
            <span>${esc(m.title)}</span>
          </div>
          <div class="gpt-callout-body">${esc(m.body)}</div>
        </div>`).join('')
      : `<div class="gpt-callout gpt-callout-success">
          <div class="gpt-callout-title">
            <i class="ti ti-circle-check"></i>
            <span>Clean Code — No Major Mistakes Detected!</span>
          </div>
          <div class="gpt-callout-body">Your solution follows good programming practices for this problem.</div>
        </div>`;

    // 2. Syntax Highlighted Optimized Code
    const uid = 'opt-' + Date.now();
    let highlightedCode = '';
    try {
      if (window.hljs) {
        highlightedCode = hljs.highlight(r.optimized_code || '', { language: langLower, ignoreIllegals: true }).value;
      } else {
        highlightedCode = esc(r.optimized_code || '');
      }
    } catch (e) {
      highlightedCode = esc(r.optimized_code || '');
    }

    // 3. Interview Questions
    const qHtml = (r.interview_questions || []).map((q, i) => `
      <div class="gpt-q-item">
        <div class="gpt-q-num">Q${i + 1}</div>
        <div class="gpt-q-text">${esc(q)}</div>
        <button class="gpt-copy-sm" onclick="Results._cpText(${JSON.stringify(q)}, this)" title="Copy question">
          <i class="ti ti-copy"></i>
        </button>
      </div>`).join('');

    // 4. Learning Roadmap
    const rmHtml = (r.roadmap || []).map((s, i) => `
      <div class="gpt-roadmap-item">
        <div class="gpt-rm-step">${i + 1}</div>
        <div class="gpt-rm-content">
          <div class="gpt-rm-title">${esc(s.title)}</div>
          <div class="gpt-rm-desc">${esc(s.desc)}</div>
        </div>
      </div>`).join('');

    // Render ChatGPT-Style Message Container
    document.getElementById('results-body').innerHTML = `
      <div class="gpt-msg-card">
        
        <!-- AI Response Header -->
        <div class="gpt-header">
          <div class="gpt-avatar">
            <i class="ti ti-sparkles"></i>
          </div>
          <div class="gpt-meta">
            <div class="gpt-name">
              Code Saathi <span class="gpt-badge">Gemini AI Review</span>
            </div>
            <div class="gpt-time">${lang} Review · Just now</div>
          </div>
        </div>

        <!-- Section: Overall Score & Summary -->
        <div class="gpt-section gpt-overview">
          <div class="gpt-score-row">
            <div class="gpt-score-badge" style="color:${scColor}; background:${scBg}; border-color:${scColor}">
              <span class="gpt-score-num">${r.score}</span>
              <span class="gpt-score-max">/100</span>
            </div>
            <div class="gpt-score-info">
              <div class="gpt-score-label" style="color:${scColor}">${esc(r.score_label)}</div>
              <div class="gpt-score-bar-wrap">
                <div class="gpt-score-bar" id="scbar" style="width:0%; background:${scGrad}"></div>
              </div>
            </div>
          </div>
          <p class="gpt-summary-text">${esc(r.summary)}</p>
        </div>

        <!-- Section: Mistakes & Diagnostics -->
        <div class="gpt-section">
          <h4 class="gpt-sec-heading"><i class="ti ti-bug" style="color:var(--red)"></i> Issues & Mentor Feedback</h4>
          <div class="gpt-mistakes-list">${mkHtml}</div>
        </div>

        <!-- Section: Complexity Analysis -->
        <div class="gpt-section">
          <h4 class="gpt-sec-heading"><i class="ti ti-chart-dots-3" style="color:var(--cyan)"></i> Big-O Complexity</h4>
          <div class="gpt-cx-chips">
            <div class="gpt-chip gpt-chip-time">
              <i class="ti ti-clock"></i> <strong>Time:</strong> ${esc(r.complexity.time)}
            </div>
            <div class="gpt-chip gpt-chip-space">
              <i class="ti ti-database"></i> <strong>Space:</strong> ${esc(r.complexity.space)}
            </div>
          </div>
          <p class="gpt-cx-desc">${esc(r.complexity.explanation)}</p>
        </div>

        <!-- Section: Optimized Code Block -->
        <div class="gpt-section">
          <h4 class="gpt-sec-heading"><i class="ti ti-code" style="color:var(--ac)"></i> Optimized Solution</h4>
          <div class="gpt-code-box">
            <div class="gpt-code-header">
              <span class="gpt-code-lang">${langLower}</span>
              <button class="gpt-code-copy" onclick="Results._cpOpt('${uid}', this)">
                <i class="ti ti-copy"></i> <span>Copy code</span>
              </button>
            </div>
            <pre class="gpt-code-pre"><code id="${uid}" class="hljs language-${langLower}">${highlightedCode}</code></pre>
          </div>
          ${r.optimization_notes ? `<p class="gpt-opt-notes"><i class="ti ti-info-circle"></i> ${esc(r.optimization_notes)}</p>` : ''}
        </div>

        <!-- Section: Interview Preparation -->
        <div class="gpt-section">
          <h4 class="gpt-sec-heading"><i class="ti ti-help-circle" style="color:var(--blu)"></i> Interview Preparation Questions</h4>
          <div class="gpt-q-list">${qHtml}</div>
        </div>

        <!-- Section: Learning Roadmap -->
        <div class="gpt-section">
          <h4 class="gpt-sec-heading"><i class="ti ti-map-2" style="color:var(--amb)"></i> Personalized Next Steps</h4>
          <div class="gpt-roadmap-list">${rmHtml}</div>
        </div>

        <!-- Feedback Actions -->
        <div class="gpt-footer-actions">
          <button class="gpt-icon-action" onclick="Results._like(this, 'up')" title="Helpful response"><i class="ti ti-thumb-up"></i></button>
          <button class="gpt-icon-action" onclick="Results._like(this, 'down')" title="Needs improvement"><i class="ti ti-thumb-down"></i></button>
          <button class="gpt-icon-action" onclick="cpyReport()" title="Copy entire report"><i class="ti ti-copy"></i> Copy response</button>
        </div>

      </div>`;

    // Trigger score animation
    requestAnimationFrame(() => {
      const b = document.getElementById('scbar');
      if (b) b.style.width = r.score + '%';
    });
  }

  function _renderDiffView() {
    if (!_last) return;
    const { r, lang, origCode } = _last;
    const langLower = (lang || 'plaintext').toLowerCase();

    let origHighlight = '';
    let optHighlight = '';

    try {
      if (window.hljs) {
        origHighlight = hljs.highlight(origCode || '', { language: langLower, ignoreIllegals: true }).value;
        optHighlight = hljs.highlight(r.optimized_code || '', { language: langLower, ignoreIllegals: true }).value;
      } else {
        origHighlight = esc(origCode || '');
        optHighlight = esc(r.optimized_code || '');
      }
    } catch (e) {
      origHighlight = esc(origCode || '');
      optHighlight = esc(r.optimized_code || '');
    }

    document.getElementById('results-body').innerHTML = `
      <div class="diff-container">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
          <h3 style="font-size:15px; font-weight:700;"><i class="ti ti-git-compare" style="color:var(--cyan)"></i> Side-by-Side Comparison</h3>
          <span style="font-size:11.5px; color:var(--t2);">Original vs Code Saathi Optimized</span>
        </div>
        <div class="diff-panels">
          <div class="diff-box">
            <div class="diff-box-head orig"><i class="ti ti-file-x"></i> Your Original Code</div>
            <pre class="diff-pre"><code class="hljs language-${langLower}">${origHighlight}</code></pre>
          </div>
          <div class="diff-box">
            <div class="diff-box-head opt"><i class="ti ti-file-check"></i> Optimized Solution</div>
            <pre class="diff-pre"><code class="hljs language-${langLower}">${optHighlight}</code></pre>
          </div>
        </div>
      </div>
    `;
  }

  // ── Text-to-Speech Mentor Audio ──
  function toggleAudio() {
    if (!_last) return;

    if (!('speechSynthesis' in window)) {
      Toast.show('Text-to-speech is not supported on this browser.', 'err');
      return;
    }

    if (_isSpeaking) {
      _stopAudio();
      Toast.show('Audio stopped.');
      return;
    }

    const { r, lang } = _last;
    let speechText = `Here is your Code Saathi review for ${lang}. Score is ${r.score} out of 100, which is ${r.score_label}. ${r.summary}. Time complexity is ${r.complexity.time}. Space complexity is ${r.complexity.space}. `;

    if (r.mistakes && r.mistakes.length) {
      speechText += `Found ${r.mistakes.length} important issues: `;
      r.mistakes.forEach((m, i) => {
        speechText += `Issue ${i + 1}: ${m.title}. ${m.body}. `;
      });
    } else {
      speechText += `Great job, no major mistakes were detected. `;
    }

    if (r.roadmap && r.roadmap.length) {
      speechText += `Next steps: ${r.roadmap[0].title}. ${r.roadmap[0].desc}`;
    }

    _speechUtterance = new SpeechSynthesisUtterance(speechText);
    _speechUtterance.rate = 1.0;
    _speechUtterance.pitch = 1.0;

    _speechUtterance.onstart = () => {
      _isSpeaking = true;
      const btn = document.getElementById('tts-btn');
      const lbl = document.getElementById('tts-label');
      if (btn) btn.classList.add('playing');
      if (lbl) lbl.textContent = 'Pause';
      Toast.show('Speaking mentor advice... 🎙️', 'ok');
    };

    _speechUtterance.onend = _speechUtterance.onerror = () => {
      _stopAudio();
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(_speechUtterance);
  }

  function _stopAudio() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    _isSpeaking = false;
    const btn = document.getElementById('tts-btn');
    const lbl = document.getElementById('tts-label');
    if (btn) btn.classList.remove('playing');
    if (lbl) lbl.textContent = 'Listen';
  }

  // ── Download File ──
  function downloadOptimized() {
    if (!_last) return;
    const { r, lang } = _last;
    const extMap = { Python: 'py', JavaScript: 'js', TypeScript: 'ts', Java: 'java', 'C++': 'cpp', C: 'c', Go: 'go', Rust: 'rs', Kotlin: 'kt', Swift: 'swift' };
    const ext = extMap[lang] || 'txt';
    const blob = new Blob([r.optimized_code || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized_solution.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Toast.show(`Downloaded optimized_solution.${ext}! 💾`, 'ok');
  }

  function _cpOpt(id, btn) {
    const el = document.getElementById(id);
    if (!el) return;
    navigator.clipboard.writeText(el.textContent)
      .then(() => {
        if (btn) {
          const original = btn.innerHTML;
          btn.innerHTML = '<i class="ti ti-check"></i> <span>Copied!</span>';
          btn.style.color = 'var(--ac)';
          setTimeout(() => {
            btn.innerHTML = original;
            btn.style.color = '';
          }, 2000);
        }
        Toast.show('Optimized code copied!', 'ok');
      })
      .catch(() => Toast.show('Copy failed.', 'err'));
  }

  function _cpText(txt, btn) {
    navigator.clipboard.writeText(txt)
      .then(() => {
        if (btn) {
          const original = btn.innerHTML;
          btn.innerHTML = '<i class="ti ti-check"></i>';
          btn.style.color = 'var(--ac)';
          setTimeout(() => {
            btn.innerHTML = original;
            btn.style.color = '';
          }, 2000);
        }
        Toast.show('Question copied!', 'ok');
      })
      .catch(() => Toast.show('Copy failed.', 'err'));
  }

  function _like(btn, type) {
    btn.style.color = type === 'up' ? 'var(--ac)' : 'var(--red)';
    Toast.show(type === 'up' ? 'Thanks for your feedback! 👍' : 'Feedback noted.', 'ok');
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return {
    showLoading,
    setTip,
    showError,
    clear,
    render,
    getLast,
    switchView,
    toggleAudio,
    downloadOptimized,
    _cpOpt,
    _cpText,
    _like
  };
})();
