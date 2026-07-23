# Deployment ke Vercel

Proyek ini hanya berisi HTML, CSS, dan JavaScript statis. Tidak memerlukan build framework.

## Opsi 1 — Melalui GitHub dan Dashboard Vercel

1. Buat repository baru di GitHub.
2. Unggah seluruh isi folder proyek, bukan folder induknya saja.
3. Masuk ke Vercel dan pilih **Add New → Project**.
4. Impor repository tersebut.
5. Pada pengaturan proyek:
   - Framework Preset: **Other**;
   - Build Command: kosongkan;
   - Output Directory: kosongkan;
   - Root Directory: gunakan folder tempat `index.html` berada.
6. Tekan **Deploy**.

## Opsi 2 — Melalui Vercel CLI

Jalankan dari root folder proyek:

```bash
npx vercel
```

Untuk deployment produksi:

```bash
npx vercel --prod
```

Ikuti pertanyaan di terminal. Karena ini situs statis, tidak ada build command yang diperlukan.

## Setelah deployment

Periksa:

- halaman splash muncul;
- seluruh tombol alur utama berfungsi;
- tampilan mobile tidak terpotong;
- service worker terdaftar;
- halaman dapat dimuat ulang;
- tidak ada error di Console.

## Domain

Vercel akan memberikan alamat dengan akhiran `.vercel.app`. Nama proyek dapat diubah melalui pengaturan proyek Vercel.
