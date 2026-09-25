/* =========================================================
   Sistem BK Digital — Formulir Pendaftaran (Publik)
   ========================================================= */
(function () {
  const form = document.getElementById("daftarForm");
  const submitBtn = document.getElementById("submitBtn");
  const statusBanner = document.getElementById("statusBanner");
  const successState = document.getElementById("successState");

  const rules = {
    nama: (v) => v.trim().length >= 3,
    asalSekolah: (v) => v.trim().length >= 3,
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    passwordEmail: (v) => v.length >= 6,
    nomorWA: (v) => /^[0-9+ ]{9,16}$/.test(v.trim()),
  };

  // Toggle lihat/sembunyikan password
  document.querySelectorAll(".toggle-pass").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.target);
      const isPass = input.type === "password";
      input.type = isPass ? "text" : "password";
      btn.textContent = isPass ? "Sembunyikan" : "Lihat";
    });
  });

  function setFieldError(name, hasError) {
    const wrap = form.querySelector(`[data-field="${name}"]`);
    if (!wrap) return;
    wrap.classList.toggle("has-error", hasError);
  }

  function validateAll(data) {
    let valid = true;
    for (const key in rules) {
      const ok = rules[key](data[key] || "");
      setFieldError(key, !ok);
      if (!ok) valid = false;
    }
    return valid;
  }

  function showBanner(message, type) {
    statusBanner.textContent = message;
    statusBanner.className = "status-banner show " + type;
  }

  function hideBanner() {
    statusBanner.className = "status-banner";
  }

  function normalizePhone(raw) {
    // Normalisasi nomor ke format 62xxxxxxxxxx untuk kebutuhan WhatsApp nanti
    let digits = raw.replace(/[^0-9]/g, "");
    if (digits.startsWith("0")) digits = "62" + digits.slice(1);
    if (digits.startsWith("8")) digits = "62" + digits;
    return digits;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    hideBanner();

    const data = {
      nama: form.nama.value.trim(),
      asalSekolah: form.asalSekolah.value.trim(),
      email: form.email.value.trim(),
      passwordEmail: form.passwordEmail.value,
      nomorWA: form.nomorWA.value.trim(),
    };

    if (!validateAll(data)) {
      showBanner("Periksa kembali data yang belum lengkap atau belum valid.", "error");
      return;
    }

    if (!CONFIG.API_URL || CONFIG.API_URL.includes("GANTI_DENGAN_URL")) {
      showBanner("Formulir belum terhubung ke server. Hubungi admin sistem.", "error");
      return;
    }

    data.nomorWA = normalizePhone(data.nomorWA);

    submitBtn.disabled = true;
    submitBtn.textContent = "Mengirim...";

    try {
      const res = await fetch(CONFIG.API_URL, {
        method: "POST",
        // text/plain menghindari CORS preflight yang tidak didukung Apps Script
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "submit", data }),
      });
      const result = await res.json();

      if (result.ok) {
        form.style.display = "none";
        statusBanner.className = "status-banner";
        successState.classList.add("show");
      } else {
        showBanner(result.message || "Terjadi kesalahan saat mengirim data. Coba lagi.", "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Kirim Pendaftaran";
      }
    } catch (err) {
      showBanner("Gagal terhubung ke server. Periksa koneksi internet Anda.", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Kirim Pendaftaran";
    }
  });

  // Bersihkan error saat user mulai mengetik ulang
  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => setFieldError(input.name, false));
  });
})();
