/* ==========================================================
   EDIT YOUR DETAILS HERE — this is the only part you need to change
   ========================================================== */
const CONFIG = {
  groom: "Mohamed",
  bride: "Nadine",
  date: "2027-01-15",          // YYYY-MM-DD
  ceremonyTime: "",            // 24h "HH:MM", e.g. "19:30". Leave "" until confirmed (countdown uses 00:00)
  venue: "Tolip Hotel Olympic International City",
  address: "",                 // full address, e.g. "Street, City". Leave "" until confirmed
  mapsUrl: "",                 // paste Google Maps link. Leave "" to hide the button
  dressCode: "",               // e.g. "Formal". Leave "" until confirmed
  whatsappNumber: "201152632221", // digits only, with country code, no + sign
  musicPath: "assets/music.mp3"   // put your audio file here. If missing, the site still works
};
/* ========================================================== */

(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const MONTHS = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Date parsing (local time)
  const [Y, M, D] = CONFIG.date.split("-").map(Number);
  const [hh, mm] = (CONFIG.ceremonyTime || "00:00").split(":").map(Number);
  const target = new Date(Y, M - 1, D, hh || 0, mm || 0, 0);
  const niceDate = D + " " + MONTHS[M - 1] + " " + Y;
  const titleCase = (s) => s.charAt(0) + s.slice(1).toLowerCase();

  // Fill text from config
  document.querySelectorAll('[data-bind="groom"]').forEach((e) => (e.textContent = CONFIG.groom));
  document.querySelectorAll('[data-bind="bride"]').forEach((e) => (e.textContent = CONFIG.bride));
  document.title = CONFIG.groom + " & " + CONFIG.bride + " — Wedding Invitation";
  $("coverDate").textContent = niceDate;
  $("dDate").textContent = D + " " + titleCase(MONTHS[M - 1]) + " " + Y;
  $("dVenue").textContent = CONFIG.venue;
  function setOpt(id, val) {
    const el = $(id);
    if (val) { el.textContent = val; el.removeAttribute("data-tba"); }
  }
  if (CONFIG.ceremonyTime) {
    const h12 = ((hh + 11) % 12) + 1;
    setOpt("dTime", h12 + ":" + String(mm).padStart(2, "0") + " " + (hh >= 12 ? "PM" : "AM"));
  }
  setOpt("dAddr", CONFIG.address);
  setOpt("dDress", CONFIG.dressCode);
  if (CONFIG.mapsUrl) { $("mapsLink").href = CONFIG.mapsUrl; $("mapsLink").hidden = false; }

  // Music
  const audio = $("bgMusic"), musicBtn = $("musicBtn");
  let musicOk = true;
  audio.src = CONFIG.musicPath;
  audio.addEventListener("error", () => {
    musicOk = false;
    musicBtn.classList.add("disabled");
    musicBtn.setAttribute("aria-label", "No music file added");
  });
  function setPlaying(on) {
    musicBtn.classList.toggle("playing", on);
    musicBtn.setAttribute("aria-pressed", String(on));
    musicBtn.setAttribute("aria-label", on ? "Pause music" : "Play music");
  }
  function playMusic() {
    if (!musicOk) return;
    const p = audio.play();
    if (p && p.then) p.then(() => setPlaying(true)).catch(() => setPlaying(false));
  }
  musicBtn.addEventListener("click", () => {
    if (!musicOk) return;
    if (audio.paused) playMusic(); else { audio.pause(); setPlaying(false); }
  });

  // Envelope
  const env = $("envelope");
  let opened = false;
  function openEnvelope() {
    if (opened) return;
    opened = true;
    env.classList.add("open");
    musicBtn.hidden = false;
    playMusic(); // allowed: triggered by a tap
    setTimeout(() => {
      document.body.classList.remove("locked");
      env.setAttribute("aria-hidden", "true");
      window.scrollTo(0, 0);
    }, reduce ? 50 : 1100);
  }
  $("openBtn").addEventListener("click", openEnvelope);

  // Reveal on scroll
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: 0.15 });
    items.forEach((i) => io.observe(i));
  } else items.forEach((i) => i.classList.add("in"));

  // Countdown
  const pad = (n) => String(n).padStart(2, "0");
  function tick() {
    let diff = target - new Date();
    if (diff <= 0) {
      $("countdown").hidden = true; $("cdDone").hidden = false; return false;
    }
    const s = Math.floor(diff / 1000);
    $("cdD").textContent = pad(Math.floor(s / 86400));
    $("cdH").textContent = pad(Math.floor((s % 86400) / 3600));
    $("cdM").textContent = pad(Math.floor((s % 3600) / 60));
    $("cdS").textContent = pad(s % 60);
    return true;
  }
  if (tick()) { const t = setInterval(() => { if (!tick()) clearInterval(t); }, 1000); }

  // RSVP
  const form = $("rsvpForm");
  const attendVal = () => form.elements.attend.value;
  function syncGuests() { $("guestsWrap").hidden = attendVal() === "decline"; }
  form.querySelectorAll('input[name="attend"]').forEach((r) => r.addEventListener("change", syncGuests));
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const name = $("gName").value.trim().replace(/\s+/g, " ");
    const msg = $("gMsg").value.trim();
    const accept = attendVal() === "accept";
    const count = parseInt($("gCount").value, 10);
    let ok = true;
    $("eName").textContent = ""; $("eCount").textContent = "";
    if (name.length < 2) { $("eName").textContent = "Please enter your name."; ok = false; }
    if (accept && (!Number.isInteger(count) || count < 1 || count > 10)) {
      $("eCount").textContent = "Please enter a number from 1 to 10."; ok = false;
    }
    if (!ok) return;
    const lines = [
      "Assalamu alaikum, this is " + name + ".",
      accept ? "I joyfully accept the invitation to the wedding of " + CONFIG.groom + " & " + CONFIG.bride + "."
             : "I regretfully decline the invitation to the wedding of " + CONFIG.groom + " & " + CONFIG.bride + ".",
      "Date: " + niceDate
    ];
    if (accept) lines.push("Number of guests: " + count);
    if (msg) lines.push("Message: " + msg);
    const url = "https://wa.me/" + CONFIG.whatsappNumber + "?text=" + encodeURIComponent(lines.join("\n"));
    $("rsvpNote").textContent = "Opening WhatsApp — please press Send there to deliver your reply.";
    $("waFallback").href = url; $("waFallback").hidden = false;
    window.location.href = url;
  });

  // Back to top
  $("toTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));
})();
