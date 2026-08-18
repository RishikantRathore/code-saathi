/* ═════════════════════════════════════════════════════════════
   RESULTS.JS — ChatGPT-Style AI Review Renderer
   ═════════════════════════════════════════════════════════════ */

const Results = (() => {
  let _last = null;

  function showLoading(tip) {
    document.getElementById('exp-bar').style.display = 'none';
    document.getElementById('results-body').innerHTML = `
      <div class="gpt-loading-view">
        <div class="gpt-avatar pulse">
          <i class="ti ti-sparkles"></i>
        </div>
        <div class="gpt-typing-indicator">
          <span></span><span></span><span></span>
        </div>
        <div class="gpt-loading-tip" id="ltip">${tip || 'Code Saathi is analyzing your code…'}</div>
      </div>`;
  }

  function setTip(t) {
    const e = document.getElementById('ltip');
    if (e) e.textContent = t;
  }

  function showError(msg) {
    document.getElementById('exp-bar').style.display = 'none';
    document.getElementById('results-body').innerHTML = `
      <div class="gpt-empty-view">
        <div class="gpt-avatar error">
          <i class="ti ti-alert-circle"></i>
        </div>
        <h3 style="color:var(--red); font-size:16px; margin-top:10px;">Analysis Failed</h3>
        <p class="gpt-error-msg">${esc(msg)}</p>
      </div>`;
  }

  function clear() {
    _last = null;
    document.getElementById('exp-bar').style.display = 'none';
    document.getElementById('results-body').innerHTML = `
      <div class="gpt-empty-view">
        <div class="gpt-avatar">
          <i class="ti ti-brain"></i>
        </div>
        <h3 style="font-size:16px; margin-top:8px;">Ready to review your code</h3>
        <p style="color:var(--t3); font-size:13px; max-width:320px; line-height:1.6;">
          Paste your code on the left and click <strong>Analyze Code</strong> to get instant feedback, complexity insights, and optimized solutions.
        </p>
      </div>`;
  }

  function getLast() { return _last; }

  function render(r, lang) {
    _last = { r, lang };
    const langLower = (lang || 'plaintext').toLowerCase();

    // Score badge colors
    const isHigh = r.score >= 80;
    const isMid  = r.score >= 60 && r.score < 80;
    const scColor = isHigh ? 'var(--ac)' : isMid ? 'var(--amb)' : 'var(--red)';
    const scBg    = isHigh ? 'var(--acd)' : isMid ? 'var(--ambd)' : 'var(--redd)';
    const scGrad  = isHigh ? 'linear-gradient(90deg, #059669, #10b981)' :
                    isMid  ? 'linear-gradient(90deg, #d97706, #f59e0b)' :
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
              Code Saathi <span class="gpt-badge">Gemini 2.5 Flash</span>
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

        <!-- Section: ChatGPT-Style Code Block -->
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

        <!-- ChatGPT Response Footer Feedback -->
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

    document.getElementById('exp-bar').style.display = 'flex';
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

  return { showLoading, setTip, showError, clear, render, getLast, _cpOpt, _cpText, _like };
})();
