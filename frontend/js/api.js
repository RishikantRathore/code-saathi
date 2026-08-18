/* api.js — All HTTP calls to the backend */

const API_BASE = (window.location.protocol.startsWith('http') && (window.location.port === '5000' || !window.location.port))
  ? ''
  : 'http://localhost:5000';

const Api = {

  _token: null,

  setToken(t) { this._token = t; },
  clearToken() { this._token = null; },

  _headers() {
    const h = { 'Content-Type': 'application/json' };
    if (this._token) h['Authorization'] = 'Bearer ' + this._token;
    return h;
  },

  async _req(method, path, body) {
    const opts = { method, headers: this._headers() };
    if (body) opts.body = JSON.stringify(body);
    let res;
    try {
      res = await fetch(API_BASE + path, opts);
    } catch (netErr) {
      throw new Error('Cannot connect to backend server. Ensure "npm run dev" is running in the backend folder.');
    }
    
    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      throw new Error(`Server returned status ${res.status}`);
    }

    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },


  // ── AUTH ──
  register(name, email, password) {
    return this._req('POST', '/api/auth/register', { name, email, password });
  },
  login(email, password) {
    return this._req('POST', '/api/auth/login', { email, password });
  },
  me() {
    return this._req('GET', '/api/auth/me');
  },

  // ── REVIEW ──
  analyze(code, language) {
    return this._req('POST', '/api/review/analyze', { code, language });
  },
  history(page = 1) {
    return this._req('GET', `/api/review/history?page=${page}&limit=30`);
  },
  getReview(id) {
    return this._req('GET', `/api/review/${id}`);
  },
  deleteReview(id) {
    return this._req('DELETE', `/api/review/${id}`);
  },

  // ── PROGRESS ──
  stats() {
    return this._req('GET', '/api/progress/stats');
  }
};
