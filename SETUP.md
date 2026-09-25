# Panduan Setup — Sistem Pendaftaran BK Digital

Struktur file:

```
index.html      -> Formulir publik untuk Koordinator BK
admin.html       -> Dashboard admin (backend)
config.js        -> Tempat URL Apps Script diisi
script.js        -> Logic formulir publik
admin.js         -> Logic dashboard admin
style.css        -> Desain kedua halaman
Code.gs           -> Backend (Google Apps Script) — ditempel ke Google Sheet
```

Database yang dipakai adalah **Google Spreadsheet**, dan yang menjembatani
website (di GitHub Pages) dengan Spreadsheet adalah **Google Apps Script**
yang di-deploy sebagai Web App. GitHub Pages tidak bisa menjalankan server,
jadi Apps Script inilah "server"-nya.

## Langkah 1 — Buat Google Spreadsheet

1. Buka [sheets.new](https://sheets.new) untuk membuat spreadsheet baru.
2. Beri nama, misalnya **Database BK Digital**.
3. Biarkan sheet pertama kosong — nanti otomatis dibuat sheet bernama
   `Pendaftaran` dengan header yang benar saat form pertama kali disubmit
   (atau saat Anda menjalankan skrip pertama kali).

## Langkah 2 — Tempel skrip backend

1. Di spreadsheet, klik menu **Extensions → Apps Script**.
2. Hapus kode default, lalu salin seluruh isi file **Code.gs** ke sana.
3. Klik ikon **Save**.

## Langkah 3 — Atur password admin

1. Di editor Apps Script, cari fungsi `setAdminPasswordSekaliJalan`.
2. Ganti `"passwordAnda"` dengan password admin pilihan Anda.
3. Pilih fungsi tersebut di dropdown toolbar, lalu klik **Run**.
4. Saat diminta izin, klik **Review permissions** → pilih akun Google Anda →
   **Advanced** → **Go to (nama project) (unsafe)** → **Allow**.
   (Ini normal karena skrip milik Anda sendiri.)
5. Setelah berhasil jalan sekali, Anda **boleh menghapus password dari kode**
   agar tidak tertinggal di teks — password sudah tersimpan aman di
   **Project Settings → Script Properties**.

## Langkah 4 — Deploy sebagai Web App

1. Klik tombol **Deploy → New deployment**.
2. Pilih ikon gerigi (Select type) → **Web app**.
3. Isi:
   - **Execute as**: `Me (email Anda)`
   - **Who has access**: `Anyone`
4. Klik **Deploy**, lalu **izinkan akses** jika diminta lagi.
5. Salin **Web app URL** yang muncul (formatnya
   `https://script.google.com/macros/s/xxxxxxxx/exec`).

> Setiap kali Anda mengubah isi Code.gs, gunakan **Deploy → Manage deployments
> → Edit (ikon pensil) → Version: New version → Deploy** agar perubahan aktif.

## Langkah 5 — Hubungkan frontend ke backend

1. Buka file **config.js**.
2. Ganti nilai `API_URL` dengan Web App URL dari Langkah 4:

```js
const CONFIG = {
  API_URL: "https://script.google.com/macros/s/xxxxxxxx/exec"
};
```

## Langkah 6 — Hosting ke GitHub Pages

1. Buat repository baru di GitHub, misalnya `bk-digital`.
2. Upload semua file (`index.html`, `admin.html`, `config.js`, `script.js`,
   `admin.js`, `style.css`) ke repository tersebut. **Code.gs dan SETUP.md
   tidak perlu diupload** — keduanya hanya referensi Anda.
3. Masuk ke **Settings → Pages**.
4. Pada **Source**, pilih branch `main` dan folder `/ (root)`, lalu **Save**.
5. Tunggu 1–2 menit, GitHub akan memberi URL seperti:
   `https://namauser.github.io/bk-digital/`

Bagikan link `index.html` (halaman utama) ke Guru BK/sekolah, dan simpan
link `admin.html` untuk Anda sendiri, misalnya:

- Form publik: `https://namauser.github.io/bk-digital/`
- Admin: `https://namauser.github.io/bk-digital/admin.html`

## Cara pakai sehari-hari

1. Guru BK mengisi form di `index.html` → data otomatis masuk ke Spreadsheet.
2. Anda memasang Sistem BK Digital untuk sekolah tersebut.
3. Buka `admin.html`, login dengan password admin.
4. Klik salah satu pendaftaran untuk membuka detailnya.
5. Isi **Link Akses**, **Link Appscript**, **Token**, **Link Database**, dan
   **Link Panduan**, lalu klik **Simpan Data**.
6. Klik **Kirim ke WhatsApp** — WhatsApp Web/App akan terbuka dengan pesan
   yang sudah otomatis berisi semua link tersebut, terkirim ke nomor WA
   yang diisi Guru BK di formulir. Anda tinggal menekan tombol kirim di
   WhatsApp.

## Catatan keamanan

- Password email guru BK tersimpan apa adanya di Spreadsheet agar tim Anda
  bisa memakainya untuk menghubungkan Appscript — batasi akses Spreadsheet
  hanya untuk Anda/tim yang perlu.
- Password admin dashboard disimpan sederhana (dicek langsung oleh Apps
  Script) — cukup untuk penggunaan internal tim kecil. Untuk kebutuhan
  keamanan lebih tinggi (banyak admin, log aktivitas, dll.), sistem ini bisa
  dikembangkan lebih lanjut.
- Field "Panduan Penggunaan" di dashboard admin memakai **link** (misalnya
  link Google Drive/Docs berisi file PDF panduan), bukan upload file
  langsung — cukup upload file panduan ke Google Drive, atur sharing
  "Anyone with the link", lalu tempel link-nya di dashboard.
