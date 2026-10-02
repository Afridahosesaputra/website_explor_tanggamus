const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

// Helper untuk parse data JSON dari Prisma SQLite
function parseDestinations(list) {
  return list.map(d => ({
    ...d,
    facilities: typeof d.facilities === 'string' ? JSON.parse(d.facilities || '[]') : d.facilities
  }));
}

function parseWeather(list) {
  return list.map(w => ({
    ...w,
    recDestinations: JSON.parse(w.recDestinations || '[]'),
    hourly: JSON.parse(w.hourlyJson || '[]'),
    daily: JSON.parse(w.dailyJson || '[]')
  }));
}

// 1. HALAMAN BERANDA UTAMA (HOME)
router.get('/', async (req, res) => {
  try {
    const destinations = await prisma.destination.findMany({ orderBy: { id: 'asc' } });
    const categories = await prisma.category.findMany();
    const weatherList = await prisma.weatherInfo.findMany();

    const featuredDestination = destinations.find(d => d.isRecommended) || destinations[0];

    res.render('index', {
      title: 'Eksplor Tanggamus — Surga Wisata Lampung',
      currentPage: 'home',
      destinations: parseDestinations(destinations),
      categories,
      weatherList: parseWeather(weatherList),
      featuredDestination: {
        ...featuredDestination,
        facilities: typeof featuredDestination.facilities === 'string' ? JSON.parse(featuredDestination.facilities || '[]') : featuredDestination.facilities
      }
    });
  } catch (error) {
    console.error('Error rendering homepage:', error);
    res.status(500).send('Terjadi kesalahan memuat beranda: ' + error.message);
  }
});

// 2. HALAMAN KATALOG DESTINASI (TERPISAH)
router.get('/destinasi', async (req, res) => {
  try {
    const destinations = await prisma.destination.findMany({ orderBy: { id: 'asc' } });
    const categories = await prisma.category.findMany();

    res.render('pages/destinasi', {
      title: 'Katalog Destinasi Wisata Tanggamus — Eksplor Tanggamus',
      currentPage: 'destinasi',
      destinations: parseDestinations(destinations),
      categories
    });
  } catch (error) {
    console.error('Error rendering destinasi page:', error);
    res.status(500).send('Gagal memuat halaman destinasi: ' + error.message);
  }
});

// 2b. HALAMAN DETAIL DESTINASI TUNGGAL (DEDICATED PERMALINK)
router.get('/destinasi/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(404).render('404', { title: 'Destinasi Tidak Ditemukan' });
    }

    const destination = await prisma.destination.findUnique({
      where: { id },
      include: {
        reviews: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!destination) {
      return res.status(404).render('404', { title: 'Destinasi Tidak Ditemukan' });
    }

    // Ambil destinasi serupa (kategori sama atau rating tinggi)
    const relatedDestinations = await prisma.destination.findMany({
      where: {
        id: { not: id },
        OR: [
          { category: destination.category },
          { isRecommended: true }
        ]
      },
      take: 4
    });

    // Ambil cuaca untuk kecamatan ini jika ada
    const weatherList = await prisma.weatherInfo.findMany();
    const weatherMatch = weatherList.find(w => 
      w.regionName.toLowerCase().includes((destination.district || '').toLowerCase()) ||
      destination.location.toLowerCase().includes(w.regionName.toLowerCase())
    ) || weatherList[0];

    const parsedDest = {
      ...destination,
      facilities: typeof destination.facilities === 'string' ? JSON.parse(destination.facilities || '[]') : destination.facilities
    };

    res.render('pages/detail-destinasi', {
      title: `${destination.name} — Wisata Tanggamus`,
      currentPage: 'destinasi',
      destination: parsedDest,
      relatedDestinations,
      weather: weatherMatch
    });
  } catch (error) {
    console.error('Error rendering detail destinasi:', error);
    res.status(500).send('Gagal memuat detail destinasi: ' + error.message);
  }
});

// 3. HALAMAN PETA WISATA INTERAKTIF (TERPISAH)
router.get('/peta', async (req, res) => {
  try {
    const destinations = await prisma.destination.findMany({ orderBy: { id: 'asc' } });

    res.render('pages/peta', {
      title: 'Peta Wisata Interaktif Tanggamus — Leaflet GIS',
      currentPage: 'peta',
      destinations: parseDestinations(destinations)
    });
  } catch (error) {
    console.error('Error rendering peta page:', error);
    res.status(500).send('Gagal memuat peta: ' + error.message);
  }
});

// 4. HALAMAN CUACA REAL-TIME (TERPISAH)
router.get('/cuaca', async (req, res) => {
  try {
    const weatherList = await prisma.weatherInfo.findMany();

    res.render('pages/cuaca', {
      title: 'Prakiraan Cuaca Real-Time Tanggamus — Satelit Meteorologi',
      currentPage: 'cuaca',
      weatherList: parseWeather(weatherList)
    });
  } catch (error) {
    console.error('Error rendering cuaca page:', error);
    res.status(500).send('Gagal memuat cuaca: ' + error.message);
  }
});

