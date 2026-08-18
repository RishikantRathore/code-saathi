/* ═════════════════════════════════════════════════════════════
   EDITOR.JS — Modern IDE-Grade Editor Engine for Code Saathi
   ═════════════════════════════════════════════════════════════ */

const Editor = (() => {
  let _hl = false;
  let _indentSize = 2;
  let _fontSize = 13;
  let _activeMode = 'comprehensive';
  let _languageTone = 'english'; // 'english' or 'hinglish'
  let _searchMatches = [];
  let _currentMatchIdx = -1;
  let _presetFilterTag = 'all';
  let _presetSearchQuery = '';

  const LANG_MAP = {
    Python: 'python', JavaScript: 'javascript', Java: 'java', 'C++': 'cpp',
    C: 'c', TypeScript: 'typescript', Go: 'go', Rust: 'rust', Kotlin: 'kotlin', Swift: 'swift'
  };

  const EXT_MAP = {
    py: 'Python', js: 'JavaScript', jsx: 'JavaScript', ts: 'TypeScript', tsx: 'TypeScript',
    java: 'Java', cpp: 'C++', cc: 'C++', cxx: 'C++', hpp: 'C++', c: 'C', h: 'C',
    go: 'Go', rs: 'Rust', kt: 'Kotlin', swift: 'Swift'
  };

  // Curated Multi-Tier DSA & Code Review Problem Library
  const PRESET_LIBRARY = [
    {
      id: 'two_sum_py',
      title: 'Two Sum (Brute Force O(n²))',
      lang: 'Python',
      diff: 'Easy',
      desc: 'Find two numbers that add up to target. Uses inefficient nested loops ready for hash map optimization.',
      code: `def two_sum(nums, target):
    # Brute force approach with nested loops: O(n^2)
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []

# Test cases
print(two_sum([2, 7, 11, 15], 9)) # Expected: [0, 1]
print(two_sum([3, 2, 4], 6))       # Expected: [1, 2]`
    },
    {
      id: 'valid_palindrome_js',
      title: 'Valid Palindrome (String Cleaning)',
      lang: 'JavaScript',
      diff: 'Easy',
      desc: 'Check if a phrase is a palindrome considering alphanumeric characters only.',
      code: `function isPalindrome(s) {
  // Convert string to lower case and filter alphanumeric
  let clean = '';
  for (let i = 0; i < s.length; i++) {
    let code = s.charCodeAt(i);
    if ((code >= 48 && code <= 57) || (code >= 97 && code <= 122) || (code >= 65 && code <= 90)) {
      clean += s[i].toLowerCase();
    }
  }
  
  // Two pointer comparison
  let left = 0;
  let right = clean.length - 1;
  while (left < right) {
    if (clean[left] !== clean[right]) return false;
    left++;
    right--;
  }
  return true;
}

console.log(isPalindrome("A man, a plan, a canal: Panama")); // true
console.log(isPalindrome("race a car")); // false`
    },
    {
      id: 'reverse_list_cpp',
      title: 'Reverse Linked List (Iterative)',
      lang: 'C++',
      diff: 'Medium',
      desc: 'Classic singly linked list reversal using 3-pointer manipulation.',
      code: `#include <iostream>
using namespace std;

struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x) : val(x), next(nullptr) {}
};

ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr;
    ListNode* curr = head;
    
    while (curr != nullptr) {
        ListNode* nextTemp = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nextTemp;
    }
    return prev;
}

int main() {
    ListNode* head = new ListNode(1);
    head->next = new ListNode(2);
    head->next->next = new ListNode(3);
    
    ListNode* rev = reverseList(head);
    while (rev) {
        cout << rev->val << " -> ";
        rev = rev->next;
    }
    cout << "NULL" << endl;
    return 0;
}`
    },
    {
      id: 'binary_search_bug_py',
      title: 'Binary Search (Tricky Off-by-One Bug)',
      lang: 'Python',
      diff: 'Buggy',
      desc: 'Contains common edge-case bug with boundary conditions (<= vs < and mid calculation).',
      code: `def binary_search_buggy(arr, target):
    low = 0
    high = len(arr) # BUG: Should be len(arr) - 1 or while low < high
    
    while low < high:
        mid = (low + high) // 2 # Potential integer overflow in some langs
        
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid # BUG: Causes infinite loop when low + 1 == high!
        else:
            high = mid - 1
            
    return -1

# Edge case test that triggers infinite loop
print(binary_search_buggy([1, 3, 5, 7], 7))`
    },
    {
      id: 'py_mutable_default_bug',
      title: 'Python Mutable Default Argument Trap',
      lang: 'Python',
      diff: 'Buggy',
      desc: 'Famous Python trap where default list argument persists across subsequent function calls.',
      code: `def add_user_log(user_id, action, logs=[]):
    # BUG: logs list is mutated in-place and shared across all calls!
    logs.append({"user": user_id, "action": action})
    return logs

# Multiple student sessions
session1 = add_user_log("user_101", "login")
session2 = add_user_log("user_202", "view_course")

print("Session 1 logs count:", len(session1)) # Expected: 1, got 2!
print("Session 2 logs count:", len(session2)) # Expected: 1, got 2!`
    },
    {
      id: 'lru_cache_java',
      title: 'LRU Cache Design (HashMap + Doubly LinkedList)',
      lang: 'Java',
      diff: 'Advanced',
      desc: 'Full O(1) Get and Put cache implementation for systems and technical interviews.',
      code: `import java.util.*;

public class LRUCache {
    class Node {
        int key, val;
        Node prev, next;
        Node(int k, int v) { key = k; val = v; }
    }

    private Map<Integer, Node> map = new HashMap<>();
    private int capacity;
    private Node head, tail;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        head = new Node(0, 0);
        tail = new Node(0, 0);
        head.next = tail;
        tail.prev = head;
    }

    private void remove(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void insert(Node node) {
        node.next = head.next;
        node.next.prev = node;
        head.next = node;
        node.prev = head;
    }

    public int get(int key) {
        if (!map.containsKey(key)) return -1;
        Node node = map.get(key);
        remove(node);
        insert(node);
        return node.val;
    }

    public void put(int key, int value) {
        if (map.containsKey(key)) {
            remove(map.get(key));
        }
        if (map.size() == capacity) {
            map.remove(tail.prev.key);
            remove(tail.prev);
        }
        Node node = new Node(key, value);
        insert(node);
        map.put(key, node);
    }
}`
    },
    {
      id: 'fast_io_boilerplate_cpp',
      title: 'Fast I/O Competitive Programming Template',
      lang: 'C++',
      diff: 'Boilerplate',
      desc: 'Optimized standard I/O template for Codeforces / LeetCode contest submissions.',
      code: `#include <bits/stdc++.h>
using namespace std;

#define fast_io ios_base::sync_with_stdio(false); cin.tie(NULL); cout.tie(NULL);
#define ll long long
#define pb push_back
#define vi vector<int>
#define vll vector<ll>

void solve() {
    int n;
    if (!(cin >> n)) return;
    vi a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    
    // Write your algorithmic solution here...
    ll sum = 0;
    for (int x : a) sum += x;
    cout << sum << "\\n";
}

int main() {
    fast_io;
    int t = 1;
    // cin >> t; // Uncomment for multi-test cases
    while (t--) {
        solve();
    }
    return 0;
}`
    },
    {
      id: 'valid_parentheses_ts',
      title: 'Valid Parentheses (Stack DS)',
      lang: 'TypeScript',
      diff: 'Easy',
      desc: 'Validating nested brackets and parentheses using stack data structure.',
      code: `function isValid(s: string): boolean {
  const stack: string[] = [];
  const map: Record<string, string> = {
    ')': '(',
    '}': '{',
    ']': '['
  };

  for (const char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else if (map[char]) {
      if (stack.length === 0 || stack.pop() !== map[char]) {
        return false;
      }
    }
  }

  return stack.length === 0;
}

console.log(isValid("()[]{}")); // true
console.log(isValid("([)]"));   // false`
    }
  ];

  // ── Multi-Tab Buffer State ──
  let _tabs = [
    {
      id: 'tab_1',
      name: 'main.py',
      lang: 'Python',
      code: `# Paste your code here...
# Code Saathi will:
#   ✦ Find & explain mistakes
#   ✦ Estimate time complexity
#   ✦ Generate optimized code
#   ✦ Create interview questions
#   ✦ Build your learning roadmap`
    }
  ];
  let _activeTabId = 'tab_1';

  function init() {
    _loadState();
    _initElements();
    _renderTabs();
    _renderPresets();
    _updateGutterAndStats();
  }

  function _loadState() {
    try {
      const savedTabs = localStorage.getItem('cs_editor_tabs');
      if (savedTabs) {
        const parsed = JSON.parse(savedTabs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          _tabs = parsed;
          _activeTabId = _tabs[0].id;
        }
      }
      const savedTheme = localStorage.getItem('cs_editor_theme');
      if (savedTheme) setTheme(savedTheme, false);
    } catch (e) {}
  }

  function _saveState() {
    try {
      localStorage.setItem('cs_editor_tabs', JSON.stringify(_tabs));
    } catch (e) {}
  }

  function _initElements() {
    const ta = document.getElementById('code-ta');
    const gutter = document.getElementById('editor-gutter');
    const container = document.getElementById('editor-container');
    const dropOverlay = document.getElementById('drop-overlay');

    if (!ta) return;

    // Load active tab code into textarea
    const curr = _getCurrentTab();
    if (curr) {
      ta.value = curr.code;
      document.getElementById('lang-sel').value = curr.lang;
    }

    // Synchronize scrolling between textarea and line numbers gutter
    ta.addEventListener('scroll', () => {
      if (gutter) gutter.scrollTop = ta.scrollTop;
    });

    // Real-time input handling
    ta.addEventListener('input', () => {
      _updateCurrentTabCode(ta.value);
      _updateGutterAndStats();
      _inspectLint(ta.value);
    });

    // Cursor position tracking
    ta.addEventListener('keyup', _updateCursorPos);
    ta.addEventListener('click', _updateCursorPos);

    // Smart Keybindings: Indentation, Brackets, Shortcuts
    ta.addEventListener('keydown', e => {
      // Ctrl+Enter or Cmd+Enter -> Run Analysis
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (window.doAnalyze) window.doAnalyze();
        return;
      }

      // Ctrl+F -> Toggle Search & Replace
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleSearch();
        return;
      }

      // Ctrl+Shift+F -> Format code
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        fmtCode();
        return;
      }

      // Tab / Shift+Tab handling
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const spaces = ' '.repeat(_indentSize);

        if (start === end) {
          // Single cursor insert spaces
          ta.value = ta.value.substring(0, start) + spaces + ta.value.substring(end);
          ta.selectionStart = ta.selectionEnd = start + _indentSize;
        } else {
          // Multi-line indent/dedent
          const lines = ta.value.substring(start, end).split('\n');
          if (e.shiftKey) {
            // Unindent
            const unindented = lines.map(l => l.startsWith(spaces) ? l.substring(_indentSize) : l.replace(/^\s+/, '')).join('\n');
            ta.value = ta.value.substring(0, start) + unindented + ta.value.substring(end);
            ta.selectionStart = start;
            ta.selectionEnd = start + unindented.length;
          } else {
            // Indent
            const indented = lines.map(l => spaces + l).join('\n');
            ta.value = ta.value.substring(0, start) + indented + ta.value.substring(end);
            ta.selectionStart = start;
            ta.selectionEnd = start + indented.length;
          }
        }
        _updateCurrentTabCode(ta.value);
        _updateGutterAndStats();
        return;
      }

      // Enter key: Auto-indent to match previous line indentation
      if (e.key === 'Enter') {
        const start = ta.selectionStart;
        const lineStart = ta.value.lastIndexOf('\n', start - 1) + 1;
        const currentLine = ta.value.substring(lineStart, start);
        const match = currentLine.match(/^(\s+)/);
        const indent = match ? match[1] : '';

        // Extra indent if previous line ends with ':' or '{'
        const extraIndent = /[:{]\s*$/.test(currentLine) ? ' '.repeat(_indentSize) : '';

        e.preventDefault();
        const insertText = '\n' + indent + extraIndent;
        ta.value = ta.value.substring(0, start) + insertText + ta.value.substring(ta.selectionEnd);
        ta.selectionStart = ta.selectionEnd = start + insertText.length;
        _updateCurrentTabCode(ta.value);
        _updateGutterAndStats();
        return;
      }

      // Auto-closing brackets and quotes
      const pairs = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };
      if (pairs[e.key] && ta.selectionStart === ta.selectionEnd) {
        const start = ta.selectionStart;
        const char = e.key;
        const close = pairs[char];
        e.preventDefault();
        ta.value = ta.value.substring(0, start) + char + close + ta.value.substring(start);
        ta.selectionStart = ta.selectionEnd = start + 1;
        _updateCurrentTabCode(ta.value);
        return;
      }
    });

    // Drag and Drop File Reading
    if (container && dropOverlay) {
      container.addEventListener('dragover', e => {
        e.preventDefault();
        dropOverlay.classList.add('active');
      });
      container.addEventListener('dragleave', e => {
        if (!container.contains(e.relatedTarget)) {
          dropOverlay.classList.remove('active');
        }
      });
      container.addEventListener('drop', e => {
        e.preventDefault();
        dropOverlay.classList.remove('active');
        const files = e.dataTransfer.files;
        if (files.length > 0) _loadFile(files[0]);
      });
    }
  }

  // ── Tab Management ──
  function _getCurrentTab() {
    return _tabs.find(t => t.id === _activeTabId) || _tabs[0];
  }

  function _updateCurrentTabCode(code) {
    const tab = _getCurrentTab();
    if (tab) {
      tab.code = code;
      _saveState();
    }
  }

  function addTab() {
    const num = _tabs.length + 1;
    const lang = getLang() || 'Python';
    const ext = Object.keys(EXT_MAP).find(k => EXT_MAP[k] === lang) || 'py';
    const newTab = {
      id: 'tab_' + Date.now(),
      name: `solution_${num}.${ext}`,
      lang: lang,
      code: `# Code Saathi — Tab ${num}\n`
    };
    _tabs.push(newTab);
    _activeTabId = newTab.id;
    _renderTabs();
    _switchTabContent(newTab);
    _saveState();
    Toast.show(`New tab created: ${newTab.name}`);
  }

  function selectTab(id) {
    _activeTabId = id;
    _renderTabs();
    const tab = _getCurrentTab();
    if (tab) _switchTabContent(tab);
  }

  function closeTab(id, e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (_tabs.length === 1) {
      // If only 1 tab exists, reset it to clean default state
      _tabs[0] = {
        id: 'tab_' + Date.now(),
        name: 'main.py',
        lang: 'Python',
        code: ''
      };
      _activeTabId = _tabs[0].id;
      _renderTabs();
      _switchTabContent(_tabs[0]);
      _saveState();
      Results.clear();
      Toast.show('Tab closed & reset.');
      return;
    }

    const idx = _tabs.findIndex(t => t.id === id);
    _tabs = _tabs.filter(t => t.id !== id);
    if (_activeTabId === id) {
      _activeTabId = _tabs[Math.max(0, idx - 1)].id;
    }
    _renderTabs();
    _switchTabContent(_getCurrentTab());
    _saveState();
    Toast.show('Tab closed.');
  }

  function _switchTabContent(tab) {
    const ta = document.getElementById('code-ta');
    if (!ta) return;
    if (_hl) toggleHL();
    ta.value = tab.code;
    document.getElementById('lang-sel').value = tab.lang;
    _updateGutterAndStats();
    _inspectLint(tab.code);
  }

  function _renderTabs() {
    const list = document.getElementById('ws-tabs-list');
    if (!list) return;
    list.innerHTML = _tabs.map(t => `
      <div class="ws-tab ${t.id === _activeTabId ? 'active' : ''}" onclick="Editor.selectTab('${t.id}')">
        <i class="ti ti-file-code"></i>
        <span>${esc(t.name)}</span>
        <span class="ws-tab-close" onclick="Editor.closeTab('${t.id}', event)" title="Close Tab">&times;</span>
      </div>
    `).join('');
  }

  // ── Gutter & Line Numbers ──
  function _updateGutterAndStats() {
    const ta = document.getElementById('code-ta');
    const gutter = document.getElementById('editor-gutter');
    if (!ta || !gutter) return;

    const text = ta.value;
    const lines = text.split('\n');
    const lineCount = text ? lines.length : 1;

    // Calculate active line based on cursor
    const cursorPos = ta.selectionStart;
    const activeLineIdx = text.substring(0, cursorPos).split('\n').length;

    let gutterHtml = '';
    for (let i = 1; i <= lineCount; i++) {
      const isActive = i === activeLineIdx;
      gutterHtml += `<div class="gutter-num ${isActive ? 'active' : ''}">${i}</div>`;
    }
    gutter.innerHTML = gutterHtml;

    // Update bottom stats
    const charCount = text.length;
    document.getElementById('line-cnt').textContent = `${lineCount} line${lineCount !== 1 ? 's' : ''}`;
    document.getElementById('char-cnt').textContent = `${charCount} char${charCount !== 1 ? 's' : ''}`;
    _updateCursorPos();
  }

  function _updateCursorPos() {
    const ta = document.getElementById('code-ta');
    const posTag = document.getElementById('cursor-pos');
    if (!ta || !posTag) return;

    const start = ta.selectionStart;
    const text = ta.value;
    const linesBefore = text.substring(0, start).split('\n');
    const line = linesBefore.length;
    const col = linesBefore[linesBefore.length - 1].length + 1;
    posTag.textContent = `Ln ${line}, Col ${col}`;
  }

  // ── Realtime Lint / Syntax Diagnostic ──
  function _inspectLint(code) {
    const lintPill = document.getElementById('lint-pill');
    if (!lintPill) return;

    if (!code || !code.trim()) {
      lintPill.style.display = 'none';
      return;
    }

    const stack = [];
    const pairs = { '(': ')', '[': ']', '{': '}' };
    let unclosed = null;
    let inString = null; // '"', "'", "`"
    let inSingleComment = false;
    let inMultiComment = false;

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const prev = i > 0 ? code[i - 1] : '';
      const next = i + 1 < code.length ? code[i + 1] : '';

      // Line breaks end single line comments
      if (char === '\n') {
        inSingleComment = false;
        continue;
      }

      // Check comments
      if (!inString) {
        if (inSingleComment) continue;
        if (inMultiComment) {
          if (char === '*' && next === '/') {
            inMultiComment = false;
            i++; // skip '/'
          }
          continue;
        }

        // Start comments
        if (char === '/' && next === '/') {
          inSingleComment = true;
          i++;
          continue;
        }
        if (char === '/' && next === '*') {
          inMultiComment = true;
          i++;
          continue;
        }
        if (char === '#') {
          inSingleComment = true;
          continue;
        }
      }

      // Check string quotes (with escape \ check)
      if (char === '"' || char === "'" || char === '`') {
        if (!inString) {
          inString = char;
          continue;
        } else if (inString === char && prev !== '\\') {
          inString = null;
          continue;
        }
      }

      // Skip inside strings
      if (inString) continue;

      // Now we are in real code: check brackets
      if (char === '(' || char === '[' || char === '{') {
        const lineNum = code.substring(0, i).split('\n').length;
        stack.push({ char, line: lineNum });
      } else if (char === ')' || char === ']' || char === '}') {
        const last = stack.pop();
        if (!last || pairs[last.char] !== char) {
          const lineNum = code.substring(0, i).split('\n').length;
          unclosed = `Mismatched bracket '${char}' at line ${lineNum}`;
          break;
        }
      }
    }

    if (!unclosed && stack.length > 0) {
      const item = stack[stack.length - 1];
      unclosed = `Unclosed bracket '${item.char}' (opened at line ${item.line})`;
    }

    if (unclosed) {
      lintPill.innerHTML = `<i class="ti ti-alert-triangle"></i> <span>${esc(unclosed)}</span>`;
      lintPill.style.display = 'flex';
    } else {
      lintPill.style.display = 'none';
    }
  }

  // ── File Upload & Drop ──
  function handleFileInput(e) {
    const file = e.target.files[0];
    if (file) _loadFile(file);
  }

  function _loadFile(file) {
    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target.result;
      const ext = file.name.split('.').pop().toLowerCase();
      const detectedLang = EXT_MAP[ext] || getLang();

      // Create new tab or populate current tab
      const tab = _getCurrentTab();
      tab.name = file.name;
      tab.lang = detectedLang;
      tab.code = content;

      document.getElementById('code-ta').value = content;
      document.getElementById('lang-sel').value = detectedLang;

      _renderTabs();
      _updateGutterAndStats();
      _saveState();
      Toast.show(`Imported ${file.name} (${detectedLang})! ✨`, 'ok');
    };
    reader.readAsText(file);
  }

  // ── Preset Library Modal ──
  function openPresetsModal() {
    _renderPresets();
    document.getElementById('presets-modal').style.display = 'flex';
  }

  function closePresetsModal() {
    document.getElementById('presets-modal').style.display = 'none';
  }

  function setPresetTag(tag, btn) {
    _presetFilterTag = tag;
    document.querySelectorAll('.ptag').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    _renderPresets();
  }

  function filterPresets(query) {
    _presetSearchQuery = (query || '').toLowerCase().trim();
    _renderPresets();
  }

  function _renderPresets() {
    const grid = document.getElementById('preset-grid');
    if (!grid) return;

    let filtered = PRESET_LIBRARY;
    if (_presetFilterTag !== 'all') {
      filtered = filtered.filter(p => p.diff.toLowerCase() === _presetFilterTag.toLowerCase());
    }
    if (_presetSearchQuery) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(_presetSearchQuery) ||
        p.desc.toLowerCase().includes(_presetSearchQuery) ||
        p.lang.toLowerCase().includes(_presetSearchQuery)
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:30px; color:var(--t3);">No problems match your search filter.</div>`;
      return;
    }

    grid.innerHTML = filtered.map(p => {
      const diffClass = p.diff.toLowerCase().replace(/[^a-z]/g, '');
      return `
        <div class="preset-card" onclick="Editor.loadPreset('${p.id}')">
          <div class="pcard-header">
            <span class="pcard-diff ${diffClass}">${p.diff}</span>
            <span class="pcard-lang">${p.lang}</span>
          </div>
          <div class="pcard-title">${esc(p.title)}</div>
          <div class="pcard-desc">${esc(p.desc)}</div>
          <div class="pcard-foot">
            <span style="font-size:11px; color:var(--t3);"><i class="ti ti-code"></i> Ready to test</span>
            <button class="pcard-btn"><i class="ti ti-arrow-right"></i> Load Code</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function loadPreset(id) {
    const p = PRESET_LIBRARY.find(item => item.id === id);
    if (!p) return;

    if (_hl) toggleHL();

    const ext = Object.keys(EXT_MAP).find(k => EXT_MAP[k] === p.lang) || 'py';
    const fileName = p.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase().slice(0, 20) + '.' + ext;

    const current = _getCurrentTab();
    const isCurrentEmpty = !current || !current.code || current.code.trim() === '' || current.code.startsWith('# Paste your code here');

    if (isCurrentEmpty && current) {
      current.name = fileName;
      current.lang = p.lang;
      current.code = p.code;
      _switchTabContent(current);
    } else {
      const newTab = {
        id: 'tab_' + Date.now(),
        name: fileName,
        lang: p.lang,
        code: p.code
      };
      _tabs.push(newTab);
      _activeTabId = newTab.id;
      _switchTabContent(newTab);
    }

    _renderTabs();
    _updateGutterAndStats();
    _saveState();
    closePresetsModal();
    Toast.show(`Loaded: ${p.title} (${p.lang})! 🚀`, 'ok');
  }

  // ── Search & Replace ──
  function toggleSearch(force) {
    const bar = document.getElementById('editor-search-bar');
    const btn = document.getElementById('search-toggle-btn');
    if (!bar) return;

    const isShowing = force !== undefined ? force : bar.style.display === 'none';
    bar.style.display = isShowing ? 'flex' : 'none';
    if (btn) btn.classList.toggle('active', isShowing);

    if (isShowing) {
      const input = document.getElementById('es-find');
      if (input) {
        input.focus();
        input.select();
      }
    }
  }

  function onFindKey(e) {
    if (e.key === 'Enter') {
      if (e.shiftKey) findPrev();
      else findNext();
    } else if (e.key === 'Escape') {
      toggleSearch(false);
    } else {
      setTimeout(_performSearch, 50);
    }
  }

  function onReplaceKey(e) {
    if (e.key === 'Enter') replaceOne();
    else if (e.key === 'Escape') toggleSearch(false);
  }

  function _performSearch() {
    const query = document.getElementById('es-find').value;
    const ta = document.getElementById('code-ta');
    const countTag = document.getElementById('es-count');
    if (!query || !ta) {
      _searchMatches = [];
      _currentMatchIdx = -1;
      if (countTag) countTag.textContent = '0/0';
      return;
    }

    const text = ta.value;
    _searchMatches = [];
    let idx = 0;
    while ((idx = text.indexOf(query, idx)) !== -1) {
      _searchMatches.push(idx);
      idx += query.length;
    }

    if (_searchMatches.length > 0) {
      if (_currentMatchIdx === -1 || _currentMatchIdx >= _searchMatches.length) {
        _currentMatchIdx = 0;
      }
      _highlightMatch();
    } else {
      _currentMatchIdx = -1;
    }

    if (countTag) {
      countTag.textContent = _searchMatches.length ? `${_currentMatchIdx + 1}/${_searchMatches.length}` : '0/0';
    }
  }

  function findNext() {
    if (_searchMatches.length === 0) _performSearch();
    if (_searchMatches.length === 0) return;
    _currentMatchIdx = (_currentMatchIdx + 1) % _searchMatches.length;
    _highlightMatch();
  }

  function findPrev() {
    if (_searchMatches.length === 0) _performSearch();
    if (_searchMatches.length === 0) return;
    _currentMatchIdx = (_currentMatchIdx - 1 + _searchMatches.length) % _searchMatches.length;
    _highlightMatch();
  }

  function _highlightMatch() {
    const ta = document.getElementById('code-ta');
    const query = document.getElementById('es-find').value;
    const countTag = document.getElementById('es-count');
    if (!ta || _currentMatchIdx < 0 || !_searchMatches[_currentMatchIdx]) return;

    const start = _searchMatches[_currentMatchIdx];
    ta.focus();
    ta.setSelectionRange(start, start + query.length);
    if (countTag) countTag.textContent = `${_currentMatchIdx + 1}/${_searchMatches.length}`;
  }

  function replaceOne() {
    const findQ = document.getElementById('es-find').value;
    const repQ = document.getElementById('es-replace').value;
    const ta = document.getElementById('code-ta');
    if (!findQ || !ta || _currentMatchIdx === -1) return;

    const start = _searchMatches[_currentMatchIdx];
    ta.value = ta.value.substring(0, start) + repQ + ta.value.substring(start + findQ.length);
    _updateCurrentTabCode(ta.value);
    _updateGutterAndStats();
    _performSearch();
    Toast.show('Replaced 1 match.');
  }

  function replaceAll() {
    const findQ = document.getElementById('es-find').value;
    const repQ = document.getElementById('es-replace').value;
    const ta = document.getElementById('code-ta');
    if (!findQ || !ta) return;

    const count = _searchMatches.length || (ta.value.split(findQ).length - 1);
    ta.value = ta.value.replaceAll(findQ, repQ);
    _updateCurrentTabCode(ta.value);
    _updateGutterAndStats();
    _performSearch();
    Toast.show(`Replaced ${count} occurrences.`);
  }

  // ── Mode & Settings ──
  function setMode(mode, btn) {
    _activeMode = mode;
    document.querySelectorAll('.mode-pill').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    Toast.show(`Review Mode: ${mode.replace('_', ' ').toUpperCase()}`);
  }

  function toggleLanguageTone() {
    _languageTone = _languageTone === 'english' ? 'hinglish' : 'english';
    const btn = document.getElementById('tone-btn');
    const lbl = document.getElementById('tone-label');
    const flag = document.getElementById('tone-flag');

    if (_languageTone === 'hinglish') {
      btn.classList.add('active');
      lbl.textContent = 'Hinglish: ON';
      flag.textContent = '🇮🇳';
      Toast.show('Hinglish Mode ON: Explanations in friendly Hindi + English!', 'ok');
    } else {
      btn.classList.remove('active');
      lbl.textContent = 'Hinglish: OFF';
      flag.textContent = '🇬🇧';
      Toast.show('Standard English Mode selected.');
    }
  }

  function toggleCustomPrompt() {
    const drawer = document.getElementById('custom-prompt-drawer');
    const btn = document.getElementById('custom-prompt-btn');
    if (!drawer) return;
    const isHidden = drawer.style.display === 'none';
    drawer.style.display = isHidden ? 'flex' : 'none';
    if (btn) btn.classList.toggle('active', isHidden);
    if (isHidden) {
      document.getElementById('custom-prompt-input').focus();
    }
  }

  function toggleIndentSize() {
    _indentSize = _indentSize === 2 ? 4 : 2;
    document.getElementById('indent-tag').textContent = `Spaces: ${_indentSize}`;
    Toast.show(`Indentation set to ${_indentSize} spaces.`);
  }

  function setTheme(theme, save = true) {
    const col = document.getElementById('editor-col');
    if (!col) return;
    col.className = 'editor-col ' + theme;
    if (save) localStorage.setItem('cs_editor_theme', theme);
  }

  function zoom(delta) {
    _fontSize = Math.max(11, Math.min(22, _fontSize + delta));
    const container = document.getElementById('editor-container');
    if (container) {
      container.style.setProperty('--editor-font-size', _fontSize + 'px');
    }
    const ta = document.getElementById('code-ta');
    if (ta) ta.style.fontSize = '';
    const gutter = document.getElementById('editor-gutter');
    if (gutter) gutter.style.fontSize = '';
    _updateGutterAndStats();
    Toast.show(`Editor zoom: ${_fontSize}px`);
  }

  function toggleFocus() {
    const layout = document.getElementById('review-layout');
    const btn = document.getElementById('focus-btn');
    if (!layout) return;
    const isExpanded = layout.classList.toggle('editor-expanded');
    if (btn) {
      btn.innerHTML = isExpanded ? '<i class="ti ti-minimize"></i>' : '<i class="ti ti-maximize"></i>';
      btn.classList.toggle('active', isExpanded);
      btn.title = isExpanded ? 'Restore Split View (Click to restore results)' : 'Expand Editor to Full Width';
    }
    _updateGutterAndStats();
    Toast.show(isExpanded ? 'Editor Expanded (Full Width)' : 'Restored Split View');
  }

  function onLangChange(lang) {
    const tab = _getCurrentTab();
    if (tab) {
      tab.lang = lang;
      const ext = Object.keys(EXT_MAP).find(k => EXT_MAP[k] === lang) || 'txt';
      const parts = tab.name.split('.');
      if (parts.length > 1) {
        parts[parts.length - 1] = ext;
        tab.name = parts.join('.');
      }
      _renderTabs();
      _saveState();
    }
  }

  function fmtCode() {
    if (_hl) toggleHL();
    const ta = document.getElementById('code-ta');
    if (!ta.value.trim()) return;

    // Smart indent formatter
    const lines = ta.value.split('\n');
    let indentLevel = 0;
    const formatted = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';

      // Decrease indent if closing bracket starts the line
      if (/^[}\]\)]/.test(trimmed)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const res = ' '.repeat(indentLevel * _indentSize) + trimmed;

      // Increase indent if line opens a block
      if (/[{\[\(:]$/.test(trimmed)) {
        indentLevel++;
      }
      return res;
    }).join('\n');

    ta.value = formatted;
    _updateCurrentTabCode(formatted);
    _updateGutterAndStats();
    Toast.show('Code formatted beautifully! ✨', 'ok');
  }

  function cpyCode() {
    const c = getCode();
    if (!c) { Toast.show('Nothing to copy.', 'err'); return; }
    navigator.clipboard.writeText(c).then(() => Toast.show('Code copied to clipboard! 📋', 'ok')).catch(() => Toast.show('Copy failed.', 'err'));
  }

  function clrEditor() {
    if (_hl) toggleHL();
    const ta = document.getElementById('code-ta');
    ta.value = '';
    _updateCurrentTabCode('');
    _updateGutterAndStats();
    Results.clear();
    Toast.show('Editor cleared.');
  }

  function getCode() {
    return (document.getElementById('code-ta')?.value || '').trim();
  }

  function getLang() {
    return document.getElementById('lang-sel')?.value || 'Python';
  }

  function getOptions() {
    const customInput = document.getElementById('custom-prompt-input');
    return {
      mode: _activeMode,
      languageStyle: _languageTone,
      customInstruction: customInput ? customInput.value.trim() : ''
    };
  }

  function toggleHL() {
    _hl = !_hl;
    const ta = document.getElementById('code-ta');
    const pv = document.getElementById('hl-view');
    if (!ta || !pv) return;

    if (_hl) {
      const lang = LANG_MAP[getLang()] || 'plaintext';
      const h = hljs.highlight(ta.value || '', { language: lang, ignoreIllegals: true }).value;
      pv.innerHTML = `<pre><code class="hljs language-${lang}">${h}</code></pre>`;
      pv.style.display = 'block';
      ta.style.display = 'none';
    } else {
      pv.style.display = 'none';
      ta.style.display = 'block';
    }
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return {
    init,
    getCode,
    getLang,
    getOptions,
    addTab,
    selectTab,
    closeTab,
    onLangChange,
    handleFileInput,
    openPresetsModal,
    closePresetsModal,
    setPresetTag,
    filterPresets,
    loadPreset,
    toggleSearch,
    onFindKey,
    onReplaceKey,
    findNext,
    findPrev,
    replaceOne,
    replaceAll,
    setMode,
    toggleLanguageTone,
    toggleCustomPrompt,
    toggleIndentSize,
    setTheme,
    zoom,
    toggleFocus,
    toggleHL,
    fmtCode,
    cpyCode,
    clrEditor
  };
})();

function toggleHL() { Editor.toggleHL(); }
function fmtCode() { Editor.fmtCode(); }
function cpyCode() { Editor.cpyCode(); }
function loadEx() { Editor.openPresetsModal(); }
function clrEditor() { Editor.clrEditor(); }
