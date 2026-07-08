/* progress.js */
const Progress = (() => {
  let _chart = null;

  async function loadAndRender() {
    if (!Auth.isLoggedIn()) { _renderGuest(); return; }
    try {
      const data = await Api.stats();
      _renderStats(data);
      _renderCalendar(data.streakDays || []);
      _renderChart(data.scoreHistory || []);
      _renderLangs(data.langBreakdown || []);
      document.getElementById('streak-num').textContent = data.currentStreak || 0;
    } catch(e) {
      Toast.show('Could not load stats.', 'err');
    }
  }

  async function loadHistory() {
    const el = document.getElementById('hist-list');
    if (!Auth.isLoggedIn()) {
      el.innerHTML = `<div class="no-hist"><i class="ti ti-lock"></i><p>Sign in to see your review history</p></div>`;
      return;
    }
    el.innerHTML = `<div style="text-align:center;padding:30px;color:var(--t3)">Loading…</div>`;
    try {
      const data = await Api.history();
      if (!data.reviews.length) {
        el.innerHTML = `<div class="no-hist"><i class="ti ti-clock-history"></i><p>No reviews yet. Analyze your first code!</p></div>`;
        return;
      }
      el.innerHTML = data.reviews.map(r => {
        const c = r.score>=80?'var(--ac)':r.score>=60?'var(--amb)':'var(--red)';
        const d = new Date(r.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
        return `<div class="h-card" onclick="Progress.openReview('${r._id}')">
          <div class="hc-score" style="color:${c}">${r.score}</div>
          <div style="flex:1">
            <div class="hc-meta">
              <span class="lang-tag">${r.language}</span>
              <span class="hc-time">${d}</span>
              <span class="hc-label">${r.scoreLabel||''}</span>
            </div>
            <div class="hc-sum">${r.summary||''}</div>
          </div>
          <i class="ti ti-chevron-right" style="color:var(--t3);font-size:13px;align-self:center"></i>
        </div>`;
      }).join('');
    } catch(e) {
      el.innerHTML = `<div class="no-hist"><i class="ti ti-alert-circle"></i><p>${e.message}</p></div>`;
    }
  }

  async function openReview(id) {
    try {
      const data = await Api.getReview(id);
      const r    = data.review;
      // Map DB fields back to result shape
      Results.render({
        score: r.score,
        score_label: r.scoreLabel,
        summary: r.summary,
        complexity: r.complexity,
        mistakes: r.mistakes,
        optimized_code: r.optimizedCode,
        optimization_notes: r.optimizationNotes,
        interview_questions: r.interviewQuestions,
        roadmap: r.roadmap
      }, r.language);
      App.switchTab('review');
      Toast.show(`Loaded review from ${new Date(r.createdAt).toLocaleDateString('en-IN')}`);
    } catch(e) {
      Toast.show('Could not load review.', 'err');
    }
  }

  async function clrHistory() {
    if (!confirm('Clear all history? This cannot be undone.')) return;
    const data = await Api.history();
    await Promise.all(data.reviews.map(r => Api.deleteReview(r._id).catch(()=>{})));
    Toast.show('History cleared.', 'ok');
    loadHistory();
  }

  function _renderGuest() {
    document.getElementById('stats-grid').innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--t3);padding:20px"><i class="ti ti-lock" style="font-size:28px;display:block;margin-bottom:8px;opacity:.4"></i>Sign in to track your progress</div>`;
    document.getElementById('cal-grid').innerHTML   = '';
    document.getElementById('lang-chart').innerHTML = '';
    if (_chart) { _chart.destroy(); _chart = null; }
  }

  function _renderStats(d) {
    document.getElementById('stats-grid').innerHTML = `
      <div class="stat-box"><div class="st-val">${d.totalReviews}</div><div class="st-lbl">Total Reviews</div></div>
      <div class="stat-box"><div class="st-val" style="color:${d.avgScore>=80?'var(--ac)':d.avgScore>=60?'var(--amb)':'var(--red)'}">${d.avgScore||'—'}</div><div class="st-lbl">Avg Score</div></div>
      <div class="stat-box"><div class="st-val">${d.bestScore||'—'}</div><div class="st-lbl">Best Score</div></div>
      <div class="stat-box"><div class="st-val" style="color:var(--amb)">${d.currentStreak||0} 🔥</div><div class="st-lbl">Day Streak</div></div>`;
  }

  function _renderCalendar(days) {
    const set = new Set(days);
    const today = new Date();
    const todayKey = today.toISOString().split('T')[0];
    const start = new Date(today);
    start.setDate(today.getDate() - 27);
    start.setDate(start.getDate() - start.getDay());
    const cells = [];
    for (let i = 0; i < 28; i++) {
      const d   = new Date(start); d.setDate(start.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const fut = d > today;
      let cls = 'cl';
      if (fut)           cls += ' fut';
      else if (set.has(key)) cls += ' on';
      if (key === todayKey) cls += ' today';
      cells.push(`<div class="${cls}" title="${key}">${d.getDate()}</div>`);
    }
    document.getElementById('cal-grid').innerHTML = cells.join('');
  }

  function _renderChart(history) {
    const canvas = document.getElementById('score-chart');
    const empty  = document.getElementById('chart-empty');
    if (!history.length) { canvas.style.display='none'; empty.style.display='block'; return; }
    canvas.style.display='block'; empty.style.display='none';
    if (_chart) { _chart.destroy(); _chart = null; }
    _chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: history.map((_,i) => `#${i+1}`),
        datasets: [{
          data: history.map(h => h.score),
          borderColor: '#6ee7b7', backgroundColor: 'rgba(110,231,183,.08)',
          borderWidth: 2, pointBackgroundColor: '#6ee7b7', pointRadius: 4,
          tension: 0.4, fill: true
        }]
      },
      options: {
        responsive: true, plugins: { legend: { display: false } },
        scales: {
          y: { min:0, max:100, grid:{color:'rgba(255,255,255,.05)'}, ticks:{color:'#64748b',font:{size:10}} },
          x: { grid:{color:'rgba(255,255,255,.05)'}, ticks:{color:'#64748b',font:{size:10}} }
        }
      }
    });
  }

  function _renderLangs(breakdown) {
    const el  = document.getElementById('lang-chart');
    if (!breakdown.length) { el.innerHTML='<div style="color:var(--t3);font-size:12px">No data yet.</div>'; return; }
    const max = breakdown[0].count;
    el.innerHTML = breakdown.map(b => `
      <div class="lang-row">
        <div class="lang-nm">${b.lang}</div>
        <div class="lang-bw"><div class="lang-bf" style="width:${(b.count/max)*100}%"></div></div>
        <div class="lang-ct">${b.count}</div>
      </div>`).join('');
  }

  return { loadAndRender, loadHistory, openReview, clrHistory };
})();

function clrHistory() { Progress.clrHistory(); }
