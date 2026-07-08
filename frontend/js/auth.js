/* auth.js — Login, Register, Session */

const Auth = (() => {
  let _mode = 'login';
  let _currentUser = null;

  function init() {
    const token = localStorage.getItem('cs_token');
    const user  = localStorage.getItem('cs_user');
    if (token && user) {
      _currentUser = JSON.parse(user);
      Api.setToken(token);
      _applyUser(_currentUser);
      // Verify token is still valid
      Api.me().catch(() => { logout(true); });
    }
  }

  function openModal(mode) {
    _mode = mode || 'login';
    _renderModal();
    document.getElementById('auth-modal').style.display = 'flex';
    closeUserMenu();
  }

  function closeModal() {
    document.getElementById('auth-modal').style.display = 'none';
    _clearError();
  }

  function toggleMode() {
    _mode = _mode === 'login' ? 'register' : 'login';
    _renderModal();
  }

  function _renderModal() {
    const isReg = _mode === 'register';
    document.getElementById('m-title').textContent      = isReg ? 'Create Account' : 'Sign In';
    document.getElementById('m-sub').textContent        = isReg ? 'Join Code Saathi and track your growth' : 'Welcome back to Code Saathi';
    document.getElementById('m-name-wrap').style.display= isReg ? 'block' : 'none';
    document.getElementById('m-btn').textContent        = isReg ? 'Create Account' : 'Sign In';
    document.getElementById('m-switch-text').textContent= isReg ? 'Already have an account?' : "Don't have an account?";
    document.getElementById('m-switch-btn').textContent = isReg ? 'Sign In' : 'Register';
    _clearError();
  }

  async function submitAuth() {
    const email = document.getElementById('m-email').value.trim();
    const pass  = document.getElementById('m-pass').value;
    const name  = document.getElementById('m-name').value.trim();

    if (!email || !pass) { _showError('Please fill in all fields.'); return; }
    if (_mode === 'register' && !name) { _showError('Please enter your name.'); return; }

    const btn = document.getElementById('m-btn');
    btn.textContent = 'Please wait…';
    btn.disabled    = true;
    _clearError();

    try {
      let data;
      if (_mode === 'register') {
        data = await Api.register(name, email, pass);
      } else {
        data = await Api.login(email, pass);
      }

      // Save session
      localStorage.setItem('cs_token', data.token);
      localStorage.setItem('cs_user',  JSON.stringify(data.user));
      Api.setToken(data.token);
      _currentUser = data.user;
      _applyUser(data.user);
      closeModal();
      Toast.show(_mode === 'register' ? 'Account created! Welcome 🎉' : 'Welcome back!', 'ok');
      App.onLogin();

    } catch (err) {
      _showError(err.message);
    } finally {
      btn.textContent = _mode === 'register' ? 'Create Account' : 'Sign In';
      btn.disabled    = false;
    }
  }

  function logout(silent) {
    localStorage.removeItem('cs_token');
    localStorage.removeItem('cs_user');
    Api.clearToken();
    _currentUser = null;
    document.getElementById('u-avatar').textContent  = 'G';
    document.getElementById('u-name').textContent    = 'Guest';
    document.getElementById('um-login').style.display  = '';
    document.getElementById('um-reg').style.display    = '';
    document.getElementById('um-logout').style.display = 'none';
    closeUserMenu();
    if (!silent) Toast.show('Signed out.');
    App.onLogout();
  }

  function _applyUser(user) {
    document.getElementById('u-avatar').textContent  = user.name[0].toUpperCase();
    document.getElementById('u-name').textContent    = user.name;
    document.getElementById('um-login').style.display  = 'none';
    document.getElementById('um-reg').style.display    = 'none';
    document.getElementById('um-logout').style.display = '';
  }

  function toggleUserMenu() {
    const m = document.getElementById('user-menu');
    m.style.display = m.style.display === 'none' ? 'block' : 'none';
  }

  function closeUserMenu() {
    document.getElementById('user-menu').style.display = 'none';
  }

  function isLoggedIn() { return !!_currentUser; }
  function getUser()    { return _currentUser; }

  function _showError(msg) {
    const el = document.getElementById('m-error');
    el.textContent = msg;
    el.style.display = 'block';
  }
  function _clearError() {
    document.getElementById('m-error').style.display = 'none';
  }

  // Close menu on outside click
  document.addEventListener('click', e => {
    const menu = document.getElementById('user-menu');
    const btn  = document.getElementById('user-btn');
    if (menu && !menu.contains(e.target) && !btn.contains(e.target)) {
      menu.style.display = 'none';
    }
  });

  return { init, openModal, closeModal, toggleMode, submitAuth, logout, toggleUserMenu, isLoggedIn, getUser };
})();

// HTML globals
function openModal(m)     { Auth.openModal(m); }
function closeModal()     { Auth.closeModal(); }
function toggleMode()     { Auth.toggleMode(); }
function submitAuth()     { Auth.submitAuth(); }
function logout()         { Auth.logout(); }
function toggleUserMenu() { Auth.toggleUserMenu(); }
function guestMode() {
  document.getElementById('splash').style.display = 'none';
  document.getElementById('app').style.display    = 'block';
}
