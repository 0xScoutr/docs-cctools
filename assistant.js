/* CCTools docs assistant — custom chat widget (replaces Mintlify's paid Ask AI).
   Mintlify auto-injects any root .js globally. Vanilla, no build step.
   Talks to the CCTools backend chat endpoint, which answers from the docs only. */
(function () {
  "use strict";
  if (window.__cctoolsAssistant) return;
  window.__cctoolsAssistant = true;

  // For local `mint dev` testing against a local backend, change to e.g.
  // "http://localhost:3002/api/ai/docs-chat".
  var ENDPOINT = "https://api.cctools.network/api/ai/docs-chat";

  var LIME = "#e6ff6a";
  var history = []; // {role, content}
  var busy = false;

  var css = ""
    + "#cct-fab{position:fixed;right:20px;bottom:20px;width:52px;height:52px;border-radius:50%;"
    + "background:" + LIME + ";color:#0c0e14;border:none;cursor:pointer;z-index:2147483000;"
    + "display:flex;align-items:center;justify-content:center;box-shadow:0 6px 24px rgba(0,0,0,.35);"
    + "transition:transform .15s ease}"
    + "#cct-fab:hover{transform:scale(1.06)}"
    + "#cct-panel{position:fixed;right:20px;bottom:84px;width:380px;max-width:calc(100vw - 32px);"
    + "height:560px;max-height:calc(100vh - 120px);background:#0c0e14;border:1px solid rgba(255,255,255,.1);"
    + "border-radius:16px;z-index:2147483000;display:none;flex-direction:column;overflow:hidden;"
    + "box-shadow:0 16px 50px rgba(0,0,0,.5);font-family:inherit}"
    + "#cct-panel.open{display:flex}"
    + "#cct-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;"
    + "border-bottom:1px solid rgba(255,255,255,.08)}"
    + "#cct-head b{color:#eaecf0;font-size:14px;font-weight:600}"
    + "#cct-head span{color:#7c8494;font-size:11px;display:block;margin-top:2px}"
    + "#cct-x{background:none;border:none;color:#7c8494;cursor:pointer;font-size:20px;line-height:1}"
    + "#cct-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}"
    + ".cct-m{font-size:13.5px;line-height:1.55;max-width:90%;padding:10px 12px;border-radius:12px;word-wrap:break-word}"
    + ".cct-u{align-self:flex-end;background:" + LIME + ";color:#0c0e14;border-bottom-right-radius:4px}"
    + ".cct-a{align-self:flex-start;background:#16181f;color:#eaecf0;border:1px solid rgba(255,255,255,.06);border-bottom-left-radius:4px}"
    + ".cct-a a{color:" + LIME + ";text-decoration:underline}"
    + ".cct-src{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}"
    + ".cct-src a{font-size:11px;color:#cfe98a;border:1px solid rgba(230,255,106,.25);border-radius:100px;"
    + "padding:3px 9px;text-decoration:none;background:rgba(230,255,106,.06)}"
    + ".cct-hint{color:#7c8494;font-size:12px;text-align:center;margin:auto 8px}"
    + "#cct-form{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.08)}"
    + "#cct-in{flex:1;background:#16181f;border:1px solid rgba(255,255,255,.1);border-radius:10px;"
    + "color:#eaecf0;padding:10px 12px;font-size:13.5px;font-family:inherit;outline:none;resize:none}"
    + "#cct-in:focus{border-color:rgba(230,255,106,.4)}"
    + "#cct-send{background:" + LIME + ";color:#0c0e14;border:none;border-radius:10px;padding:0 14px;"
    + "font-weight:600;cursor:pointer;font-size:13px}"
    + "#cct-send:disabled{opacity:.5;cursor:default}"
    + ".cct-dots{display:inline-block}.cct-dots:after{content:'.';animation:cctd 1.2s steps(3,end) infinite}"
    + "@keyframes cctd{0%{content:'.'}33%{content:'..'}66%{content:'...'}}";

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  // Minimal, safe markdown: escape first, then linkify [t](url), **bold**, newlines.
  function md(s) {
    var t = esc(s);
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/\n/g, "<br>");
    return t;
  }

  var panel, msgs, input, sendBtn;

  function mount() {
    var style = el("style"); style.textContent = css; document.head.appendChild(style);

    var fab = el("button", { id: "cct-fab", "aria-label": "Ask the docs" });
    fab.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    fab.onclick = toggle;
    document.body.appendChild(fab);

    panel = el("div", { id: "cct-panel" });
    panel.appendChild(el("div", { id: "cct-head" },
      '<div><b>Ask the docs</b><span>AI answers from the CCTools docs</span></div>'));
    panel.querySelector("#cct-head").appendChild(el("button", { id: "cct-x", "aria-label": "Close" }, "×"));

    msgs = el("div", { id: "cct-msgs" });
    msgs.appendChild(el("div", { class: "cct-hint" }, "Ask anything about using CCTools — wallets, XP, campaigns, the ecosystem."));
    panel.appendChild(msgs);

    var form = el("form", { id: "cct-form" });
    input = el("textarea", { id: "cct-in", rows: "1", placeholder: "Ask a question..." });
    sendBtn = el("button", { id: "cct-send", type: "submit" }, "Send");
    form.appendChild(input); form.appendChild(sendBtn);
    panel.appendChild(form);
    document.body.appendChild(panel);

    panel.querySelector("#cct-x").onclick = toggle;
    form.onsubmit = function (e) { e.preventDefault(); send(); };
    input.onkeydown = function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
  }

  function toggle() {
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) setTimeout(function () { input.focus(); }, 50);
  }

  function addMsg(role, html) {
    var hint = msgs.querySelector(".cct-hint"); if (hint) hint.remove();
    var m = el("div", { class: "cct-m " + (role === "user" ? "cct-u" : "cct-a") }, html);
    msgs.appendChild(m); msgs.scrollTop = msgs.scrollHeight;
    return m;
  }

  function send() {
    if (busy) return;
    var q = input.value.trim();
    if (q.length < 2) return;
    input.value = "";
    addMsg("user", esc(q));
    var thinking = addMsg("assistant", '<span class="cct-dots">Thinking</span>');
    busy = true; sendBtn.disabled = true;

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q, lang: navigator.language || "", history: history.slice(-4) }),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) { thinking.innerHTML = esc(res.d && res.d.error ? res.d.error : "Something went wrong."); return; }
        var d = res.d;
        var html = md(d.answer || "");
        if (d.sources && d.sources.length) {
          html += '<div class="cct-src">' + d.sources.map(function (s) {
            return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title) + "</a>";
          }).join("") + "</div>";
        }
        thinking.innerHTML = html;
        history.push({ role: "user", content: q });
        history.push({ role: "assistant", content: d.answer || "" });
        msgs.scrollTop = msgs.scrollHeight;
      })
      .catch(function () { thinking.innerHTML = "Network error. Please try again."; })
      .finally(function () { busy = false; sendBtn.disabled = false; });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
