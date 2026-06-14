/* CCTools AI - docs assistant widget. Vanilla, self-contained, reusable in prod.
   Visual language mirrors the CCTools v2 product (sharp 2px corners, flat
   elevated surfaces, subtle shadow not glow, restrained lime accent, mono
   section labels, lucide line icons). Deliberately NOT a generic AI chatbot:
   no sparkle, no gradients, no glow, no blurred orbs. Answers from the docs. */
(function () {
  "use strict";
  if (window.__cctoolsAI) return;
  window.__cctoolsAI = true;

  // Local `mint dev` against a local backend: swap to http://localhost:3002/...
  var ENDPOINT = "https://api.cctools.network/api/ai/docs-chat";
  var MARK = "/logo/cctools.png"; // CCTools gear-C brand mark (lime square)

  var SUGGESTIONS = [
    "How do I add a wallet?",
    "How does the XP system work?",
    "How are campaign winners chosen?",
  ];

  var history = [];
  var busy = false;
  var openState = false;

  // lucide-style line icons (currentColor)
  var I_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var I_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M12 5l7 7-7 7"/></svg>';
  var I_DOC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M16 21H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6l4 4v12a2 2 0 0 1-2 2z"/></svg>';
  var I_ARR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  var CSS = [
    "#ccai,#ccai *{box-sizing:border-box}",
    "#ccai{--lime:#e6ff6a;--lime-soft:#c9dc4a;--lime-dim:rgba(230,255,106,.08);--lime-bd:rgba(230,255,106,.16);--navy:#00273f;",
    "--bg:#10131c;--elev:#161924;--card:#181b24;--cardh:#1c1f2a;--surface:#20232d;",
    "--t1:#dadce6;--t2:#8b93a4;--t3:#5b6473;--bd:rgba(255,255,255,.08);--bdh:rgba(255,255,255,.14);",
    "--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;",
    "--shadow:0 1px 2px rgba(0,0,0,.5),0 16px 40px rgba(0,0,0,.45);font-family:inherit}",
    ".ccai-lbl{font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--t3)}",

    /* launcher: flat dark elevated, sharp, brand mark, no glow/pulse */
    "#ccai-fab{position:fixed;right:20px;bottom:20px;z-index:2147483000;display:flex;align-items:center;gap:9px;",
    "padding:9px 14px 9px 9px;border:1px solid var(--bd);border-radius:var(--r,6px);cursor:pointer;",
    "background:var(--elev);color:var(--t1);font-size:13px;font-weight:600;letter-spacing:-.01em;box-shadow:var(--shadow);",
    "transition:background .15s,border-color .15s,transform .15s}",
    "#ccai-fab:hover{background:var(--cardh);border-color:var(--bdh);transform:translateY(-1px)}",
    "#ccai-fab img{width:22px;height:22px;border-radius:4px;display:block}",
    "#ccai-fab.hide{display:none}",

    /* panel: sharp 2px, flat elevated, subtle shadow, NO gradient/blur */
    "#ccai-panel{position:fixed;right:20px;bottom:20px;z-index:2147483001;width:400px;max-width:calc(100vw - 28px);",
    "height:620px;max-height:calc(100vh - 40px);display:none;flex-direction:column;overflow:hidden;",
    "background:var(--bg);border:1px solid var(--bd);border-radius:2px;box-shadow:var(--shadow);",
    "opacity:0;transform:translateY(8px);transition:opacity .18s ease,transform .2s ease}",
    "#ccai-panel.open{display:flex}#ccai-panel.show{opacity:1;transform:none}",

    /* header */
    "#ccai-hd{display:flex;align-items:center;gap:10px;padding:13px 14px;border-bottom:1px solid var(--bd);background:var(--elev)}",
    "#ccai-hd img{width:26px;height:26px;border-radius:4px;display:block;flex:none}",
    "#ccai-hd .tt{flex:1;min-width:0;line-height:1.25}",
    "#ccai-hd .tt b{display:block;color:var(--t1);font-size:13.5px;font-weight:650;letter-spacing:-.01em}",
    "#ccai-hd .tt .ccai-lbl{margin-top:2px}",
    "#ccai-x{flex:none;width:28px;height:28px;border-radius:4px;border:none;background:none;color:var(--t3);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.15s}",
    "#ccai-x svg{width:16px;height:16px}#ccai-x:hover{background:var(--surface);color:var(--t1)}",

    /* messages */
    "#ccai-msgs{flex:1;overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;gap:14px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.12) transparent}",
    "#ccai-msgs::-webkit-scrollbar{width:7px}#ccai-msgs::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:0}",
    ".ccai-row{display:flex;animation:ccai-in .18s ease both}",
    "@keyframes ccai-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}",
    ".ccai-row.u{justify-content:flex-end}",
    ".ccai-u-b{max-width:84%;background:var(--lime);color:var(--navy);font-size:13px;line-height:1.5;padding:8px 12px;border-radius:4px;font-weight:550}",
    ".ccai-a{max-width:100%;color:var(--t1);font-size:13.5px;line-height:1.62}",
    ".ccai-a>.ccai-lbl{display:block;margin-bottom:6px}",
    ".ccai-a p{margin:0 0 8px}.ccai-a p:last-child{margin-bottom:0}",
    ".ccai-a strong{color:#fff;font-weight:650}",
    ".ccai-a a{color:var(--lime-soft);text-decoration:none;border-bottom:1px solid rgba(201,220,74,.35)}.ccai-a a:hover{border-bottom-color:var(--lime-soft)}",
    ".ccai-a .cct-h{color:#fff;font-weight:650;margin:12px 0 6px;font-size:13.5px}.ccai-a .cct-h:first-child{margin-top:0}",
    ".ccai-a ul,.ccai-a ol{margin:0 0 8px;padding-left:4px;list-style:none}",
    ".ccai-a ol{counter-reset:ci}.ccai-a li{position:relative;padding-left:18px;margin:4px 0}",
    ".ccai-a ul li:before{content:'';position:absolute;left:3px;top:8px;width:4px;height:4px;background:var(--lime-soft)}",
    ".ccai-a ol li:before{counter-increment:ci;content:counter(ci);position:absolute;left:0;top:0;font-family:var(--mono);font-size:11px;color:var(--lime-soft)}",
    ".ccai-a .cct-code{background:var(--surface);border:1px solid var(--bd);border-radius:3px;padding:1px 5px;font-family:var(--mono);font-size:12px}",
    ".ccai-a .cct-pre{background:var(--elev);border:1px solid var(--bd);border-radius:2px;padding:10px 11px;overflow-x:auto;margin:0 0 8px}",
    ".ccai-a .cct-pre code{font-family:var(--mono);font-size:12px;color:#cfd3db;white-space:pre}",
    ".ccai-src{margin-top:12px;display:flex;flex-direction:column;gap:5px}",
    ".ccai-src a{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--t2);background:var(--card);",
    "border:1px solid var(--bd);border-radius:2px;padding:7px 9px;text-decoration:none;transition:.13s}",
    ".ccai-src a:hover{background:var(--cardh);border-color:var(--bdh);color:var(--t1)}",
    ".ccai-src a svg{width:14px;height:14px;color:var(--t3);flex:none}.ccai-src a span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",

    /* thinking */
    ".ccai-think{display:flex;gap:4px;align-items:center;height:18px}",
    ".ccai-think i{width:5px;height:5px;background:var(--t3);animation:ccai-b 1.1s ease-in-out infinite}",
    ".ccai-think i:nth-child(2){animation-delay:.14s}.ccai-think i:nth-child(3){animation-delay:.28s}",
    "@keyframes ccai-b{0%,70%,100%{opacity:.3}35%{opacity:1}}",

    /* empty */
    ".ccai-empty{margin:auto 0;display:flex;flex-direction:column;gap:5px;padding:4px 2px}",
    ".ccai-empty img{width:30px;height:30px;border-radius:4px;margin-bottom:6px}",
    ".ccai-empty h4{margin:0;color:var(--t1);font-size:14.5px;font-weight:650;letter-spacing:-.01em}",
    ".ccai-empty p{margin:0;color:var(--t2);font-size:12.5px;line-height:1.5}",
    ".ccai-sg{margin-top:14px;display:flex;flex-direction:column;gap:1px}",
    ".ccai-sg>.ccai-lbl{margin-bottom:7px}",
    ".ccai-chip{display:flex;align-items:center;gap:9px;width:100%;text-align:left;background:transparent;border:1px solid var(--bd);",
    "border-radius:2px;color:var(--t2);font-size:12.5px;padding:9px 11px;cursor:pointer;font-family:inherit;transition:.13s;margin-bottom:6px}",
    ".ccai-chip:hover{background:var(--card);border-color:var(--bdh);color:var(--t1)}",
    ".ccai-chip span{flex:1}.ccai-chip svg{width:14px;height:14px;color:var(--t3);flex:none}",

    /* composer */
    "#ccai-foot{padding:11px 13px 12px;border-top:1px solid var(--bd);background:var(--elev)}",
    "#ccai-form{display:flex;align-items:flex-end;gap:8px;background:var(--bg);border:1px solid var(--bd);border-radius:2px;padding:6px 6px 6px 11px;transition:border-color .15s}",
    "#ccai-form:focus-within{border-color:var(--lime-bd)}",
    "#ccai-in{flex:1;background:none;border:none;outline:none;color:var(--t1);font-size:13px;font-family:inherit;resize:none;max-height:92px;line-height:1.5;padding:4px 0}",
    "#ccai-in::placeholder{color:var(--t3)}",
    "#ccai-send{flex:none;width:32px;height:32px;border-radius:2px;border:none;background:var(--lime);color:var(--navy);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.13s}",
    "#ccai-send svg{width:17px;height:17px}#ccai-send:disabled{opacity:.35;cursor:default}#ccai-send:not(:disabled):hover{background:var(--lime-soft)}",
    "#ccai-dis{text-align:center;color:var(--t3);font-size:10.5px;margin-top:8px}",

    "@media (max-width:520px){#ccai-panel{right:8px;left:8px;bottom:8px;width:auto;height:calc(100vh - 16px);max-height:none}#ccai-fab{right:12px;bottom:12px}}",
  ].join("");

  function E(t, a, h) { var e = document.createElement(t); if (a) for (var k in a) e.setAttribute(k, a[k]); if (h != null) e.innerHTML = h; return e; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function inlineMd(t) {
    return esc(t)
      .replace(/`([^`]+)`/g, '<code class="cct-code">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
  function renderMd(src) {
    var lines = String(src).replace(/\r/g, "").split("\n"), out = [], i = 0;
    while (i < lines.length) {
      var line = lines[i];
      if (/^```/.test(line)) { var c = []; i++; while (i < lines.length && !/^```/.test(lines[i])) { c.push(lines[i]); i++; } i++; out.push('<pre class="cct-pre"><code>' + esc(c.join("\n")) + "</code></pre>"); continue; }
      var h = line.match(/^(#{1,4})\s+(.*)/); if (h) { out.push('<div class="cct-h">' + inlineMd(h[2]) + "</div>"); i++; continue; }
      if (/^\s*[-*]\s+/.test(line)) { var u = []; while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { u.push("<li>" + inlineMd(lines[i].replace(/^\s*[-*]\s+/, "")) + "</li>"); i++; } out.push("<ul>" + u.join("") + "</ul>"); continue; }
      if (/^\s*\d+\.\s+/.test(line)) { var o = []; while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { o.push("<li>" + inlineMd(lines[i].replace(/^\s*\d+\.\s+/, "")) + "</li>"); i++; } out.push("<ol>" + o.join("") + "</ol>"); continue; }
      if (/^\s*$/.test(line)) { i++; continue; }
      var p = [line]; i++; while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,4}\s|```|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])) { p.push(lines[i]); i++; }
      out.push("<p>" + inlineMd(p.join(" ")) + "</p>");
    }
    return out.join("");
  }

  var panel, msgs, input, sendBtn, fab;

  function mount() {
    document.head.appendChild(E("style", null, CSS));
    var root = E("div", { id: "ccai" });

    fab = E("button", { id: "ccai-fab", "aria-label": "Ask CCTools AI" }, '<img src="' + MARK + '" alt=""><span>Ask AI</span>');
    fab.onclick = openPanel;
    root.appendChild(fab);

    panel = E("div", { id: "ccai-panel", role: "dialog", "aria-label": "CCTools AI" });
    var hd = E("div", { id: "ccai-hd" }, '<img src="' + MARK + '" alt=""><div class="tt"><b>CCTools AI</b><span class="ccai-lbl">Docs assistant</span></div>');
    var x = E("button", { id: "ccai-x", "aria-label": "Close" }, I_CLOSE); x.onclick = closePanel; hd.appendChild(x);
    panel.appendChild(hd);

    msgs = E("div", { id: "ccai-msgs" });
    panel.appendChild(msgs);

    var foot = E("div", { id: "ccai-foot" });
    var form = E("form", { id: "ccai-form" });
    input = E("textarea", { id: "ccai-in", rows: "1", placeholder: "Ask about CCTools...", "aria-label": "Message" });
    sendBtn = E("button", { id: "ccai-send", type: "submit", "aria-label": "Send" }, I_SEND);
    form.appendChild(input); form.appendChild(sendBtn); foot.appendChild(form);
    foot.appendChild(E("div", { id: "ccai-dis" }, "AI can be wrong. Verify with the docs."));
    panel.appendChild(foot);

    root.appendChild(panel);
    document.body.appendChild(root);

    form.addEventListener("submit", function (e) { e.preventDefault(); send(input.value); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input.value); } });
    input.addEventListener("input", function () { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 92) + "px"; });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && openState) closePanel(); });
    renderEmpty();
  }

  function renderEmpty() {
    msgs.innerHTML = "";
    var w = E("div", { class: "ccai-empty" },
      '<img src="' + MARK + '" alt="">' +
      "<h4>Ask the CCTools docs</h4>" +
      "<p>Answers on wallets, XP, campaigns, the ecosystem, and more.</p>");
    var sg = E("div", { class: "ccai-sg" }, '<span class="ccai-lbl">Suggested</span>');
    SUGGESTIONS.forEach(function (q) {
      var c = E("button", { class: "ccai-chip", type: "button" }, "<span>" + esc(q) + "</span>" + I_ARR);
      c.onclick = function () { send(q); };
      sg.appendChild(c);
    });
    w.appendChild(sg); msgs.appendChild(w);
  }

  function openPanel() { openState = true; fab.classList.add("hide"); panel.classList.add("open"); requestAnimationFrame(function () { panel.classList.add("show"); }); setTimeout(function () { input && input.focus(); }, 110); }
  function closePanel() { openState = false; panel.classList.remove("show"); fab.classList.remove("hide"); setTimeout(function () { if (!openState) panel.classList.remove("open"); }, 200); }

  function addRow(role) {
    if (msgs.querySelector(".ccai-empty")) msgs.innerHTML = "";
    var r = E("div", { class: "ccai-row " + role });
    var b = E("div", { class: role === "u" ? "ccai-u-b" : "ccai-a" });
    r.appendChild(b); msgs.appendChild(r); msgs.scrollTop = msgs.scrollHeight; return b;
  }

  function send(text) {
    if (busy) return;
    var q = (text || "").trim(); if (q.length < 2) return;
    input.value = ""; input.style.height = "auto";
    addRow("u").textContent = q;
    var ans = addRow("a");
    ans.innerHTML = '<span class="ccai-lbl">CCTools AI</span><div class="ccai-think"><i></i><i></i><i></i></div>';
    busy = true; sendBtn.disabled = true;

    fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q, lang: navigator.language || "", history: history.slice(-4) }) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) { ans.innerHTML = '<span class="ccai-lbl">CCTools AI</span><p>' + esc((res.d && res.d.error) || "Something went wrong. Please try again.") + "</p>"; return; }
        var d = res.d, html = '<span class="ccai-lbl">CCTools AI</span>' + renderMd(d.answer || "");
        if (d.sources && d.sources.length) {
          html += '<div class="ccai-src">' + d.sources.map(function (s) { return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + I_DOC + "<span>" + esc(s.title) + "</span></a>"; }).join("") + "</div>";
        }
        ans.innerHTML = html;
        history.push({ role: "user", content: q }); history.push({ role: "assistant", content: d.answer || "" });
        msgs.scrollTop = msgs.scrollHeight;
      })
      .catch(function () { ans.innerHTML = '<span class="ccai-lbl">CCTools AI</span><p>Network error. Please try again.</p>'; })
      .finally(function () { busy = false; sendBtn.disabled = false; input.focus(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
