/* CCTools AI - docs assistant widget. Premium, self-contained, vanilla JS.
   Mintlify auto-injects any root .js globally. Designed to be reusable in the
   main app (cctools2) later. Talks to our own endpoint, answers from the docs. */
(function () {
  "use strict";
  if (window.__cctoolsAI) return;
  window.__cctoolsAI = true;

  // Local `mint dev` against a local backend: swap to http://localhost:3002/...
  var ENDPOINT = "https://api.cctools.network/api/ai/docs-chat";

  var SUGGESTIONS = [
    "How do I add a wallet?",
    "How does the XP system work?",
    "How are campaign winners chosen?",
  ];

  var history = [];
  var busy = false;
  var opened = false;

  // ---- icons --------------------------------------------------------------
  var SPARK =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 2.2l1.7 4.8a4 4 0 0 0 2.5 2.5l4.8 1.7-4.8 1.7a4 4 0 0 0-2.5 2.5L12 20.2l-1.7-4.8a4 4 0 0 0-2.5-2.5L3 11.2l4.8-1.7a4 4 0 0 0 2.5-2.5z"/>' +
    '<path d="M19 2.6l.55 1.55L21.1 4.7l-1.55.55L19 6.8l-.55-1.55L16.9 4.7l1.55-.55z" opacity=".75"/></svg>';
  var SEND =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  var CLOSE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var DOC =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/></svg>';

  // ---- styles -------------------------------------------------------------
  var CSS = [
    "#ccai,#ccai *{box-sizing:border-box}",
    "#ccai{--lime:#e6ff6a;--bg:#0b0d12;--surface:#13161f;--surface2:#1a1e29;",
    "--t1:#eef0f5;--t2:#8b93a4;--border:rgba(255,255,255,.08);--limeb:rgba(230,255,106,.22);",
    "font-family:inherit}",

    /* launcher */
    "#ccai-fab{position:fixed;right:22px;bottom:22px;z-index:2147483000;display:flex;align-items:center;gap:8px;",
    "padding:11px 16px 11px 13px;border:1px solid var(--limeb);border-radius:100px;cursor:pointer;",
    "background:linear-gradient(180deg,#161a24,#0e1118);color:var(--t1);font-size:13.5px;font-weight:600;letter-spacing:-.01em;",
    "box-shadow:0 8px 30px rgba(0,0,0,.45),0 0 0 0 rgba(230,255,106,.0);transition:transform .18s cubic-bezier(.2,.8,.2,1),box-shadow .3s,border-color .3s}",
    "#ccai-fab:hover{transform:translateY(-2px);border-color:rgba(230,255,106,.5);box-shadow:0 12px 36px rgba(0,0,0,.5),0 0 24px rgba(230,255,106,.18)}",
    "#ccai-fab .ic{width:20px;height:20px;color:var(--lime);filter:drop-shadow(0 0 6px rgba(230,255,106,.5));animation:ccai-tw 3.2s ease-in-out infinite}",
    "@keyframes ccai-tw{0%,100%{opacity:.85;transform:scale(1) rotate(0)}50%{opacity:1;transform:scale(1.12) rotate(8deg)}}",
    "#ccai-fab.hide{opacity:0;pointer-events:none;transform:scale(.8)}",

    /* panel */
    "#ccai-panel{position:fixed;right:22px;bottom:22px;z-index:2147483001;width:404px;max-width:calc(100vw - 32px);",
    "height:640px;max-height:calc(100vh - 44px);display:none;flex-direction:column;overflow:hidden;",
    "background:radial-gradient(120% 80% at 50% -10%,rgba(230,255,106,.06),transparent 60%),var(--bg);",
    "border:1px solid var(--border);border-radius:20px;backdrop-filter:blur(12px);",
    "box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.02) inset;",
    "opacity:0;transform:translateY(12px) scale(.985);transition:opacity .22s ease,transform .26s cubic-bezier(.2,.8,.2,1)}",
    "#ccai-panel.open{display:flex}#ccai-panel.show{opacity:1;transform:none}",

    /* header */
    "#ccai-hd{display:flex;align-items:center;gap:11px;padding:15px 16px 14px;border-bottom:1px solid var(--border)}",
    ".ccai-av{flex:none;width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;",
    "background:radial-gradient(120% 120% at 30% 20%,rgba(230,255,106,.22),rgba(230,255,106,.05));border:1px solid var(--limeb)}",
    ".ccai-av svg{width:19px;height:19px;color:var(--lime)}",
    "#ccai-hd .tt{flex:1;min-width:0}",
    "#ccai-hd .tt b{display:block;color:var(--t1);font-size:14px;font-weight:650;letter-spacing:-.01em}",
    "#ccai-hd .tt span{display:block;color:var(--t2);font-size:11.5px;margin-top:1px}",
    "#ccai-x{flex:none;width:30px;height:30px;border-radius:8px;border:1px solid transparent;background:none;color:var(--t2);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.15s}",
    "#ccai-x svg{width:17px;height:17px}#ccai-x:hover{background:var(--surface2);color:var(--t1)}",

    /* messages */
    "#ccai-msgs{flex:1;overflow-y:auto;padding:18px 16px;display:flex;flex-direction:column;gap:16px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.14) transparent}",
    "#ccai-msgs::-webkit-scrollbar{width:8px}#ccai-msgs::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:8px;border:2px solid transparent;background-clip:padding-box}",
    ".ccai-row{display:flex;gap:10px;animation:ccai-up .26s cubic-bezier(.2,.8,.2,1) both}",
    "@keyframes ccai-up{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}",
    ".ccai-row.u{justify-content:flex-end}",
    ".ccai-row .mav{flex:none;width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:rgba(230,255,106,.08);border:1px solid var(--limeb);margin-top:1px}",
    ".ccai-row .mav svg{width:15px;height:15px;color:var(--lime)}",
    ".ccai-u-b{max-width:82%;background:var(--lime);color:#0b0d12;font-size:13.5px;line-height:1.5;padding:9px 13px;border-radius:14px 14px 4px 14px;font-weight:500}",
    ".ccai-a{max-width:88%;color:var(--t1);font-size:13.5px;line-height:1.62}",
    ".ccai-a p{margin:0 0 9px}.ccai-a p:last-child{margin-bottom:0}",
    ".ccai-a strong{color:#fff;font-weight:650}",
    ".ccai-a a{color:var(--lime);text-decoration:none;border-bottom:1px solid rgba(230,255,106,.35)}.ccai-a a:hover{border-bottom-color:var(--lime)}",
    ".ccai-a .cct-h{color:#fff;font-weight:650;letter-spacing:-.01em;margin:13px 0 7px;font-size:13.5px}.ccai-a .cct-h:first-child{margin-top:0}",
    ".ccai-a ul,.ccai-a ol{margin:0 0 9px;padding-left:18px}.ccai-a li{margin:3px 0}",
    ".ccai-a ul{list-style:none;padding-left:4px}.ccai-a ul li{position:relative;padding-left:15px}",
    ".ccai-a ul li:before{content:'';position:absolute;left:1px;top:8px;width:5px;height:5px;border-radius:50%;background:var(--lime)}",
    ".ccai-a .cct-code{background:var(--surface2);border:1px solid var(--border);border-radius:5px;padding:1px 5px;font-size:12px;font-family:ui-monospace,Menlo,Consolas,monospace}",
    ".ccai-a .cct-pre{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:11px 12px;overflow-x:auto;margin:0 0 9px}",
    ".ccai-a .cct-pre code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;color:#d6dae2;white-space:pre}",
    ".ccai-src{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}",
    ".ccai-src a{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:var(--t1);background:var(--surface);",
    "border:1px solid var(--border);border-radius:9px;padding:5px 10px;text-decoration:none;transition:.15s;max-width:100%}",
    ".ccai-src a:hover{border-color:var(--limeb);background:var(--surface2)}",
    ".ccai-src a svg{width:13px;height:13px;color:var(--lime);flex:none}.ccai-src a span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",

    /* thinking */
    ".ccai-think{display:flex;gap:4px;align-items:center;height:20px}",
    ".ccai-think i{width:6px;height:6px;border-radius:50%;background:var(--t2);animation:ccai-b 1.2s ease-in-out infinite}",
    ".ccai-think i:nth-child(2){animation-delay:.15s}.ccai-think i:nth-child(3){animation-delay:.3s}",
    "@keyframes ccai-b{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}",

    /* empty state */
    ".ccai-empty{margin:auto 0;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:8px}",
    ".ccai-empty .big{width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:6px;",
    "background:radial-gradient(120% 120% at 30% 20%,rgba(230,255,106,.22),rgba(230,255,106,.04));border:1px solid var(--limeb)}",
    ".ccai-empty .big svg{width:26px;height:26px;color:var(--lime);filter:drop-shadow(0 0 8px rgba(230,255,106,.4))}",
    ".ccai-empty h4{margin:0;color:var(--t1);font-size:15px;font-weight:650;letter-spacing:-.01em}",
    ".ccai-empty p{margin:0;color:var(--t2);font-size:12.5px;line-height:1.5;max-width:260px}",
    ".ccai-chips{display:flex;flex-direction:column;gap:8px;width:100%;margin-top:14px}",
    ".ccai-chip{text-align:left;background:var(--surface);border:1px solid var(--border);border-radius:11px;color:var(--t1);",
    "font-size:13px;padding:11px 13px;cursor:pointer;transition:.15s;font-family:inherit;display:flex;align-items:center;gap:9px}",
    ".ccai-chip:hover{border-color:var(--limeb);background:var(--surface2);transform:translateX(2px)}",
    ".ccai-chip svg{width:14px;height:14px;color:var(--lime);flex:none}",

    /* composer */
    "#ccai-foot{padding:12px 14px 13px;border-top:1px solid var(--border)}",
    "#ccai-form{display:flex;align-items:flex-end;gap:9px;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:7px 7px 7px 13px;transition:border-color .18s}",
    "#ccai-form:focus-within{border-color:var(--limeb)}",
    "#ccai-in{flex:1;background:none;border:none;outline:none;color:var(--t1);font-size:13.5px;font-family:inherit;resize:none;max-height:96px;line-height:1.5;padding:5px 0}",
    "#ccai-in::placeholder{color:var(--t2)}",
    "#ccai-send{flex:none;width:34px;height:34px;border-radius:10px;border:none;background:var(--lime);color:#0b0d12;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.15s}",
    "#ccai-send svg{width:18px;height:18px}#ccai-send:disabled{opacity:.35;cursor:default}#ccai-send:not(:disabled):hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(230,255,106,.3)}",
    "#ccai-dis{text-align:center;color:var(--t2);font-size:10.5px;margin-top:9px;opacity:.8}",

    "@media (max-width:520px){#ccai-panel{right:8px;left:8px;bottom:8px;width:auto;height:calc(100vh - 16px);max-height:none;border-radius:18px}#ccai-fab{right:14px;bottom:14px}}",
  ].join("");

  function E(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }

  // ---- safe rich markdown -------------------------------------------------
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function inlineMd(t) {
    return esc(t)
      .replace(/`([^`]+)`/g, '<code class="cct-code">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
  function renderMd(src) {
    var lines = String(src).replace(/\r/g, "").split("\n");
    var out = [], i = 0;
    while (i < lines.length) {
      var line = lines[i];
      if (/^```/.test(line)) {
        var code = []; i++;
        while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
        i++;
        out.push('<pre class="cct-pre"><code>' + esc(code.join("\n")) + "</code></pre>");
        continue;
      }
      var h = line.match(/^(#{1,4})\s+(.*)/);
      if (h) { out.push('<div class="cct-h">' + inlineMd(h[2]) + "</div>"); i++; continue; }
      if (/^\s*[-*]\s+/.test(line)) {
        var ul = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { ul.push("<li>" + inlineMd(lines[i].replace(/^\s*[-*]\s+/, "")) + "</li>"); i++; }
        out.push("<ul>" + ul.join("") + "</ul>"); continue;
      }
      if (/^\s*\d+\.\s+/.test(line)) {
        var ol = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { ol.push("<li>" + inlineMd(lines[i].replace(/^\s*\d+\.\s+/, "")) + "</li>"); i++; }
        out.push("<ol>" + ol.join("") + "</ol>"); continue;
      }
      if (/^\s*$/.test(line)) { i++; continue; }
      var para = [line]; i++;
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,4}\s|```|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])) { para.push(lines[i]); i++; }
      out.push("<p>" + inlineMd(para.join(" ")) + "</p>");
    }
    return out.join("");
  }

  var panel, msgs, input, sendBtn, fab;

  function mount() {
    document.head.appendChild(E("style", null, CSS));
    var root = E("div", { id: "ccai" });

    fab = E("button", { id: "ccai-fab", "aria-label": "Ask CCTools AI" },
      '<span class="ic">' + SPARK + "</span><span>Ask AI</span>");
    fab.onclick = open;
    root.appendChild(fab);

    panel = E("div", { id: "ccai-panel", role: "dialog", "aria-label": "CCTools AI assistant" });
    var hd = E("div", { id: "ccai-hd" },
      '<div class="ccai-av">' + SPARK + "</div>" +
      '<div class="tt"><b>CCTools AI</b><span>Answers from the docs</span></div>');
    var x = E("button", { id: "ccai-x", "aria-label": "Close" }, CLOSE);
    x.onclick = close; hd.appendChild(x);
    panel.appendChild(hd);

    msgs = E("div", { id: "ccai-msgs" });
    panel.appendChild(msgs);

    var foot = E("div", { id: "ccai-foot" });
    var form = E("form", { id: "ccai-form" });
    input = E("textarea", { id: "ccai-in", rows: "1", placeholder: "Ask about CCTools...", "aria-label": "Message" });
    sendBtn = E("button", { id: "ccai-send", type: "submit", "aria-label": "Send" }, SEND);
    form.appendChild(input); form.appendChild(sendBtn);
    foot.appendChild(form);
    foot.appendChild(E("div", { id: "ccai-dis" }, "AI can be wrong. Double-check the docs."));
    panel.appendChild(foot);

    root.appendChild(panel);
    document.body.appendChild(root);

    form.addEventListener("submit", function (e) { e.preventDefault(); send(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input.value); }
    });
    input.addEventListener("input", function () {
      input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 96) + "px";
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && opened) close(); });

    renderEmpty();
  }

  function renderEmpty() {
    msgs.innerHTML = "";
    var wrap = E("div", { class: "ccai-empty" },
      '<div class="big">' + SPARK + "</div>" +
      "<h4>Ask the CCTools docs</h4>" +
      "<p>Get instant answers on wallets, XP, campaigns, the ecosystem, and more.</p>");
    var chips = E("div", { class: "ccai-chips" });
    SUGGESTIONS.forEach(function (q) {
      var c = E("button", { class: "ccai-chip", type: "button" }, SPARK + "<span>" + esc(q) + "</span>");
      c.onclick = function () { send(q); };
      chips.appendChild(c);
    });
    wrap.appendChild(chips);
    msgs.appendChild(wrap);
  }

  function open() {
    opened = true;
    fab.classList.add("hide");
    panel.classList.add("open");
    requestAnimationFrame(function () { panel.classList.add("show"); });
    setTimeout(function () { input && input.focus(); }, 120);
  }
  function close() {
    opened = false;
    panel.classList.remove("show");
    fab.classList.remove("hide");
    setTimeout(function () { if (!opened) panel.classList.remove("open"); }, 240);
  }

  function row(role) {
    var r = E("div", { class: "ccai-row " + role });
    if (role === "a") r.appendChild(E("div", { class: "mav" }, SPARK));
    var body = E("div", { class: role === "u" ? "ccai-u-b" : "ccai-a" });
    r.appendChild(body);
    msgs.appendChild(r);
    msgs.scrollTop = msgs.scrollHeight;
    return body;
  }

  function send(text) {
    if (busy) return;
    var q = (text || "").trim();
    if (q.length < 2) return;
    if (msgs.querySelector(".ccai-empty")) msgs.innerHTML = "";
    input.value = ""; input.style.height = "auto";

    row("u").textContent = q;
    var ans = row("a");
    ans.innerHTML = '<div class="ccai-think"><i></i><i></i><i></i></div>';
    busy = true; sendBtn.disabled = true;

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q, lang: navigator.language || "", history: history.slice(-4) }),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) { ans.innerHTML = "<p>" + esc((res.d && res.d.error) || "Something went wrong. Please try again.") + "</p>"; return; }
        var d = res.d;
        var html = renderMd(d.answer || "");
        if (d.sources && d.sources.length) {
          html += '<div class="ccai-src">' + d.sources.map(function (s) {
            return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + DOC + "<span>" + esc(s.title) + "</span></a>";
          }).join("") + "</div>";
        }
        ans.innerHTML = html;
        history.push({ role: "user", content: q });
        history.push({ role: "assistant", content: d.answer || "" });
        msgs.scrollTop = msgs.scrollHeight;
      })
      .catch(function () { ans.innerHTML = "<p>Network error. Please try again.</p>"; })
      .finally(function () { busy = false; sendBtn.disabled = false; input.focus(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
