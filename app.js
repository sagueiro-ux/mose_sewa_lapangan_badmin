// ═══════════════════════════════════════════════════════════
// CONFIG: Sesuaikan BASE_URL dengan lokasi server PHP Anda
// ═══════════════════════════════════════════════════════════
const BASE_URL = "http://localhost/mose/api"; // Ganti sesuai server XAMPP Anda

// ─── Section Loader ──────────────────────────────────────────
// Memuat file HTML tiap section lalu inject ke dalam #sections-container
async function loadSections() {
    const container = document.getElementById("sections-container");
    const sections = ["home", "schedule", "courts", "booking", "profile"];

    for (const name of sections) {
        try {
            const res = await fetch(name + ".html");
            const html = await res.text();
            container.insertAdjacentHTML("beforeend", html);
        } catch (e) {
            console.error("Gagal memuat section:", name, e);
        }
    }

    // Setelah semua section dimuat, jalankan inisialisasi
    bindDynamicEvents();
    init();
}

// Event listener yang perlu diattach setelah DOM section tersedia
function bindDynamicEvents() {
    document
        .getElementById("schedule-date-picker")
        ?.addEventListener("change", function () {
            setScheduleDate(this.value, null);
            document
                .querySelectorAll(".date-btn")
                .forEach((b) => b.classList.remove("active"));
        });

    document
        .getElementById("avatar-upload-overlay")
        ?.addEventListener("click", function (e) {
            if (e.target === this) closeAvatarModal();
        });

    document.addEventListener("click", function (e) {
        const nav = document.querySelector("nav");
        if (!nav.contains(e.target)) closeMenu();
    });
}

// ─── Helpers ─────────────────────────────────────────────────
const SESSION_KEY = "mose_session";
const getSession = () =>
    JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
const saveSession = (d) => localStorage.setItem(SESSION_KEY, JSON.stringify(d));
const clearSess = () => localStorage.removeItem(SESSION_KEY);

function authHeader() {
    const s = getSession();
    return s
        ? { Authorization: "Bearer " + s.token, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };
}

async function apiCall(endpoint, options = {}) {
    try {
        const s = getSession();
        const token = s ? s.token : null;
        const sep = endpoint.includes("?") ? "&" : "?";
        const url =
            BASE_URL +
            endpoint +
            (token ? sep + "token=" + encodeURIComponent(token) : "");
        const headers = { "Content-Type": "application/json" };
        const res = await fetch(url, { headers, ...options });
        return await res.json();
    } catch (e) {
        return {
            success: false,
            message: "Gagal terhubung ke server. Pastikan server PHP berjalan.",
        };
    }
}

function showToast(msg, isError = false) {
    const t = document.getElementById("toast");
    document.getElementById("toast-msg").textContent = msg;
    t.style.borderColor = isError
        ? "rgba(255,107,107,0.4)"
        : "rgba(19,201,142,0.3)";
    t.querySelector(".toast-icon").textContent = isError ? "❌" : "✅";
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3200);
}

// ═══════════════════════════════════════════════════════════
// AUTH SYSTEM
// ═══════════════════════════════════════════════════════════

function openAuthOverlay(tab) {
    if (tab) switchAuthTab(tab);
    document.getElementById("auth-overlay").classList.add("visible");
}

function closeAuthOverlay() {
    document.getElementById("auth-overlay").classList.remove("visible");
}

function switchAuthTab(tab) {
    document
        .getElementById("panel-login")
        .classList.toggle("active", tab === "login");
    document
        .getElementById("panel-register")
        .classList.toggle("active", tab === "register");
    document
        .getElementById("tab-login")
        .classList.toggle("active", tab === "login");
    document
        .getElementById("tab-register")
        .classList.toggle("active", tab === "register");
    ["login-alert", "reg-alert"].forEach((id) => {
        document.getElementById(id).classList.remove("show", "auth-alert-success");
    });
}

function togglePw(inputId, btn) {
    const inp = document.getElementById(inputId);
    if (inp.type === "password") {
        inp.type = "text";
        btn.textContent = "🙈";
    } else {
        inp.type = "password";
        btn.textContent = "👁";
    }
}

// ─── Register ─────────────────────────────────────────────
async function doRegister() {
    clearAuthErrors();
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const phone = document.getElementById("reg-phone").value.trim();
    const pw = document.getElementById("reg-pw").value;
    const pw2 = document.getElementById("reg-pw2").value;
    let ok = true;

    if (name.length < 2) {
        showFieldErr("reg-name-err");
        document.getElementById("reg-name").classList.add("error");
        ok = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFieldErr("reg-email-err");
        document.getElementById("reg-email").classList.add("error");
        ok = false;
    }
    if (phone.replace(/\D/g, "").length < 10) {
        showFieldErr("reg-phone-err");
        document.getElementById("reg-phone").classList.add("error");
        ok = false;
    }
    if (pw.length < 6) {
        showFieldErr("reg-pw-err");
        document.getElementById("reg-pw").classList.add("error");
        ok = false;
    }
    if (pw !== pw2) {
        showFieldErr("reg-pw2-err");
        document.getElementById("reg-pw2").classList.add("error");
        ok = false;
    }
    if (!ok) return;

    const btn = document.getElementById("reg-btn");
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Mendaftar...';

    const res = await apiCall("/auth.php?action=register", {
        method: "POST",
        body: JSON.stringify({
            nama_lengkap: name,
            email,
            nomor_handphone: phone,
            password: pw,
        }),
    });

    btn.disabled = false;
    btn.innerHTML = "✨ Buat Akun";

    if (!res.success) {
        showAlert("reg-alert", "❌ " + res.message);
        return;
    }

    showAlert("reg-alert", "✅ Akun berhasil dibuat! Sedang masuk...", true);
    setTimeout(() => doLoginAfterRegister(email, pw), 800);
}

