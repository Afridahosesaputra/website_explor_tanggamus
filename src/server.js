const express = require('express');
const path = require('path');
require('dotenv').config();

const indexRoutes = require('./routes/index.routes');
const apiRoutes = require('./routes/api.routes');
const prisma = require('./config/db');

const app = express();
let currentPort = Number(process.env.PORT) || 3002;

// 1. Konfigurasi View Engine EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// 2. Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 3. Global Template Helpers & Variables
app.use((req, res, next) => {
  res.locals.appName = 'Eksplor Tanggamus';
  res.locals.tagline = 'Surga Wisata Lampung';
  res.locals.creator = 'HOSEE';
  res.locals.formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number || 0);
  };
  res.locals.formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  next();
});

// 4. Mount Routes
app.use('/', indexRoutes);
app.use('/api', apiRoutes);

// 5. 404 Route Handler
app.use((req, res) => {
  res.status(404).render('404', {
    title: '404 - Halaman Tidak Ditemukan'
  });
});

// 6. Graceful Shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('\n🛑 Server Express & Database Prisma Tanggamus ditutup.');
  process.exit(0);
});

// 7. Start Server with Auto Port Fallback
function startServer(port) {
  const server = app.listen(port, () => {
    console.log('=======================================================');
    console.log('🌊 PLATFORM PARIWISATA "EKSPLOR TANGGAMUS"');
    console.log('🎨 TEMA: MONOKROMATIK BIRU ULTRA MEWAH (1 WARNA BIRU)');
    console.log('💾 DATABASE: SQLite (dev.db) + Prisma ORM');
    console.log(`🌐 Akses Website: http://localhost:${port}`);
    console.log(`🛠️ Panel Manajemen: http://localhost:${port}/admin`);
    console.log('=======================================================');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${port} sedang digunakan. Mencoba port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('❌ Server error:', err);
    }
  });
}

startServer(currentPort);
