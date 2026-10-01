/* ==========================================================================
   EKSPLOR TANGGAMUS — SCRIPT INTERAKTIF LENGKAP
   Terhubung Langsung dengan Database SQLite & Prisma ORM Melalui REST API
   ========================================================================== */

// --- ELEMEN DOM ---
const listKontainer = document.getElementById('destinasi-list');
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const filterBtns = document.querySelectorAll('.btn-filter');
const modal = document.getElementById('detailModal');
const modalBody = document.getElementById('modalBody');
const closeModalBtn = document.getElementById('closeModalBtn');
const noResults = document.getElementById('no-results');
const sortSelect = document.getElementById('sortSelect');
const viewGrid = document.getElementById('viewGrid');
const viewList = document.getElementById('viewList');
const priceRange = document.getElementById('priceRange');
const priceMaxLabel = document.getElementById('priceMax');
const priceHint = document.getElementById('priceHint');
const resultsInfo = document.getElementById('resultsInfo');
const navbar = document.getElementById('navbar');
const backToTop = document.getElementById('backToTop');
const wishlistCount = document.getElementById('wishlistCount');
const wishlistItems = document.getElementById('wishlistItems');
const wishlistPanel = document.getElementById('wishlistPanel');
const wishlistOverlay = document.getElementById('wishlistOverlay');
const toast = document.getElementById('toast');
const cursorGlow = document.getElementById('cursorGlow');

// --- STATE APLIKASI ---
let dataWisataGlobal = [];
let kategoriAktif = 'Semua';
let isListView = false;
let wishlist = JSON.parse(localStorage.getItem('tanggamus_wishlist') || '[]');
let currentModalId = null;
let maxPriceFilter = 25000;
let statsAnimated = false;
let toastTimeout = null;

// --- FORMAT MATA UANG ---
function formatMataUang(nominal) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(nominal || 0);
}

// =========================================
// GLOW KURSOR
// =========================================
if (cursorGlow) {
    document.addEventListener('mousemove', e => {
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';
    });
}

// =========================================
// MUAT DATA WISATA DARI DATABASE (API / SSR)
// =========================================
async function muatDataWisata() {
    tampilkanSkeleton();
    try {
        const response = await fetch('/api/destinations');
        if (!response.ok) throw new Error('API Error');
        const json = await response.json();
        if (json.success && json.data) {
            dataWisataGlobal = json.data;
        } else {
            throw new Error('Data format invalid');
        }
    } catch (err) {
        console.warn('Menggunakan fallback data awal:', err);
        if (window.__INITIAL_DATA__ && window.__INITIAL_DATA__.destinations) {
            dataWisataGlobal = window.__INITIAL_DATA__.destinations;
        }
    }
    filterDanTampilkan();
    updatePriceRange();
    updateFeaturedCard();
    if (leafletMap) renderMapData();
}

function tampilkanSkeleton() {
    if (!listKontainer) return;
    listKontainer.innerHTML = Array.from({ length: 6 }, (_, i) => `
        <div class="card skeleton" style="animation-delay:${i * 0.08}s; opacity:0.6; min-height:300px;">
            <div style="height:200px; background:rgba(37,99,235,0.1); border-radius:14px; margin-bottom:14px;"></div>
            <div style="height:20px; width:60%; background:rgba(56,189,248,0.15); border-radius:6px; margin-bottom:10px;"></div>
            <div style="height:14px; width:90%; background:rgba(255,255,255,0.06); border-radius:4px; margin-bottom:6px;"></div>
            <div style="height:14px; width:75%; background:rgba(255,255,255,0.06); border-radius:4px;"></div>
        </div>
    `).join('');
}

function updatePriceRange() {
    if (!priceRange || dataWisataGlobal.length === 0) return;
    const maxHarga = Math.max(...dataWisataGlobal.map(d => d.ticketPrice || 0), 25000);
    priceRange.max = maxHarga;
    priceRange.value = maxHarga;
    maxPriceFilter = maxHarga;
    if (priceMaxLabel) priceMaxLabel.textContent = formatMataUang(maxHarga);
}

function updateFeaturedCard() {
    const featuredItem = dataWisataGlobal.find(d => d.isRecommended) || dataWisataGlobal[0];
    if (!featuredItem) return;

    const card = document.getElementById('featuredCard');
    if (!card) return;

    card.onclick = () => bukaDetail(featuredItem.id);
    const img = card.querySelector('.featured-img');
    if (img) {
        img.src = `/Gambar/${featuredItem.image}`;
        img.alt = featuredItem.name;
    }

    const title = card.querySelector('.featured-title');
    if (title) title.textContent = featuredItem.name;

    const loc = card.querySelector('.featured-loc');
    if (loc) loc.textContent = `📍 ${featuredItem.location}`;

    const desc = card.querySelector('.featured-desc');
    if (desc) desc.textContent = featuredItem.description;

    const rating = card.querySelector('.featured-rating');
    if (rating) rating.textContent = `⭐ ${featuredItem.rating} / 5.0`;

    const price = card.querySelector('.featured-price');
    if (price) price.textContent = `Tiket: ${formatMataUang(featuredItem.ticketPrice)}`;

    const cat = card.querySelector('.featured-cat-badge');
    if (cat) cat.textContent = `🔷 ${featuredItem.category}`;
}

// =========================================
// RENDER KARTU DESTINASI
// =========================================
function tampilkanKeLayar(wisata) {
    if (!listKontainer) return;
    listKontainer.innerHTML = '';

    if (wisata.length === 0) {
        if (noResults) noResults.style.display = 'block';
        if (resultsInfo) resultsInfo.innerHTML = '';
        return;
    }

    if (noResults) noResults.style.display = 'none';
    if (resultsInfo) {
        resultsInfo.innerHTML = `Menampilkan <strong>${wisata.length}</strong> dari total ${dataWisataGlobal.length} destinasi wisata Tanggamus`;
    }

    wisata.forEach((item, index) => {
        const harga = formatMataUang(item.ticketPrice);
        const isWishlisted = wishlist.includes(item.id);
        const badgeRekomendasi = item.isRecommended
            ? `<span class="badge-rekomendasi">★ Rekomendasi</span>` : '';

        const kartuHTML = `
        <div class="card" style="animation-delay:${index * 0.05}s" onclick="bukaDetail(${item.id})">
            <div class="card-img-wrapper">
                ${badgeRekomendasi}
                <button class="btn-zoom-card" onclick="openLightbox(event, ${item.id})" title="Perbesar Foto">🔍</button>
                <img src="/Gambar/${item.image}" alt="${item.name}" loading="lazy" onerror="this.src='/Gambar/batutegi.jpg'">
            </div>
            <div class="card-content">
                <div class="card-header">
                    <span class="category">${item.category}</span>
                    <span class="rating">⭐ ${item.rating}</span>
                </div>
                <h3>${item.name}</h3>
                <div class="card-location">📍 ${item.location}</div>
                <p class="desc">${item.description}</p>
                <div class="card-footer">
                    <div>
                        <span class="price-label">Tiket Masuk</span>
                        <span class="price">${harga}</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn-wishlist-card ${isWishlisted ? 'active' : ''}"
                            onclick="toggleWishlist(event, ${item.id})"
                            title="${isWishlisted ? 'Hapus favorit' : 'Tambah favorit'}">
                            ${isWishlisted ? '❤️' : '🤍'}
                        </button>
                        <span class="btn-detail">Detail →</span>
                    </div>
                </div>
            </div>
        </div>`;
        listKontainer.innerHTML += kartuHTML;
    });

    init3DTilt();
}

