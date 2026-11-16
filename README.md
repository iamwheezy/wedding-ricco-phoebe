# Undangan Pernikahan Ricco & Phoebe

Website undangan digital (statis) + RSVP ke Google Sheets lewat Google Apps Script. Di-host gratis di GitHub Pages.

Link undangan: **https://iamwheezy.github.io/wedding-ricco-phoebe/**
Link dengan nama tamu: `https://iamwheezy.github.io/wedding-ricco-phoebe/?to=Bapak+Andi`
(Spasi pada nama tamu ditulis `+`, misalnya `?to=Ibu+Siti+Aminah`.)

---

## Struktur file

```
index.html              ← struktur halaman (urutan section)
assets/js/config.js     ← SEMUA data acara (nama, tanggal, alamat, rekening, URL Script)  ← edit di sini
assets/js/main.js       ← logika (countdown, RSVP, ucapan, kalender, maps)
assets/css/style.css    ← desain (warna ada di bagian :root paling atas)
assets/img/             ← foto yang sudah dikompres (.webp)
apps-script/Code.gs     ← kode backend Google Apps Script (TIDAK perlu di-upload ke GitHub)
.nojekyll               ← wajib ada supaya GitHub Pages tidak memproses ulang file
```

---

## 1. Setup Google Sheets + Apps Script (sekali saja, ±5 menit)

1. Buka https://sheets.new, lalu beri nama file, misalnya **RSVP Wedding Ricco & Phoebe**.
2. Klik menu **Extensions → Apps Script**.
3. Hapus isi `Code.gs` yang ada, paste seluruh isi `apps-script/Code.gs`, lalu klik 💾 **Save**.
4. Di toolbar, pilih fungsi **setup**, lalu klik **Run**.
   - Akan muncul "Authorization required". Klik **Review permissions**, pilih akun Google kamu, lalu **Advanced → Go to (unsafe) → Allow**. Peringatan ini normal karena script-nya buatan kamu sendiri.
   - Sheet bernama **RSVP** dengan header akan terbentuk.
5. Klik **Deploy → New deployment**. Klik ⚙️ di samping "Select type", lalu pilih **Web app**.
   - Description: `RSVP`
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Klik **Deploy**, lalu copy **Web app URL** (yang berakhiran `/exec`).
6. Buka `assets/js/config.js`, lalu paste URL tadi ke `scriptURL: "https://script.google.com/macros/s/XXXX/exec"`.
7. Upload ulang `config.js` ke GitHub (lihat bagian 3).

### Struktur Google Sheet (tab "RSVP")

| Kolom | Isi |
|---|---|
| A — Timestamp | Waktu submit (otomatis) |
| B — Name | Nama lengkap tamu |
| C — Attendance | `Attending` / `Not Attending` |
| D — Guests | Jumlah orang yang hadir (0 jika tidak hadir) |
| E — Message | Ucapan & doa |
| F — Invited As | Nama dari link `?to=` (untuk mencocokkan undangan) |
| G — Show Wish | ☑ Checkbox. **Hilangkan centang** untuk menyembunyikan ucapan dari website (moderasi) |

- Setiap RSVP masuk sebagai **baris baru**.
- Export data: **File → Download → Microsoft Excel (.xlsx)** atau **CSV**.
- Total tamu hadir: ketik `=SUMIF(C:C,"Attending",D:D)` di sel kosong.

> Kalau suatu saat kode `Code.gs` diubah: **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. URL-nya tetap sama.

---

## 2. Deploy pertama ke GitHub Pages

1. Buka repo **github.com/iamwheezy/wedding-ricco-phoebe**.
2. Klik **Add file → Upload files**.
3. Buka folder `website` di laptop, **pilih semua isinya** (`index.html`, `.nojekyll`, folder `assets`, `README.md`), lalu drag ke halaman GitHub.
   - Yang di-upload adalah **isi** folder `website`, bukan folder `website`-nya. `index.html` harus ada di paling atas (root) repo.
   - File `.nojekyll` tersembunyi di Windows. Kalau tidak terlihat, aktifkan **View → Show → Hidden items** di File Explorer.
4. Klik **Commit changes**.
5. Buka **Settings → Pages**:
   - Source: **Deploy from a branch**
   - Branch: **main**, folder **/ (root)**, lalu klik **Save**.
6. Tunggu 1–2 menit, lalu buka https://iamwheezy.github.io/wedding-ricco-phoebe/

---

## 3. Maintenance (mengubah data nanti)

**Ganti teks, tanggal, jam, alamat, atau rekening:**
Di GitHub, buka `assets/js/config.js`, klik ✏️ (Edit), ubah nilainya, lalu klik **Commit changes**. Website ter-update dalam ±1 menit.

**Menambahkan musik:**
1. Siapkan file `.mp3` (sebaiknya di bawah 5 MB, 128 kbps), beri nama `song.mp3`.
2. Upload ke repo di folder `assets/audio/`. Caranya: Add file → Upload files, lalu ketik path-nya.
3. Di `config.js` isi `music: "assets/audio/song.mp3"`. Tombol musik akan muncul otomatis.

**Menambahkan video pre-wedding:**
1. Kompres video ke MP4 (H.264), maksimal sekitar 20 MB. Bisa pakai HandBrake dengan preset "Fast 720p30".
2. Upload ke `assets/video/prewedding.mp4`.
3. Di `config.js` isi `video: "assets/video/prewedding.mp4"`. Video tampil di atas galeri.
   (Alternatif untuk video besar: upload ke YouTube, lalu minta bantuan untuk embed.)

**Mengganti foto:**
Timpa file di `assets/img/` dengan nama yang sama (`cover.webp`, `hero.webp`, `groom.webp`, `bride.webp`, `g1.webp`–`g8.webp`, dst). Ukuran ideal di bawah 300 KB per foto. Bisa dikonversi di https://squoosh.app.

**Link Google Maps yang lebih presisi:**
Buka lokasi venue di Google Maps → **Share → Copy link**, lalu paste ke `mapsLink` di `config.js`.

**Mengganti warna:**
Edit variabel di bagian paling atas `assets/css/style.css` (`--forest`, `--gold`, `--sage`, dst).

---

## 4. Membuat link per tamu

Format: `https://iamwheezy.github.io/wedding-ricco-phoebe/?to=NAMA+TAMU`

Contoh di Google Sheets (nama tamu di kolom A):
```
="https://iamwheezy.github.io/wedding-ricco-phoebe/?to="&SUBSTITUTE(A2," ","+")
```
