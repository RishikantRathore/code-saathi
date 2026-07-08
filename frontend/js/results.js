/* results.js */
const Results = (() => {
  let _last = null;

  function showLoading(tip){
    document.getElementById('exp-bar').style.display='none';
    document.getElementById('results-body').innerHTML=`
      <div class="loading-st">
        <div class="spin"></div>
        <div class="ltip" id="ltip">${tip||'Analyzing…'}</div>
      </div>`;
  }
  function setTip(t){ const e=document.getElementById('ltip'); if(e) e.textContent=t; }

  function showError(msg){
    document.getElementById('results-body').innerHTML=`
      <div class="empty-st">
        <i class="ti ti-alert-circle" style="color:var(--red)"></i>
        <p style="color:var(--red)">Analysis failed</p>
        <small>${esc(msg)}</small>
      </div>`;
  }

  function clear(){
    _last=null;
    document.getElementById('exp-bar').style.display='none';
    document.getElementById('results-body').innerHTML=`
      <div class="empty-st">
        <i class="ti ti-brain"></i>
        <p>Paste code and click <strong>Analyze Code</strong></p>
        <small>Full AI-powered review in seconds</small>
      </div>`;
  }

  function getLast(){ return _last; }

  function render(r, lang){
    _last={r, lang};
    const sc=r.score>=80?'var(--ac)':r.score>=60?'var(--amb)':'var(--red)';
    const gr=r.score>=80?'linear-gradient(90deg,var(--ac2),var(--ac))':
             r.score>=60?'linear-gradient(90deg,#d97706,var(--amb))':
             'linear-gradient(90deg,#dc2626,var(--red))';

    const mkHtml = r.mistakes&&r.mistakes.length
      ? r.mistakes.map(m=>`<div class="mk-item"><div class="mk-title"><i class="ti ti-alert-triangle" style="font-size:11px"></i> ${esc(m.title)}</div><div class="mk-body">${esc(m.body)}</div></div>`).join('')
      : `<div class="no-mk"><i class="ti ti-circle-check"></i> No major mistakes — great code!</div>`;

    const cxHtml=`<div class="cx-row">
      <div class="cx cx-t"><i class="ti ti-clock"></i> Time: ${esc(r.complexity.time)}</div>
      <div class="cx cx-s"><i class="ti ti-database"></i> Space: ${esc(r.complexity.space)}</div>
    </div><div>${esc(r.complexity.explanation)}</div>`;

    const uid='oc-'+Date.now();
    const optHtml=`<div class="code-blk"><button class="cp-btn" onclick="Results._cpOpt('${uid}')"><i class="ti ti-copy"></i></button><code id="${uid}">${esc(r.optimized_code)}</code></div><div class="opt-note">${esc(r.optimization_notes)}</div>`;

    const qHtml=r.interview_questions.map((q,i)=>`<div class="qi"><span class="qn">Q${i+1}</span>${esc(q)}</div>`).join('');

    const rmHtml=r.roadmap.map((s,i)=>`<div class="rm-step"><div class="rm-n">${i+1}</div><div><div class="rm-title">${esc(s.title)}</div><div class="rm-desc">${esc(s.desc)}</div></div></div>`).join('');

    document.getElementById('results-body').innerHTML=`
      <div class="score-card">
        <div class="sc-num" style="color:${sc}">${r.score}</div>
        <div class="sc-info">
          <div class="sc-lbl">${r.score_label}</div>
          <div class="sc-sum">${esc(r.summary)}</div>
          <div class="sc-bar-wrap"><div class="sc-bar" id="scbar" style="width:0;background:${gr}"></div></div>
        </div>
      </div>
      ${sec('ti-bug','Mistakes & Explanations',r.mistakes?r.mistakes.length+' found':'Clean',mkHtml,'var(--red)')}
      ${sec('ti-clock','Time & Space Complexity',r.complexity.time,cxHtml,'var(--pur)')}
      ${sec('ti-rocket','Optimized Code','Improved',optHtml,'var(--ac)')}
      ${sec('ti-help-circle','Interview Questions',r.interview_questions.length+' questions',qHtml,'var(--blu)')}
      ${sec('ti-map','Learning Roadmap',r.roadmap.length+' steps',rmHtml,'var(--amb)')}`;

    requestAnimationFrame(()=>{
      const b=document.getElementById('scbar');
      if(b) b.style.width=r.score+'%';
    });
    document.getElementById('exp-bar').style.display='flex';
  }

  function sec(icon,title,badge,body,col){
    return `<div class="sec open">
      <div class="sec-head" onclick="this.parentElement.classList.toggle('open')">
        <i class="ti ${icon} si" style="color:${col}"></i>
        <span class="sec-ttl">${title}</span>
        ${badge?`<span class="sec-badge">${badge}</span>`:''}
        <i class="ti ti-chevron-down chv"></i>
      </div>
      <div class="sec-body">${body}</div>
    </div>`;
  }

  function _cpOpt(id){
    const el=document.getElementById(id);
    if(!el) return;
    navigator.clipboard.writeText(el.textContent)
      .then(()=>Toast.show('Code copied!','ok'))
      .catch(()=>Toast.show('Copy failed.','err'));
  }

  function esc(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { showLoading, setTip, showError, clear, render, getLast, _cpOpt };
})();