// 3D Card Tilt
function init3DTilt() {
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const dx = (x - cx) / cx;
            const dy = (y - cy) / cy;
            const tiltX = dy * -6;
            const tiltY = dx * 6;
            card.style.transform = `translateY(-8px) perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// =========================================
// FILTER, PENCARIAN & SORTIR
// =========================================
function filterDanTampilkan() {
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const sortVal = sortSelect ? sortSelect.value : 'default';

    let hasil = dataWisataGlobal.filter(item => {
        const itemCat = (item.category || '').toLowerCase();
        const activeCat = kategoriAktif.toLowerCase();
        const cocokKategori = activeCat === 'semua' || itemCat.includes(activeCat);

        const cocokKeyword = !keyword ||
            (item.name && item.name.toLowerCase().includes(keyword)) ||
            (item.location && item.location.toLowerCase().includes(keyword)) ||
            (item.description && item.description.toLowerCase().includes(keyword));

        const cocokHarga = (item.ticketPrice || 0) <= maxPriceFilter;
        return cocokKategori && cocokKeyword && cocokHarga;
    });

    switch (sortVal) {
        case 'rating-desc': hasil.sort((a, b) => b.rating - a.rating); break;
        case 'rating-asc': hasil.sort((a, b) => a.rating - b.rating); break;
        case 'price-asc': hasil.sort((a, b) => a.ticketPrice - b.ticketPrice); break;
        case 'price-desc': hasil.sort((a, b) => b.ticketPrice - a.ticketPrice); break;
        case 'name-asc': hasil.sort((a, b) => a.name.localeCompare(b.name)); break;
        case 'recommend': hasil.sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0) || b.rating - a.rating); break;
    }

    tampilkanKeLayar(hasil);
}

function resetFilters() {
    if (searchInput) {
        searchInput.value = '';
        if (searchClear) searchClear.style.display = 'none';
    }
    if (sortSelect) sortSelect.value = 'default';
    kategoriAktif = 'Semua';
    filterBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-category="Semua"]')?.classList.add('active');

    if (priceRange) {
        maxPriceFilter = parseInt(priceRange.max);
        priceRange.value = priceRange.max;
        if (priceMaxLabel) priceMaxLabel.textContent = formatMataUang(parseInt(priceRange.max));
    }
    if (priceHint) priceHint.textContent = '';
    filterDanTampilkan();
}

window.setFilter = function(cat) {
    kategoriAktif = cat;
    filterBtns.forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-category="${cat}"]`)?.classList.add('active');
    filterDanTampilkan();
    document.getElementById('destinasi')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// Events Search & Filter
if (searchInput) {
    searchInput.addEventListener('input', () => {
        if (searchClear) searchClear.style.display = searchInput.value ? 'block' : 'none';
        filterDanTampilkan();
    });
}

if (searchClear) {
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.style.display = 'none';
        searchInput.focus();
        filterDanTampilkan();
    });
}

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        kategoriAktif = btn.dataset.category || 'Semua';
        filterDanTampilkan();
    });
});

if (sortSelect) sortSelect.addEventListener('change', filterDanTampilkan);

if (viewGrid && viewList) {
    viewGrid.addEventListener('click', () => {
        isListView = false;
        listKontainer.classList.remove('list-view');
        viewGrid.classList.add('active');
        viewList.classList.remove('active');
    });

    viewList.addEventListener('click', () => {
        isListView = true;
        listKontainer.classList.add('list-view');
        viewList.classList.add('active');
        viewGrid.classList.remove('active');
    });
}

if (priceRange) {
    priceRange.addEventListener('input', () => {
        maxPriceFilter = parseInt(priceRange.value);
        if (priceMaxLabel) priceMaxLabel.textContent = formatMataUang(maxPriceFilter);
        const isFiltered = maxPriceFilter < parseInt(priceRange.max);
        if (priceHint) priceHint.textContent = isFiltered ? `🔵 Filter aktif: maks. ${formatMataUang(maxPriceFilter)}` : '';
        filterDanTampilkan();
    });
}

// =========================================
// SISTEM FAVORIT / WISHLIST
// =========================================
function toggleWishlist(e, id) {
    if (e) e.stopPropagation();
    const idx = wishlist.indexOf(id);
    const item = dataWisataGlobal.find(d => d.id === id);
    if (idx > -1) {
        wishlist.splice(idx, 1);
        showToast(`❌ ${item?.name || 'Destinasi'} dihapus dari favorit`);
    } else {
        wishlist.push(id);
        showToast(`❤️ ${item?.name || 'Destinasi'} ditambahkan ke favorit!`);
    }
    localStorage.setItem('tanggamus_wishlist', JSON.stringify(wishlist));
    updateWishlistCount();
    renderWishlistItems();
    filterDanTampilkan();

    if (currentModalId === id) {
        const btn = document.querySelector('.btn-wishlist-modal');
        if (btn) {
            const isNow = wishlist.includes(id);
            btn.classList.toggle('wishlisted', isNow);
            btn.innerHTML = isNow ? '❤️ Hapus Favorit' : '🤍 Simpan Favorit';
        }
    }
}

function updateWishlistCount() {
    if (!wishlistCount) return;
    wishlistCount.textContent = wishlist.length;
    wishlistCount.style.display = wishlist.length > 0 ? 'flex' : 'none';
}

function renderWishlistItems() {
    if (!wishlistItems) return;
    if (wishlist.length === 0) {
        wishlistItems.innerHTML = '<p class="wishlist-empty" style="color:var(--text-muted); text-align:center; padding:20px;">Belum ada favorit.<br>Klik 🤍 pada kartu destinasi wisata!</p>';
        return;
    }
    wishlistItems.innerHTML = wishlist.map(id => {
        const item = dataWisataGlobal.find(d => d.id === id);
        if (!item) return '';
        return `
            <div class="wishlist-item" onclick="bukaDetail(${item.id}); toggleWishlistPanel();" style="display:flex; align-items:center; gap:12px; padding:10px; background:rgba(6,14,34,0.7); border:1px solid var(--border-subtle); border-radius:10px; margin-bottom:10px; cursor:pointer;">
                <img class="wishlist-item-img" src="/Gambar/${item.image}" alt="${item.name}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;" onerror="this.src='/Gambar/batutegi.jpg'">
                <div class="wishlist-item-info" style="flex:1;">
                    <div style="font-weight:700; color:#fff; font-size:0.9rem;">${item.name}</div>
                    <div style="font-size:0.75rem; color:var(--blue-ice);">${item.category} · ⭐ ${item.rating}</div>
                </div>
                <button class="wishlist-remove" onclick="event.stopPropagation(); toggleWishlist(event, ${item.id})" style="background:none; border:none; cursor:pointer; font-size:1.1rem;" title="Hapus">🗑️</button>
            </div>`;
    }).join('');
}

window.toggleWishlistPanel = function() {
    if (!wishlistPanel || !wishlistOverlay) return;
    const isOpen = wishlistPanel.classList.toggle('open');
    wishlistOverlay.style.display = isOpen ? 'block' : 'none';
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (isOpen) renderWishlistItems();
};