async function doLoginAfterRegister(email, pw) {
    const res = await apiCall("/auth.php?action=login", {
        method: "POST",
        body: JSON.stringify({ email, password: pw }),
    });
    if (res.success) {
        saveSession({ ...res.user, token: res.token });
        closeAuthOverlay();
        onLoginSuccess();
    }
}

// ─── Login ────────────────────────────────────────────────
async function doLogin() {
    clearAuthErrors();
    const email = document
        .getElementById("login-email")
        .value.trim()
        .toLowerCase();
    const pw = document.getElementById("login-pw").value;
    let ok = true;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFieldErr("login-email-err");
        document.getElementById("login-email").classList.add("error");
        ok = false;
    }
    if (!pw) {
        showFieldErr("login-pw-err");
        document.getElementById("login-pw").classList.add("error");
        ok = false;
    }
    if (!ok) return;

    const btn = document.getElementById("login-btn");
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Masuk...';

    const res = await apiCall("/auth.php?action=login", {
        method: "POST",
        body: JSON.stringify({ email, password: pw }),
    });

    btn.disabled = false;
    btn.innerHTML = "🔑 Masuk";

    if (!res.success) {
        showAlert("login-alert", "❌ " + res.message);
        return;
    }

    saveSession({ ...res.user, token: res.token });
    closeAuthOverlay();
    onLoginSuccess();
}

// ─── Logout ───────────────────────────────────────────────
function doLogout() {
    clearSess();
    updateNavUser();
    showSection("home");
    showToast("👋 Kamu telah keluar dari akun.");
}

// ─── After login success ──────────────────────────────────
function onLoginSuccess() {
    updateNavUser();
    autofillBooking();
    loadCourtsForBooking();
    loadMyBookings();
    showToast(
        "✅ Selamat datang, " + getSession().nama_lengkap.split(" ")[0] + "!",
    );
}