// 5. HALAMAN WISATA KULINER KHAS (TERPISAH)
router.get('/kuliner', async (req, res) => {
  try {
    const culinaries = await prisma.culinary.findMany();

    res.render('pages/kuliner', {
      title: 'Wisata Kuliner Khas Tanggamus — Seruit & Kopi Robusta',
      currentPage: 'kuliner',
      culinaries
    });
  } catch (error) {
    console.error('Error rendering kuliner page:', error);
    res.status(500).send('Gagal memuat kuliner: ' + error.message);
  }
});

// 6. HALAMAN KALKULATOR BIAYA WISATA (TERPISAH)
router.get('/biaya', async (req, res) => {
  try {
    res.render('pages/biaya', {
      title: 'Kalkulator Estimasi Biaya Wisata — Tanggamus Budget Planner',
      currentPage: 'biaya'
    });
  } catch (error) {
    console.error('Error rendering biaya page:', error);
    res.status(500).send('Gagal memuat kalkulator biaya: ' + error.message);
  }
});

// 7. HALAMAN ZONA MINI GAME ARCADE (TERPISAH)
router.get('/game', async (req, res) => {
  try {
    res.render('pages/game', {
      title: 'Zona Permainan & Kuis Tanggamus — Arcade Quest',
      currentPage: 'game'
    });
  } catch (error) {
    console.error('Error rendering game page:', error);
    res.status(500).send('Gagal memuat game: ' + error.message);
  }
});

// 8. HALAMAN PUSAT BANTUAN & FAQ (TERPISAH)
router.get('/faq', async (req, res) => {
  try {
    const faqs = await prisma.faqItem.findMany({ orderBy: { order: 'asc' } });

    res.render('pages/faq', {
      title: 'Pusat Bantuan & FAQ Wisata Tanggamus',
      currentPage: 'faq',
      faqs
    });
  } catch (error) {
    console.error('Error rendering faq page:', error);
    res.status(500).send('Gagal memuat FAQ: ' + error.message);
  }
});

// 9. HALAMAN ULASAN & TESTIMONIAL (TERPISAH)
router.get('/ulasan', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.render('pages/ulasan', {
      title: 'Ulasan & Testimonial Pengunjung Tanggamus',
      currentPage: 'ulasan',
      reviews
    });
  } catch (error) {
    console.error('Error rendering ulasan page:', error);
    res.status(500).send('Gagal memuat ulasan: ' + error.message);
  }
});

// Middleware Proteksi Admin
function checkAdminAuth(req, res, next) {
  const cookies = req.headers.cookie || '';
  if (cookies.includes('admin_auth=authenticated_tanggamus_2026')) {
    return next();
  }
  return res.redirect('/login?error=auth_required');
}

// 10. HALAMAN ITINERARY & SMART TRIP PLANNER
router.get('/itinerary', async (req, res) => {
  try {
    const destinations = await prisma.destination.findMany({ orderBy: { rating: 'desc' } });
    const culinaries = await prisma.culinary.findMany();

    res.render('pages/itinerary', {
      title: 'Smart Itinerary Planner Tanggamus — Rencana Perjalanan Wisata',
      currentPage: 'itinerary',
      destinations: parseDestinations(destinations),
      culinaries
    });
  } catch (error) {
    console.error('Error rendering itinerary page:', error);
    res.status(500).send('Gagal memuat rencana perjalanan: ' + error.message);
  }
});

// 11. HALAMAN LOGIN ADMIN
router.get('/login', (req, res) => {
  const cookies = req.headers.cookie || '';
  if (cookies.includes('admin_auth=authenticated_tanggamus_2026')) {
    return res.redirect('/admin');
  }
  const error = req.query.error || '';
  const isLogout = req.query.logout === '1';

  res.render('pages/login', {
    title: 'Login Pengelola Database — Eksplor Tanggamus',
    currentPage: 'admin',
    error,
    isLogout
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const validUser = process.env.ADMIN_USER || 'admin';
  const validPass = process.env.ADMIN_PASS || 'tanggamus2026';

  if (username === validUser && password === validPass) {
    res.setHeader('Set-Cookie', 'admin_auth=authenticated_tanggamus_2026; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400');
    return res.redirect('/admin');
  }

  res.render('pages/login', {
    title: 'Login Pengelola Database — Eksplor Tanggamus',
    currentPage: 'admin',
    error: 'invalid_credentials',
    isLogout: false
  });
});

router.get('/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'admin_auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.redirect('/login?logout=1');
});

// 12. HALAMAN ADMIN MANAJEMEN DATABASE (DIPROTEKSI LOGIN)
router.get('/admin', checkAdminAuth, async (req, res) => {
  try {
    const destinations = await prisma.destination.findMany({
      orderBy: { id: 'desc' },
      include: { reviews: true }
    });
    const categories = await prisma.category.findMany();
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: { destination: true }
    });

    res.render('admin', {
      title: 'Pusat Manajemen Database Wisata — Eksplor Tanggamus',
      currentPage: 'admin',
      destinations,
      categories,
      reviews
    });
  } catch (error) {
    console.error('Error rendering admin page:', error);
    res.status(500).send('Gagal memuat halaman admin: ' + error.message);
  }
});

module.exports = router;