// =========================================
// MODAL DETAIL DESTINASI
// =========================================
async function bukaDetail(id) {
    const item = dataWisataGlobal.find(d => d.id === id);
    if (!item) return;
    currentModalId = id;

    const harga = formatMataUang(item.ticketPrice);
    const facilitiesArr = Array.isArray(item.facilities) ? item.facilities : [];
    const fasilitasHTML = facilitiesArr.map(f => `<span class="facility-badge">✓ ${f}</span>`).join('');
    const isWishlisted = wishlist.includes(id);
    const rekBadge = item.isRecommended ? `<span class="badge-rekomendasi" style="position:static;">★ Rekomendasi</span>` : '';

    modalBody.innerHTML = `
        <img class="modal-img" src="/Gambar/${item.image}" alt="${item.name}" onerror="this.src='/Gambar/batutegi.jpg'">
        <div class="modal-inner">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
                <span class="category">${item.category}</span>
                <span class="rating">⭐ ${item.rating} / 5.0 (${item.reviewCount || 300}+ ulasan)</span>
                ${rekBadge}
            </div>
            <h2 style="font-family:'DM Serif Display',serif; font-size:1.8rem; color:#fff; margin-bottom:6px;">${item.name}</h2>
            <p style="color:var(--blue-ice); font-size:0.92rem; margin-bottom:16px;">📍 <strong>${item.location}</strong></p>

            <div style="background:rgba(37,99,235,0.12); border:1px solid var(--border-glow); border-radius:12px; padding:16px; margin-bottom:20px;">
                <div style="font-weight:700; color:var(--blue-neon); font-size:0.88rem; margin-bottom:6px;">🕒 Waktu Kunjungan Terbaik:</div>
                <div style="color:#fff; font-size:0.9rem;">${item.bestTime || 'Pagi & Sore Hari'} (Buka: ${item.openHours || '08.00 - 17.00 WIB'})</div>
            </div>

            <p style="color:var(--text-secondary); line-height:1.7; font-size:0.95rem; margin-bottom:20px;">${item.description}</p>

            <div style="font-weight:700; color:#fff; margin-bottom:10px;">Fasilitas Tersedia:</div>
            <div style="margin-bottom:24px;">${fasilitasHTML}</div>

            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:18px; flex-wrap:wrap; gap:12px;">
                <div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">Tiket Masuk:</div>
                    <div style="font-size:1.4rem; font-weight:800; color:#fff;">${harga}</div>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <a href="/destinasi/${item.id}" class="btn-primary-hero" style="padding:10px 18px; font-size:0.85rem; text-decoration:none;">
                        🔗 Halaman Penuh →
                    </a>
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}" target="_blank" rel="noopener" class="btn-secondary-hero" style="padding:10px 18px; font-size:0.85rem; text-decoration:none;">
                        🗺️ Google Maps
                    </a>
                    <button class="btn-secondary-hero" onclick="shareDestinasi(${item.id})" style="padding:10px 18px; font-size:0.85rem;">
                        📤 Bagikan
                    </button>
                    <button class="btn-wishlist-modal ${isWishlisted ? 'wishlisted' : ''}" onclick="toggleWishlist(event, ${item.id})" style="background:rgba(37,99,235,0.2); border:1px solid var(--border-glow); color:#fff; padding:10px 16px; border-radius:var(--radius-pill); cursor:pointer;">
                        ${isWishlisted ? '❤️ Hapus Favorit' : '🤍 Simpan'}
                    </button>
                </div>
            </div>
        </div>`;

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function tutupModal() {
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
    currentModalId = null;
}

if (closeModalBtn) closeModalBtn.addEventListener('click', tutupModal);
window.addEventListener('click', e => { if (e.target === modal) tutupModal(); });
window.addEventListener('keydown', e => { if (e.key === 'Escape' && modal && modal.style.display === 'block') tutupModal(); });

// Share Destinasi
window.shareDestinasi = async function(id) {
    const item = dataWisataGlobal.find(d => d.id === id);
    if (!item) return;
    const shareData = {
        title: `Eksplor Tanggamus — ${item.name}`,
        text: `Yuk liburan ke ${item.name} di ${item.location}, Tanggamus! ⭐ Rating: ${item.rating}. Tiket: ${formatMataUang(item.ticketPrice)}`,
        url: window.location.href
    };
    if (navigator.share) {
        try { await navigator.share(shareData); } catch {}
    } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        showToast('📋 Info destinasi wisata berhasil disalin!');
    }
};

// =========================================
// TOAST NOTIFIKASI
// =========================================
function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3200);
}

// =========================================
// SCROLL EVENTS & COUNTERS
// =========================================
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (navbar) navbar.classList.toggle('scrolled', scrollY > 60);
    if (backToTop) backToTop.classList.toggle('visible', scrollY > 450);

    const statsEl = document.getElementById('stats');
    if (statsEl && !statsAnimated) {
        const rect = statsEl.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.88) {
            animateCounters();
            statsAnimated = true;
        }
    }
}, { passive: true });

function animateCounters() {
    document.querySelectorAll('.stat-card').forEach(card => {
        const target = parseFloat(card.dataset.target || '0');
        const suffix = card.dataset.suffix || '';
        const decimal = parseInt(card.dataset.decimal || '0');
        const numEl = card.querySelector('.stat-number');
        if (!numEl) return;
        const duration = 2000;
        const start = performance.now();

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            numEl.textContent = (eased * target).toFixed(decimal) + suffix;
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    });
}

// Hamburger Mobile
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', isOpen);
    });
    navLinks.addEventListener('click', e => {
        if (e.target.classList.contains('nav-link')) {
            navLinks.classList.remove('open');
            hamburger.setAttribute('aria-expanded', false);
        }
    });
}

// Particles Generator
function createParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;
    const colors = ['#2563eb', '#38bdf8', '#60a5fa', '#1d4ed8', '#93c5fd'];
    for (let i = 0; i < 28; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 5 + 2;
        const left = Math.random() * 100;
        const dur = Math.random() * 16 + 8;
        const delay = Math.random() * 10;
        p.style.cssText = `
            width:${size}px; height:${size}px;
            background:${color};
            left:${left}%;
            bottom:0;
            animation-duration:${dur}s;
            animation-delay:${delay}s;
            box-shadow: 0 0 ${size * 3}px ${color};
        `;
        container.appendChild(p);
    }
}

// =========================================
// REAL-TIME WEATHER HUB
// =========================================
let activeWeatherRegion = 'kota-agung';

async function renderWeatherHub(regionSlug, forceRefresh = false) {
    try {
        const res = await fetch(`/api/weather/${regionSlug}`);
        const json = await res.json();
        if (!json.success || !json.data) return;
        const w = json.data;

        const locName = document.getElementById('cuacaLocationName');
        const updateTime = document.getElementById('cuacaUpdateTime');
        const tempMain = document.getElementById('cuacaTempMain');
        const condText = document.getElementById('cuacaConditionText');
        const feelsLike = document.getElementById('cuacaFeelsLike');
        const iconLarge = document.getElementById('cuacaIconLarge');
        const recTitle = document.getElementById('recommendTitle');
        const recDesc = document.getElementById('recommendDesc');
        const recDests = document.getElementById('recommendDestinations');
        const hum = document.getElementById('cuacaHumidity');
        const wind = document.getElementById('cuacaWindSpeed');
        const rain = document.getElementById('cuacaRainChance');
        const uv = document.getElementById('cuacaUVIndex');

        if (locName) locName.textContent = `Kecamatan ${w.regionName}, Tanggamus`;
        if (updateTime) updateTime.textContent = `Diperbarui: Baru Saja (${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB)`;
        if (tempMain) tempMain.textContent = w.temp;
        if (condText) condText.textContent = w.condition;
        if (feelsLike) feelsLike.textContent = `Suhu terasa ${w.feelsLike}°C · Angin ${w.windSpeed} km/j`;
        if (iconLarge) iconLarge.textContent = w.icon;
        if (recTitle) recTitle.textContent = w.recommendTitle;
        if (recDesc) recDesc.textContent = w.recommendDesc;
        if (recDests && w.recDestinations) {
            recDests.innerHTML = w.recDestinations.map(d => `<span class="rec-tag">🔷 ${d}</span>`).join('');
        }
        if (hum) hum.textContent = `${w.humidity}%`;
        if (wind) wind.textContent = `${w.windSpeed} km/j`;
        if (rain) rain.textContent = `${w.rainChance}%`;
        if (uv) uv.textContent = w.uvIndex;

        // Render Hourly Track
        const track = document.getElementById('cuacaHourlyTrack');
        if (track && w.hourly) {
            track.innerHTML = w.hourly.map((h, i) => `
                <div class="hourly-card ${i === 0 ? 'now' : ''}">
                    <span class="hourly-time">${h.time}</span>
                    <span class="hourly-icon">${h.icon}</span>
                    <span class="hourly-temp">${h.temp}°C</span>
                    <span class="hourly-rain">${h.cond}</span>
                </div>
            `).join('');
        }

        // Render Daily Grid
        const dailyGrid = document.getElementById('cuacaDailyGrid');
        if (dailyGrid && w.daily) {
            dailyGrid.innerHTML = w.daily.map(d => `
                <div class="daily-card">
                    <span class="daily-day">${d.day}</span>
                    <span class="daily-icon">${d.icon}</span>
                    <span class="daily-condition">${d.cond}</span>
                    <div class="daily-temp-range">
                        <span class="daily-temp-max">${d.high}°</span>
                        <span class="daily-temp-min">/ ${d.low}°</span>
                    </div>
                </div>
            `).join('');
        }

        // Update Navbar Weather
        const navTemp = document.getElementById('navWeatherTemp');
        const navIcon = document.getElementById('navWeatherIcon');
        const navCity = document.querySelector('.nav-weather-city');
        if (navTemp) navTemp.textContent = `${w.temp}°C`;
        if (navIcon) navIcon.textContent = w.icon;
        if (navCity) navCity.textContent = w.regionName;
    } catch (e) {
        console.warn('Weather error:', e);
    }
}

function initWeatherSection() {
    const tabs = document.querySelectorAll('.region-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeWeatherRegion = tab.dataset.region || 'kota-agung';
            renderWeatherHub(activeWeatherRegion);
        });
    });

    const refreshBtn = document.getElementById('btnCuacaRefresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            renderWeatherHub(activeWeatherRegion, true);
            showToast('🌤️ Data cuaca berhasil diperbarui!');
        });
    }
    renderWeatherHub(activeWeatherRegion);
}