// ─── Navbar user area ─────────────────────────────────────
function updateNavUser() {
    const user = getSession();
    const area = document.getElementById("nav-user-area");
    const navProfile = document.getElementById("nav-profile");

    if (user) {
        const initials = user.nama_lengkap
            .split(" ")
            .map((w) => w[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
        const avatarHtml = user.foto_profil
            ? `<img src="${BASE_URL.replace("/api", "")}/${user.foto_profil}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid rgba(19,201,142,0.4);" onerror="this.outerHTML='<div class=\\'nav-user-avatar\\'>${initials}</div>'">`
            : `<div class="nav-user-avatar">${initials}</div>`;
        area.innerHTML = `
      <div class="nav-user">
        <div style="cursor:pointer" onclick="showSection('profile')">${avatarHtml}</div>
        <span class="nav-user-name" style="cursor:pointer" onclick="showSection('profile')">${user.nama_lengkap.split(" ")[0]}</span>
        <button class="nav-logout-btn" onclick="doLogout()">Keluar</button>
      </div>`;
        if (navProfile) navProfile.style.display = "";
    } else {
        area.innerHTML = `<button class="nav-login-btn" onclick="openAuthOverlay('login')">🔑 Masuk</button>`;
        if (navProfile) navProfile.style.display = "none";
    }
}

// ─── Auth helpers ─────────────────────────────────────────
function showFieldErr(id) {
    document.getElementById(id).classList.add("show");
}
function clearAuthErrors() {
    document
        .querySelectorAll(".auth-error")
        .forEach((e) => e.classList.remove("show"));
    document
        .querySelectorAll(".auth-input")
        .forEach((e) => e.classList.remove("error"));
}
function showAlert(id, msg, success = false) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.classList.add("show");
    if (success) el.classList.add("auth-alert-success");
    else el.classList.remove("auth-alert-success");
}

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════

function showSection(id) {
    if (id === "booking" && !getSession()) {
        openAuthOverlay("login");
        return;
    }
    if (id === "profile" && !getSession()) {
        openAuthOverlay("login");
        return;
    }

    document
        .querySelectorAll(".section")
        .forEach((s) => s.classList.remove("active"));
    document
        .querySelectorAll(".nav-links a")
        .forEach((a) => a.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    const navEl = document.getElementById("nav-" + id);
    if (navEl) navEl.classList.add("active");
    window.scrollTo(0, 0);

    if (id === "schedule") renderSchedulePage();
    if (id === "booking") refreshBookingGate();
    if (id === "courts") loadCourtsPage();
    if (id === "profile") loadProfilePage();
}

// ═══════════════════════════════════════════════════════════
// COURTS — HALAMAN & PREVIEW HOME
// ═══════════════════════════════════════════════════════════

const COURT_INFO = {
    1: {
        label: "LAPANGAN A",
        type: "🏅 Kelas Standard · Lantai Vinyl",
        info: [
            ["❄️", "Full AC"],
            ["💡", "LED 600 lux"],
            ["🎯", "Net Standard"],
            ["🏪", "Kantin Dekat"],
        ],
        bg: "linear-gradient(160deg,#0d3060 0%,#0a5a3a 100%)",
    },
    2: {
        label: "LAPANGAN B",
        type: "🏅 Kelas Standard · Lantai Vinyl",
        info: [
            ["❄️", "Full AC"],
            ["💡", "LED 600 lux"],
            ["🎯", "Net Standard"],
            ["🏪", "Kantin Dekat"],
        ],
        bg: "linear-gradient(160deg,#0d3060 0%,#0a5a3a 100%)",
    },
    3: {
        label: "LAPANGAN C",
        type: "🏅 Kelas Standard · Lantai Vinyl",
        info: [
            ["🌬️", "Kipas Besar"],
            ["💡", "LED 600 lux"],
            ["🎯", "Net Standard"],
            ["🚿", "Shower Nearby"],
        ],
        bg: "linear-gradient(160deg,#122a50 0%,#0c6040 100%)",
    },
    4: {
        label: "LAPANGAN D",
        type: "🏅 Kelas Standard · Lantai Vinyl",
        info: [
            ["🌬️", "Kipas Besar"],
            ["💡", "LED 600 lux"],
            ["🎯", "Net Standard"],
            ["🚿", "Shower Nearby"],
        ],
        bg: "linear-gradient(160deg,#122a50 0%,#0c6040 100%)",
    },
};

async function loadCourtsPage() {
    const grid = document.getElementById("courts-grid");
    const res = await apiCall("/courts.php");
    if (!res.success || !res.data.length) {
        grid.innerHTML =
            '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-light);">Gagal memuat data lapangan</div>';
        return;
    }

    const today = new Date().toISOString().split("T")[0];
    const schedPromises = res.data.map((c) =>
        apiCall(`/schedules.php?court_id=${c.court_id}&date=${today}`),
    );
    const scheds = await Promise.all(schedPromises);

    grid.innerHTML = res.data
        .map((court, i) => {
            const info = COURT_INFO[court.court_id] || COURT_INFO[1];
            const sched = scheds[i];
            const availCount = sched.success
                ? sched.data.filter((s) => s.availability === "available").length
                : 0;
            const totalSlots = sched.success ? sched.data.length : 0;
            const statusLabel = availCount > 0 ? "✓ Tersedia" : "✗ Penuh";
            const statusColor =
                availCount > 0
                    ? "rgba(19,201,142,0.2);color:#13c98e;border:1px solid rgba(19,201,142,0.4)"
                    : "rgba(255,80,80,0.2);color:#ff8080;border:1px solid rgba(255,80,80,0.4)";

            const minPrice =
                sched.success && sched.data.length
                    ? Math.min(...sched.data.map((s) => s.price))
                    : 50000;
            const infoRows = info.info
                .slice(0, 2)
                .map(
                    ([ic, tx]) =>
                        `<div class="court-info-item">${ic} <span>${tx}</span></div>`,
                )
                .join("");
            const infoRows2 = info.info
                .slice(2, 4)
                .map(
                    ([ic, tx]) =>
                        `<div class="court-info-item">${ic} <span>${tx}</span></div>`,
                )
                .join("");

            return `
    <div class="court-detail-card">
      <div class="court-img" style="background:${info.bg}">
        <svg width="200" height="100" viewBox="0 0 200 100">
          <rect x="10" y="10" width="180" height="80" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
          <line x1="100" y1="10" x2="100" y2="90" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
          <line x1="10" y1="50" x2="190" y2="50" stroke="rgba(255,255,255,0.8)" stroke-width="2.5"/>
          <rect x="30" y="10" width="140" height="80" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
        </svg>
        <div class="court-number-badge">${info.label}</div>
        <div style="position:absolute;top:14px;right:14px;padding:4px 12px;border-radius:100px;font-size:12px;font-weight:600;background:${statusColor};">${statusLabel}</div>
      </div>
      <div class="court-body">
        <div class="court-title">${court.nama_lapangan}</div>
        <div class="court-type">${info.type}</div>
        <div class="court-info-row">${infoRows}</div>
        <div class="court-info-row">${infoRows2}</div>
        <div class="court-price">
          <div>
            <div class="price-text">Rp ${minPrice.toLocaleString("id-ID")}</div>
            <div class="price-sub">mulai dari / jam · ${availCount}/${totalSlots} slot tersedia</div>
          </div>
          <button class="book-btn" onclick="prefillBooking('${court.court_id}')">⚡ Booking</button>
        </div>
      </div>
    </div>`;
        })
        .join("");
}

async function loadHeroPreview() {
    const res = await apiCall("/courts.php");
    const preview = document.getElementById("hero-court-preview");
    if (!res.success || !res.data.length) return;
    const today = new Date().toISOString().split("T")[0];
    const scheds = await Promise.all(
        res.data
            .slice(0, 4)
            .map((c) =>
                apiCall(`/schedules.php?court_id=${c.court_id}&date=${today}`),
            ),
    );

    preview.innerHTML = res.data
        .slice(0, 4)
        .map((court, i) => {
            const sched = scheds[i];
            const slots = sched.success ? sched.data.slice(0, 6) : [];
            const availCount = slots.filter(
                (s) => s.availability === "available",
            ).length;
            const statusLabel = availCount > 0 ? "Tersedia" : "Penuh";
            const statusClass = availCount > 0 ? "status-open" : "status-busy";
            const slotPills = slots
                .map(
                    (s) =>
                        `<span class="slot ${s.availability === "available" ? "slot-open" : "slot-taken"}">${s.start_time.slice(0, 5)}</span>`,
                )
                .join("");

            return `
    <div class="court-card">
      <div class="court-card-header">
        <div class="court-name">🏸 ${court.nama_lapangan}</div>
        <span class="court-status ${statusClass}">${statusLabel}</span>
      </div>
      <div class="court-slots">${slotPills || '<span style="color:rgba(255,255,255,0.3);font-size:12px;">Tidak ada jadwal hari ini</span>'}</div>
    </div>`;
        })
        .join("");
}

// ═══════════════════════════════════════════════════════════
// SCHEDULE — JADWAL REAL-TIME
// ═══════════════════════════════════════════════════════════

let currentScheduleDate = new Date().toISOString().split("T")[0];

function buildDateButtons() {
    const container = document.getElementById("date-selector-btns");
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Agu",
        "Sep",
        "Okt",
        "Nov",
        "Des",
    ];
    let html = "";
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const iso = d.toISOString().split("T")[0];
        const isActive = iso === currentScheduleDate ? "active" : "";
        html += `<button class="date-btn ${isActive}" onclick="setScheduleDate('${iso}',this)">
      ${days[d.getDay()]}<br><span style="font-size:10px;opacity:.7">${d.getDate()} ${months[d.getMonth()]}</span>
    </button>`;
    }
    container.innerHTML = html;
}

