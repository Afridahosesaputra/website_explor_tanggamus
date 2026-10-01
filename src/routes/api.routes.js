const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const destinationController = require('../controllers/destination.controller');
const reviewController = require('../controllers/review.controller');

// --- DESTINATIONS API ---
router.get('/destinations', destinationController.getAllDestinations);
router.get('/destinations/:id', destinationController.getDestinationById);
router.post('/destinations', destinationController.createDestination);
router.put('/destinations/:id', destinationController.updateDestination);
router.delete('/destinations/:id', destinationController.deleteDestination);

// --- REVIEWS / TESTIMONIALS API ---
router.get('/reviews', reviewController.getAllReviews);
router.post('/reviews', reviewController.createReview);

// --- CULINARY API ---
router.get('/culinary', async (req, res) => {
  try {
    const culinary = await prisma.culinary.findMany();
    res.json({ success: true, data: culinary });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat kuliner' });
  }
});

// --- WEATHER API ---
router.get('/weather', async (req, res) => {
  try {
    const list = await prisma.weatherInfo.findMany();
    const parsed = list.map(w => ({
      ...w,
      recDestinations: JSON.parse(w.recDestinations || '[]'),
      hourly: JSON.parse(w.hourlyJson || '[]'),
      daily: JSON.parse(w.dailyJson || '[]')
    }));
    res.json({ success: true, data: parsed });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat data cuaca' });
  }
});

router.get('/weather/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const weather = await prisma.weatherInfo.findUnique({
      where: { regionSlug: slug }
    });
    if (!weather) {
      return res.status(404).json({ success: false, message: 'Wilayah cuaca tidak ditemukan' });
    }
    res.json({
      success: true,
      data: {
        ...weather,
        recDestinations: JSON.parse(weather.recDestinations || '[]'),
        hourly: JSON.parse(weather.hourlyJson || '[]'),
        daily: JSON.parse(weather.dailyJson || '[]')
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat cuaca wilayah' });
  }
});

// --- STATS API ---
router.get('/stats', async (req, res) => {
  try {
    const totalDest = await prisma.destination.count();
    const totalReviews = await prisma.review.count();
    const categoriesCount = await prisma.category.count();
    const avgRatingAgg = await prisma.destination.aggregate({
      _avg: { rating: true }
    });

    res.json({
      success: true,
      data: {
        totalDestinations: totalDest,
        totalReviews,
        categoriesCount,
        averageRating: Number(avgRatingAgg._avg.rating || 4.8).toFixed(1),
        visitorAnnual: '120K+'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat statistik' });
  }
});

// --- FAQ API ---
router.get('/faqs', async (req, res) => {
  try {
    const faqs = await prisma.faqItem.findMany({ orderBy: { order: 'asc' } });
    res.json({ success: true, data: faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat FAQ' });
  }
});

// --- EXPORT DATA DESTINASI (JSON & CSV) ---
router.get('/export/destinations', async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const destinations = await prisma.destination.findMany({ orderBy: { id: 'asc' } });

    if (format === 'csv') {
      const headers = ['ID', 'Kode', 'Nama Destinasi', 'Kategori', 'Harga Tiket (Rp)', 'Rating', 'Kecamatan', 'Lokasi', 'Jam Operasional', 'Waktu Terbaik', 'Latitude', 'Longitude'];
      const rows = destinations.map(d => [
        d.id,
        `"${d.code}"`,
        `"${(d.name || '').replace(/"/g, '""')}"`,
        `"${d.category}"`,
        d.ticketPrice,
        d.rating,
        `"${d.district || ''}"`,
        `"${(d.location || '').replace(/"/g, '""')}"`,
        `"${d.openHours || ''}"`,
        `"${d.bestTime || ''}"`,
        d.latitude,
        d.longitude
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="data-destinasi-tanggamus.csv"');
      return res.send(csvContent);
    }

    // Default: JSON export
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="data-destinasi-tanggamus.json"');
    res.send(JSON.stringify(destinations, null, 2));
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengekspor data: ' + error.message });
  }
});

// --- RESET DATABASE KE DATA AWAL (SEEDER) ---
router.post('/admin/reset-db', (req, res) => {
  const { exec } = require('child_process');
  exec('node prisma/seed.js', (error, stdout, stderr) => {
    if (error) {
      console.error('Reset DB error:', error, stderr);
      return res.status(500).json({ success: false, message: 'Gagal mereset database: ' + error.message });
    }
    console.log('Reset DB success:\n', stdout);
    res.json({ success: true, message: 'Database SQLite (dev.db) berhasil di-reset ke data awal!' });
  });
});

module.exports = router;