// =========================================
// PETA WISATA INTERAKTIF (LEAFLET.JS)
// =========================================
let leafletMap = null;
let mapMarkers = {};
let currentTileLayer = null;
let darkLayer = null;
let satLayer = null;
let activeMapFilter = 'all';

function initWisataMap() {
    const mapContainer = document.getElementById('petaWisataMap');
    if (!mapContainer || typeof L === 'undefined') return;

    leafletMap = L.map('petaWisataMap', {
        center: [-5.45, 104.75],
        zoom: 10,
        zoomControl: true,
        scrollWheelZoom: false
    });

    // Layer Satelit Resolusi Tinggi (Google Hybrid: Citra Satelit + Nama Lokasi & Jalan)
    satLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        attribution: '&copy; Citra Satelit Google &bull; Eksplor Tanggamus',
        maxZoom: 20
    });

    // Layer Peta Jalan Bebas Watermark (OpenStreetMap)
    darkLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    });

    // Default: Mode Satelit Aktif Langsung
    currentTileLayer = satLayer;
    currentTileLayer.addTo(leafletMap);

    const btnDark = document.getElementById('btnLayerDark');
    const btnSat = document.getElementById('btnLayerSat');

    if (btnDark && btnSat) {
        btnSat.classList.add('active');
        btnDark.classList.remove('active');

        btnDark.addEventListener('click', () => {
            if (currentTileLayer !== darkLayer) {
                leafletMap.removeLayer(currentTileLayer);
                darkLayer.addTo(leafletMap);
                currentTileLayer = darkLayer;
                btnDark.classList.add('active');
                btnSat.classList.remove('active');
                showToast('🗺️ Mode Peta Jalan Aktif');
            }
        });

        btnSat.addEventListener('click', () => {
            if (currentTileLayer !== satLayer) {
                leafletMap.removeLayer(currentTileLayer);
                satLayer.addTo(leafletMap);
                currentTileLayer = satLayer;
                btnSat.classList.add('active');
                btnDark.classList.remove('active');
                showToast('🛰️ Mode Peta Satelit Aktif');
            }
        });
    }

    renderMapData();

    const chips = document.querySelectorAll('.peta-chip:not(.chip-route)');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeMapFilter = chip.dataset.mapFilter || 'all';
            renderMapData();
        });
    });
}