function setScheduleDate(date, btn) {
    currentScheduleDate = date;
    document
        .querySelectorAll(".date-btn")
        .forEach((b) => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    document.getElementById("schedule-date-picker").value = date;
    renderSchedulePage();
}

async function renderSchedulePage() {
    buildDateButtons();
    const body = document.getElementById("schedule-body");
    body.innerHTML = '<div class="schedule-loading">⏳ Memuat jadwal...</div>';

    const courtsRes = await apiCall("/courts.php");
    if (!courtsRes.success) {
        body.innerHTML =
            '<div class="schedule-loading">❌ Gagal memuat data lapangan</div>';
        return;
    }

    const promises = courtsRes.data.map((c) =>
        apiCall(
            `/schedules.php?court_id=${c.court_id}&date=${currentScheduleDate}`,
        ),
    );
    const results = await Promise.all(promises);

    const allTimes = {};
    results.forEach((r) => {
        if (r.success)
            r.data.forEach((s) => {
                allTimes[s.start_time] = s.start_time;
            });
    });
    const sortedTimes = Object.keys(allTimes).sort();

    if (!sortedTimes.length) {
        body.innerHTML =
            '<div class="schedule-loading">📅 Tidak ada jadwal tersedia untuk tanggal ini</div>';
        return;
    }

    const session = getSession();
    let html = "";
    body.style.display = "grid";
    body.style.gridTemplateColumns = "var(--sched-col, 100px 1fr 1fr 1fr 1fr)";
    body.style.minWidth = "var(--sched-min, unset)";

    sortedTimes.forEach((time) => {
        html += `<div style="display:contents">`;
        html += `<div class="time-label">${time.slice(0, 5)}</div>`;

        results.forEach((res, courtIdx) => {
            if (!res.success) {
                html += `<div class="slot-cell"></div>`;
                return;
            }
            const slot = res.data.find((s) => s.start_time === time);

            if (!slot) {
                html += `<div class="slot-cell" style="background:rgba(0,0,0,0.02);"></div>`;
                return;
            }

            let cls,
                label,
                clickAttr = "";
            if (slot.availability === "booked") {
                cls = "slot-booked";
                label = "Dipesan";
            } else {
                cls = "slot-available";
                label = "Tersedia";
                const cid = courtsRes.data[courtIdx].court_id;
                clickAttr = `onclick="bookFromSchedule(${cid},'${time.slice(0, 5)}')"`;
            }

            html += `<div class="slot-cell ${cls}" ${clickAttr}><span class="slot-pill">${label}</span></div>`;
        });
        html += `</div>`;
    });

    body.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
// BOOKING
// ═══════════════════════════════════════════════════════════

let selectedSlots = [];
let scheduleByTime = {};

async function loadCourtsForBooking() {
    const res = await apiCall("/courts.php");
    if (!res.success) return;
    const sel = document.getElementById("book-court");
    sel.innerHTML = '<option value="">— Pilih Lapangan —</option>';
    res.data.forEach((c) => {
        sel.innerHTML += `<option value="${c.court_id}">${c.nama_lapangan}</option>`;
    });
}

async function onCourtOrDateChange() {
    updateSummary();
    const courtId = document.getElementById("book-court").value;
    const date = document.getElementById("book-date").value;
    if (!courtId || !date) return;

    const slotsContainer = document.getElementById("time-slots");
    slotsContainer.innerHTML =
        '<div style="grid-column:1/-1;text-align:center;padding:1.5rem;color:var(--text-light);">⏳ Memuat slot...</div>';
    selectedSlots = [];
    scheduleByTime = {};
    updateSummary();

    const res = await apiCall(`/schedules.php?court_id=${courtId}&date=${date}`);
    if (!res.success || !res.data.length) {
        slotsContainer.innerHTML =
            '<div style="grid-column:1/-1;text-align:center;padding:1.5rem;color:var(--text-light);">Tidak ada jadwal untuk pilihan ini</div>';
        return;
    }

    res.data.forEach((s) => {
        scheduleByTime[s.start_time.slice(0, 5)] = {
            schedule_id: s.schedule_id,
            price: s.price,
        };
    });

    slotsContainer.innerHTML = res.data
        .map((s) => {
            const time = s.start_time.slice(0, 5);
            const taken = s.availability === "booked";
            return `<div class="time-slot-btn ${taken ? "taken" : ""}"
      data-time="${time}" data-price="${s.price}" data-sid="${s.schedule_id}"
      onclick="toggleSlot(this,'${time}',${s.price},${s.schedule_id})">
      ${time}<br><span style="font-size:10px;opacity:0.7;">Rp ${(s.price / 1000).toFixed(0)}k</span>
    </div>`;
        })
        .join("");
}

function toggleSlot(el, time, price, scheduleId) {
    if (el.classList.contains("taken")) return;
    if (el.classList.contains("selected")) {
        el.classList.remove("selected");
        selectedSlots = selectedSlots.filter((s) => s.start_time !== time);
    } else {
        el.classList.add("selected");
        selectedSlots.push({ schedule_id: scheduleId, start_time: time, price });
        selectedSlots.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    updateSummary();
}

function updateSummary() {
    const name = document.getElementById("book-name")?.value || "—";
    const courtEl = document.getElementById("book-court");
    const court = courtEl?.options[courtEl.selectedIndex]?.text || "—";
    const date = document.getElementById("book-date")?.value;

    document.getElementById("sum-name").textContent = name || "—";
    document.getElementById("sum-court").textContent = courtEl?.value
        ? court
        : "—";
    document.getElementById("sum-date").textContent = date
        ? formatDate(date)
        : "—";
    document.getElementById("sum-time").textContent = selectedSlots.length
        ? selectedSlots.map((s) => s.start_time).join(", ")
        : "—";
    document.getElementById("sum-dur").textContent = selectedSlots.length
        ? selectedSlots.length + " jam"
        : "—";
    document.getElementById("sum-pay").textContent = "QRIS";

    const total = selectedSlots.reduce((sum, s) => sum + s.price, 0);
    document.getElementById("sum-total").textContent =
        total > 0 ? "Rp " + total.toLocaleString("id-ID") : "Rp 0";
}

function formatDate(d) {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Agu",
        "Sep",
        "Okt",
        "Nov",
        "Des",
    ];
    const dt = new Date(d + "T00:00:00");
    return `${days[dt.getDay()]}, ${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
}

function autofillBooking() {
    const user = getSession();
    if (!user) return;
    const nameEl = document.getElementById("book-name");
    const phoneEl = document.getElementById("book-phone");
    if (nameEl) nameEl.value = user.nama_lengkap || "";
    if (phoneEl) phoneEl.value = user.nomor_handphone || "";
    updateSummary();
}

function refreshBookingGate() {
    const loggedIn = !!getSession();
    document
        .getElementById("booking-auth-gate")
        .classList.toggle("show", !loggedIn);
    document.getElementById("booking-content").style.display = loggedIn
        ? "block"
        : "none";
    if (loggedIn) {
        autofillBooking();
        loadCourtsForBooking();
        loadMyBookings();
        const dateEl = document.getElementById("book-date");
        if (dateEl && !dateEl.value) {
            dateEl.value = new Date().toISOString().split("T")[0];
        }
    }
}

// ─── QRIS Payment State ─────────────────────────────────────
let qrisBookingData = null;
let qrisTimerInterval = null;
const QRIS_TIMEOUT_SEC = 300;

async function submitBooking() {
    const name = document.getElementById("book-name").value.trim();
    const courtId = document.getElementById("book-court").value;
    const date = document.getElementById("book-date").value;

    if (!name) {
        showToast("⚠️ Harap isi nama lengkap!", true);
        return;
    }
    if (!courtId) {
        showToast("⚠️ Harap pilih lapangan!", true);
        return;
    }
    if (!date) {
        showToast("⚠️ Harap pilih tanggal!", true);
        return;
    }
    if (!selectedSlots.length) {
        showToast("⚠️ Harap pilih minimal 1 jam!", true);
        return;
    }

    const btn = document.getElementById("submit-btn");
    btn.disabled = true;
    btn.innerHTML =
        '<div class="spinner" style="border-color:rgba(255,255,255,0.3);border-top-color:white;margin:0 auto;"></div>';

    const items = selectedSlots.map((s) => ({
        schedule_id: s.schedule_id,
        play_date: date,
    }));
    const totalPrice = selectedSlots.reduce((sum, s) => sum + (s.price || 0), 0);

    qrisBookingData = { items, totalPrice, courtId, date };

    btn.disabled = false;
    btn.innerHTML = "⚡ KONFIRMASI BOOKING";

    openQrisModal(totalPrice);
}

function openQrisModal(totalPrice) {
    const overlay = document.getElementById("qris-overlay");
    document.getElementById("qris-success").style.display = "none";
    overlay.querySelector(".qris-body").style.display = "";
    overlay.querySelector(".qris-footer").style.display = "";
    overlay.querySelector(".qris-header").style.display = "";

    document.getElementById("qris-amount").textContent =
        "Rp " + totalPrice.toLocaleString("id-ID");
    document.getElementById("qris-booking-ref").textContent =
        "Menunggu konfirmasi pembayaran…";

    const qrData = `MOSE-QRIS-${Date.now()}-${totalPrice}`;
    renderQrisQR(qrData, totalPrice);

    overlay.classList.add("show");
    document.body.style.overflow = "hidden";
    startQrisTimer();
}

function renderQrisQR(data, amount) {
    const container = document.getElementById("qris-qr-inner");
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}&margin=10&bgcolor=ffffff&color=0d2240&format=png&qzone=1`;
    container.innerHTML = `
    <div style="background:#fff;padding:12px;border-radius:12px;display:inline-block;box-shadow:0 4px 20px rgba(0,0,0,0.12);">
      <img src="${qrUrl}" width="180" height="180" alt="QRIS MoSe"
           onerror="this.parentElement.innerHTML=getFallbackQR(${amount})"
           style="display:block;border-radius:4px;">
    </div>
    <div style="margin-top:10px;font-size:11px;font-weight:700;color:var(--teal);letter-spacing:1px;">MoSe · NMID: ID102410125567891</div>
  `;
}

function getFallbackQR(amount) {
    return `<div style="width:180px;height:180px;background:#fff;border-radius:8px;display:grid;place-items:center;padding:16px;">
    <div style="font-size:48px;">⬛</div>
    <div style="font-size:11px;color:#0d2240;text-align:center;font-weight:600;margin-top:4px;">Rp ${amount.toLocaleString("id-ID")}</div>
  </div>`;
}

function startQrisTimer() {
    clearInterval(qrisTimerInterval);
    let remaining = QRIS_TIMEOUT_SEC;
    const textEl = document.getElementById("qris-timer-text");
    const circleEl = document.getElementById("qris-timer-circle");
    const circumference = 113;

    function tick() {
        const m = String(Math.floor(remaining / 60)).padStart(2, "0");
        const s = String(remaining % 60).padStart(2, "0");
        textEl.textContent = `${m}:${s}`;

        const progress = remaining / QRIS_TIMEOUT_SEC;
        circleEl.style.strokeDashoffset = circumference * (1 - progress);
        circleEl.style.stroke = remaining < 60 ? "#ff6b6b" : "#13c98e";
        textEl.style.color = remaining < 60 ? "#ff6b6b" : "var(--teal)";

        if (remaining <= 0) {
            clearInterval(qrisTimerInterval);
            onQrisExpired();
            return;
        }
        remaining--;
    }
    tick();
    qrisTimerInterval = setInterval(tick, 1000);
}

function onQrisExpired() {
    showToast("⏰ Waktu pembayaran habis. Silakan coba lagi.", true);
    closeQrisModal();
}

function cancelQrisPayment() {
    clearInterval(qrisTimerInterval);
    closeQrisModal();
    showToast("❌ Pembayaran dibatalkan.", true);
}

async function confirmQrisPayment() {
    if (!qrisBookingData) return;

    const btn = document.getElementById("qris-confirm-btn");
    btn.disabled = true;
    document.getElementById("qris-confirm-content").innerHTML =
        '<div class="spinner" style="border-color:rgba(255,255,255,0.3);border-top-color:white;width:18px;height:18px;margin:0 auto;"></div>';

    clearInterval(qrisTimerInterval);

    const res = await apiCall("/bookings.php", {
        method: "POST",
        body: JSON.stringify({
            items: qrisBookingData.items,
            payment_method: "qris",
        }),
    });

    btn.disabled = false;
    document.getElementById("qris-confirm-content").textContent =
        "✅ Saya Sudah Bayar";

    if (!res.success) {
        showToast("❌ " + res.message, true);
        closeQrisModal();
        return;
    }

    showQrisSuccess(res);
}

function showQrisSuccess(res) {
    document
        .getElementById("qris-overlay")
        .querySelector(".qris-body").style.display = "none";
    document
        .getElementById("qris-overlay")
        .querySelector(".qris-footer").style.display = "none";
    document
        .getElementById("qris-overlay")
        .querySelector(".qris-header").style.display = "none";

    document.getElementById("qris-booking-ref").textContent =
        `Booking #${res.booking_id}`;
    document.getElementById("qris-success-desc").textContent =
        `Booking #${res.booking_id} · Rp ${res.total_price?.toLocaleString("id-ID")} · Pembayaran QRIS Terverifikasi ✓`;
    document.getElementById("qris-success").style.display = "flex";
}

function closeQrisModal() {
    clearInterval(qrisTimerInterval);
    const overlay = document.getElementById("qris-overlay");
    overlay.classList.remove("show");
    document.body.style.overflow = "";
    qrisBookingData = null;

    selectedSlots = [];
    document.getElementById("book-court").value = "";
    document.getElementById("book-date").value = new Date()
        .toISOString()
        .split("T")[0];
    document.getElementById("book-note").value = "";
    document.getElementById("time-slots").innerHTML =
        '<div style="grid-column:1/-1;text-align:center;padding:1.5rem;color:var(--text-light);">Pilih lapangan dan tanggal terlebih dahulu</div>';
    autofillBooking();
    updateSummary();
    loadMyBookings();
}

function prefillBooking(courtId) {
    showSection("booking");
    setTimeout(() => {
        const sel = document.getElementById("book-court");
        if (sel) {
            sel.value = courtId;
            onCourtOrDateChange();
        }
    }, 200);
}

function bookFromSchedule(courtId, time) {
    showSection("booking");
    setTimeout(() => {
        const sel = document.getElementById("book-court");
        const dateEl = document.getElementById("book-date");
        if (sel) sel.value = courtId;
        if (dateEl) dateEl.value = currentScheduleDate;
        onCourtOrDateChange().then(() => {
            setTimeout(() => {
                const btn = document.querySelector(`[data-time="${time}"]`);
                if (btn && !btn.classList.contains("taken")) btn.click();
            }, 300);
        });
    }, 200);
}

// ═══════════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════════

let avatarFile = null;

async function loadProfilePage() {
    const user = getSession();
    if (!user) return;

    renderProfileUI(user);

    const res = await apiCall("/users.php");
    if (res.success && res.data) {
        const updated = { ...user, ...res.data };
        saveSession(updated);
        renderProfileUI(updated);
    }
}

function renderProfileUI(user) {
    const avatarEl = document.getElementById("profile-avatar-display");
    if (user.foto_profil) {
        const baseUrl = BASE_URL.replace("/api", "");
        avatarEl.innerHTML = `<img src="${baseUrl}/${user.foto_profil}" alt="Foto" style="width:96px;height:96px;border-radius:50%;object-fit:cover;" onerror="this.parentElement.innerHTML=initials_of('${user.nama_lengkap}')">`;
        avatarEl.classList.add("has-photo");
    } else {
        const initials = user.nama_lengkap
            .split(" ")
            .map((w) => w[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
        avatarEl.textContent = initials;
        avatarEl.classList.remove("has-photo");
        avatarEl.style.display = "flex";
    }

    document.getElementById("profile-display-name").textContent =
        user.nama_lengkap || "—";
    document.getElementById("profile-display-email").textContent =
        user.email || "—";
    document.getElementById("profile-nama").value = user.nama_lengkap || "";
    document.getElementById("profile-phone").value = user.nomor_handphone || "";
    document.getElementById("profile-email").value = user.email || "";
}

async function saveProfileInfo() {
    const nama = document.getElementById("profile-nama").value.trim();
    const alertEl = document.getElementById("profile-info-alert");
    alertEl.className = "profile-alert";
    alertEl.style.display = "none";

    if (nama.length < 2) {
        showProfileAlert(
            "profile-info-alert",
            "Nama lengkap minimal 2 karakter",
            "error",
        );
        return;
    }

    const btn = document.getElementById("profile-save-btn");
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Menyimpan...';

    const res = await apiCall("/users.php", {
        method: "PUT",
        body: JSON.stringify({ nama_lengkap: nama }),
    });

    btn.disabled = false;
    btn.innerHTML = "💾 Simpan Perubahan";

    if (!res.success) {
        showProfileAlert("profile-info-alert", "❌ " + res.message, "error");
        return;
    }

    const session = getSession();
    const updated = { ...session, nama_lengkap: nama, ...(res.data || {}) };
    saveSession(updated);
    updateNavUser();
    renderProfileUI(updated);
    showProfileAlert(
        "profile-info-alert",
        "✅ Profil berhasil diperbarui!",
        "success",
    );
}

async function saveProfilePassword() {
    const oldPw = document.getElementById("profile-old-pw").value;
    const newPw = document.getElementById("profile-new-pw").value;
    const newPw2 = document.getElementById("profile-new-pw2").value;

    if (!oldPw || !newPw || !newPw2) {
        showProfileAlert(
            "profile-pw-alert",
            "❌ Semua field password wajib diisi",
            "error",
        );
        return;
    }
    if (newPw.length < 6) {
        showProfileAlert(
            "profile-pw-alert",
            "❌ Password baru minimal 6 karakter",
            "error",
        );
        return;
    }
    if (newPw !== newPw2) {
        showProfileAlert(
            "profile-pw-alert",
            "❌ Konfirmasi password tidak cocok",
            "error",
        );
        return;
    }

    const btn = document.getElementById("profile-pw-btn");
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Memproses...';

    const res = await apiCall("/users.php?action=password", {
        method: "PUT",
        body: JSON.stringify({ old_password: oldPw, new_password: newPw }),
    });

    btn.disabled = false;
    btn.innerHTML = "🔑 Ganti Password";

    if (!res.success) {
        showProfileAlert("profile-pw-alert", "❌ " + res.message, "error");
        return;
    }

    document.getElementById("profile-old-pw").value = "";
    document.getElementById("profile-new-pw").value = "";
    document.getElementById("profile-new-pw2").value = "";
    showProfileAlert(
        "profile-pw-alert",
        "✅ Password berhasil diubah!",
        "success",
    );
}

function showProfileAlert(id, msg, type) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.className = "profile-alert " + type + " show";
    setTimeout(() => {
        el.classList.remove("show");
    }, 4000);
}

function toggleProfilePw(inputId, btn) {
    const inp = document.getElementById(inputId);
    if (inp.type === "password") {
        inp.type = "text";
        btn.textContent = "🙈";
    } else {
        inp.type = "password";
        btn.textContent = "👁";
    }
}

// ─── Avatar Modal ─────────────────────────────────────────────
function openAvatarModal() {
    avatarFile = null;
    document.getElementById("avatar-file-input").value = "";
    document.getElementById("avatar-preview-wrap").classList.remove("show");
    document.getElementById("avatar-confirm-btn").disabled = true;
    document.getElementById("avatar-drop-zone").style.display = "";
    document.getElementById("avatar-upload-overlay").classList.add("visible");
}

function closeAvatarModal() {
    document.getElementById("avatar-upload-overlay").classList.remove("visible");
    avatarFile = null;
}

function avatarDragOver(e) {
    e.preventDefault();
    document.getElementById("avatar-drop-zone").classList.add("drag-over");
}
function avatarDragLeave() {
    document.getElementById("avatar-drop-zone").classList.remove("drag-over");
}
function avatarDrop(e) {
    e.preventDefault();
    document.getElementById("avatar-drop-zone").classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file) avatarFileSelected(file);
}

function avatarFileSelected(file) {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
        showToast("❌ Format file harus JPG, PNG, WebP, atau GIF", true);
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        showToast("❌ Ukuran file maksimal 2 MB", true);
        return;
    }

    avatarFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById("avatar-preview-img").src = e.target.result;
        document.getElementById("avatar-preview-name").textContent =
            file.name + " · " + (file.size / 1024).toFixed(0) + " KB";
        document.getElementById("avatar-preview-wrap").classList.add("show");
        document.getElementById("avatar-drop-zone").style.display = "none";
        document.getElementById("avatar-confirm-btn").disabled = false;
    };
    reader.readAsDataURL(file);
}

