/* editor.js */
const Editor = (() => {
  let _hl = false;
  const LANG_MAP = {
    Python:'python',JavaScript:'javascript',Java:'java','C++':'cpp',
    C:'c',TypeScript:'typescript',Go:'go',Rust:'rust',Kotlin:'kotlin',Swift:'swift'
  };
  const EXAMPLES = {
  Python: `def find_duplicates(arr):
    duplicates = []
    for i in range(len(arr)):
        for j in range(i+1, len(arr)):
            if arr[i] == arr[j] and arr[i] not in duplicates:
                duplicates.append(arr[i])
    return duplicates

print(find_duplicates([1, 2, 3, 2, 4, 3, 5]))`,

  JavaScript: `function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}

console.log(bubbleSort([64,34,25,12,22,11,90]));`,

  Java: `public class Fibonacci {
    public static int fib(int n) {
        if(n <= 1) return n;
        return fib(n-1) + fib(n-2);
    }

    public static void main(String[] args) {
        for(int i=0;i<10;i++)
            System.out.print(fib(i) + " ");
    }
}`,

  "C++": `#include <iostream>
#include <vector>
using namespace std;

int linearSearch(vector<int>& a, int target){
    for(int i=0;i<a.size();i++){
        if(a[i]==target) return i;
    }
    return -1;
}

int main(){
    vector<int> a={2,3,4,10,40};
    cout << linearSearch(a,10);
}`,

  C: `#include <stdio.h>

int main() {
    int arr[] = {1,2,3,4,5};
    int n = 5;

    for(int i=0;i<n;i++) {
        printf("%d ", arr[i]);
    }

    return 0;
}`,

  TypeScript: `function add(a:number,b:number):number{
    return a+b;
}

console.log(add(5,10));`,

  Go: `package main

import "fmt"

func main() {
    fmt.Println("Hello Go")
}`,

  Rust: `fn main() {
    println!("Hello Rust");
}`,

  Kotlin: `fun main() {
    println("Hello Kotlin")
}`,

  Swift: `import Foundation

print("Hello Swift")`
};

  function init() {
    const ta = document.getElementById('code-ta');
    ta.addEventListener('input', _upd);
    ta.addEventListener('keydown', e => {
      if(e.key==='Tab'){
        e.preventDefault();
        const s=ta.selectionStart, end=ta.selectionEnd;
        ta.value=ta.value.substring(0,s)+'  '+ta.value.substring(end);
        ta.selectionStart=ta.selectionEnd=s+2;
        _upd();
      }
    });
    _upd();
  }

  function _upd(){
    const v=document.getElementById('code-ta').value;
    const n=v?v.split('\n').length:0;
    document.getElementById('line-cnt').textContent=`${n} line${n!==1?'s':''}`;
  }

  function getCode(){ return document.getElementById('code-ta').value.trim(); }
  function getLang(){ return document.getElementById('lang-sel').value; }

  function toggleHL(){
    _hl=!_hl;
    const ta=document.getElementById('code-ta');
    const pv=document.getElementById('hl-view');
    const bn=document.getElementById('hl-btn');
    if(_hl){
      const lang=LANG_MAP[getLang()]||'plaintext';
      const h=hljs.highlight(ta.value||'',{language:lang,ignoreIllegals:true}).value;
      pv.innerHTML=`<pre><code class="hljs language-${lang}">${h}</code></pre>`;
      pv.style.display='block'; ta.style.display='none';
      bn.classList.add('active'); bn.innerHTML='<i class="ti ti-edit"></i> Edit';
    } else {
      pv.style.display='none'; ta.style.display='block';
      bn.classList.remove('active'); bn.innerHTML='<i class="ti ti-highlight"></i>';
    }
  }

  function fmtCode(){
    if(_hl) toggleHL();
    const ta=document.getElementById('code-ta');
    ta.value=ta.value.split('\n').map(l=>l.trimEnd()).join('\n').trimEnd();
    _upd(); Toast.show('Formatted.');
  }

  function cpyCode(){
    const c=getCode();
    if(!c){Toast.show('Nothing to copy.','err');return;}
    navigator.clipboard.writeText(c).then(()=>Toast.show('Copied!','ok')).catch(()=>Toast.show('Copy failed.','err'));
  }

  function loadEx(){
  if(_hl) toggleHL();

  const lang = getLang();

  document.getElementById('code-ta').value =
    EXAMPLES[lang] || '';

  _upd();
  Toast.show(`${lang} example loaded.`);
}

  function clrEditor(){
    if(_hl) toggleHL();
    document.getElementById('code-ta').value='';
    _upd(); Results.clear();
  }

  return { init, getCode, getLang, toggleHL, fmtCode, cpyCode, loadEx, clrEditor };
})();

function toggleHL()  { Editor.toggleHL(); }
function fmtCode()   { Editor.fmtCode(); }
function cpyCode()   { Editor.cpyCode(); }
function loadEx()    { Editor.loadEx(); }
function clrEditor() { Editor.clrEditor(); }