function renderMapData() {
    if (!leafletMap || dataWisataGlobal.length === 0) return;

    Object.values(mapMarkers).forEach(m => leafletMap.removeLayer(m));
    mapMarkers = {};

    const filtered = activeMapFilter === 'all'
        ? dataWisataGlobal
        : dataWisataGlobal.filter(d => (d.category || '').toLowerCase().includes(activeMapFilter.toLowerCase()));

    const listEl = document.getElementById('petaDestList');
    if (listEl) {
        listEl.innerHTML = filtered.map(item => `
            <div class="peta-card-item" id="petaCard${item.id}" onclick="focusDestinationOnMap(${item.id})">
                <img src="/Gambar/${item.image}" alt="${item.name}" class="peta-card-thumb" onerror="this.src='/Gambar/batutegi.jpg'">
                <div class="peta-card-info">
                    <span class="peta-card-title">${item.name}</span>
                    <div class="peta-card-meta">
                        <span>🔷 ${item.category}</span>
                        <span>•</span>
                        <span>⭐ ${item.rating}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    filtered.forEach(item => {
        const customIcon = L.divIcon({
            className: 'custom-map-icon-wrapper',
            html: `<div class="custom-map-pin">🔷</div>`,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
            popupAnchor: [0, -20]
        });

        const hargaText = item.ticketPrice === 0 ? 'Gratis' : formatMataUang(item.ticketPrice);
        const popupContent = `
            <div class="map-popup-card">
                <img src="/Gambar/${item.image}" alt="${item.name}" class="map-popup-img" onerror="this.src='/Gambar/batutegi.jpg'">
                <div class="map-popup-body">
                    <span class="map-popup-tag">🔷 ${item.category} • ${item.location}</span>
                    <h4 class="map-popup-title">${item.name}</h4>
                    <div class="map-popup-meta">
                        <span>⭐ ${item.rating} / 5.0</span>
                        <span style="color:#fff; font-weight:700;">${hargaText}</span>
                    </div>
                    <div class="map-popup-actions">
                        <button class="btn-popup-detail" onclick="bukaDetail(${item.id})">Detail</button>
                        <a href="/destinasi/${item.id}" class="btn-popup-detail" style="text-decoration:none;">Buka</a>
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}" target="_blank" rel="noopener" class="btn-popup-gmaps">Rute</a>
                    </div>
                </div>
            </div>
        `;

        const marker = L.marker([item.latitude, item.longitude], { icon: customIcon })
            .bindPopup(popupContent, { maxWidth: 260 })
            .addTo(leafletMap);

        marker.on('click', () => {
            highlightSidebarCard(item.id);
            const statusEl = document.getElementById('petaActiveName');
            if (statusEl) statusEl.textContent = `📍 ${item.name} — ${item.location}`;
        });

        mapMarkers[item.id] = marker;
    });
}

function focusDestinationOnMap(id) {
    if (!leafletMap) return;
    const item = dataWisataGlobal.find(d => d.id === id);
    const marker = mapMarkers[id];
    if (item && marker) {
        leafletMap.flyTo([item.latitude, item.longitude], 13, { duration: 1.2 });
        setTimeout(() => marker.openPopup(), 800);
        highlightSidebarCard(id);
    }
}

function highlightSidebarCard(id) {
    document.querySelectorAll('.peta-card-item').forEach(c => c.classList.remove('active'));
    const target = document.getElementById(`petaCard${id}`);
    if (target) {
        target.classList.add('active');
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

let mapRouteGroup = null;
let isRouteActive = false;
window.toggleMapRouteLines = function() {
    if (!leafletMap) return;
    const btn = document.getElementById('btnToggleRoute');

    if (!isRouteActive) {
        if (!mapRouteGroup) mapRouteGroup = L.layerGroup();
        mapRouteGroup.clearLayers();

        const latLngs = dataWisataGlobal.map(d => [d.latitude, d.longitude]);
        const polyline = L.polyline(latLngs, {
            color: '#38bdf8',
            weight: 4,
            opacity: 0.9,
            dashArray: '8, 8'
        });
        mapRouteGroup.addLayer(polyline);
        mapRouteGroup.addTo(leafletMap);
        leafletMap.fitBounds(polyline.getBounds(), { padding: [40, 40] });
        isRouteActive = true;
        if (btn) btn.classList.add('active');
        showToast('🛣️ Rute jelajah Tanggamus ditampilkan!');
    } else {
        if (mapRouteGroup) leafletMap.removeLayer(mapRouteGroup);
        isRouteActive = false;
        if (btn) btn.classList.remove('active');
        showToast('🛣️ Rute jelajah disembunyikan.');
    }
};

// =========================================
// MINI GAME: DOLPHIN WAVE SURF (CANVAS)
// =========================================
const dolphinCanvas = document.getElementById('dolphinCanvas');
const dolphinCtx = dolphinCanvas ? dolphinCanvas.getContext('2d') : null;
let isDolphinRunning = false;
let dolphinAnimFrame = null;
let dolphinScore = 0;
let dolphinDistance = 0;
let dolphinHigh = parseInt(localStorage.getItem('tanggamus_dolphin_high') || '0');

const dolphinState = { x: 90, y: 180, vy: 0 };
let obstacles = [];
let collectibles = [];
let gameParticles = [];

function startDolphinGame() {
    dolphinScore = 0;
    dolphinDistance = 0;
    dolphinState.y = 180;
    dolphinState.vy = 0;
    obstacles = [];
    collectibles = [];
    gameParticles = [];
    isDolphinRunning = true;

    document.getElementById('gameStartOverlay')?.style.setProperty('display', 'none');
    document.getElementById('gameOverOverlay')?.style.setProperty('display', 'none');

    if (dolphinAnimFrame) cancelAnimationFrame(dolphinAnimFrame);
    gameLoop();
}

function triggerDolphinJump() {
    if (!isDolphinRunning) return;
    dolphinState.vy = -7;
    // Splash particles
    for (let i = 0; i < 5; i++) {
        gameParticles.push({
            x: dolphinState.x,
            y: dolphinState.y + 10,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            color: '#38bdf8',
            life: 20
        });
    }
}

function stopDolphinGame() {
    isDolphinRunning = false;
    if (dolphinAnimFrame) cancelAnimationFrame(dolphinAnimFrame);
    if (dolphinScore > dolphinHigh) {
        dolphinHigh = dolphinScore;
        localStorage.setItem('tanggamus_dolphin_high', dolphinHigh.toString());
    }

    const finalScore = document.getElementById('finalScore');
    const finalDist = document.getElementById('finalDistance');
    if (finalScore) finalScore.textContent = dolphinScore;
    if (finalDist) finalDist.textContent = `${Math.floor(dolphinDistance)} m`;
    document.getElementById('gameOverOverlay')?.style.setProperty('display', 'flex');
    updateHUD();
}

function updateHUD() {
    const s = document.getElementById('gameScore');
    const d = document.getElementById('gameDistance');
    const h = document.getElementById('gameHighScore');
    if (s) s.textContent = dolphinScore;
    if (d) d.textContent = `${Math.floor(dolphinDistance)} m`;
    if (h) h.textContent = dolphinHigh;
}

function gameLoop() {
    if (!isDolphinRunning || !dolphinCtx) return;
    const w = dolphinCanvas.width;
    const h = dolphinCanvas.height;
    const waterY = h * 0.55;

    dolphinDistance += 0.4;
    dolphinState.vy += (dolphinState.y > waterY ? -0.18 : 0.28);
    dolphinState.vy *= 0.95;
    dolphinState.y += dolphinState.vy;

    if (dolphinState.y > h - 30) dolphinState.y = h - 30;
    if (dolphinState.y < 30) dolphinState.y = 30;

    // Spawning items
    if (Math.random() < 0.02) {
        obstacles.push({ x: w + 20, y: waterY - 5, w: 30, h: 20 });
    }
    if (Math.random() < 0.035) {
        collectibles.push({ x: w + 20, y: waterY + (Math.random() * 80 - 40), r: 8 });
    }

    // Move & collide
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= 3.5;
        if (Math.hypot(dolphinState.x - obs.x, dolphinState.y - obs.y) < 24) {
            stopDolphinGame();
            return;
        }
        if (obs.x < -40) obstacles.splice(i, 1);
    }

    for (let i = collectibles.length - 1; i >= 0; i--) {
        const c = collectibles[i];
        c.x -= 3.5;
        if (Math.hypot(dolphinState.x - c.x, dolphinState.y - c.y) < 24) {
            dolphinScore += 10;
            collectibles.splice(i, 1);
            updateHUD();
        } else if (c.x < -20) {
            collectibles.splice(i, 1);
        }
    }

    // Render Canvas
    dolphinCtx.clearRect(0, 0, w, h);

    // Sky
    const skyGrad = dolphinCtx.createLinearGradient(0, 0, 0, waterY);
    skyGrad.addColorStop(0, '#020617');
    skyGrad.addColorStop(1, '#0c1f48');
    dolphinCtx.fillStyle = skyGrad;
    dolphinCtx.fillRect(0, 0, w, waterY);

    // Water
    const seaGrad = dolphinCtx.createLinearGradient(0, waterY, 0, h);
    seaGrad.addColorStop(0, '#1d4ed8');
    seaGrad.addColorStop(1, '#05112e');
    dolphinCtx.fillStyle = seaGrad;
    dolphinCtx.fillRect(0, waterY, w, h - waterY);

    // Wave Line
    dolphinCtx.fillStyle = '#38bdf8';
    dolphinCtx.beginPath();
    dolphinCtx.moveTo(0, waterY);
    for (let x = 0; x <= w; x += 20) {
        dolphinCtx.lineTo(x, waterY + Math.sin((x + dolphinDistance * 10) * 0.04) * 4);
    }
    dolphinCtx.lineTo(w, waterY + 4);
    dolphinCtx.lineTo(0, waterY + 4);
    dolphinCtx.fill();

    // Dolphin
    dolphinCtx.fillStyle = '#38bdf8';
    dolphinCtx.font = '28px sans-serif';
    dolphinCtx.fillText('🐬', dolphinState.x - 14, dolphinState.y + 10);

    // Obstacles
    dolphinCtx.fillStyle = '#1e3a8a';
    obstacles.forEach(o => {
        dolphinCtx.fillRect(o.x, o.y, o.w, o.h);
    });

    // Collectibles (Blue Pearls)
    collectibles.forEach(c => {
        dolphinCtx.fillStyle = '#60a5fa';
        dolphinCtx.beginPath();
        dolphinCtx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        dolphinCtx.fill();
    });

    // Particles
    for (let i = gameParticles.length - 1; i >= 0; i--) {
        const p = gameParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        dolphinCtx.fillStyle = p.color;
        dolphinCtx.beginPath();
        dolphinCtx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        dolphinCtx.fill();
        if (p.life <= 0) gameParticles.splice(i, 1);
    }

    dolphinAnimFrame = requestAnimationFrame(gameLoop);
}

// =========================================
// MINI GAME: KUIS PENJELAJAH TANGGAMUS
// =========================================
const QUIZ_DATA = [
    { q: "Pantai dengan formasi karang tajam mirip gigi hiu di Tanggamus adalah?", opts: ["Pantai Gigi Hiu", "Pantai Klara", "Pantai Marina", "Pantai Pasir Putih"], ans: 0 },
    { q: "Teluk Kiluan Tanggamus sangat terkenal dengan atraksi kawanan satwa liar apa?", opts: ["Penyu Hijau", "Lumba-lumba", "Hiu Paus", "Burung Cendrawasih"], ans: 1 },
    { q: "Berapa ketinggian puncak Gunung Tanggamus di atas permukaan laut?", opts: ["1.500 mdpl", "2.102 mdpl", "3.142 mdpl", "800 mdpl"], ans: 1 },
    { q: "Air Terjun bersejarah di kaki Gn. Tanggamus yang dibangun sejak 1937 bernama?", opts: ["Way Lalaan", "Curup Tujuh", "Lembah Pelangi", "Way Kanan"], ans: 0 },
    { q: "Minuman kopi robusta khas dataran tinggi Tanggamus berasal dari lereng kecamatan?", opts: ["Gisting", "Cukuh Balak", "Pugung", "Semaka"], ans: 0 }
];

let quizIdx = 0;
let quizScore = 0;
let quizTimer = 15;
let quizTimerId = null;

function startExplorerQuiz() {
    quizIdx = 0;
    quizScore = 0;
    document.getElementById('quizStartScreen').style.display = 'none';
    document.getElementById('quizResultScreen').style.display = 'none';
    document.getElementById('quizActiveScreen').style.display = 'block';
    loadQuizQuestion();
}

function loadQuizQuestion() {
    clearInterval(quizTimerId);
    quizTimer = 15;
    const q = QUIZ_DATA[quizIdx];

    document.getElementById('qCurrent').textContent = quizIdx + 1;
    document.getElementById('quizQuestionText').textContent = q.q;
    document.getElementById('quizTimerVal').textContent = quizTimer;
    document.getElementById('quizScoreVal').textContent = quizScore;

    const grid = document.getElementById('quizOptionsGrid');
    grid.innerHTML = q.opts.map((opt, i) => `
        <button class="quiz-opt-btn" onclick="handleQuizAnswer(${i})" id="qOpt${i}">
            <span>${String.fromCharCode(65 + i)}.</span>
            <span>${opt}</span>
        </button>
    `).join('');

    quizTimerId = setInterval(() => {
        quizTimer--;
        const tVal = document.getElementById('quizTimerVal');
        const tFill = document.getElementById('quizTimerFill');
        if (tVal) tVal.textContent = quizTimer;
        if (tFill) tFill.style.width = `${(quizTimer / 15) * 100}%`;
        if (quizTimer <= 0) {
            clearInterval(quizTimerId);
            handleQuizAnswer(-1);
        }
    }, 1000);
}

window.handleQuizAnswer = function(chosen) {
    clearInterval(quizTimerId);
    const q = QUIZ_DATA[quizIdx];
    const buttons = document.querySelectorAll('.quiz-opt-btn');
    buttons.forEach(b => b.disabled = true);

    if (chosen === q.ans) {
        quizScore += 20;
        document.getElementById(`qOpt${chosen}`)?.classList.add('correct');
    } else {
        if (chosen >= 0) document.getElementById(`qOpt${chosen}`)?.classList.add('wrong');
        document.getElementById(`qOpt${q.ans}`)?.classList.add('correct');
    }

    setTimeout(() => {
        quizIdx++;
        if (quizIdx < QUIZ_DATA.length) {
            loadQuizQuestion();
        } else {
            finishQuiz();
        }
    }, 1200);
};

function finishQuiz() {
    document.getElementById('quizActiveScreen').style.display = 'none';
    document.getElementById('quizResultScreen').style.display = 'block';
    document.getElementById('quizFinalScore').textContent = quizScore;
    document.getElementById('quizCorrectCount').textContent = `${quizScore / 20}/5`;
    const rankEl = document.getElementById('quizRankTitle');
    if (rankEl) {
        rankEl.textContent = quizScore === 100 ? '👑 Master Eksplor Tanggamus' : (quizScore >= 60 ? '⭐ Petualang Sejati' : '🌱 Penjelajah Pemula');
    }
}

// Lifeline 50:50
const btn50 = document.getElementById('btnLifeline5050');
if (btn50) {
    btn50.addEventListener('click', () => {
        const q = QUIZ_DATA[quizIdx];
        const wrongs = [0, 1, 2, 3].filter(i => i !== q.ans).sort(() => Math.random() - 0.5).slice(0, 2);
        wrongs.forEach(i => {
            const b = document.getElementById(`qOpt${i}`);
            if (b) { b.style.opacity = '0.25'; b.disabled = true; }
        });
        btn50.disabled = true;
        document.getElementById('lifelineCount').textContent = '0x';
    });
}

// =========================================
// MINI GAME: RODA KEBERUNTUNGAN (SPIN WHEEL)
// =========================================
const wheelCanvas = document.getElementById('wheelCanvas');
const wheelCtx = wheelCanvas ? wheelCanvas.getContext('2d') : null;
const WHEEL_REWARDS = [
    { title: 'Voucher Teluk Kiluan', color: '#1d4ed8' },
    { title: 'Lencana Master Gigi Hiu', color: '#2563eb' },
    { title: 'Kopi Gisting Gratis', color: '#1e40af' },
    { title: 'Tiket Way Lalaan', color: '#0284c7' },
    { title: 'Lencana Penjelajah', color: '#3b82f6' },
    { title: 'Tips Rahasia Batutegi', color: '#0369a1' }
];

let wheelAngle = 0;
let isSpinning = false;

function drawWheel() {
    if (!wheelCtx || !wheelCanvas) return;
    const w = wheelCanvas.width;
    const cx = w / 2;
    const cy = w / 2;
    const rad = cx - 10;
    const arc = (Math.PI * 2) / WHEEL_REWARDS.length;

    wheelCtx.clearRect(0, 0, w, w);

    WHEEL_REWARDS.forEach((p, i) => {
        const ang = wheelAngle + i * arc;
        wheelCtx.fillStyle = p.color;
        wheelCtx.beginPath();
        wheelCtx.moveTo(cx, cy);
        wheelCtx.arc(cx, cy, rad, ang, ang + arc);
        wheelCtx.fill();

        wheelCtx.save();
        wheelCtx.translate(cx, cy);
        wheelCtx.rotate(ang + arc / 2);
        wheelCtx.textAlign = 'right';
        wheelCtx.fillStyle = '#fff';
        wheelCtx.font = 'bold 12px Inter, sans-serif';
        wheelCtx.fillText(p.title, rad - 16, 4);
        wheelCtx.restore();
    });

    // Center Hub
    wheelCtx.fillStyle = '#38bdf8';
    wheelCtx.beginPath();
    wheelCtx.arc(cx, cy, 18, 0, Math.PI * 2);
    wheelCtx.fill();
}

function spinWheel() {
    if (isSpinning) return;
    isSpinning = true;
    const target = wheelAngle + Math.PI * 2 * 6 + Math.random() * Math.PI * 2;
    const start = performance.now();
    const dur = 3500;
    const initAng = wheelAngle;

    function anim(now) {
        const p = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 4);
        wheelAngle = initAng + (target - initAng) * ease;
        drawWheel();
        if (p < 1) {
            requestAnimationFrame(anim);
        } else {
            isSpinning = false;
            showToast('🎁 Selamat! Hadiah berhasil kamu dapatkan.');
        }
    }
    requestAnimationFrame(anim);
}

// =========================================
// SINTESIS SUARA ALAM MULTI-AMBIENCE (WEB AUDIO API)
// =========================================
let audioCtx = null;
let currentAmbience = null;
let noiseNode = null;
let birdInterval = null;
let gainNode = null;

function toggleAudioPopover() {
    const pop = document.getElementById('audioPopover');
    if (!pop) return;
    const isShow = pop.style.display === 'block';
    pop.style.display = isShow ? 'none' : 'block';
}

function selectAmbienceSound(type, btnEl) {
    stopAmbienceSound(false);

    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 1.5);
        gainNode.connect(audioCtx.destination);

        const sampleRate = audioCtx.sampleRate;
        const bufferSize = sampleRate * 3;
        const buffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }

        noiseNode = audioCtx.createBufferSource();
        noiseNode.buffer = buffer;
        noiseNode.loop = true;

        if (type === 'waves') {
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(320, audioCtx.currentTime);

            const lfo = audioCtx.createOscillator();
            const lfoGain = audioCtx.createGain();
            lfo.frequency.value = 0.18;
            lfoGain.gain.value = 0.12;
            lfo.connect(lfoGain);
            lfoGain.connect(gainNode.gain);
            lfo.start();

            noiseNode.connect(filter);
            filter.connect(gainNode);
            noiseNode.start();
            showToast('🌊 Memutar Suara Ombak Pantai Kiluan & Gigi Hiu');
        } else if (type === 'forest') {
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(500, audioCtx.currentTime);
            filter.Q.value = 0.5;

            noiseNode.connect(filter);
            filter.connect(gainNode);
            noiseNode.start();

            birdInterval = setInterval(() => {
                if (!audioCtx || audioCtx.state === 'closed') return;
                try {
                    const birdOsc = audioCtx.createOscillator();
                    const birdGain = audioCtx.createGain();
                    birdOsc.type = 'sine';
                    const baseFreq = 2200 + Math.random() * 600;
                    birdOsc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
                    birdOsc.frequency.exponentialRampToValueAtTime(baseFreq + 700, audioCtx.currentTime + 0.12);
                    birdOsc.frequency.exponentialRampToValueAtTime(baseFreq, audioCtx.currentTime + 0.25);

                    birdGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
                    birdGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.28);

                    birdOsc.connect(birdGain);
                    birdGain.connect(audioCtx.destination);
                    birdOsc.start();
                    birdOsc.stop(audioCtx.currentTime + 0.3);
                } catch {}
            }, 3500);

            showToast('🌲 Memutar Suara Hutan & Kicauan Burung Tanggamus');
        } else if (type === 'waterfall') {
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(650, audioCtx.currentTime);

            noiseNode.connect(filter);
            filter.connect(gainNode);
            noiseNode.start();
            showToast('💧 Memutar Gemericik Air Terjun Way Lalaan');
        }

        currentAmbience = type;
        document.querySelectorAll('.audio-opt-btn').forEach(b => b.classList.remove('active'));
        if (btnEl) btnEl.classList.add('active');

        const navBtn = document.getElementById('navAudioBtn');
        const audioLabel = document.getElementById('audioLabel');
        if (navBtn) navBtn.classList.add('playing');
        if (audioLabel) {
            audioLabel.textContent = type === 'waves' ? 'Ombak Aktif' : (type === 'forest' ? 'Hutan Aktif' : 'Air Terjun Aktif');
        }

        setTimeout(() => {
            const pop = document.getElementById('audioPopover');
            if (pop) pop.style.display = 'none';
        }, 600);
    } catch (e) {
        console.warn('Audio synthesis error:', e);
        showToast('⚠️ Audio tidak didukung peramban ini.');
    }
}

function stopAmbienceSound(notify = true) {
    if (birdInterval) {
        clearInterval(birdInterval);
        birdInterval = null;
    }
    if (gainNode && audioCtx) {
        try {
            gainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
            setTimeout(() => {
                if (noiseNode) { try { noiseNode.stop(); } catch {} noiseNode = null; }
            }, 450);
        } catch {
            if (noiseNode) { try { noiseNode.stop(); } catch {} noiseNode = null; }
        }
    } else if (noiseNode) {
        try { noiseNode.stop(); } catch {}
        noiseNode = null;
    }

    currentAmbience = null;
    document.querySelectorAll('.audio-opt-btn').forEach(b => b.classList.remove('active'));
    const navBtn = document.getElementById('navAudioBtn');
    const audioLabel = document.getElementById('audioLabel');
    if (navBtn) navBtn.classList.remove('playing');
    if (audioLabel) audioLabel.textContent = 'Suara Alam';
    if (notify) showToast('🔇 Suara alam dimatikan.');

    const pop = document.getElementById('audioPopover');
    if (pop) pop.style.display = 'none';
}
window.toggleAmbientAudio = toggleAudioPopover;
window.toggleAudioPopover = toggleAudioPopover;
window.selectAmbienceSound = selectAmbienceSound;
window.stopAmbienceSound = stopAmbienceSound;

// =========================================
// SPOTLIGHT SEARCH (CTRL + K)
// =========================================
let spotlightDataCache = null;
let spotlightFocusedIndex = -1;

async function loadSpotlightData() {
    if (spotlightDataCache) return spotlightDataCache;
    try {
        const [dRes, cRes] = await Promise.all([
            fetch('/api/destinations').then(r => r.json()),
            fetch('/api/culinary').then(r => r.json())
        ]);
        const destinations = dRes.data || [];
        const culinary = cRes.data || [];
        const pages = [
            { name: 'Beranda Utama', category: 'Halaman', url: '/', icon: '🏠', desc: 'Halaman depan Eksplor Tanggamus' },
            { name: 'Katalog Destinasi', category: 'Halaman', url: '/destinasi', icon: '🏝️', desc: 'Daftar lengkap objek wisata Tanggamus' },
            { name: 'Peta Satelit Interaktif', category: 'Halaman', url: '/peta', icon: '🛰️', desc: 'Navigasi peta GIS citra satelit' },
            { name: 'Prakiraan Cuaca Real-Time', category: 'Halaman', url: '/cuaca', icon: '🌤️', desc: 'Kondisi cuaca mikro 5 kecamatan' },
            { name: 'Kuliner Khas Tanggamus', category: 'Halaman', url: '/kuliner', icon: '🍲', desc: 'Seruit, ikan bakar, kopi robusta' },
            { name: 'Kalkulator Biaya Liburan', category: 'Halaman', url: '/biaya', icon: '🧮', desc: 'Hitung estimasi pengeluaran liburan' },
            { name: 'Zona Arcade Game', category: 'Halaman', url: '/game', icon: '🎮', desc: 'Dolphin surf & kuis penjelajah' },
            { name: 'Pusat Bantuan & FAQ', category: 'Halaman', url: '/faq', icon: '❓', desc: 'Tanya jawab seputar transportasi & rute' },
            { name: 'Ulasan Pengunjung', category: 'Halaman', url: '/ulasan', icon: '💬', desc: 'Testimoni nyata wisatawan' },
            { name: 'Panel Manajemen Admin', category: 'Admin', url: '/admin', icon: '⚙️', desc: 'Kelola data database SQLite' }
        ];
        spotlightDataCache = { destinations, culinary, pages };
        return spotlightDataCache;
    } catch {
        return { destinations: [], culinary: [], pages: [] };
    }
}

async function openSpotlightSearch() {
    const overlay = document.getElementById('spotlightOverlay');
    const input = document.getElementById('spotlightInput');
    if (!overlay || !input) return;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    input.value = '';
    input.focus();
    renderSpotlightResults('');
}

function closeSpotlightSearch(e) {
    if (e && e.target !== e.currentTarget && !e.target.classList.contains('spotlight-esc')) return;
    const overlay = document.getElementById('spotlightOverlay');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

async function renderSpotlightResults(query) {
    const container = document.getElementById('spotlightResults');
    if (!container) return;
    const data = await loadSpotlightData();
    const q = (query || '').toLowerCase().trim();

    let items = [];

    if (!q) {
        items = [
            ...data.pages.slice(0, 4).map(p => ({
                title: p.name,
                meta: `${p.category} · ${p.desc}`,
                url: p.url,
                icon: p.icon
            })),
            ...data.destinations.slice(0, 4).map(d => ({
                title: d.name,
                meta: `📍 ${d.location} · ⭐ ${d.rating} · ${d.ticketPrice === 0 ? 'Gratis' : formatMataUang(d.ticketPrice)}`,
                url: `/destinasi/${d.id}`,
                img: `/Gambar/${d.image}`
            }))
        ];
    } else {
        data.destinations.forEach(d => {
            if (d.name.toLowerCase().includes(q) || d.location.toLowerCase().includes(q) || (d.category || '').toLowerCase().includes(q)) {
                items.push({
                    title: d.name,
                    meta: `🏝️ Destinasi (${d.category}) · 📍 ${d.location} · ⭐ ${d.rating}`,
                    url: `/destinasi/${d.id}`,
                    img: `/Gambar/${d.image}`
                });
            }
        });

        data.culinary.forEach(c => {
            if (c.name.toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q)) {
                items.push({
                    title: c.name,
                    meta: `🍲 Kuliner Khas · ${c.priceRange} · 📍 ${c.location}`,
                    url: '/kuliner',
                    img: `/Gambar/${c.image}`
                });
            }
        });

        data.pages.forEach(p => {
            if (p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)) {
                items.push({
                    title: p.name,
                    meta: `📄 Menu: ${p.desc}`,
                    url: p.url,
                    icon: p.icon
                });
            }
        });
    }

    if (items.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:32px 16px; color:var(--text-muted);">
                <div style="font-size:2rem; margin-bottom:8px;">🔍</div>
                <div style="font-weight:600; color:#fff;">Tidak ditemukan hasil untuk "${query}"</div>
                <div style="font-size:0.82rem; margin-top:4px;">Coba kata kunci lain seperti "Pantai", "Seruit", atau "Peta"</div>
            </div>
        `;
        return;
    }

    spotlightFocusedIndex = -1;
    container.innerHTML = items.map((it, idx) => `
        <a href="${it.url}" class="spotlight-item" data-index="${idx}">
            ${it.img ? `<img src="${it.img}" alt="${it.title}" class="spotlight-item-thumb" onerror="this.src='/Gambar/batutegi.jpg'">` : `<div style="font-size:1.6rem; width:42px; text-align:center;">${it.icon || '📄'}</div>`}
            <div class="spotlight-item-info">
                <div class="spotlight-item-name">${it.title}</div>
                <div class="spotlight-item-meta">${it.meta}</div>
            </div>
            <span style="color:var(--blue-ice); font-size:0.85rem;">→</span>
        </a>
    `).join('');
}

