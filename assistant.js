/* CCTools AI - docs assistant widget. Vanilla, self-contained.
   Visually blends into the Mintlify docs theme: it READS the page's real
   background/text/font at runtime and derives soft, rounded surfaces from them,
   so it matches the docs in both dark and light mode instead of guessing hexes.
   No AI-slop tells (no sparkle, no glow, no gradient, no pulse). Brand mark =
   the CCTools gear-C. Answers strictly from the docs. Reusable in the app. */
(function () {
  "use strict";
  if (window.__cctoolsAI) return;
  window.__cctoolsAI = true;

  // Local `mint dev` against a local backend: swap to http://localhost:3002/...
  var ENDPOINT = "https://api.cctools.network/api/ai/docs-chat";
  var MARK = "/logo/cctools.png"; // CCTools gear-C brand mark

  var SUGGESTIONS = [
    "How do I add a wallet?",
    "How does the XP system work?",
    "How are campaign winners chosen?",
  ];

  var history = [];
  var busy = false;
  var openState = false;

  var I_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var I_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';
  var I_DOC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M16 21H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6l4 4v12a2 2 0 0 1-2 2z"/></svg>';
  var I_ARR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';

  // -- theme: read the docs' real colors so we blend in any theme/mode --------
  function rgb(el, prop) { try { return getComputedStyle(el)[prop]; } catch (e) { return ""; } }
  function opaque(c) { return c && c !== "transparent" && c.indexOf("rgba(0, 0, 0, 0") === -1; }
  function luminance(c) { var m = (c || "").match(/\d+(\.\d+)?/g); if (!m) return 0; return (0.299 * +m[0] + 0.587 * +m[1] + 0.114 * +m[2]) / 255; }

  function isDark() {
    var de = document.documentElement;
    if (de.classList.contains("dark")) return true;
    if (de.classList.contains("light")) return false;
    var dt = de.getAttribute("data-theme") || de.style.colorScheme || "";
    if (dt) return dt.indexOf("light") === -1;
    var b = rgb(document.body, "backgroundColor");
    return opaque(b) ? luminance(b) < 0.5 : true;
  }
  function themeVars() {
    var dark = isDark();
    var bgRead = rgb(document.body, "backgroundColor");
    if (!opaque(bgRead)) bgRead = rgb(document.documentElement, "backgroundColor");
    var bg = opaque(bgRead) ? bgRead : (dark ? "#0b0d12" : "#ffffff");
    var text = rgb(document.body, "color") || (dark ? "#e6e8ec" : "#1c1e26");
    var font = rgb(document.body, "fontFamily") || "inherit";
    var o = dark ? "255,255,255" : "17,20,28";
    return {
      "--bg": bg,
      "--soft": "rgba(" + o + ",.035)",
      "--card": "rgba(" + o + ",.05)",
      "--cardh": "rgba(" + o + ",.085)",
      "--bd": "rgba(" + o + ",.10)",
      "--bdh": "rgba(" + o + ",.18)",
      "--t1": text,
      "--t2": dark ? "rgba(255,255,255,.6)" : "rgba(17,20,28,.62)",
      "--accent": dark ? "#e6ff6a" : "#4d7c0f",
      "--cta": "#e6ff6a",
      "--oncta": "#0a0c10",
      "--font": font,
      "--shadow": dark ? "0 1px 2px rgba(0,0,0,.5),0 18px 48px rgba(0,0,0,.5)" : "0 1px 2px rgba(0,0,0,.08),0 18px 48px rgba(0,0,0,.16)",
    };
  }

  var CSS = [
    "#ccai,#ccai *{box-sizing:border-box}",
    "#ccai{font-family:var(--font);--r:16px;--rs:12px}",

    "#ccai-fab{position:fixed;right:22px;bottom:22px;z-index:2147483000;display:flex;align-items:center;gap:8px;",
    "padding:9px 15px 9px 10px;border:1px solid var(--bd);border-radius:100px;cursor:pointer;",
    "background:var(--soft);color:var(--t1);font-size:13.5px;font-weight:600;letter-spacing:-.01em;box-shadow:var(--shadow);",
    "backdrop-filter:blur(8px);transition:background .16s,border-color .16s,transform .16s}",
    "#ccai-fab:hover{background:var(--cardh);border-color:var(--bdh);transform:translateY(-1px)}",
    "#ccai-fab img{width:22px;height:22px;border-radius:6px;display:block}",
    "#ccai-fab.hide{display:none}",

    "#ccai-panel{position:fixed;right:22px;bottom:22px;z-index:2147483001;width:410px;max-width:calc(100vw - 28px);",
    "height:634px;max-height:calc(100vh - 44px);display:none;flex-direction:column;overflow:hidden;",
    "background:var(--bg);border:1px solid var(--bd);border-radius:var(--r);box-shadow:var(--shadow);",
    "opacity:0;transform:translateY(10px) scale(.99);transition:opacity .2s ease,transform .24s cubic-bezier(.2,.8,.2,1)}",
    "#ccai-panel.open{display:flex}#ccai-panel.show{opacity:1;transform:none}",

    "#ccai-hd{display:flex;align-items:center;gap:11px;padding:15px 16px;border-bottom:1px solid var(--bd)}",
    "#ccai-hd img{width:28px;height:28px;border-radius:7px;display:block;flex:none}",
    "#ccai-hd .tt{flex:1;min-width:0;line-height:1.3}",
    "#ccai-hd .tt b{display:block;color:var(--t1);font-size:14px;font-weight:650;letter-spacing:-.01em}",
    "#ccai-hd .tt span{display:block;color:var(--t2);font-size:11.5px;margin-top:1px}",
    "#ccai-x{flex:none;width:30px;height:30px;border-radius:8px;border:none;background:none;color:var(--t2);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.15s}",
    "#ccai-x svg{width:17px;height:17px}#ccai-x:hover{background:var(--soft);color:var(--t1)}",

    "#ccai-msgs{flex:1;overflow-y:auto;padding:18px 16px;display:flex;flex-direction:column;gap:16px;scrollbar-width:thin;scrollbar-color:var(--bdh) transparent}",
    "#ccai-msgs::-webkit-scrollbar{width:8px}#ccai-msgs::-webkit-scrollbar-thumb{background:var(--bd);border-radius:8px;border:2px solid transparent;background-clip:padding-box}",
    ".ccai-row{display:flex;animation:ccai-in .2s ease both}",
    "@keyframes ccai-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}",
    ".ccai-row.u{justify-content:flex-end}",
    ".ccai-u-b{max-width:84%;background:var(--cta);color:var(--oncta);font-size:13.5px;line-height:1.5;padding:9px 13px;border-radius:14px 14px 4px 14px;font-weight:550}",
    ".ccai-a{max-width:100%;color:var(--t1);font-size:13.5px;line-height:1.62}",
    ".ccai-body.typing::after{content:'';display:inline-block;width:2px;height:1em;background:var(--accent);margin-left:2px;vertical-align:text-bottom;animation:ccai-cur .9s steps(1) infinite}",
    "@keyframes ccai-cur{50%{opacity:0}}",
    ".ccai-a>.lbl{display:flex;align-items:center;gap:6px;color:var(--t2);font-size:11px;font-weight:600;margin-bottom:7px}",
    ".ccai-a>.lbl img{width:15px;height:15px;border-radius:4px}",
    ".ccai-a p{margin:0 0 9px}.ccai-a p:last-child{margin-bottom:0}",
    ".ccai-a strong{color:var(--t1);font-weight:680}",
    ".ccai-a a{color:var(--accent);text-decoration:none;font-weight:550;border-bottom:1px solid color-mix(in srgb,var(--accent) 35%,transparent)}.ccai-a a:hover{border-bottom-color:var(--accent)}",
    ".ccai-a .cct-h{color:var(--t1);font-weight:680;margin:14px 0 7px;font-size:13.5px}.ccai-a .cct-h:first-child{margin-top:0}",
    ".ccai-a ul,.ccai-a ol{margin:0 0 9px;padding-left:6px;list-style:none}",
    ".ccai-a ol{counter-reset:ci}.ccai-a li{position:relative;padding-left:19px;margin:4px 0}",
    ".ccai-a ul li:before{content:'';position:absolute;left:4px;top:8px;width:5px;height:5px;border-radius:50%;background:var(--accent)}",
    ".ccai-a ol li:before{counter-increment:ci;content:counter(ci) '.';position:absolute;left:0;top:0;color:var(--accent);font-weight:600;font-size:12.5px}",
    ".ccai-a .cct-code{background:var(--card);border:1px solid var(--bd);border-radius:5px;padding:1px 5px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px}",
    ".ccai-a .cct-pre{background:var(--soft);border:1px solid var(--bd);border-radius:10px;padding:11px 12px;overflow-x:auto;margin:0 0 9px}",
    ".ccai-a .cct-pre code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;white-space:pre}",
    ".ccai-src{margin-top:13px;display:flex;flex-direction:column;gap:6px}",
    ".ccai-src .lbl{color:var(--t2);font-size:11px;font-weight:600;margin-bottom:1px}",
    ".ccai-src a{display:flex;align-items:center;gap:9px;font-size:12.5px;color:var(--t2);background:var(--card);",
    "border:1px solid var(--bd);border-radius:10px;padding:8px 11px;text-decoration:none;transition:.14s}",
    ".ccai-src a:hover{background:var(--cardh);border-color:var(--bdh);color:var(--t1)}",
    ".ccai-src a svg{width:15px;height:15px;color:var(--accent);flex:none}.ccai-src a span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",

    ".ccai-think{display:flex;gap:5px;align-items:center;height:18px}",
    ".ccai-think i{width:6px;height:6px;border-radius:50%;background:var(--t2);animation:ccai-b 1.2s ease-in-out infinite}",
    ".ccai-think i:nth-child(2){animation-delay:.15s}.ccai-think i:nth-child(3){animation-delay:.3s}",
    "@keyframes ccai-b{0%,70%,100%{opacity:.3}35%{opacity:1}}",

    ".ccai-empty{margin:auto 0;display:flex;flex-direction:column;gap:6px;padding:4px 2px}",
    ".ccai-empty img{width:34px;height:34px;border-radius:9px;margin-bottom:8px}",
    ".ccai-empty h4{margin:0;color:var(--t1);font-size:15.5px;font-weight:680;letter-spacing:-.01em}",
    ".ccai-empty p{margin:0;color:var(--t2);font-size:13px;line-height:1.5;max-width:280px}",
    ".ccai-sg{margin-top:16px;display:flex;flex-direction:column;gap:8px}",
    ".ccai-chip{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:var(--card);border:1px solid var(--bd);",
    "border-radius:12px;color:var(--t1);font-size:13px;padding:11px 13px;cursor:pointer;font-family:inherit;transition:.14s}",
    ".ccai-chip:hover{background:var(--cardh);border-color:var(--bdh)}",
    ".ccai-chip span{flex:1}.ccai-chip svg{width:15px;height:15px;color:var(--accent);flex:none}",

    "#ccai-foot{padding:13px 14px}",
    "#ccai-form{display:flex;align-items:flex-end;gap:8px;background:var(--soft);border:1px solid var(--bd);border-radius:14px;padding:7px 7px 7px 13px;transition:border-color .16s}",
    "#ccai-form:focus-within{border-color:var(--bdh)}",
    "#ccai-in{flex:1;background:none;border:none;outline:none;color:var(--t1);font-size:13.5px;font-family:inherit;resize:none;max-height:94px;line-height:1.5;padding:5px 0}",
    "#ccai-in::placeholder{color:var(--t2)}",
    "#ccai-send{flex:none;width:34px;height:34px;border-radius:11px;border:none;background:var(--cta);color:var(--oncta);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.14s}",
    "#ccai-send svg{width:18px;height:18px}#ccai-send:disabled{opacity:.4;cursor:default}#ccai-send:not(:disabled):hover{transform:translateY(-1px)}",
    "#ccai-dis{text-align:center;color:var(--t2);font-size:10.5px;margin-top:9px;opacity:.85}",

    "@media (max-width:520px){#ccai-panel{right:8px;left:8px;bottom:8px;width:auto;height:calc(100vh - 16px);max-height:none}#ccai-fab{right:14px;bottom:14px}}",
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

  // Fast typewriter: reveal the already-rendered (formatted) text node by node,
  // capped to ~550ms total so long answers never feel slow.
  function typeIn(container, onDone) {
    var nodes = [];
    (function walk(n) { for (var c = n.firstChild; c; c = c.nextSibling) { if (c.nodeType === 3) nodes.push(c); else if (c.nodeType === 1) walk(c); } })(container);
    var full = nodes.map(function (n) { return n.nodeValue; });
    var total = 0; full.forEach(function (s) { total += s.length; });
    if (total === 0) { onDone && onDone(); return; }
    nodes.forEach(function (n) { n.nodeValue = ""; });
    var TARGET = 550, TICK = 16, per = Math.max(3, Math.ceil(total / (TARGET / TICK)));
    var ni = 0, ci = 0;
    var timer = setInterval(function () {
      var budget = per;
      while (budget > 0 && ni < nodes.length) {
        var s = full[ni], take = Math.min(budget, s.length - ci);
        nodes[ni].nodeValue = s.slice(0, ci + take);
        ci += take; budget -= take;
        if (ci >= s.length) { ni++; ci = 0; }
      }
      msgs.scrollTop = msgs.scrollHeight;
      if (ni >= nodes.length) { clearInterval(timer); onDone && onDone(); }
    }, TICK);
  }

  var root, panel, msgs, input, sendBtn, fab;

  function applyTheme() { var v = themeVars(); for (var k in v) root.style.setProperty(k, v[k]); }

  function mount() {
    document.head.appendChild(E("style", null, CSS));
    root = E("div", { id: "ccai" });

    fab = E("button", { id: "ccai-fab", "aria-label": "Ask CCTools AI" }, '<img src="' + MARK + '" alt=""><span>Ask AI</span>');
    fab.onclick = openPanel;
    root.appendChild(fab);

    panel = E("div", { id: "ccai-panel", role: "dialog", "aria-label": "CCTools AI" });
    var hd = E("div", { id: "ccai-hd" }, '<img src="' + MARK + '" alt=""><div class="tt"><b>CCTools AI</b><span>Docs assistant</span></div>');
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
    applyTheme();

    form.addEventListener("submit", function (e) { e.preventDefault(); send(input.value); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input.value); } });
    input.addEventListener("input", function () { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 94) + "px"; });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && openState) closePanel(); });
    // Re-read colors if the docs theme toggle is used.
    try { new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] }); } catch (e) {}
    renderEmpty();
  }

  function renderEmpty() {
    msgs.innerHTML = "";
    var w = E("div", { class: "ccai-empty" },
      '<img src="' + MARK + '" alt="">' +
      "<h4>Ask the CCTools docs</h4>" +
      "<p>Answers on wallets, XP, campaigns, the ecosystem, and more, drawn straight from the docs.</p>");
    var sg = E("div", { class: "ccai-sg" });
    SUGGESTIONS.forEach(function (q) {
      var c = E("button", { class: "ccai-chip", type: "button" }, "<span>" + esc(q) + "</span>" + I_ARR);
      c.onclick = function () { send(q); };
      sg.appendChild(c);
    });
    w.appendChild(sg); msgs.appendChild(w);
  }

  function openPanel() { openState = true; applyTheme(); fab.classList.add("hide"); panel.classList.add("open"); requestAnimationFrame(function () { panel.classList.add("show"); }); setTimeout(function () { input && input.focus(); }, 110); }
  function closePanel() { openState = false; panel.classList.remove("show"); fab.classList.remove("hide"); setTimeout(function () { if (!openState) panel.classList.remove("open"); }, 220); }

  function addRow(role) {
    if (msgs.querySelector(".ccai-empty")) msgs.innerHTML = "";
    var r = E("div", { class: "ccai-row " + role });
    var b = E("div", { class: role === "u" ? "ccai-u-b" : "ccai-a" });
    r.appendChild(b); msgs.appendChild(r); msgs.scrollTop = msgs.scrollHeight; return b;
  }
  function aiLabel() { return '<div class="lbl"><img src="' + MARK + '" alt="">CCTools AI</div>'; }

  function send(text) {
    if (busy) return;
    var q = (text || "").trim(); if (q.length < 2) return;
    input.value = ""; input.style.height = "auto";
    addRow("u").textContent = q;
    var ans = addRow("a");
    ans.innerHTML = aiLabel() + '<div class="ccai-think"><i></i><i></i><i></i></div>';
    busy = true; sendBtn.disabled = true;

    fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q, lang: navigator.language || "", history: history.slice(-4) }) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) { ans.innerHTML = aiLabel() + "<p>" + esc((res.d && res.d.error) || "Something went wrong. Please try again.") + "</p>"; return; }
        var d = res.d;
        ans.innerHTML = aiLabel() + '<div class="ccai-body typing">' + renderMd(d.answer || "") + "</div>";
        var body = ans.querySelector(".ccai-body");
        var srcHtml = "";
        if (d.sources && d.sources.length) {
          srcHtml = '<div class="ccai-src"><div class="lbl">Sources</div>' + d.sources.map(function (s) { return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + I_DOC + "<span>" + esc(s.title) + "</span></a>"; }).join("") + "</div>";
        }
        typeIn(body, function () { body.classList.remove("typing"); if (srcHtml) { var t = E("div", null, srcHtml); ans.appendChild(t.firstChild); } msgs.scrollTop = msgs.scrollHeight; });
        history.push({ role: "user", content: q }); history.push({ role: "assistant", content: d.answer || "" });
      })
      .catch(function () { ans.innerHTML = aiLabel() + "<p>Network error. Please try again.</p>"; })
      .finally(function () { busy = false; sendBtn.disabled = false; input.focus(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
