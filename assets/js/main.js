(function () {
  "use strict";
  // Safety net: the cover always opens, even if another part of the script fails
  document.addEventListener("click", (e) => {
    if (!e.target.closest || !e.target.closest("#openBtn")) return;
    const cv = document.getElementById("cover");
    setTimeout(() => {
      if (document.body.classList.contains("locked")) {
        cv.classList.add("opened"); document.body.classList.remove("locked");
        setTimeout(() => (cv.style.display = "none"), 1200);
      }
    }, 300);
  });
  const C = window.WEDDING;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const get = (path) => path.split(".").reduce((o, k) => (o ? o[k] : ""), C);

  /* ---------- 1. Bind config values ---------- */
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
  /* Envelope intro: click -> flap opens -> cover photo */
  const env = $("#envelope");
  if (env) {
    let envOpened = false;
    // decode all envelope layers up front so the first frame of the animation never stutters
    $$(".env-layer", env).forEach((im) => im.decode && im.decode().catch(() => {}));
    $("#envBtn").addEventListener("click", () => {
      if (envOpened) return; envOpened = true;
      playMusic();
      env.classList.add("opening");
      setTimeout(() => env.classList.add("zoom"), 1350);
      setTimeout(() => env.classList.add("gone"), 1900);
      setTimeout(() => (env.style.display = "none"), 2900);
    });
  }
  /* From the cover photo: swipe up / scroll / tap continues into the invitation */
  const cover = $("#cover");
  const goIn = () => { if (document.body.classList.contains("locked")) $("#openBtn").click(); };
  let ty = null;
  cover.addEventListener("touchstart", (e) => (ty = e.touches[0].clientY), { passive: true });
  cover.addEventListener("touchend", (e) => { if (ty !== null && ty - e.changedTouches[0].clientY > 40) goIn(); ty = null; });
  cover.addEventListener("wheel", (e) => { if (e.deltaY > 10) goIn(); }, { passive: true });
  cover.addEventListener("click", goIn);

  $("#openBtn").addEventListener("click", () => {
    $("#cover").classList.add("opened");
    document.body.classList.remove("locked");
    window.scrollTo(0, 0);
    playMusic();
    setTimeout(() => ($("#cover").style.display = "none"), 1200);
  });

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