window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSpotlightSearch();
    }
    if (e.key === 'Escape') {
        closeSpotlightSearch();
        const pop = document.getElementById('audioPopover');
        if (pop) pop.style.display = 'none';
    }
});

window.openSpotlightSearch = openSpotlightSearch;
window.closeSpotlightSearch = closeSpotlightSearch;

// =========================================
// GANTI BAHASA (ID / EN)
// =========================================
let currentLang = 'ID';
function toggleLanguage() {
    currentLang = currentLang === 'ID' ? 'EN' : 'ID';
    const langFlag = document.getElementById('langFlag');
    const langCode = document.getElementById('langCode');
    if (langFlag) langFlag.textContent = currentLang === 'ID' ? '🇮🇩' : '🇬🇧';
    if (langCode) langCode.textContent = currentLang;

    const heroLine1 = document.querySelector('.hero-line-1');
    const heroAccent = document.querySelector('.hero-title-accent');
    const heroLine3 = document.querySelector('.hero-line-3');

    if (currentLang === 'EN') {
        if (heroLine1) heroLine1.textContent = 'Discover Hidden';
        if (heroAccent) heroAccent.textContent = 'Paradise';
        if (heroLine3) heroLine3.textContent = 'in Tanggamus';
        showToast('🇬🇧 Switched to English');
    } else {
        if (heroLine1) heroLine1.textContent = 'Temukan Surga';
        if (heroAccent) heroAccent.textContent = 'Tersembunyi';
        if (heroLine3) heroLine3.textContent = 'di Tanggamus';
        showToast('🇮🇩 Bahasa Indonesia diaktifkan');
    }
}

