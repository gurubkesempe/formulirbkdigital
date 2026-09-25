/* =========================================================
   Sistem BK Digital — Dashboard Admin
   ========================================================= */
(function () {
  const loginWrap = document.getElementById("loginWrap");
  const dashboardWrap = document.getElementById("dashboardWrap");
  const topbarWho = document.getElementById("topbarWho");
  const loginForm = document.getElementById("loginForm");
  const loginBtn = document.getElementById("loginBtn");
  const loginBanner = document.getElementById("loginBanner");
  const logoutBtn = document.getElementById("logoutBtn");
  const entryList = document.getElementById("entryList");
  const searchInput = document.getElementById("searchInput");
  const filterStatus = document.getElementById("filterStatus");
  const refreshBtn = document.getElementById("refreshBtn");
  const toast = document.getElementById("toast");

  let allEntries = [];
  let adminPassword = sessionStorage.getItem("bkAdminPass") || "";

  // ---------- Helpers ----------
  function showToast(msg, isError) {
    toast.textContent = msg;
    toast.className = "toast show" + (isError ? " error" : "");
    setTimeout(() => (toast.className = "toast"), 3200);
  }

  function apiUrlReady() {
    return CONFIG.API_URL && !CONFIG.API_URL.includes("GANTI_DENGAN_URL");
  }

  async function apiPost(payload) {
    const res = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  async function apiGetList() {
    return apiPost({ action: "list", password: adminPassword });
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function initials(name) {
    return (name || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  }

  function statusClass(status) {
    if (status === "Terkirim") return "terkirim";
    if (status === "Siap Kirim") return "siap";
    return "baru";
  }

  function normalizePhoneForWa(raw) {
    let digits = String(raw ?? "").replace(/[^0-9]/g, "");
    if (digits.startsWith("0")) digits = "62" + digits.slice(1);
    if (!digits.startsWith("62")) digits = "62" + digits;
    return digits;
  }

  function buildWaMessage(entry) {
    const lines = [
      `Halo ${entry.nama || ""}, 🙏`,
      "",
      `Berikut akses *Sistem BK Digital* untuk *${entry.asalSekolah || ""}* yang telah berhasil dipasang:`,
      "",
    ];
    if (entry.linkAkses) lines.push(`🔗 *Link Akses Sistem:*\n${entry.linkAkses}`, "");
    if (entry.linkAppscript) lines.push(`⚙️ *Link Appscript:*\n${entry.linkAppscript}`, "");
    if (entry.tokenAppscript) lines.push(`🔑 *Token Appscript:*\n${entry.tokenAppscript}`, "");
    if (entry.linkDatabase) lines.push(`🗄️ *Link Database:*\n${entry.linkDatabase}`, "");
    if (entry.linkPanduan) lines.push(`📘 *Panduan Penggunaan:*\n${entry.linkPanduan}`, "");
    lines.push("Mohon disimpan baik-baik. Jika ada kendala saat penggunaan sistem, silakan hubungi kami melalui chat ini.", "", "Terima kasih 🙏");
    return lines.join("\n");
  }

  // ---------- Auth ----------
  document.querySelectorAll(".toggle-pass").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.target);
      const isPass = input.type === "password";
      input.type = isPass ? "text" : "password";
      btn.textContent = isPass ? "Sembunyikan" : "Lihat";
    });
  });

  function enterDashboard() {
    loginWrap.style.display = "none";
    dashboardWrap.style.display = "block";
    topbarWho.style.display = "flex";
    loadEntries();
  }

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!apiUrlReady()) {
      loginBanner.textContent = "Dashboard belum terhubung ke server. Lengkapi config.js.";
      loginBanner.className = "status-banner show error";
      return;
    }
    const pass = document.getElementById("adminPass").value;
    loginBtn.disabled = true;
    loginBtn.textContent = "Memeriksa...";
    try {
      const result = await apiPost({ action: "login", password: pass });
      if (result.ok) {
        adminPassword = pass;
        sessionStorage.setItem("bkAdminPass", pass);
        enterDashboard();
      } else {
        loginBanner.textContent = result.message || "Password salah.";
        loginBanner.className = "status-banner show error";
      }
    } catch (err) {
      loginBanner.textContent = "Gagal terhubung ke server.";
      loginBanner.className = "status-banner show error";
    }
    loginBtn.disabled = false;
    loginBtn.textContent = "Masuk";
  });

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("bkAdminPass");
    adminPassword = "";
    dashboardWrap.style.display = "none";
    topbarWho.style.display = "none";
    loginWrap.style.display = "flex";
  });

  // ---------- Load & render ----------
  async function loadEntries() {
    entryList.innerHTML = `<div class="empty-state"><h3>Memuat data...</h3><p>Mohon tunggu sebentar.</p></div>`;
    try {
      const result = await apiGetList();
      if (!result.ok) {
        entryList.innerHTML = `<div class="empty-state"><h3>Gagal memuat</h3><p>${escapeHtml(result.message || "")}</p></div>`;
        return;
      }
      allEntries = result.data || [];
      renderStats();
      renderList();
    } catch (err) {
      entryList.innerHTML = `<div class="empty-state"><h3>Gagal terhubung ke server</h3><p>Periksa koneksi atau URL Apps Script di config.js.</p></div>`;
    }
  }

  function renderStats() {
    document.getElementById("statTotal").textContent = allEntries.length;
    document.getElementById("statBaru").textContent = allEntries.filter(e => (e.status || "Baru") === "Baru").length;
    document.getElementById("statTerkirim").textContent = allEntries.filter(e => e.status === "Terkirim").length;
  }

  function getFiltered() {
    const q = searchInput.value.trim().toLowerCase();
    const st = filterStatus.value;
    return allEntries.filter((e) => {
      const matchQ = !q || [e.nama, e.asalSekolah, e.nomorWA, e.email].join(" ").toLowerCase().includes(q);
      const matchSt = !st || (e.status || "Baru") === st;
      return matchQ && matchSt;
    });
  }

  function renderList() {
    const items = getFiltered();
    if (!items.length) {
      entryList.innerHTML = `<div class="empty-state"><h3>Belum ada data</h3><p>Pendaftaran dari Guru BK akan muncul di sini.</p></div>`;
      return;
    }
    entryList.innerHTML = items.map(entryCardHtml).join("");
    items.forEach(bindEntryCard);
  }

  function entryCardHtml(e) {
    const status = e.status || "Baru";
    return `
    <div class="entry-card" data-id="${escapeHtml(e.id)}">
      <div class="entry-summary" data-toggle>
        <div class="avatar">${escapeHtml(initials(e.nama))}</div>
        <div class="who">
          <div class="name">${escapeHtml(e.nama)}</div>
          <div class="meta">${escapeHtml(e.asalSekolah)} • ${escapeHtml(e.nomorWA)}</div>
        </div>
        <span class="status-tag ${statusClass(status)}">${escapeHtml(status)}</span>
        <span class="chev">▾</span>
      </div>
      <div class="entry-body">
        <h4>Data dari Guru BK</h4>
        <div class="entry-grid">
          <div class="readonly-field"><div class="k">Nama Koordinator</div><div class="v">${escapeHtml(e.nama)}</div></div>
          <div class="readonly-field"><div class="k">Asal Sekolah</div><div class="v">${escapeHtml(e.asalSekolah)}</div></div>
          <div class="readonly-field"><div class="k">Email</div><div class="v">${escapeHtml(e.email)}</div></div>
          <div class="readonly-field"><div class="k">Password Email</div><div class="v">${escapeHtml(e.passwordEmail)}</div></div>
          <div class="readonly-field"><div class="k">Nomor WhatsApp</div><div class="v">${escapeHtml(e.nomorWA)}</div></div>
          <div class="readonly-field"><div class="k">Tanggal Daftar</div><div class="v">${escapeHtml(e.timestamp)}</div></div>
        </div>

        <h4>Data Instalasi (diisi Admin)</h4>
        <div class="field">
          <label>Link Akses Sistem BK Digital</label>
          <input type="text" data-key="linkAkses" value="${escapeHtml(e.linkAkses)}" placeholder="https://...">
        </div>
        <div class="row-2">
          <div class="field">
            <label>Link Appscript</label>
            <input type="text" data-key="linkAppscript" value="${escapeHtml(e.linkAppscript)}" placeholder="https://script.google.com/...">
          </div>
          <div class="field">
            <label>Token Appscript</label>
            <input type="text" data-key="tokenAppscript" value="${escapeHtml(e.tokenAppscript)}" placeholder="Token">
          </div>
        </div>
        <div class="field">
          <label>Link Database (Spreadsheet)</label>
          <input type="text" data-key="linkDatabase" value="${escapeHtml(e.linkDatabase)}" placeholder="https://docs.google.com/spreadsheets/...">
        </div>
        <div class="field">
          <label>Link Panduan Penggunaan</label>
          <input type="text" data-key="linkPanduan" value="${escapeHtml(e.linkPanduan)}" placeholder="https://drive.google.com/...">
        </div>

        <div class="entry-actions">
          <button class="btn btn-save" data-action="save">Simpan Data</button>
          <button class="btn btn-wa" data-action="send">
            <span>Kirim ke WhatsApp</span>
          </button>
          <span class="save-note" data-note></span>
        </div>
      </div>
    </div>`;
  }

  function bindEntryCard(e) {
    const card = entryList.querySelector(`.entry-card[data-id="${cssEscape(e.id)}"]`);
    if (!card) return;

    card.querySelector("[data-toggle]").addEventListener("click", () => {
      card.classList.toggle("open");
    });

    const inputs = card.querySelectorAll("[data-key]");
    const note = card.querySelector("[data-note]");
    const saveBtn = card.querySelector('[data-action="save"]');
    const waBtn = card.querySelector('[data-action="send"]');

    function currentValues() {
      const vals = {};
      inputs.forEach((i) => (vals[i.dataset.key] = i.value.trim()));
      return vals;
    }

    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span class="spinner"></span>`;
      const vals = currentValues();
      const hasLinks = Object.values(vals).some((v) => v);
      const payload = {
        action: "update",
        password: adminPassword,
        id: e.id,
        fields: vals,
        status: hasLinks ? "Siap Kirim" : "Baru",
      };
      try {
        const result = await apiPost(payload);
        if (result.ok) {
          note.textContent = "Tersimpan.";
          Object.assign(e, vals, { status: payload.status });
          card.querySelector(".status-tag").className = `status-tag ${statusClass(payload.status)}`;
          card.querySelector(".status-tag").textContent = payload.status;
          renderStats();
          showToast("Data instalasi tersimpan.");
        } else {
          note.textContent = "Gagal menyimpan.";
          showToast(result.message || "Gagal menyimpan data.", true);
        }
      } catch (err) {
        note.textContent = "Gagal terhubung ke server.";
        showToast("Gagal terhubung ke server.", true);
      }
      saveBtn.disabled = false;
      saveBtn.textContent = "Simpan Data";
      setTimeout(() => (note.textContent = ""), 3000);
    });

    waBtn.addEventListener("click", async () => {
      const vals = currentValues();
      const merged = Object.assign({}, e, vals);
      const phone = normalizePhoneForWa(merged.nomorWA);
      const message = buildWaMessage(merged);
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");

      // Tandai status Terkirim setelah dibuka
      try {
        await apiPost({
          action: "update",
          password: adminPassword,
          id: e.id,
          fields: vals,
          status: "Terkirim",
        });
        Object.assign(e, vals, { status: "Terkirim" });
        card.querySelector(".status-tag").className = "status-tag terkirim";
        card.querySelector(".status-tag").textContent = "Terkirim";
        renderStats();
      } catch (err) {
        /* status akan tetap update saat reload berikutnya */
      }
    });
  }

  function cssEscape(str) {
    return String(str).replace(/["\\]/g, "\\$&");
  }

  // ---------- Toolbar ----------
  searchInput.addEventListener("input", renderList);
  filterStatus.addEventListener("change", renderList);
  refreshBtn.addEventListener("click", loadEntries);

  // ---------- Auto-login jika session tersimpan ----------
  if (adminPassword) {
    enterDashboard();
  }
})();
