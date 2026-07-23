# KOMPAS Digital — Prototype Web

Prototype mobile-first yang membantu anak:

1. memeriksa tanda risiko digital;
2. memperoleh langkah perlindungan awal;
3. terhubung kepada pendamping manusia.

Web ini sengaja tidak memiliki login, database, unggah bukti, deteksi otomatis, atau chatbot yang berpura-pura menjadi konselor.

## Menjalankan di VS Code

### Cara paling cepat

Buka folder proyek, lalu buka `index.html` dengan ekstensi **Live Server**.

### Melalui terminal

Pastikan Node.js tersedia, kemudian jalankan server lokal tanpa dependensi tambahan:

```bash
npm run dev
```

Buka alamat yang tampil di terminal, biasanya `http://localhost:3000`.

## Struktur proyek

```text
kompas-digital-web/
├── assets/
│   └── favicon.svg
├── preview/
│   ├── 01-beranda-mobile.png
│   ├── 02-hasil-risiko.png
│   ├── 03-ringkasan-pendamping.png
│   ├── 04-klinik-privasi.png
│   └── 05-laboratorium-verifikasi.png
├── index.html
├── styles.css
├── app.js
├── manifest.webmanifest
├── sw.js
├── vercel.json
├── package.json
├── server.mjs
├── README.md
├── DEPLOY-VERCEL.md
└── SKENARIO-DEMO.md
```

## Alur utama demo

```text
Beranda
→ Pesan atau tautan mencurigakan
→ Hadiah atau kuota gratis
→ 3 langkah pemeriksaan
→ Ditemukan tanda risiko
→ Saya sudah mengirim data
→ Langkah pengamanan
→ Pilih pendamping
→ Ringkasan pendamping
```

## Catatan keamanan

- Prototype tidak menyimpan isi kasus.
- `localStorage` hanya digunakan untuk preferensi tampilan: ukuran teks, pengurangan animasi, dan kontras.
- Tidak ada data yang dikirim ke server.
- Service worker hanya menyimpan file statis agar prototype tetap dapat dibuka setelah pernah dimuat.
- Jangan menambahkan nomor layanan yang belum diverifikasi.

## Mengubah teks dan tampilan

- Seluruh layar dan teks berada di `app.js`, dalam objek `views`.
- Warna, jarak, komponen, dan animasi berada di `styles.css`.
- Identitas dan metadata halaman berada di `index.html`.

## Reset cache saat mengubah file

Service worker dapat menyimpan versi lama. Setelah mengubah file:

1. buka DevTools;
2. masuk ke **Application → Service Workers**;
3. pilih **Unregister**;
4. lakukan hard refresh.

Atau ubah `CACHE_NAME` di `sw.js` dari `v1` menjadi `v2`.