// =========================================
// LIGHTBOX MODAL
// =========================================
let currentLightboxIdx = 0;
function openLightbox(e, id) {
    if (e) e.stopPropagation();
    const idx = dataWisataGlobal.findIndex(d => d.id === id);
    if (idx === -1) return;
    currentLightboxIdx = idx;
    const item = dataWisataGlobal[idx];

    document.getElementById('lightboxImg').src = `/Gambar/${item.image}`;
    document.getElementById('lightboxTitle').textContent = item.name;
    document.getElementById('lightboxDesc').textContent = item.description;
    document.getElementById('lightboxLocation').textContent = `📍 ${item.location}`;
    document.getElementById('lightboxRating').textContent = `⭐ ${item.rating}`;
    document.getElementById('lightboxModal')?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox(e) {
    if (e && e.target !== e.currentTarget && !e.target.classList.contains('lightbox-close')) return;
    document.getElementById('lightboxModal')?.classList.remove('active');
    document.body.style.overflow = '';
}

function navigateLightbox(dir) {
    if (dataWisataGlobal.length === 0) return;
    currentLightboxIdx = (currentLightboxIdx + dir + dataWisataGlobal.length) % dataWisataGlobal.length;
    const item = dataWisataGlobal[currentLightboxIdx];
    document.getElementById('lightboxImg').src = `/Gambar/${item.image}`;
    document.getElementById('lightboxTitle').textContent = item.name;
    document.getElementById('lightboxDesc').textContent = item.description;
    document.getElementById('lightboxLocation').textContent = `📍 ${item.location}`;
    document.getElementById('lightboxRating').textContent = `⭐ ${item.rating}`;
}

function shareToWhatsAppFromLightbox() {
    const item = dataWisataGlobal[currentLightboxIdx];
    if (!item) return;
    const text = `Halo! Cek destinasi wisata spektakuler di Tanggamus ini: *${item.name}* (Rating ⭐${item.rating}) - ${item.description}. Kunjungi: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
}

// =========================================
// KIRIM ULASAN PENGUNJUNG (SIMPAN KE DATABASE!)
// =========================================
function openReviewModal() {
    document.getElementById('reviewModal')?.classList.add('active');
}

function closeReviewModal() {
    document.getElementById('reviewModal')?.classList.remove('active');
}

async function handleReviewSubmit(e) {
    e.preventDefault();
    const author = document.getElementById('revAuthor').value.trim();
    const city = document.getElementById('revCity').value.trim();
    const rating = parseInt(document.getElementById('revStars').value, 10);
    const comment = document.getElementById('revText').value.trim();

    if (!author || !city || !comment) return;

    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ author, city, rating, comment })
        });
        const result = await response.json();

        if (result.success) {
            closeReviewModal();
            document.getElementById('reviewForm').reset();
            showToast('✨ Ulasan kamu berhasil dikirim & tersimpan di database!');

            // Sisipkan ulasan ke daftar ulasan langsung
            const grid = document.getElementById('testimonialGrid');
            if (grid) {
                const cardHTML = `
                <div class="testimonial-card">
                    <div class="testimonial-stars">${'⭐'.repeat(rating)}</div>
                    <p class="testimonial-text">"${comment}"</p>
                    <div class="testimonial-author">
                        <div class="author-avatar">${result.data.avatar || 'US'}</div>
                        <div>
                            <div class="author-name">${author}</div>
                            <div class="author-origin">📍 ${city}</div>
                        </div>
                        <div class="author-verified">✓</div>
                    </div>
                </div>`;
                grid.insertAdjacentHTML('afterbegin', cardHTML);
            }
        } else {
            showToast('❌ ' + (result.message || 'Gagal mengirim ulasan'));
        }
    } catch (err) {
        console.error('Submit review error:', err);
        showToast('⚠️ Gagal mengirim ulasan ke database.');
    }
}

// =========================================
// KALKULATOR ESTIMASI BIAYA
// =========================================
function calculateTripBudget() {
    const days = Math.max(1, parseInt(document.getElementById('calcDays')?.value || '2', 10));
    const people = Math.max(1, parseInt(document.getElementById('calcPeople')?.value || '2', 10));
    const stay = parseInt(document.getElementById('calcStay')?.value || '150000', 10);
    const trans = parseInt(document.getElementById('calcTrans')?.value || '75000', 10);

    const total = (people * 75000 * days) + (people * 20000 * days) + (stay * (days > 1 ? days - 1 : 1)) + (trans * days);
    const perPerson = Math.round(total / people);

    const resTotal = document.getElementById('resTotalBudget');
    const resPerson = document.getElementById('resPerPerson');
    if (resTotal) resTotal.textContent = formatMataUang(total);
    if (resPerson) resPerson.textContent = `${formatMataUang(perPerson)} / orang`;
}

// FAQ Accordion
function toggleFaq(btn) {
    if (!btn) return;
    const item = btn.parentElement;
    const isAct = item.classList.contains('active');
    document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('active'));
    if (!isAct) item.classList.add('active');
}

// Inisialisasi awal DOM
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    muatDataWisata();
    initWeatherSection();
    calculateTripBudget();
    updateHUD();
    drawWheel();
    setTimeout(initWisataMap, 300);

    // Event controls mini game
    document.getElementById('btnStartGame')?.addEventListener('click', startDolphinGame);
    document.getElementById('btnRestartGame')?.addEventListener('click', startDolphinGame);
    if (dolphinCanvas) {
        dolphinCanvas.addEventListener('mousedown', triggerDolphinJump);
        dolphinCanvas.addEventListener('touchstart', e => { e.preventDefault(); triggerDolphinJump(); }, { passive: false });
    }
    document.getElementById('mobileTapBtn')?.addEventListener('click', triggerDolphinJump);
    window.addEventListener('keydown', e => {
        if (e.code === 'Space' && isDolphinRunning) {
            e.preventDefault();
            triggerDolphinJump();
        }
    });

    document.getElementById('btnStartQuiz')?.addEventListener('click', startExplorerQuiz);
    document.getElementById('btnRestartQuiz')?.addEventListener('click', startExplorerQuiz);
    document.getElementById('btnSpinWheel')?.addEventListener('click', spinWheel);

    // Mode tab mini game
    document.querySelectorAll('.game-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.game-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const mode = tab.dataset.game;
            document.querySelectorAll('.game-view-panel').forEach(p => p.classList.remove('active'));
            if (mode === 'dolphin') document.getElementById('panelGameDolphin')?.classList.add('active');
            if (mode === 'quiz') document.getElementById('panelGameQuiz')?.classList.add('active');
            if (mode === 'wheel') {
                document.getElementById('panelGameWheel')?.classList.add('active');
                drawWheel();
            }
        });
    });

    // Spotlight Input Events
    const input = document.getElementById('spotlightInput');
    if (input) {
        input.addEventListener('input', e => renderSpotlightResults(e.target.value));
        input.addEventListener('keydown', e => {
            const items = document.querySelectorAll('.spotlight-item');
            if (items.length === 0) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                spotlightFocusedIndex = (spotlightFocusedIndex + 1) % items.length;
                items.forEach((it, i) => it.classList.toggle('focused', i === spotlightFocusedIndex));
                items[spotlightFocusedIndex]?.scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                spotlightFocusedIndex = (spotlightFocusedIndex - 1 + items.length) % items.length;
                items.forEach((it, i) => it.classList.toggle('focused', i === spotlightFocusedIndex));
                items[spotlightFocusedIndex]?.scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'Enter') {
                if (spotlightFocusedIndex >= 0 && items[spotlightFocusedIndex]) {
                    e.preventDefault();
                    items[spotlightFocusedIndex].click();
                }
            }
        });
    }

    // PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        });
    }
});

// Ekspor fungsi ke window untuk inline HTML onclick
window.bukaDetail = bukaDetail;
window.resetFilters = resetFilters;
window.toggleWishlist = toggleWishlist;
window.toggleAmbientAudio = toggleAmbientAudio;
window.toggleLanguage = toggleLanguage;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.navigateLightbox = navigateLightbox;
window.shareToWhatsAppFromLightbox = shareToWhatsAppFromLightbox;
window.openReviewModal = openReviewModal;
window.closeReviewModal = closeReviewModal;
window.handleReviewSubmit = handleReviewSubmit;
window.calculateTripBudget = calculateTripBudget;
window.toggleFaq = toggleFaq;
window.focusDestinationOnMap = focusDestinationOnMap;
window.openSpotlightSearch = openSpotlightSearch;
window.closeSpotlightSearch = closeSpotlightSearch;
window.toggleAudioPopover = toggleAudioPopover;
window.selectAmbienceSound = selectAmbienceSound;
window.stopAmbienceSound = stopAmbienceSound;
