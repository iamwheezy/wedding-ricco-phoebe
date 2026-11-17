(function () {
  "use strict";
  const C = window.WEDDING;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const get = (path) => path.split(".").reduce((o, k) => (o ? o[k] : ""), C);

  /* ---------- 1. Bind config values ---------- */
  C.groom.initial = (C.groom.nickname || "R").charAt(0);
  C.bride.initial = (C.bride.nickname || "S").charAt(0);
  $$("[data-bind]").forEach((el) => (el.textContent = get(el.dataset.bind)));
  $$("[data-bind-html]").forEach((el) => (el.innerHTML = get(el.dataset.bindHtml)));
  $$("[data-ig]").forEach((el) => {
    const url = C[el.dataset.ig].instagram;
    if (url) { el.href = url; el.hidden = false; }
  });

  /* ---------- 2. Guest name from ?to= ---------- */
  const to = new URLSearchParams(location.search).get("to");
  if (to) {
    const name = to.replace(/[+_]/g, " ").trim().slice(0, 60);
    $("#guestName").textContent = name;
    document.title = `${name}, you are invited · Ricco & Syifa`;
    const n = $("#f-name"); if (n) n.value = name;
  }

  /* ---------- 3. Google Calendar + Maps links ---------- */
  const toGCal = (iso) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const calURL = "https://calendar.google.com/calendar/render?" + new URLSearchParams({
    action: "TEMPLATE",
    text: `The Wedding of ${C.groom.nickname} & ${C.bride.nickname}`,
    dates: `${toGCal(C.eventStart)}/${toGCal(C.eventEnd)}`,
    location: `${C.venueName}, ${C.venueAddress}`,
    details: `${C.eventTitle} of ${C.groom.fullName} & ${C.bride.fullName}.\n` +
             `${C.dateText}, ${C.timeText}\n${C.venueName}, ${C.venueAddress}\n\n` +
             `Invitation: ${location.origin}${location.pathname}`,
    ctz: "Asia/Jakarta"
  }).toString().replace("%2F", "/");
  const q = `${C.venueName}, ${C.mapsQuery}`;
  const mapsURL = C.mapsLink || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
  ["#calBtn", "#dateLink"].forEach((s) => ($(s).href = calURL));
  ["#venueLink", "#mapBtn"].forEach((s) => ($(s).href = mapsURL));
  $("#mapFrame").src = "https://maps.google.com/maps?q=" + encodeURIComponent(C.mapsQuery) + "&z=16&output=embed";

  /* ---------- 4. Cover / open invitation ---------- */
  const audio = $("#bgm"), musicBtn = $("#musicBtn");
  if (C.music) { audio.src = C.music; musicBtn.hidden = false; }
  const playMusic = () => {
    if (!C.music) return;
    audio.play().then(() => musicBtn.classList.add("playing")).catch(() => {});
  };
  musicBtn.addEventListener("click", () => {
    if (audio.paused) playMusic();
    else { audio.pause(); musicBtn.classList.remove("playing"); }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !audio.paused) { audio.pause(); musicBtn.classList.remove("playing"); audio.dataset.resume = "1"; }
    else if (!document.hidden && audio.dataset.resume) { delete audio.dataset.resume; playMusic(); }
  });
  /* Envelope flap with lace edge (drawn to the exact screen size) */
  const NS = "http://www.w3.org/2000/svg";
  function drawFlap() {
    const flap = $("#envFlap"); if (!flap) return;
    const w = flap.clientWidth, h = flap.clientHeight;
    const tri = `M0 0 L${w} 0 L${w / 2} ${h} Z`;
    const L = Math.hypot(w / 2, h);
    const edges = [
      { p0: [0, 0], d: [w / 2 / L, h / L], n: [-h / L, (w / 2) / L] },
      { p0: [w, 0], d: [-w / 2 / L, h / L], n: [h / L, (w / 2) / L] }
    ];
    let lace = "";
    const step = 13;
    edges.forEach((e) => {
      const at = (t, off) => [e.p0[0] + e.d[0] * t + e.n[0] * off, e.p0[1] + e.d[1] * t + e.n[1] * off];
      // inner band
      const a = at(0, -4), b = at(L, -4), c = at(L, 7), d = at(0, 7);
      lace += `<path d="M${a} L${b} L${c} L${d}Z" fill="#f8f2e6" stroke="#ddcfb2" stroke-width=".6"/>`;
      for (let t = step / 2, i = 0; t < L - 6; t += step, i++) {
        const [x1, y1] = at(t, 9), [x2, y2] = at(t, 1.5), [x3, y3] = at(t + step / 2, 15.5), [x4, y4] = at(t, 22);
        lace += `<circle cx="${x1}" cy="${y1}" r="8.4" fill="#faf6ee" fill-opacity=".96" stroke="#d9caab" stroke-width=".6"/>`;
        lace += `<circle cx="${x1}" cy="${y1}" r="6.4" fill="none" stroke="#cdbb95" stroke-width=".9" stroke-dasharray=".1 2.2" stroke-linecap="round"/>`;
        lace += `<path d="M${at(t - 3.5, 6)} Q${at(t, 12.5)} ${at(t + 3.5, 6)}" fill="none" stroke="#d5c4a0" stroke-width=".6"/>`;
        lace += `<circle cx="${x2}" cy="${y2}" r=".9" fill="#d6c6a4"/>`;
        if (t + step < L - 6) lace += `<circle cx="${x3}" cy="${y3}" r="3" fill="#f9f4ea" stroke="#d8c8a8" stroke-width=".6"/>`;
        if (i % 3 === 1) {
          // little flower motif hanging from the lace
          let petals = "";
          for (let k = 0; k < 5; k++) petals += `<ellipse cx="0" cy="-3.2" rx="1.9" ry="3.2" transform="rotate(${k * 72})"/>`;
          lace += `<g transform="translate(${x4} ${y4})" fill="#f9f4ea" stroke="#d3c19e" stroke-width=".5">${petals}<circle r="1.2" fill="#cdb98f" stroke="none"/></g>`;
        }
      }
    });
    $("#flapSvg").innerHTML =
      `<defs>
        <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6efe2"/><stop offset="1" stop-color="#ebe1cd"/></linearGradient>
        <pattern id="gr" width="280" height="280" patternUnits="userSpaceOnUse"><image href="assets/svg/grain.svg" width="280" height="280"/></pattern>
        <filter id="ls" x="-5%" y="-5%" width="110%" height="120%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.2" flood-color="#6b5428" flood-opacity=".28"/></filter>
        <clipPath id="fc"><path d="${tri}"/></clipPath>
      </defs>
      <g filter="url(#ls)">${lace}</g>
      <path d="${tri}" fill="url(#fg)"/>
      <path d="${tri}" fill="url(#gr)"/>
      <g clip-path="url(#fc)"><rect width="${w}" height="${h}" fill="url(#hl)" opacity="0"/></g>`;
    $("#flapBackSvg").innerHTML =
      `<defs><linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9dfcb"/><stop offset="1" stop-color="#ddd0b6"/></linearGradient></defs>
       <path d="${tri}" fill="url(#bg2)"/>`;
  }
  drawFlap();
  let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(drawFlap, 150); });

  /* Envelope opening sequence */
  const cover = $("#cover");
  let opened = false;
  const burst = () => {
    const b = $("#sealBurst");
    for (let i = 0; i < 26; i++) {
      const p = document.createElement("i");
      const a = Math.random() * Math.PI * 2, r = 60 + Math.random() * 110;
      p.style.setProperty("--x", Math.cos(a) * r + "px");
      p.style.setProperty("--y", Math.sin(a) * r + "px");
      p.style.setProperty("--s", (0.5 + Math.random()).toFixed(2));
      p.style.animationDelay = Math.random() * 0.15 + "s";
      b.appendChild(p);
    }
    setTimeout(() => (b.innerHTML = ""), 1600);
  };
  const openInvitation = () => {
    if (opened) return; opened = true;
    playMusic();
    burst();
    cover.classList.add("opening");                       // seal press + flap opens
    setTimeout(() => cover.classList.add("revealing"), 1900); // envelope drifts away
    setTimeout(() => {
      document.body.classList.remove("locked");
      document.body.classList.add("opened");
      window.scrollTo(0, 0);
    }, 2200);
    setTimeout(() => (cover.style.display = "none"), 3300);
  };
  $("#openBtn").addEventListener("click", openInvitation);
  $(".env-flap-wrap").addEventListener("click", openInvitation);

  if (C.video) {
    const v = $("#preVideo");
    v.src = C.video; $("#videoWrap").hidden = false;
    // pause background music while the video plays, resume after
    v.addEventListener("play", () => { if (!audio.paused) { audio.pause(); musicBtn.classList.remove("playing"); v.dataset.music = "1"; } });
    const resume = () => { if (v.dataset.music) { delete v.dataset.music; playMusic(); } };
    v.addEventListener("pause", resume); v.addEventListener("ended", resume);
  }

  /* ---------- 5. Countdown ---------- */
  const target = new Date(C.eventStart).getTime();
  const pad = (n) => String(n).padStart(2, "0");
  const tick = () => {
    let d = Math.max(0, target - Date.now());
    if (d === 0) { $("#countdown").hidden = true; $("#cd-done").hidden = false; return; }
    const days = Math.floor(d / 864e5); d %= 864e5;
    const h = Math.floor(d / 36e5); d %= 36e5;
    const m = Math.floor(d / 6e4); const s = Math.floor((d % 6e4) / 1e3);
    $("#cd-d").textContent = pad(days); $("#cd-h").textContent = pad(h);
    $("#cd-m").textContent = pad(m); $("#cd-s").textContent = pad(s);
  };
  tick(); setInterval(tick, 1000);

  /* ---------- 6. Reveal on scroll + parallax ---------- */
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  const plx = $$(".parallax");
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      plx.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight) el.style.transform = `translate3d(0,${(r.top - innerHeight / 2) * -0.12}px,0)`;
      });
      ticking = false;
    });
  }, { passive: true });

  /* ---------- 7. Sparkles ---------- */
  const sp = $(".sparkles");
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (let i = 0; i < 18; i++) {
      const el = document.createElement("i");
      const size = 3 + Math.random() * 5;
      Object.assign(el.style, {
        left: Math.random() * 100 + "%", width: size + "px", height: size + "px",
        animationDuration: 9 + Math.random() * 12 + "s", animationDelay: Math.random() * 12 + "s"
      });
      sp.appendChild(el);
    }
  }

  /* ---------- 8. Gallery lightbox ---------- */
  $$(".gallery img").forEach((img) => img.addEventListener("click", () => {
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = `<img src="${img.src}" alt="">`;
    lb.addEventListener("click", () => lb.remove());
    document.body.appendChild(lb);
  }));

  /* ---------- 9. Copy buttons + toast ---------- */
  const toast = (msg) => {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2200);
  };
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); }
    catch { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); }
    toast("Copied ♡");
  };
  $$("[data-copy]").forEach((b) => b.addEventListener("click", () => copy(C[b.dataset.copy])));

  /* ---------- 10. RSVP form ---------- */
  const sel = $("#f-guests");
  for (let i = 1; i <= C.maxGuests; i++) sel.add(new Option(i === 1 ? "1 person" : `${i} people`, i));
  const form = $("#rsvpForm"), status = $("#formStatus"), btn = $("#rsvpBtn");
  form.addEventListener("change", () => {
    const attending = form.attendance.value === "Attending";
    $("#guestsField").hidden = !attending;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      name: form.name.value.trim(),
      attendance: form.attendance.value,
      guests: form.attendance.value === "Attending" ? Number(sel.value) : 0,
      message: form.message.value.trim(),
      invitedAs: to || ""
    };
    if (data.name.length < 2) { status.className = "form-status err"; status.textContent = "Please enter your full name."; form.name.focus(); return; }

    btn.disabled = true; btn.textContent = "Sending…"; status.textContent = "";
    try {
      if (!C.scriptURL) throw new Error("not-configured");
      let serverError = "";
      try {
        const res = await fetch(C.scriptURL, { method: "POST", body: JSON.stringify(data) });
        const json = await res.json();
        if (json.result !== "success") serverError = json.error || "failed";
      } catch (_) {
        // Some browsers block reading the response (CORS). Re-send without reading it;
        // the Apps Script ignores exact duplicates sent within 2 minutes.
        await fetch(C.scriptURL, { method: "POST", mode: "no-cors", body: JSON.stringify(data) });
      }
      if (serverError) throw new Error(serverError);
      status.className = "form-status ok";
      status.textContent = data.attendance === "Attending"
        ? `Thank you, ${data.name}! We can't wait to celebrate with you ♡`
        : `Thank you, ${data.name}. You will be missed ♡`;
      if (data.message) addWish({ ...data, timestamp: new Date().toISOString() }, true);
      form.message.value = "";
      toast("RSVP sent ♡");
    } catch (err) {
      status.className = "form-status err";
      status.textContent = err.message === "not-configured"
        ? "RSVP is not connected yet. Please try again later."
        : "Sorry, something went wrong. Please try again.";
      console.error(err);
    } finally {
      btn.disabled = false; btn.textContent = "Send RSVP";
    }
  });

  /* ---------- 11. Wishes (live from Google Sheets) ---------- */
  const list = $("#wishList");
  const seen = new Set();
  const keyOf = (w) => `${w.name}|${w.message}`.toLowerCase();
  const initials = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
  const timeAgo = (iso) => {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (isNaN(s)) return "";
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " hr ago";
    if (s < 2592000) return Math.floor(s / 86400) + " days ago";
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };
  function addWish(w, prepend) {
    const k = keyOf(w);
    if (seen.has(k)) return; seen.add(k);
    const empty = $(".empty", list); if (empty) empty.remove();
    const el = document.createElement("article");
    el.className = "wish";
    const no = w.attendance === "Not Attending";
    el.innerHTML = `<div class="wish-head"><div class="avatar"></div><div><div class="wish-name"></div>
      <div class="wish-meta"><span class="badge ${no ? "no" : ""}">${no ? "Not attending" : "Attending"}</span><span class="when"></span></div></div></div>
      <p class="msg"></p>`;
    $(".avatar", el).textContent = initials(w.name);
    $(".wish-name", el).textContent = w.name;
    $(".when", el).textContent = timeAgo(w.timestamp);
    $(".msg", el).textContent = `“${w.message}”`;
    prepend ? list.prepend(el) : list.appendChild(el);
    $("#wishCount").textContent = `${seen.size} ${seen.size === 1 ? "wish" : "wishes"} received`;
  }
  async function loadWishes() {
    if (!C.scriptURL) return;
    try {
      const res = await fetch(C.scriptURL + "?action=wishes&t=" + Date.now());
      const json = await res.json();
      // server returns newest first; add oldest first so newest end up on top
      (json.wishes || []).slice().reverse().forEach((w) => addWish(w, true));
    } catch (e) { console.warn("Wishes unavailable", e); }
  }
  loadWishes();
  setInterval(() => { if (!document.hidden) loadWishes(); }, 30000);
})();