async function uploadAvatar() {
    if (!avatarFile) return;

    const btn = document.getElementById("avatar-confirm-btn");
    btn.disabled = true;
    btn.innerHTML =
        '<div class="spinner" style="border-color:rgba(255,255,255,0.3);border-top-color:white;"></div>';

    const session = getSession();
    const formData = new FormData();
    formData.append("foto", avatarFile);

    try {
        const url =
            BASE_URL +
            "/users.php?action=avatar&token=" +
            encodeURIComponent(session.token);
        const res = await fetch(url, { method: "POST", body: formData });
        const data = await res.json();

        if (!data.success) {
            showToast("❌ " + data.message, true);
            btn.disabled = false;
            btn.innerHTML = "⬆️ Upload";
            return;
        }

        const updated = { ...session, foto_profil: data.foto_profil };
        saveSession(updated);
        closeAvatarModal();
        renderProfileUI(updated);
        updateNavUser();
        showToast("✅ Foto profil berhasil diperbarui!");
    } catch (e) {
        showToast("❌ Gagal menghubungi server", true);
        btn.disabled = false;
        btn.innerHTML = "⬆️ Upload";
    }
}

// ─── Riwayat Booking User ─────────────────────────────────
async function loadMyBookings() {
    if (!getSession()) return;
    const list = document.getElementById("my-bookings-list");
    const res = await apiCall("/bookings.php");

    if (!res.success || !res.data.length) {
        list.innerHTML =
            '<div style="font-size:12px;color:rgba(255,255,255,0.3);text-align:center;padding:1rem;">Belum ada booking</div>';
        return;
    }

    list.innerHTML = res.data
        .slice(0, 5)
        .map(
            (b) => `
    <div class="my-booking-card">
      <div class="bk-header">
        <div class="bk-court">Booking #${b.booking_id}</div>
        <span class="bk-status ${b.status}">${b.status === "confirmed" ? "✅ Confirmed" : b.status === "cancelled" ? "❌ Dibatalkan" : b.status}</span>
      </div>
      <div class="bk-info">
        📅 ${b.booking_date} · Rp ${parseInt(b.total_price).toLocaleString("id-ID")}
        <br>⬛ QRIS ·
        <span style="color:${b.payment_status === "verified" ? "#13c98e" : b.payment_status === "failed" ? "#ff8080" : "#ffa500"}">
          ${b.payment_status === "verified" ? "✓ Terverifikasi" : b.payment_status === "failed" ? "✗ Gagal" : b.payment_status || "pending"}
        </span>
      </div>
    </div>
  `,
        )
        .join("");
}

// ─── Mobile Hamburger Menu ─────────────────────────────
function toggleMenu() {
    document.getElementById("nav-links").classList.toggle("open");
    document.getElementById("nav-hamburger").classList.toggle("open");
}
function closeMenu() {
    document.getElementById("nav-links").classList.remove("open");
    document.getElementById("nav-hamburger").classList.remove("open");
}

// ═══════════════════════════════════════════════════════════
// INIT — dipanggil oleh loadSections() setelah semua section dimuat
// ═══════════════════════════════════════════════════════════
function init() {
    updateNavUser();
    loadHeroPreview();

    if (getSession()) {
        loadCourtsForBooking();
    } else {
        setTimeout(() => openAuthOverlay("login"), 400);
    }
}

// Mulai dengan memuat semua section
loadSections();
