(() => {
  'use strict';

  const appMain = document.getElementById('app-main');
  const overlayRoot = document.getElementById('overlay-root');
  const toastRoot = document.getElementById('toast-root');
  const liveRegion = document.getElementById('live-region');
  const appFrame = document.getElementById('app-frame');

  const routeMeta = {
    splash: { title: 'KOMPAS Digital' },
    onboarding: { title: 'Tentang KOMPAS' },
    home: { title: 'Beranda' },
    situations: { title: 'Pilih Situasi' },
    caseQuota: { title: 'Simulasi Pesan' },
    risk1: { title: 'Periksa Risiko' },
    risk2: { title: 'Periksa Risiko' },
    risk3: { title: 'Periksa Risiko' },
    result: { title: 'Arah Aman' },
    sentData: { title: 'Data Sudah Dikirim' },
    protection: { title: 'Langkah Pengamanan' },
    companion: { title: 'Pilih Pendamping' },
    summary: { title: 'Ringkasan Pendamping' },
    privacyIntro: { title: 'Klinik Privasi' },
    privacyChecklist: { title: 'Klinik Privasi' },
    privacyResult: { title: 'Hasil Pemeriksaan' },
    lab: { title: 'Laboratorium Verifikasi' },
    labResult: { title: 'Hasil Latihan' },
    designReading: { title: 'Baca Desain Digital' },
    help: { title: 'Cari Bantuan' },
    guide: { title: 'Panduan Pendamping' },
    about: { title: 'Tentang KOMPAS' },
    accessibility: { title: 'Aksesibilitas' },
  };

  const safeStorage = {
    get(key) {
      try { return window.localStorage.getItem(key); }
      catch { return null; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); }
      catch { /* Preferences remain active for the current session. */ }
    },
  };

  const state = {
    route: 'splash',
    history: [],
    risk: { urgency: '', data: '', verified: '' },
    sentDataType: '',
    companion: 'Guru pendamping Pos KOMPAS',
    privacyChecks: new Set(),
    labSelections: new Set(),
    darkPatternAnswer: '',
    settings: {
      largeText: safeStorage.get('kompas-large-text') === 'true',
      reducedMotion: safeStorage.get('kompas-reduced-motion') === 'true',
      highContrast: safeStorage.get('kompas-high-contrast') === 'true',
    },
  };

  const icon = (name, className = 'icon') => `<svg class="${className}" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
  const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));

  function applySettings() {
    document.documentElement.style.setProperty('--font-scale', state.settings.largeText ? '1.1' : '1');
    appFrame.classList.toggle('reduce-motion', state.settings.reducedMotion);
    appFrame.classList.toggle('high-contrast', state.settings.highContrast);
  }

  function saveSettings() {
    safeStorage.set('kompas-large-text', String(state.settings.largeText));
    safeStorage.set('kompas-reduced-motion', String(state.settings.reducedMotion));
    safeStorage.set('kompas-high-contrast', String(state.settings.highContrast));
    applySettings();
  }

  function topbar(title, options = {}) {
    const { brand = false, back = true, settings = true } = options;
    if (brand) {
      return `<header class="topbar topbar--brand">
        <div class="topbar__brand">
          <span class="brand-mark">${icon('compass')}</span>
          <strong>KOMPAS Digital</strong>
        </div>
        <button class="icon-button" type="button" data-nav="accessibility" aria-label="Buka pengaturan aksesibilitas">${icon('settings')}</button>
      </header>`;
    }
    return `<header class="topbar">
      ${back ? `<button class="icon-button" type="button" data-back aria-label="Kembali">${icon('arrow-left')}</button>` : '<span></span>'}
      <h1 class="topbar__title">${escapeHTML(title)}</h1>
      ${settings ? `<button class="icon-button" type="button" data-nav="accessibility" aria-label="Buka pengaturan aksesibilitas">${icon('settings')}</button>` : '<span></span>'}
    </header>`;
  }

  function bottomNav(active = 'home') {
    const items = [
      ['home', 'home', 'Beranda'],
      ['situations', 'search', 'Periksa'],
      ['lab', 'book', 'Latihan'],
      ['help', 'users', 'Bantuan'],
    ];
    return `<nav class="bottom-nav" aria-label="Navigasi utama">
      ${items.map(([route, iconName, label]) => `<button type="button" class="bottom-nav__item ${active === route ? 'is-active' : ''}" data-nav="${route}" aria-current="${active === route ? 'page' : 'false'}">${icon(iconName)}<span>${label}</span></button>`).join('')}
    </nav>`;
  }

  function screen(content, options = {}) {
    const { nav = '', noScroll = false, className = '' } = options;
    return `<section class="screen ${className}">
      ${content}
      ${nav ? bottomNav(nav) : ''}
    </section>`;
  }

  function scrollArea(content, noNav = false) {
    return `<div class="screen__scroll ${noNav ? 'screen__scroll--no-nav' : ''}">${content}</div>`;
  }

  function choiceCard({ title, description = '', iconName = 'chevron', route = '', action = '', value = '', selected = false, tone = '' }) {
    const attrs = route ? `data-nav="${route}"` : action ? `data-action="${action}" data-value="${escapeHTML(value)}"` : '';
    return `<button type="button" class="choice-card ${selected ? 'is-selected' : ''} ${tone}" ${attrs}>
      <span class="choice-card__icon">${icon(iconName)}</span>
      <span class="choice-card__body"><strong>${escapeHTML(title)}</strong>${description ? `<span>${escapeHTML(description)}</span>` : ''}</span>
      <span class="choice-card__arrow">${icon('chevron', 'icon icon--sm')}</span>
    </button>`;
  }

  function progress(step, total = 3) {
    const percent = Math.round((step / total) * 100);
    return `<div class="progress-wrap" aria-label="Langkah ${step} dari ${total}">
      <div class="progress-meta"><span>Langkah ${step} dari ${total}</span><span>${percent}%</span></div>
      <div class="progress-track"><div class="progress-bar" style="width:${percent}%"></div></div>
    </div>`;
  }

  const views = {
    splash() {
      return screen(`<div class="splash">
        <div class="splash__content">
          <span class="brand-mark splash__mark">${icon('compass')}</span>
          <p class="eyebrow eyebrow--light">POS KOMPAS DIGITAL</p>
          <h1>KOMPAS Digital</h1>
          <p>Temukan arah aman di dunia digital.</p>
          <button class="btn" type="button" data-nav="onboarding">Mulai ${icon('chevron', 'icon icon--sm')}</button>
        </div>
      </div>`, { className: 'screen--splash' });
    },

    onboarding() {
      return screen(`${topbar('Tentang KOMPAS', { back: false })}${scrollArea(`
        <div class="onboarding-visual">
          <div class="onboarding-visual__orbit"></div>
          <span class="brand-mark">${icon('compass')}</span>
        </div>
        <div class="page-heading">
          <p class="eyebrow">Bukan sekadar web edukasi</p>
          <h2 class="page-title">Tidak yakin harus berbuat apa?</h2>
          <p class="page-copy">KOMPAS membantu memeriksa tanda risiko, melindungi data, dan menemukan pendamping yang tepat.</p>
        </div>
        <div class="feature-triad">
          <div class="feature-triad__item"><span class="feature-triad__number">01</span><div><strong>Belajar</strong><p>Kenali pola manipulasi melalui situasi yang dekat dengan keseharian.</p></div></div>
          <div class="feature-triad__item"><span class="feature-triad__number">02</span><div><strong>Melindungi</strong><p>Dapatkan langkah awal untuk menjaga data dan keamanan akun.</p></div></div>
          <div class="feature-triad__item"><span class="feature-triad__number">03</span><div><strong>Menolong</strong><p>Terhubung kepada manusia ketika situasi membutuhkan pendampingan.</p></div></div>
        </div>
        <div class="banner">${icon('info')}<span>KOMPAS tidak menggantikan guru, orang tua, konselor, atau layanan resmi.</span></div>
        <div class="button-row">
          <button class="btn btn--primary" type="button" data-nav="home">Masuk ke KOMPAS</button>
          <button class="btn btn--ghost" type="button" data-nav="home">Lewati penjelasan</button>
        </div>
      `, true)}`);
    },

    home() {
      return screen(`${topbar('', { brand: true })}${scrollArea(`
        <section class="hero-card">
          <p class="eyebrow eyebrow--light">Mulai dari situasimu</p>
          <h1>Sedang menghadapi masalah digital?</h1>
          <p>Pilih situasi yang paling mendekati. Kamu tidak perlu memahami istilah teknis terlebih dahulu.</p>
          <div class="hero-card__meta">${icon('shield', 'icon icon--sm')} Prototype tidak menyimpan isi kasus</div>
        </section>

        <div class="section-heading"><h2>Apa yang sedang terjadi?</h2><p>Pilih satu</p></div>
        <div class="stack">
          ${choiceCard({ title: 'Pesan atau tautan mencurigakan', description: 'Hadiah, kuota, bantuan, lowongan, atau tautan yang terasa tidak wajar.', iconName: 'link', route: 'situations' })}
          ${choiceCard({ title: 'Data pribadi diminta', description: 'Kartu pelajar, nomor telepon, kata sandi, OTP, atau foto.', iconName: 'lock', route: 'sentData' })}
          ${choiceCard({ title: 'Akun atau foto disalahgunakan', description: 'Akun diambil, ditiru, atau foto disebarkan tanpa izin.', iconName: 'image', route: 'help' })}
          ${choiceCard({ title: 'Saya merasa tidak aman', description: 'Mengalami ancaman, tekanan, perundungan, atau bingung harus bercerita kepada siapa.', iconName: 'alert', route: 'help' })}
        </div>

        <div class="section-heading"><h2>Periksa sebelum terjadi</h2></div>
        <div class="grid-2">
          <button class="quick-card" type="button" data-nav="privacyIntro"><span class="quick-card__top"><span class="quick-card__icon">${icon('shield')}</span>${icon('chevron', 'icon icon--sm')}</span><strong>Periksa keamanan akun</strong><span>Klinik Privasi</span></button>
          <button class="quick-card" type="button" data-nav="lab"><span class="quick-card__top"><span class="quick-card__icon">${icon('book')}</span>${icon('chevron', 'icon icon--sm')}</span><strong>Coba latihan skenario</strong><span>Laboratorium</span></button>
        </div>
        <div class="banner">${icon('users')}<span><strong>Kamu tidak harus menghadapi masalah ini sendirian.</strong><br>Pendamping manusia adalah bagian utama KOMPAS.</span></div>
      `)} `, { nav: 'home' });
    },

    situations() {
      return screen(`${topbar('Pilih Situasi')}${scrollArea(`
        <div class="page-heading"><p class="eyebrow">Periksa risiko</p><h2 class="page-title">Pesan seperti apa yang kamu terima?</h2><p class="page-copy">Pilih yang paling mendekati. Jawabanmu tidak disimpan dalam prototype ini.</p></div>
        <div class="stack" style="margin-top:20px">
          ${choiceCard({ title: 'Hadiah atau kuota gratis', description: 'Menawarkan hadiah dan meminta tindakan tertentu.', iconName: 'phone', route: 'caseQuota' })}
          ${choiceCard({ title: 'Lowongan atau bantuan sosial', description: 'Menawarkan kesempatan, tetapi meminta biaya atau data.', iconName: 'message', route: 'caseQuota' })}
          ${choiceCard({ title: 'Permintaan data pribadi', description: 'Meminta identitas, kata sandi, atau kode keamanan.', iconName: 'lock', route: 'caseQuota' })}
          ${choiceCard({ title: 'Tautan dari teman atau keluarga', description: 'Dikirim orang yang dikenal, tetapi sumbernya belum jelas.', iconName: 'users', route: 'caseQuota' })}
          ${choiceCard({ title: 'Penawaran jual beli', description: 'Harga atau syarat terasa tidak masuk akal.', iconName: 'alert', route: 'caseQuota' })}
          ${choiceCard({ title: 'Situasi lainnya', description: 'Saya masih belum yakin cara menjelaskannya.', iconName: 'help', route: 'help' })}
        </div>
      `)}`);
    },

    caseQuota() {
      return screen(`${topbar('Simulasi Pesan')}${scrollArea(`
        <div class="page-heading"><span class="status-chip status-chip--assist">${icon('info', 'icon icon--sm')} Contoh simulasi</span><h2 class="page-title" style="margin-top:14px">Kuota gratis untuk pelajar</h2><p class="page-copy">Perhatikan isi pesan berikut. Kita akan memeriksanya bersama, bukan langsung memberi vonis.</p></div>
        <div class="message-preview">
          <div class="message-preview__label">Pesan masuk</div>
          <div class="message-bubble"><b>Selamat!</b> Pelajar Sumatera Utara berhak menerima kuota gratis 50 GB. Isi formulir <mark>dalam 10 menit</mark>, unggah <mark>foto kartu pelajar</mark>, lalu <mark>teruskan ke lima grup</mark>.<div class="message-meta">10.24 ✓✓</div></div>
        </div>
        <div class="banner banner--warm">${icon('alert')}<span>Contoh ini dibuat untuk latihan. Jangan membuka tautan atau mengirim data sungguhan.</span></div>
        <div class="button-row"><button class="btn btn--primary" type="button" data-nav="risk1">Mulai periksa ${icon('chevron', 'icon icon--sm')}</button></div>
      `, true)}`);
    },

    risk1() {
      const selected = state.risk.urgency;
      return screen(`${topbar('Periksa Risiko')}${scrollArea(`
        ${progress(1)}
        <h2 class="question-title">Apakah pesan mendesakmu bertindak cepat?</h2>
        <p class="question-hint">Desakan waktu dapat membuat kita bereaksi sebelum sempat memeriksa.</p>
        <div class="stack">
          ${choiceCard({ title: 'Ya', description: 'Pesan memberikan batas waktu singkat.', iconName: 'alert', action: 'set-risk-urgency', value: 'Ya, ada desakan waktu', selected: selected === 'Ya, ada desakan waktu' })}
          ${choiceCard({ title: 'Tidak', description: 'Tidak ada batas waktu atau ancaman kehilangan kesempatan.', iconName: 'check', action: 'set-risk-urgency', value: 'Tidak ada desakan', selected: selected === 'Tidak ada desakan' })}
          ${choiceCard({ title: 'Tidak yakin', description: 'Saya belum dapat menilainya.', iconName: 'help', action: 'set-risk-urgency', value: 'Tidak yakin', selected: selected === 'Tidak yakin' })}
        </div>
        <div class="button-row"><button class="btn btn--primary" type="button" data-nav="risk2" ${selected ? '' : 'disabled'}>Lanjutkan</button></div>
      `, true)}`);
    },

    risk2() {
      const selected = state.risk.data;
      const choices = [
        ['Foto kartu pelajar', 'Identitas visual dan informasi sekolah.', 'image'],
        ['Kata sandi atau kode OTP', 'Informasi yang dapat membuka akses akun.', 'key'],
        ['Nomor telepon', 'Dapat digunakan untuk menghubungi atau mencoba mengambil akun.', 'phone'],
        ['Tidak ada data pribadi', 'Pesan tidak meminta informasi pribadi.', 'check'],
        ['Saya tidak yakin', 'Saya belum memahami jenis datanya.', 'help'],
      ];
      return screen(`${topbar('Periksa Risiko')}${scrollArea(`
        ${progress(2)}
        <h2 class="question-title">Data apa yang diminta?</h2>
        <p class="question-hint">Identitas dan kode keamanan tidak boleh diberikan tanpa tujuan dan pihak yang jelas.</p>
        <div class="stack">${choices.map(([title, description, iconName]) => choiceCard({ title, description, iconName, action: 'set-risk-data', value: title, selected: selected === title })).join('')}</div>
        <div class="button-row"><button class="btn btn--primary" type="button" data-nav="risk3" ${selected ? '' : 'disabled'}>Lanjutkan</button></div>
      `, true)}`);
    },

    risk3() {
      const selected = state.risk.verified;
      const choices = [
        ['Sudah, dan informasinya sesuai', 'Saya menemukannya di kanal resmi.', 'check'],
        ['Belum diperiksa', 'Saya belum membuka kanal resmi.', 'search'],
        ['Tidak menemukan sumber resmi', 'Tidak ada informasi yang sesuai.', 'alert'],
        ['Saya tidak tahu cara memeriksanya', 'Saya membutuhkan panduan.', 'help'],
      ];
      return screen(`${topbar('Periksa Risiko')}${scrollArea(`
        ${progress(3)}
        <h2 class="question-title">Apakah informasi ini sudah diperiksa melalui kanal resmi?</h2>
        <p class="question-hint">Periksa alamat situs, akun resmi, tanggal informasi, dan tujuan permintaan data.</p>
        <div class="stack">${choices.map(([title, description, iconName]) => choiceCard({ title, description, iconName, action: 'set-risk-verified', value: title, selected: selected === title })).join('')}</div>
        <div class="button-row"><button class="btn btn--primary" type="button" data-nav="result" ${selected ? '' : 'disabled'}>Lihat Arah Aman</button></div>
      `, true)}`);
    },

    result() {
      return screen(`${topbar('Arah Aman')}${scrollArea(`
        <section class="result-hero"><span class="status-chip status-chip--warning">${icon('alert', 'icon icon--sm')} Perlu diperiksa lebih lanjut</span><h1>Ditemukan beberapa tanda risiko</h1><p>KOMPAS tidak menyatakan pesan ini pasti penipuan. Namun, ada alasan kuat untuk berhenti dan memeriksanya.</p></section>
        <div class="section-heading"><h2>Tanda yang ditemukan</h2></div>
        <ul class="finding-list">
          <li class="finding"><span class="finding__index">1</span><p>Pesan mendesak pengguna bertindak cepat.</p></li>
          <li class="finding"><span class="finding__index">2</span><p>Pesan meminta identitas pribadi berupa kartu pelajar.</p></li>
          <li class="finding"><span class="finding__index">3</span><p>Informasi belum berhasil diverifikasi melalui kanal resmi.</p></li>
        </ul>
        <div class="section-heading"><h2>Yang sebaiknya dilakukan</h2></div>
        <ul class="check-list">
          <li class="check-item"><span class="check-item__icon">${icon('check', 'icon icon--sm')}</span><p>Jangan mengirim data tambahan.</p></li>
          <li class="check-item"><span class="check-item__icon">${icon('check', 'icon icon--sm')}</span><p>Jangan meneruskan pesan ke grup lain.</p></li>
          <li class="check-item"><span class="check-item__icon">${icon('check', 'icon icon--sm')}</span><p>Periksa melalui kanal resmi dan tunjukkan kepada pendamping tepercaya.</p></li>
        </ul>
        <div class="button-row">
          <button class="btn btn--primary" type="button" data-action="safe-before-send">Saya belum mengirim data</button>
          <button class="btn btn--danger-soft" type="button" data-nav="sentData">Saya sudah mengirim data</button>
          <button class="btn btn--secondary" type="button" data-nav="companion">Saya masih tidak yakin</button>
        </div>
        <div class="banner">${icon('info')}<span>KOMPAS membantu membaca tanda risiko, bukan memberikan vonis otomatis.</span></div>
      `, true)}`);
    },

    sentData() {
      const selected = state.sentDataType;
      const choices = ['Foto kartu pelajar', 'Kata sandi', 'Kode OTP', 'Nomor telepon', 'Foto pribadi', 'Data lainnya', 'Saya tidak ingin menjawab sekarang'];
      const icons = ['image', 'key', 'key', 'phone', 'image', 'help', 'shield'];
      return screen(`${topbar('Data Sudah Dikirim')}${scrollArea(`
        <div class="page-heading"><span class="status-chip status-chip--assist">${icon('users', 'icon icon--sm')} Pendampingan, bukan penilaian</span><h2 class="page-title" style="margin-top:14px">Kamu sudah benar karena mencari bantuan.</h2><p class="page-copy">Kita akan menentukan langkah awal tanpa menyalahkanmu.</p></div>
        <div class="section-heading"><h2>Data apa yang sudah dikirim?</h2></div>
        <div class="stack">${choices.map((title, index) => choiceCard({ title, description: title === 'Saya tidak ingin menjawab sekarang' ? 'Kamu tetap dapat melanjutkan dan memilih pendamping.' : '', iconName: icons[index], action: 'set-sent-data', value: title, selected: selected === title })).join('')}</div>
        <div class="banner">${icon('shield')}<span>Kamu tidak perlu mengunggah bukti atau menuliskan nama lengkap.</span></div>
        <div class="button-row"><button class="btn btn--primary" type="button" data-nav="protection" ${selected ? '' : 'disabled'}>Lihat langkah pengamanan</button></div>
      `, true)}`);
    },

    protection() {
      return screen(`${topbar('Langkah Pengamanan')}${scrollArea(`
        <div class="page-heading"><span class="status-chip status-chip--safe">${icon('check', 'icon icon--sm')} Tindakan awal tersedia</span><h2 class="page-title" style="margin-top:14px">Lakukan langkah ini terlebih dahulu</h2><p class="page-copy">Mulai dari satu langkah yang paling mungkin dilakukan sekarang.</p></div>
        <ul class="guideline-list">
          <li class="guideline-item"><span class="guideline-item__index">1</span><p>Jangan mengirim informasi tambahan.</p></li>
          <li class="guideline-item"><span class="guideline-item__index">2</span><p>Jangan membuka tautan tersebut kembali.</p></li>
          <li class="guideline-item"><span class="guideline-item__index">3</span><p>Simpan nomor atau alamat situs pengirim tanpa menyebarkan ulang foto kartu.</p></li>
          <li class="guideline-item"><span class="guideline-item__index">4</span><p>Periksa keamanan akun yang digunakan.</p></li>
          <li class="guideline-item"><span class="guideline-item__index">5</span><p>Beri tahu pendamping yang dipercaya.</p></li>
          <li class="guideline-item"><span class="guideline-item__index">6</span><p>Jika muncul ancaman atau tekanan, jangan menghadapi pengirim sendirian.</p></li>
        </ul>
        <div class="banner banner--safe">${icon('users')}<span>KOMPAS hanya memberikan langkah awal. Penanganan lebih lanjut dilakukan bersama pendamping manusia.</span></div>
        <div class="button-row"><button class="btn btn--primary" type="button" data-nav="companion">Pilih pendamping</button></div>
      `, true)}`);
    },

    companion() {
      const selected = state.companion;
      const choices = [
        ['Guru pendamping Pos KOMPAS', 'Untuk pemeriksaan awal dan menghubungkanmu ke bantuan berikutnya.', 'book'],
        ['Duta literasi sebaya', 'Untuk menemanimu memulai percakapan, bukan menangani kasus serius sendirian.', 'users'],
        ['Orang tua atau keluarga tepercaya', 'Pilih orang yang dapat mendengarkan tanpa menyalahkan.', 'home'],
        ['Pendamping profesional', 'Untuk situasi yang memerlukan penanganan khusus.', 'shield'],
        ['Layanan resmi', 'Untuk ancaman, pemerasan, eksploitasi, atau risiko serius.', 'alert'],
        ['Saya belum merasa aman memilih siapa pun', 'Kamu dapat mencari pendamping lain di luar lingkungan terdekat.', 'help'],
      ];
      return screen(`${topbar('Pilih Pendamping')}${scrollArea(`
        <div class="page-heading"><p class="eyebrow">Bantuan manusia</p><h2 class="page-title">Siapa yang paling aman untuk mendampingimu?</h2><p class="page-copy">Pilih berdasarkan rasa aman, bukan hanya berdasarkan jabatan.</p></div>
        <div class="stack" style="margin-top:20px">${choices.map(([title, description, iconName]) => choiceCard({ title, description, iconName, action: 'set-companion', value: title, selected: selected === title })).join('')}</div>
        ${selected === 'Saya belum merasa aman memilih siapa pun' ? `<div class="banner banner--warm">${icon('info')}<span>Kamu dapat memilih pendamping lain di luar sekolah atau keluarga apabila lingkungan terdekat tidak aman.</span></div>` : ''}
        <div class="button-row"><button class="btn btn--primary" type="button" data-nav="summary" ${selected ? '' : 'disabled'}>Buat ringkasan untuk pendamping</button></div>
      `, true)}`);
    },

    summary() {
      const dataType = state.sentDataType || 'Belum dijelaskan';
      const companion = state.companion || 'Belum dipilih';
      return screen(`${topbar('Ringkasan Pendamping')}${scrollArea(`
        <div class="page-heading"><span class="status-chip status-chip--assist">${icon('message', 'icon icon--sm')} Untuk memulai percakapan</span><h2 class="page-title" style="margin-top:14px">Kamu tidak perlu menjelaskan semuanya sekaligus.</h2><p class="page-copy">Mulailah dari bagian yang terasa paling aman.</p></div>
        <section class="summary-card" id="summary-card">
          <div class="summary-card__head"><strong>Ringkasan Situasi</strong><p>Tanpa identitas pribadi</p></div>
          <dl class="summary-list">
            <div class="summary-row"><dt>Jenis situasi</dt><dd>Pesan hadiah atau kuota gratis.</dd></div>
            <div class="summary-row"><dt>Tanda risiko</dt><dd>Meminta kartu pelajar, menggunakan desakan waktu, dan meminta pesan diteruskan.</dd></div>
            <div class="summary-row"><dt>Data yang dikirim</dt><dd>${escapeHTML(dataType)}</dd></div>
            <div class="summary-row"><dt>Langkah awal</dt><dd>Komunikasi dihentikan dan pengguna memerlukan pemeriksaan keamanan lebih lanjut.</dd></div>
            <div class="summary-row"><dt>Pendamping yang dipilih</dt><dd>${escapeHTML(companion)}</dd></div>
          </dl>
        </section>
        <div class="banner">${icon('shield')}<span>Ringkasan ini tidak memuat nama lengkap, alamat, nomor telepon, nama sekolah, atau foto pribadi.</span></div>
        <div class="button-row">
          <button class="btn btn--primary" type="button" data-action="show-summary">Tunjukkan kepada pendamping</button>
          <button class="btn btn--secondary" type="button" data-action="reset-home">Kembali ke beranda</button>
        </div>
      `, true)}`);
    },

    privacyIntro() {
      return screen(`${topbar('Klinik Privasi')}${scrollArea(`
        <section class="hero-card" style="margin-top:20px"><p class="eyebrow eyebrow--light">Pemeriksaan mandiri</p><h1>Seberapa aman akunmu?</h1><p>Pemeriksaan ini tidak meminta kata sandi dan tidak menyimpan jawaban.</p><div class="hero-card__meta">${icon('lock', 'icon icon--sm')} Sekitar 2 menit</div></section>
        <div class="page-heading page-heading--compact"><h2 class="page-title">Periksa kebiasaan, bukan menilai dirimu.</h2><p class="page-copy">Hasilnya akan menunjukkan hal yang bisa diperbaiki secara bertahap.</p></div>
        <div class="button-row"><button class="btn btn--primary" type="button" data-nav="privacyChecklist">Mulai pemeriksaan</button></div>
      `, true)}`);
    },

    privacyChecklist() {
      const items = [
        ['password-different', 'Saya menggunakan kata sandi berbeda untuk akun penting.', 'Mengurangi dampak jika satu akun bermasalah.'],
        ['two-factor', 'Autentikasi dua faktor sudah aktif.', 'Menambah lapisan perlindungan akun.'],
        ['no-address', 'Profil saya tidak menampilkan alamat rumah.', 'Alamat rumah termasuk informasi sensitif.'],
        ['school-private', 'Informasi sekolah tidak terlihat untuk semua orang.', 'Batasi siapa yang dapat melihatnya.'],
        ['camera-access', 'Saya mengetahui aplikasi yang mengakses kamera.', 'Cabut izin dari aplikasi yang tidak memerlukan.'],
        ['location-access', 'Saya mengetahui aplikasi yang mengakses lokasi.', 'Lokasi sebaiknya diberikan hanya saat diperlukan.'],
        ['never-otp', 'Saya tidak pernah memberikan kode OTP kepada orang lain.', 'Kode OTP tidak boleh dibagikan.'],
        ['devices', 'Saya memeriksa perangkat yang masih masuk ke akun.', 'Keluar dari perangkat yang tidak dikenal.'],
      ];
      return screen(`${topbar('Klinik Privasi')}${scrollArea(`
        ${progress(1, 1)}
        <h2 class="question-title">Centang yang sudah kamu lakukan</h2>
        <p class="question-hint">Tidak ada jawaban gagal. Bagian yang belum dicentang akan menjadi rekomendasi.</p>
        <div class="stack">${items.map(([id, label, hint]) => `<label class="check-option"><input type="checkbox" data-privacy-check="${id}" ${state.privacyChecks.has(id) ? 'checked' : ''}><span class="fake-check">${icon('check', 'icon icon--sm')}</span><span class="check-option__copy">${label}<span>${hint}</span></span></label>`).join('')}</div>
        <div class="button-row"><button class="btn btn--primary" type="button" data-nav="privacyResult">Lihat hal yang dapat diperbaiki</button></div>
      `, true)}`);
    },

    privacyResult() {
      const done = state.privacyChecks.size;
      const recommendations = [
        ['two-factor', 'Aktifkan autentikasi dua faktor pada akun penting.'],
        ['camera-access', 'Periksa aplikasi yang memiliki akses kamera.'],
        ['location-access', 'Cabut akses lokasi dari aplikasi yang tidak memerlukan.'],
        ['school-private', 'Sembunyikan informasi sekolah dari profil publik.'],
        ['password-different', 'Gunakan kata sandi berbeda untuk akun penting.'],
        ['devices', 'Periksa dan keluarkan perangkat yang tidak dikenal.'],
      ].filter(([id]) => !state.privacyChecks.has(id)).slice(0, 3);
      const recs = recommendations.length ? recommendations : [['ok', 'Pertahankan kebiasaan baik dan periksa kembali secara berkala.']];
      return screen(`${topbar('Hasil Pemeriksaan')}${scrollArea(`
        <div class="page-heading"><span class="status-chip status-chip--safe">${icon('shield', 'icon icon--sm')} ${done} kebiasaan sudah diterapkan</span><h2 class="page-title" style="margin-top:14px">Ada beberapa hal yang dapat diperbaiki</h2><p class="page-copy">Mulai dari satu langkah yang paling mudah. Hasil ini bukan nilai kecerdasan atau kehati-hatianmu.</p></div>
        <div class="section-heading"><h2>Prioritas berikutnya</h2></div>
        <ul class="guideline-list">${recs.map(([, text], index) => `<li class="guideline-item"><span class="guideline-item__index">${index + 1}</span><p>${text}</p></li>`).join('')}</ul>
        <div class="banner">${icon('info')}<span>KOMPAS tidak pernah meminta kata sandi atau kode OTP.</span></div>
        <div class="button-row"><button class="btn btn--primary" type="button" data-nav="home">Kembali ke beranda</button><button class="btn btn--secondary" type="button" data-nav="privacyChecklist">Periksa ulang</button></div>
      `, true)}`);
    },

    lab() {
      const pieces = [
        ['urgency', 'dalam 10 menit'],
        ['identity', 'kirim kartu pelajar'],
        ['spread', 'teruskan kepada lima grup'],
        ['fear', 'agar bantuan tidak dibatalkan'],
      ];
      return screen(`${topbar('Laboratorium Verifikasi')}${scrollArea(`
        <div class="page-heading"><p class="eyebrow">Latihan skenario</p><h2 class="page-title">Temukan tanda manipulasinya</h2><p class="page-copy">Ketuk bagian pesan yang menurutmu perlu dicurigai.</p></div>
        <div class="scenario-text" style="margin-top:20px">Bantuan pendidikan khusus pelajar! Daftar <button type="button" data-lab-piece="urgency" class="${state.labSelections.has('urgency') ? 'is-selected' : ''}">dalam 10 menit</button>. <button type="button" data-lab-piece="identity" class="${state.labSelections.has('identity') ? 'is-selected' : ''}">Kirim kartu pelajar</button> dan <button type="button" data-lab-piece="spread" class="${state.labSelections.has('spread') ? 'is-selected' : ''}">teruskan kepada lima grup</button> <button type="button" data-lab-piece="fear" class="${state.labSelections.has('fear') ? 'is-selected' : ''}">agar bantuan tidak dibatalkan</button>.</div>
        <div class="banner">${icon('search')}<span>Pilih lebih dari satu bagian. Fokus pada cara pesan mendorong keputusan, bukan hanya pada ejaan atau tampilannya.</span></div>
        <div class="button-row"><button class="btn btn--primary" type="button" data-nav="labResult" ${state.labSelections.size ? '' : 'disabled'}>Periksa jawaban</button><button class="btn btn--secondary" type="button" data-nav="designReading">Pelajari desain manipulatif</button></div>
      `, true)}`);
    },

    labResult() {
      const selected = state.labSelections.size;
      return screen(`${topbar('Hasil Latihan')}${scrollArea(`
        <div class="page-heading"><span class="status-chip status-chip--safe">${icon('check', 'icon icon--sm')} ${selected} pola dipilih</span><h2 class="page-title" style="margin-top:14px">Kamu menemukan pola penting</h2><p class="page-copy">Pesan manipulatif sering menggabungkan beberapa tekanan sekaligus.</p></div>
        <ul class="finding-list">
          <li class="finding"><span class="finding__index">1</span><p><strong>“Dalam 10 menit”</strong> menggunakan desakan waktu.</p></li>
          <li class="finding"><span class="finding__index">2</span><p><strong>“Kirim kartu pelajar”</strong> meminta data sensitif.</p></li>
          <li class="finding"><span class="finding__index">3</span><p><strong>“Teruskan kepada lima grup”</strong> memanfaatkan penyebaran sosial.</p></li>
          <li class="finding"><span class="finding__index">4</span><p><strong>“Agar bantuan tidak dibatalkan”</strong> menggunakan rasa takut kehilangan kesempatan.</p></li>
        </ul>
        <div class="banner banner--safe">${icon('shield')}<span><strong>Ingat:</strong> berhenti sejenak, periksa sumber, dan tanyakan tujuan permintaan data.</span></div>
        <div class="button-row"><button class="btn btn--primary" type="button" data-action="reset-lab">Coba ulang</button><button class="btn btn--secondary" type="button" data-nav="home">Kembali ke beranda</button></div>
      `, true)}`);
    },

    designReading() {
      const selected = state.darkPatternAnswer;
      const answers = ['Hitung mundur', 'Tombol setuju sangat besar', 'Tombol batal disamarkan', 'Semua jawaban benar'];
      return screen(`${topbar('Baca Desain Digital')}${scrollArea(`
        <div class="page-heading"><p class="eyebrow">Membaca desain</p><h2 class="page-title">Apakah desain ini membantumu memilih—atau mendorongmu?</h2><p class="page-copy">Perhatikan bagaimana ukuran, warna, dan waktu memengaruhi keputusan.</p></div>
        <div class="dark-pattern-demo"><h3>KLAIM HADIAH SEKARANG!</h3><div class="countdown">00:01:59</div><button type="button" class="fake-accept">SETUJU DAN LANJUTKAN</button><button type="button" class="fake-decline">Tidak, terima kasih</button></div>
        <div class="section-heading"><h2>Apa yang mendorong pengguna?</h2></div>
        <div class="stack">${answers.map((answer) => choiceCard({ title: answer, iconName: answer === 'Semua jawaban benar' ? 'check' : 'eye', action: 'set-dark-answer', value: answer, selected: selected === answer })).join('')}</div>
        ${selected ? `<div class="banner ${selected === 'Semua jawaban benar' ? 'banner--safe' : 'banner--warm'}">${icon(selected === 'Semua jawaban benar' ? 'check' : 'info')}<span>${selected === 'Semua jawaban benar' ? '<strong>Tepat.</strong> Ketiganya bekerja bersama untuk mempersempit ruang berpikir.' : 'Itu salah satu tandanya. Periksa juga ukuran tombol dan pilihan keluar yang disamarkan.'}</span></div>` : ''}
        <div class="section-heading"><h2>Pola lain yang perlu dikenali</h2></div>
        <div class="grid-2"><div class="quick-card"><span class="quick-card__icon">${icon('phone')}</span><strong>Autoplay</strong><span>Menghilangkan titik berhenti.</span></div><div class="quick-card"><span class="quick-card__icon">${icon('alert')}</span><strong>Notifikasi berulang</strong><span>Mendorong untuk kembali.</span></div><div class="quick-card"><span class="quick-card__icon">${icon('users')}</span><strong>Hadiah ajak teman</strong><span>Memanfaatkan relasi sosial.</span></div><div class="quick-card"><span class="quick-card__icon">${icon('eye')}</span><strong>Pilihan keluar kecil</strong><span>Menyulitkan pilihan aman.</span></div></div>
      `, true)}`);
    },

    help() {
      return screen(`${topbar('Cari Bantuan')}${scrollArea(`
        <div class="page-heading"><p class="eyebrow">Bantuan manusia</p><h2 class="page-title">Pilih situasi yang paling mendekati</h2><p class="page-copy">Kamu tidak perlu menentukan nama masalahnya terlebih dahulu.</p></div>
        <div class="stack" style="margin-top:20px">
          ${choiceCard({ title: 'Perlu diperiksa', description: 'Pesan mencurigakan, izin aplikasi, atau akun kurang aman.', iconName: 'search', route: 'situations' })}
          ${choiceCard({ title: 'Perlu pendamping', description: 'Data sudah dikirim, akun diambil alih, atau foto disebarkan.', iconName: 'users', route: 'companion' })}
          ${choiceCard({ title: 'Perlu bantuan segera', description: 'Ada ancaman, pemerasan, eksploitasi, atau situasi yang membuat tidak aman.', iconName: 'alert', action: 'urgent-help', value: 'urgent' })}
        </div>
        <div class="banner banner--danger">${icon('alert')}<span>Untuk situasi serius, jangan menghadapi pelaku sendirian. Cari orang dewasa tepercaya atau layanan resmi yang sudah diverifikasi di wilayahmu.</span></div>
        <div class="section-heading"><h2>Untuk pendamping</h2></div>
        ${choiceCard({ title: 'Panduan respons awal', description: 'Langkah mendengarkan, menjaga bukti, dan mengalihkan kasus.', iconName: 'book', route: 'guide' })}
      `)} `, { nav: 'help' });
    },

    guide() {
      const steps = [
        'Dengarkan tanpa menyalahkan.',
        'Ucapkan: “Kamu sudah benar karena bercerita.”',
        'Pastikan anak berada dalam keadaan aman.',
        'Jangan menyebarkan ulang bukti.',
        'Catat informasi seminimal mungkin.',
        'Jangan menjanjikan kerahasiaan absolut.',
        'Jelaskan siapa yang perlu dilibatkan.',
        'Alihkan kasus yang berada di luar kewenangan.',
        'Sediakan jalur lain jika pendamping atau institusi asal tidak aman.',
      ];
      return screen(`${topbar('Panduan Pendamping')}${scrollArea(`
        <div class="page-heading"><p class="eyebrow">Respons awal</p><h2 class="page-title">Ketika anak mulai bercerita</h2><p class="page-copy">Tujuan pertama bukan mencari kesalahan, melainkan membangun rasa aman dan menentukan batas kewenangan.</p></div>
        <ul class="guideline-list">${steps.map((text, index) => `<li class="guideline-item"><span class="guideline-item__index">${index + 1}</span><p>${text}</p></li>`).join('')}</ul>
        <div class="section-heading"><h2>Dapat dibantu di Pos KOMPAS</h2></div>
        <div class="banner banner--safe">${icon('check')}<span>Pemeriksaan pesan, edukasi privasi, pengamanan awal akun, dan latihan mengenali manipulasi.</span></div>
        <div class="section-heading"><h2>Harus dialihkan</h2></div>
        <div class="banner banner--danger">${icon('alert')}<span>Ancaman, pemerasan, eksploitasi, penyalahgunaan foto, risiko serius, dan konflik kepentingan pendamping.</span></div>
        <div class="banner banner--warm">${icon('users')}<span><strong>Duta sebaya tidak boleh menangani kasus serius sendirian.</strong></span></div>
      `, true)}`);
    },

    about() {
      return screen(`${topbar('Tentang KOMPAS')}${scrollArea(`
        <div class="page-heading"><p class="eyebrow">Batas teknologi</p><h2 class="page-title">Teknologi membantu menemukan arah, bukan mengambil alih keputusan moral.</h2></div>
        <div class="section-heading"><h2>KOMPAS membantu</h2></div>
        <ul class="check-list"><li class="check-item"><span class="check-item__icon">${icon('check', 'icon icon--sm')}</span><p>Mengenali pola risiko.</p></li><li class="check-item"><span class="check-item__icon">${icon('check', 'icon icon--sm')}</span><p>Memberikan edukasi dan langkah perlindungan awal.</p></li><li class="check-item"><span class="check-item__icon">${icon('check', 'icon icon--sm')}</span><p>Menghubungkan pengguna kepada pendamping.</p></li></ul>
        <div class="section-heading"><h2>KOMPAS tidak</h2></div>
        <ul class="finding-list"><li class="finding"><span class="finding__index">×</span><p>Menentukan apakah korban berkata benar.</p></li><li class="finding"><span class="finding__index">×</span><p>Memberikan diagnosis psikologis atau menggantikan konselor.</p></li><li class="finding"><span class="finding__index">×</span><p>Menangani keadaan darurat sendirian.</p></li><li class="finding"><span class="finding__index">×</span><p>Meminta unggahan bukti sensitif atau menggunakan jawaban untuk melatih AI.</p></li></ul>
        <div class="section-heading"><h2>Prinsip kami</h2></div>
        <div class="grid-2"><div class="quick-card"><span class="quick-card__icon">${icon('shield')}</span><strong>Keselamatan anak</strong><span>Di atas kepentingan sistem.</span></div><div class="quick-card"><span class="quick-card__icon">${icon('lock')}</span><strong>Minimisasi data</strong><span>Meminta sesedikit mungkin.</span></div><div class="quick-card"><span class="quick-card__icon">${icon('users')}</span><strong>Pendamping manusia</strong><span>Teknologi tahu batasnya.</span></div><div class="quick-card"><span class="quick-card__icon">${icon('eye')}</span><strong>Aksesibilitas</strong><span>Mudah dibaca dan digunakan.</span></div></div>
        <span class="prototype-label">Prototype demonstrasi — tidak menyimpan isi kasus</span>
      `, true)}`);
    },

    accessibility() {
      return screen(`${topbar('Aksesibilitas')}${scrollArea(`
        <div class="page-heading"><p class="eyebrow">Sesuaikan tampilan</p><h2 class="page-title">Buat KOMPAS lebih nyaman digunakan</h2><p class="page-copy">Pengaturan ini disimpan di perangkat. Isi kasus tetap tidak disimpan.</p></div>
        <div class="summary-card" style="margin-top:20px"><div style="padding:0 18px">
          <div class="setting-row"><div><strong>Perbesar teks</strong><span>Meningkatkan ukuran tulisan utama.</span></div><button type="button" class="switch ${state.settings.largeText ? 'is-on' : ''}" data-setting="largeText" role="switch" aria-checked="${state.settings.largeText}"><span class="sr-only">Perbesar teks</span></button></div>
          <div class="setting-row"><div><strong>Kurangi animasi</strong><span>Mengurangi transisi antarhalaman.</span></div><button type="button" class="switch ${state.settings.reducedMotion ? 'is-on' : ''}" data-setting="reducedMotion" role="switch" aria-checked="${state.settings.reducedMotion}"><span class="sr-only">Kurangi animasi</span></button></div>
          <div class="setting-row"><div><strong>Kontras lebih tinggi</strong><span>Mempertegas garis dan teks sekunder.</span></div><button type="button" class="switch ${state.settings.highContrast ? 'is-on' : ''}" data-setting="highContrast" role="switch" aria-checked="${state.settings.highContrast}"><span class="sr-only">Kontras tinggi</span></button></div>
        </div></div>
        <div class="section-heading"><h2>Informasi produk</h2></div>
        ${choiceCard({ title: 'Tentang dan batas teknologi', description: 'Lihat apa yang dapat dan tidak dapat dilakukan KOMPAS.', iconName: 'info', route: 'about' })}
      `, true)}`);
    },
  };

  function navigate(route, { replace = false, direction = 'forward' } = {}) {
    if (!views[route]) return;
    if (!replace && state.route !== route) state.history.push(state.route);
    const oldScreen = appMain.querySelector('.screen');
    const nextHTML = views[route]();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = nextHTML.trim();
    const newScreen = wrapper.firstElementChild;
    newScreen.classList.add(direction === 'back' ? 'is-entering-back' : 'is-entering-forward');
    appMain.appendChild(newScreen);
    if (oldScreen) {
      oldScreen.classList.add(direction === 'back' ? 'is-leaving-back' : 'is-leaving-forward');
      window.setTimeout(() => oldScreen.remove(), state.settings.reducedMotion ? 5 : 310);
    }
    state.route = route;
    document.title = `${routeMeta[route]?.title || 'KOMPAS Digital'} — KOMPAS Digital`;
    liveRegion.textContent = `Halaman ${routeMeta[route]?.title || route}`;
    window.setTimeout(() => appMain.focus({ preventScroll: true }), 30);
  }

  function goBack() {
    const previous = state.history.pop() || 'home';
    navigate(previous, { replace: true, direction: 'back' });
  }

  function rerender() {
    const current = appMain.querySelector('.screen');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = views[state.route]().trim();
    const next = wrapper.firstElementChild;
    current?.replaceWith(next);
  }

  function resetJourney() {
    state.history = [];
    state.risk = { urgency: '', data: '', verified: '' };
    state.sentDataType = '';
    state.companion = 'Guru pendamping Pos KOMPAS';
    navigate('home', { replace: true });
  }

  function showToast(message, duration = 2600) {
    toastRoot.innerHTML = `<div class="toast">${escapeHTML(message)}</div>`;
    window.setTimeout(() => { toastRoot.innerHTML = ''; }, duration);
  }

  function showSheet(content) {
    overlayRoot.innerHTML = `<div class="sheet-backdrop" data-close-overlay><section class="bottom-sheet" role="dialog" aria-modal="true" aria-label="Informasi"><div class="sheet-handle"></div>${content}</section></div>`;
  }

  function closeOverlay() { overlayRoot.innerHTML = ''; }

  function handleAction(action, value) {
    switch (action) {
      case 'set-risk-urgency': state.risk.urgency = value; rerender(); break;
      case 'set-risk-data': state.risk.data = value; rerender(); break;
      case 'set-risk-verified': state.risk.verified = value; rerender(); break;
      case 'set-sent-data': state.sentDataType = value; rerender(); break;
      case 'set-companion': state.companion = value; rerender(); break;
      case 'set-dark-answer': state.darkPatternAnswer = value; rerender(); break;
      case 'safe-before-send':
        showSheet(`<span class="status-chip status-chip--safe">${icon('check', 'icon icon--sm')} Langkah aman diambil</span><h2 style="margin-top:14px">Berhenti sebelum mengirim data adalah keputusan yang baik.</h2><p>Simpan panduan ini, periksa melalui kanal resmi, dan ajak pendamping bila kamu masih ragu.</p><div class="button-row"><button class="btn btn--primary" type="button" data-action="reset-home">Kembali ke beranda</button><button class="btn btn--secondary" type="button" data-close-overlay>Tutup</button></div>`);
        break;
      case 'show-summary':
        showSheet(`<span class="status-chip status-chip--assist">${icon('users', 'icon icon--sm')} Mode pendamping</span><h2 style="margin-top:14px">Tunjukkan layar ini kepada pendamping.</h2><p>Mulailah dengan kalimat: “Saya menerima pesan yang meminta data pribadi dan saya membutuhkan bantuan untuk memeriksanya.”</p><div class="banner">${icon('shield')}<span>Jangan kirim ringkasan ke pihak yang tidak dikenal.</span></div><div class="button-row"><button class="btn btn--primary" type="button" data-close-overlay>Saya mengerti</button></div>`);
        break;
      case 'urgent-help':
        showSheet(`<span class="status-chip status-chip--danger">${icon('alert', 'icon icon--sm')} Perlu bantuan manusia</span><h2 style="margin-top:14px">Jangan menghadapi situasi ini sendirian.</h2><p>Segera cari orang dewasa tepercaya, pendamping profesional, atau layanan resmi yang sudah diverifikasi di wilayahmu. Jangan menyebarkan ulang bukti dan jangan bernegosiasi sendirian dengan pihak yang mengancam.</p><div class="button-row"><button class="btn btn--primary" type="button" data-nav="companion">Pilih pendamping</button><button class="btn btn--secondary" type="button" data-close-overlay>Tutup</button></div>`);
        break;
      case 'reset-lab': state.labSelections.clear(); navigate('lab', { replace: true, direction: 'back' }); break;
      case 'reset-home': closeOverlay(); resetJourney(); break;
      default: break;
    }
  }

  appMain.addEventListener('click', (event) => {
    const nav = event.target.closest('[data-nav]');
    if (nav && !nav.disabled) { navigate(nav.dataset.nav); return; }
    const back = event.target.closest('[data-back]');
    if (back) { goBack(); return; }
    const action = event.target.closest('[data-action]');
    if (action && !action.disabled) { handleAction(action.dataset.action, action.dataset.value || ''); return; }
    const labPiece = event.target.closest('[data-lab-piece]');
    if (labPiece) {
      const id = labPiece.dataset.labPiece;
      state.labSelections.has(id) ? state.labSelections.delete(id) : state.labSelections.add(id);
      rerender();
    }
  });

  appMain.addEventListener('change', (event) => {
    const privacy = event.target.closest('[data-privacy-check]');
    if (privacy) {
      privacy.checked ? state.privacyChecks.add(privacy.dataset.privacyCheck) : state.privacyChecks.delete(privacy.dataset.privacyCheck);
    }
  });

  appMain.addEventListener('click', (event) => {
    const setting = event.target.closest('[data-setting]');
    if (!setting) return;
    const key = setting.dataset.setting;
    state.settings[key] = !state.settings[key];
    saveSettings();
    rerender();
    showToast('Pengaturan diperbarui');
  });

  overlayRoot.addEventListener('click', (event) => {
    const nav = event.target.closest('[data-nav]');
    if (nav) { closeOverlay(); navigate(nav.dataset.nav); return; }
    const action = event.target.closest('[data-action]');
    if (action) { handleAction(action.dataset.action, action.dataset.value || ''); return; }
    if (event.target.closest('[data-close-overlay]')) closeOverlay();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlayRoot.innerHTML) closeOverlay();
  });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }

  applySettings();
  navigate('splash', { replace: true });
})();
