const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌊 Memulai proses seeding database EKSPLOR TANGGAMUS...');

  // Bersihkan data lama jika ada
  await prisma.review.deleteMany({});
  await prisma.destination.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.culinary.deleteMany({});
  await prisma.weatherInfo.deleteMany({});
  await prisma.faqItem.deleteMany({});

  // 1. Kategori Wisata
  const categories = [
    { slug: 'Nongkrong', name: 'Nongkrong & Kafe', icon: '☕', description: 'Spot ngopi sejuk & kuliner malam khas pegunungan' },
    { slug: 'Pantai', name: 'Pantai Eksotis', icon: '🏖️', description: 'Nikmati keindahan pesisir samudra & gugusan karang megah' },
    { slug: 'Air Terjun', name: 'Air Terjun', icon: '💧', description: 'Kesegaran gemercik air alami di kaki pegunungan Tanggamus' },
    { slug: 'Alam', name: 'Wisata Alam', icon: '🌿', description: 'Jelajahi keanekaragaman flora, fauna & pesona lumba-lumba' },
    { slug: 'Petualangan', name: 'Petualangan', icon: '⛰️', description: 'Trekking hutan lumut & pendakian puncak Gunung Tanggamus' },
    { slug: 'Edukasi', name: 'Edukasi & Sejarah', icon: '📚', description: 'Belajar teknologi bendungan raksasa sambil berekreasi' },
    { slug: 'Taman Kota', name: 'Taman Kota', icon: '🏙️', description: 'Ruang terbuka hijau santai tepi pantai untuk keluarga' }
  ];

  for (const cat of categories) {
    await prisma.category.create({ data: cat });
  }
  console.log(`✅ Berhasil menambahkan ${categories.length} kategori wisata.`);

  // 2. Destinasi Wisata Tanggamus (10 Destinasi)
  const destinations = [
    {
      code: 'DST-01',
      name: 'Pantai Gigi Hiu (Pegadungan)',
      category: 'Pantai',
      location: 'Kecamatan Kelumbayan',
      district: 'Kelumbayan',
      description: 'Gugusan batu karang tajam yang artistik di tepi samudra. Fenomena alam yang langka ini menciptakan panorama unik dan menjadi spot foto paling ikonik di Tanggamus.',
      ticketPrice: 15000,
      rating: 4.8,
      reviewCount: 420,
      facilities: JSON.stringify(['Spot Foto Ikonik', 'Parkir Area', 'Toilet', 'Warung Makan', 'Pemandu Lokal']),
      image: 'gigi-hiu.jpg',
      isRecommended: true,
      latitude: -5.7533,
      longitude: 105.1052,
      bestTime: '16.00 - 18.00 WIB (Golden Hour)',
      openHours: '24 Jam'
    },
    {
      code: 'DST-02',
      name: 'Teluk Kiluan',
      category: 'Alam',
      location: 'Kecamatan Kelumbayan',
      district: 'Kelumbayan',
      description: 'Habitat alami lumba-lumba hidung botol di laut lepas. Ribuan lumba-lumba dapat disaksikan setiap pagi hari saat mereka bermain di perairan biru yang jernih.',
      ticketPrice: 20000,
      rating: 4.9,
      reviewCount: 680,
      facilities: JSON.stringify(['Sewa Perahu Cadik', 'Penginapan Homestay', 'Guide Lokal', 'Snorkeling', 'Kolam Laguna']),
      image: 'kiluan.jpg',
      isRecommended: true,
      latitude: -5.7867,
      longitude: 105.2155,
      bestTime: '06.00 - 09.00 WIB (Melihat Lumba-lumba)',
      openHours: '06.00 - 18.00 WIB'
    },
    {
      code: 'DST-03',
      name: 'Air Terjun Way Lalaan',
      category: 'Air Terjun',
      location: 'Kecamatan Kota Agung Timur',
      district: 'Kota Agung Timur',
      description: 'Air terjun bersejarah di kaki Gunung Tanggamus sejak zaman kolonial Belanda 1937. Dikelilingi hutan tropis lebat dengan udara sejuk dan kolam pemandian alami.',
      ticketPrice: 10000,
      rating: 4.5,
      reviewCount: 310,
      facilities: JSON.stringify(['Kamar Ganti & Bilas', 'Mushola', 'Kantin Kuliner', 'Area Bermain Anak', 'Spot Selfie']),
      image: 'way-lalaan.jpg',
      isRecommended: false,
      latitude: -5.4678,
      longitude: 104.7214,
      bestTime: '08.00 - 15.00 WIB',
      openHours: '07.30 - 17.00 WIB'
    },
    {
      code: 'DST-04',
      name: 'Bendungan Batutegi',
      category: 'Edukasi',
      location: 'Kecamatan Air Naningan',
      district: 'Air Naningan',
      description: 'Bendungan terbesar di Asia Tenggara pada masanya dengan panorama perbukitan hijau dan danau air biru yang menakjubkan. Menjadi pusat PLTA dan pengendali banjir.',
      ticketPrice: 5000,
      rating: 4.4,
      reviewCount: 290,
      facilities: JSON.stringify(['Rest Area Puncak', 'Spot Foto Dermaga', 'Perahu Wisata', 'Parkir Luas', 'Warung Ikan']),
      image: 'batutegi.jpg',
      isRecommended: false,
      latitude: -5.1633,
      longitude: 104.7933,
      bestTime: '08.00 - 16.00 WIB',
      openHours: '07.00 - 17.30 WIB'
    },
    {
      code: 'DST-05',
      name: 'Taman Wisata Muara Indah',
      category: 'Taman Kota',
      location: 'Kecamatan Kota Agung',
      district: 'Kota Agung',
      description: 'Ruang terbuka hijau pesisir dengan landmark patung lumba-lumba raksasa. Menghadap langsung Teluk Semaka, sempurna untuk bersantai menikmati senja bersama keluarga.',
      ticketPrice: 5000,
      rating: 4.2,
      reviewCount: 350,
      facilities: JSON.stringify(['Jogging Track', 'Sentra Kuliner Pesisir', 'Taman Bermain', 'Gazebo Pantai', 'Toilet']),
      image: 'muara-indah.jpg',
      isRecommended: false,
      latitude: -5.4989,
      longitude: 104.6225,
      bestTime: '16.30 - 18.30 WIB (Sunset)',
      openHours: '06.00 - 21.00 WIB'
    },
    {
      code: 'DST-06',
      name: 'Gunung Tanggamus',
      category: 'Petualangan',
      location: 'Kecamatan Gisting',
      district: 'Gisting',
      description: 'Jalur pendakian hutan lumut (mossy forest) yang magis dengan ketinggian 2.102 mdpl. Di puncaknya tersaji pemandangan spektakuler kaldera dan birunya Teluk Semaka.',
      ticketPrice: 15000,
      rating: 4.7,
      reviewCount: 520,
      facilities: JSON.stringify(['Basecamp Registrasi', 'Pos Pendakian 1-3', 'Mata Air Alami', 'Jasa Porter & Guide']),
      image: 'gunung-tanggamus.jpg',
      isRecommended: true,
      latitude: -5.4297,
      longitude: 104.6756,
      bestTime: '05.00 - 07.00 WIB (Sunrise Puncak)',
      openHours: '24 Jam (Wajib Lapor Basecamp)'
    },
    {
      code: 'DST-07',
      name: 'Rest Area Gisting & Kuliner Malam',
      category: 'Nongkrong',
      location: 'Kecamatan Gisting',
      district: 'Gisting',
      description: 'Pusat nongkrong terfavorit di Gisting dengan hawa sejuk pegunungan, aneka kuliner lezat, dan seduhan kopi Robusta Tanggamus yang harum.',
      ticketPrice: 0,
      rating: 4.8,
      reviewCount: 610,
      facilities: JSON.stringify(['Area Duduk Santai', 'Sentra Kopi Robusta', 'Food Stalls', 'Parkir Luas', 'Mushola Bersih']),
      image: 'rest-area-gisting.jpg',
      isRecommended: true,
      latitude: -5.3956,
      longitude: 104.7292,
      bestTime: '17.00 - 23.00 WIB',
      openHours: '15.00 - 24.00 WIB'
    },
    {
      code: 'DST-08',
      name: 'Bukit Idaman Gisting & Cafe Sunset',
      category: 'Nongkrong',
      location: 'Kecamatan Gisting',
      district: 'Gisting',
      description: 'Spot nongkrong estetik di perbukitan dengan hamparan taman bunga aneka warna dan latar belakang megah Gunung Tanggamus saat langit keemasan.',
      ticketPrice: 10000,
      rating: 4.7,
      reviewCount: 430,
      facilities: JSON.stringify(['Outdoor Deck Cafe', 'Spot Foto Bunga', 'Gardu Pandang', 'Wi-Fi Cepat', 'Area Parkir Luas']),
      image: 'bukit-idaman.jpg',
      isRecommended: true,
      latitude: -5.3881,
      longitude: 104.7345,
      bestTime: '16.00 - 18.30 WIB',
      openHours: '08.00 - 20.00 WIB'
    },
    {
      code: 'DST-09',
      name: 'Butterfly Garden Cafe & Eatery',
      category: 'Nongkrong',
      location: 'Kecamatan Gisting',
      district: 'Gisting',
      description: 'Kafe kekinian berkonsep rumah kaca botani modern. Menyajikan mocktail biru menyegarkan, artisan coffee, dan aneka camilan western & nusantara.',
      ticketPrice: 5000,
      rating: 4.6,
      reviewCount: 280,
      facilities: JSON.stringify(['Glasshouse Indoor AC', 'Taman Outdoor Rindang', 'Wi-Fi Cepat', 'Stop Kontak Meja', 'Live Music Weekend']),
      image: 'butterfly-cafe.jpg',
      isRecommended: false,
      latitude: -5.3925,
      longitude: 104.7210,
      bestTime: '14.00 - 21.00 WIB',
      openHours: '10.00 - 22.00 WIB'
    },
    {
      code: 'DST-10',
      name: 'Dam Margo Tirto (Kawasan Ngopi Sore)',
      category: 'Nongkrong',
      location: 'Kecamatan Gisting',
      district: 'Gisting',
      description: 'Telaga bersejarah era kolonial yang disulap menjadi spot nongkrong santai tepi air dengan deretan gazebo kayu dan kedai kopi bambu.',
      ticketPrice: 5000,
      rating: 4.5,
      reviewCount: 240,
      facilities: JSON.stringify(['Gazebo Tepi Air', 'Perahu Bebek Gowes', 'Kedai Kopi & Camilan', 'Spot Mancing Ikan', 'Parkir Motor/Mobil']),
      image: 'dam-margo-tirto.jpg',
      isRecommended: false,
      latitude: -5.3850,
      longitude: 104.7412,
      bestTime: '15.30 - 18.00 WIB',
      openHours: '07.00 - 18.00 WIB'
    }
  ];

  for (const dst of destinations) {
    await prisma.destination.create({ data: dst });
  }
  console.log(`✅ Berhasil menambahkan ${destinations.length} destinasi wisata Tanggamus.`);

  // 3. Kuliner Khas Tanggamus
  const culinaries = [
    {
      name: 'Seruit Tanggamus',
      category: 'Olahan Ikan Segar',
      priceRange: 'Rp 25.000 - Rp 45.000',
      location: 'Kota Agung & Gisting',
      description: 'Hidangan tradisi kebanggaan Lampung berupa ikan bakar/goreng segar disajikan dengan racikan sambal terasi tempoyak durian khas dan lalapan hijau segar.',
      image: 'seruit-lampung.jpg',
      tag: 'Paling Khas'
    },
    {
      name: 'Kopi Robusta Gisting',
      category: 'Minuman Khas Dataran Tinggi',
      priceRange: 'Rp 10.000 - Rp 25.000',
      location: 'Kecamatan Gisting',
      description: 'Kopi hitam aromatik berkarakter kuat dari biji kopi pilihan yang ditanam di dataran tinggi sejuk lereng Gunung Tanggamus.',
      image: 'kopi-gisting.jpg',
      tag: 'Kopi Juara'
    },
    {
      name: 'Gulai Taboh Pesisir',
      category: 'Kuah Santan Rempah',
      priceRange: 'Rp 20.000 - Rp 35.000',
      location: 'Rumah Makan Pesisir Kota Agung',
      description: 'Gulai bersantan kental berbumbu rempah kunyit & cabai berisi potongan ikan laut segar khas pesisir Teluk Semaka Kota Agung.',
      image: 'gulai-taboh.jpg',
      tag: 'Kuah Santan Gurih'
    },
    {
      name: 'Kue Sekubal & Keripik Tanggamus',
      category: 'Camilan Tradisional & Oleh-Oleh',
      priceRange: 'Rp 15.000 - Rp 30.000',
      location: 'Pusat Oleh-Oleh Gisting',
      description: 'Ketan kukus bungkus daun pisang legit bersantan gurih manis, bersanding renyahnya keripik pisang olahan khas Lampung.',
      image: 'sekubal-keripik.jpg',
      tag: 'Oleh-Oleh Khas'
    }
  ];

  for (const cul of culinaries) {
    await prisma.culinary.create({ data: cul });
  }
  console.log(`✅ Berhasil menambahkan ${culinaries.length} menu kuliner khas Tanggamus.`);

  // 4. Stasiun Cuaca Real-Time per Wilayah
  const weatherStations = [
    {
      regionSlug: 'kota-agung',
      regionName: 'Kota Agung',
      sub: 'Pusat & Muara Indah',
      temp: 29,
      feelsLike: 31,
      condition: 'Cerah Berawan',
      icon: '🌤️',
      humidity: 78,
      windSpeed: 12,
      rainChance: 15,
      uvIndex: '6 (Sedang)',
      recommendTitle: 'Kondisi Wisata Sangat Baik',
      recommendDesc: 'Cuaca sangat bersahabat! Kondisi ideal untuk eksplorasi pantai, menikmati pemandangan laut, dan kegiatan fotografi luar ruangan.',
      recDestinations: JSON.stringify(['Pantai Gigi Hiu', 'Teluk Kiluan', 'Muara Indah']),
      hourlyJson: JSON.stringify([
        { time: '11:00', temp: 29, icon: '🌤️', cond: 'Cerah Berawan' },
        { time: '13:00', temp: 31, icon: '☀️', cond: 'Cerah' },
        { time: '15:00', temp: 30, icon: '⛅', cond: 'Sebagian Berawan' },
        { time: '17:00', temp: 28, icon: '🌅', cond: 'Sunset Cerah' },
        { time: '19:00', temp: 26, icon: '🌙', cond: 'Malam Sejuk' },
        { time: '21:00', temp: 25, icon: '🌌', cond: 'Cerah Malam' }
      ]),
      dailyJson: JSON.stringify([
        { day: 'Hari Ini', high: 31, low: 24, icon: '🌤️', cond: 'Cerah Berawan' },
        { day: 'Besok', high: 32, low: 23, icon: '☀️', cond: 'Cerah Terang' },
        { day: 'Lusa', high: 30, low: 24, icon: '⛅', cond: 'Berawan' },
        { day: 'Jumat', high: 29, low: 23, icon: '🌦️', cond: 'Hujan Ringan Sore' },
        { day: 'Sabtu', high: 31, low: 24, icon: '🌤️', cond: 'Cerah Berawan' }
      ])
    },
    {
      regionSlug: 'kelumbayan',
      regionName: 'Kelumbayan',
      sub: 'Gigi Hiu & Kiluan',
      temp: 28,
      feelsLike: 30,
      condition: 'Cerah Berangin',
      icon: '🌊',
      humidity: 80,
      windSpeed: 16,
      rainChance: 10,
      uvIndex: '7 (Tinggi)',
      recommendTitle: 'Sempurna untuk Snorkeling & Perahu',
      recommendDesc: 'Ombak sedang tenang dan laut jernih. Peluang bertemu lumba-lumba di pagi hari sangat tinggi!',
      recDestinations: JSON.stringify(['Teluk Kiluan', 'Pantai Gigi Hiu', 'Laguna Dodo']),
      hourlyJson: JSON.stringify([
        { time: '11:00', temp: 28, icon: '🌊', cond: 'Angin Laut Lembut' },
        { time: '13:00', temp: 30, icon: '☀️', cond: 'Cerah Terik' },
        { time: '15:00', temp: 29, icon: '🌤️', cond: 'Cerah Berawan' },
        { time: '17:00', temp: 27, icon: '🌅', cond: 'Senja Indah' },
        { time: '19:00', temp: 25, icon: '🌙', cond: 'Malam Berbintang' }
      ]),
      dailyJson: JSON.stringify([
        { day: 'Hari Ini', high: 30, low: 23, icon: '🌊', cond: 'Angin Laut Segar' },
        { day: 'Besok', high: 31, low: 24, icon: '☀️', cond: 'Cerah Penuh' },
        { day: 'Lusa', high: 29, low: 23, icon: '🌤️', cond: 'Cerah Berawan' },
        { day: 'Jumat', high: 28, low: 22, icon: '⛅', cond: 'Berawan' },
        { day: 'Sabtu', high: 30, low: 23, icon: '🌊', cond: 'Kondisi Prima' }
      ])
    },
    {
      regionSlug: 'gisting',
      regionName: 'Gisting',
      sub: 'Gn. Tanggamus & Kafe',
      temp: 23,
      feelsLike: 23,
      condition: 'Sejuk Pegunungan',
      icon: '🌿',
      humidity: 85,
      windSpeed: 8,
      rainChance: 20,
      uvIndex: '5 (Sedang)',
      recommendTitle: 'Hawa Sejuk Mantap untuk Ngopi',
      recommendDesc: 'Suhu sejuk alami 23°C sangat pas untuk nongkrong di Bukit Idaman, Rest Area, dan kafe kaca.',
      recDestinations: JSON.stringify(['Gunung Tanggamus', 'Bukit Idaman', 'Rest Area Gisting', 'Dam Margo Tirto']),
      hourlyJson: JSON.stringify([
        { time: '11:00', temp: 24, icon: '🌿', cond: 'Sejuk Berawan' },
        { time: '13:00', temp: 25, icon: '⛅', cond: 'Berawan Tipis' },
        { time: '15:00', temp: 23, icon: '🌦️', cond: 'Gerimis Sejuk' },
        { time: '17:00', temp: 21, icon: '☕', cond: 'Kabut Sore' },
        { time: '19:00', temp: 19, icon: '🌌', cond: 'Dingin Pegunungan' }
      ]),
      dailyJson: JSON.stringify([
        { day: 'Hari Ini', high: 25, low: 18, icon: '🌿', cond: 'Sejuk Nyaman' },
        { day: 'Besok', high: 26, low: 17, icon: '🌤️', cond: 'Cerah Sejuk' },
        { day: 'Lusa', high: 24, low: 18, icon: '🌦️', cond: 'Hujan Ringan' },
        { day: 'Jumat', high: 25, low: 17, icon: '⛅', cond: 'Berawan' },
        { day: 'Sabtu', high: 26, low: 18, icon: '🌿', cond: 'Cerah Ceria' }
      ])
    },
    {
      regionSlug: 'air-naningan',
      regionName: 'Air Naningan',
      sub: 'Bendungan Batutegi',
      temp: 27,
      feelsLike: 28,
      condition: 'Cerah Alami',
      icon: '🏞️',
      humidity: 76,
      windSpeed: 10,
      rainChance: 12,
      uvIndex: '6 (Sedang)',
      recommendTitle: 'Panorama Air Bersinar Cerah',
      recommendDesc: 'Permukaan bendungan tenang dan langit cerah membentang luas. Waktu yang tepat untuk naik perahu wisata.',
      recDestinations: JSON.stringify(['Bendungan Batutegi', 'Dermaga Apung', 'Gardu Pandang']),
      hourlyJson: JSON.stringify([
        { time: '11:00', temp: 27, icon: '🏞️', cond: 'Cerah Cerah' },
        { time: '13:00', temp: 29, icon: '☀️', cond: 'Matahari Terang' },
        { time: '15:00', temp: 28, icon: '🌤️', cond: 'Cerah Berawan' },
        { time: '17:00', temp: 26, icon: '🌅', cond: 'Senja Waduk' }
      ]),
      dailyJson: JSON.stringify([
        { day: 'Hari Ini', high: 29, low: 22, icon: '🏞️', cond: 'Cerah Waduk' },
        { day: 'Besok', high: 30, low: 22, icon: '☀️', cond: 'Cerah Penuh' },
        { day: 'Lusa', high: 28, low: 21, icon: '⛅', cond: 'Berawan Teduh' },
        { day: 'Jumat', high: 27, low: 22, icon: '🌤️', cond: 'Cerah Nyaman' },
        { day: 'Sabtu', high: 29, low: 21, icon: '🏞️', cond: 'Ideal Liburan' }
      ])
    },
    {
      regionSlug: 'kota-agung-timur',
      regionName: 'Kota Agung Timur',
      sub: 'Air Terjun Way Lalaan',
      temp: 26,
      feelsLike: 27,
      condition: 'Segar Berembun',
      icon: '💧',
      humidity: 82,
      windSpeed: 9,
      rainChance: 18,
      uvIndex: '5 (Sedang)',
      recommendTitle: 'Debit Air Jernih & Menyegarkan',
      recommendDesc: 'Aliran air terjun stabil jernih dan suasana hutan sejuk rindang. Segar untuk mandi atau piknik santai.',
      recDestinations: JSON.stringify(['Air Terjun Way Lalaan 1', 'Way Lalaan 2', 'Taman Agrowisata']),
      hourlyJson: JSON.stringify([
        { time: '11:00', temp: 26, icon: '💧', cond: 'Segar Rindang' },
        { time: '13:00', temp: 28, icon: '🌤️', cond: 'Matahari Tembus Daun' },
        { time: '15:00', temp: 27, icon: '💧', cond: 'Embun Segar' },
        { time: '17:00', temp: 25, icon: '⛅', cond: 'Sore Teduh' }
      ]),
      dailyJson: JSON.stringify([
        { day: 'Hari Ini', high: 28, low: 22, icon: '💧', cond: 'Segar Alami' },
        { day: 'Besok', high: 29, low: 21, icon: '🌤️', cond: 'Cerah Teduh' },
        { day: 'Lusa', high: 27, low: 22, icon: '🌦️', cond: 'Hujan Rintik' },
        { day: 'Jumat', high: 28, low: 21, icon: '💧', cond: 'Jernih Segar' },
        { day: 'Sabtu', high: 29, low: 22, icon: '🌤️', cond: 'Sangat Nyaman' }
      ])
    }
  ];

  for (const ws of weatherStations) {
    await prisma.weatherInfo.create({ data: ws });
  }
  console.log(`✅ Berhasil menambahkan ${weatherStations.length} stasiun cuaca Tanggamus.`);

  // 5. Ulasan Pengunjung Nyata (Testimonial)
  const reviews = [
    {
      author: 'Rina Sari',
      city: 'Jakarta',
      rating: 5,
      comment: 'Pantai Gigi Hiu benar-benar memukau! Batu karangnya unik seperti formasi kristal raksasa yang tidak ada duanya. Wajib dikunjungi saat ke Lampung!',
      avatar: 'RS',
      isVerified: true
    },
    {
      author: 'Budi Hartono',
      city: 'Bandung',
      rating: 5,
      comment: 'Teluk Kiluan memberikan pengalaman melihat ratusan lumba-lumba liar yang tidak terlupakan. Airnya biru jernih, pemandangannya surgawi. Pasti akan kembali!',
      avatar: 'BH',
      isVerified: true
    },
    {
      author: 'Andi Setiawan',
      city: 'Yogyakarta',
      rating: 5,
      comment: 'Pendakian Gunung Tanggamus sungguh menantang lewat jalur hutan lumut yang eksotis. Pemandangan dari puncaknya luar biasa magis.',
      avatar: 'AS',
      isVerified: true
    },
    {
      author: 'Maya Novitasari',
      city: 'Bandar Lampung',
      rating: 5,
      comment: 'Rest Area Gisting asyik banget buat nongkrong malam! Udaranya dingin menusuk, minum kopi robusta panas ditemani pisang goreng keju.',
      avatar: 'MN',
      isVerified: true
    }
  ];

  for (const rev of reviews) {
    await prisma.review.create({ data: rev });
  }
  console.log(`✅ Berhasil menambahkan ${reviews.length} ulasan pengunjung.`);

  // 6. FAQ Wisata
  const faqs = [
    {
      question: 'Kapan waktu paling ideal untuk melihat lumba-lumba di Teluk Kiluan?',
      answer: 'Waktu terbaik adalah saat fajar pukul 06.00 – 09.00 WIB pada musim kemarau (April–Oktober). Pada jam tersebut lumba-lumba liar hidung botol sangat aktif bermunculan dekat perahu nelayan.',
      category: 'Destinasi',
      order: 1
    },
    {
      question: 'Bagaimana kondisi akses jalan menuju Pantai Gigi Hiu?',
      answer: 'Rute utama lewat Kelumbayan kini sudah teraspal mulus hingga mendekati area pantai. Untuk 2 km terakhir disarankan menggunakan motor atau mobil ber-ground clearance tinggi (SUV/4WD).',
      category: 'Akses & Rute',
      order: 2
    },
    {
      question: 'Bagaimana kondisi sinyal seluler di destinasi Tanggamus?',
      answer: 'Di daerah Gisting, Kota Agung, dan Batutegi sinyal 4G sangat lancar. Di daerah pesisir seperti Kiluan dan Gigi Hiu sinyal provider utama tetap tersedia di titik pemukiman warga.',
      category: 'Fasilitas',
      order: 3
    },
    {
      question: 'Apa kuliner khas Tanggamus yang paling wajib dicoba?',
      answer: 'Wajib mencicipi Seruit Lampung (ikan bakar segar dengan sambal tempoyak durian), Gulai Taboh Pesisir Kota Agung, Kopi Robusta Gisting hangat, serta kue Sekubal ketan tradisional.',
      category: 'Kuliner',
      order: 4
    }
  ];

  for (const faq of faqs) {
    await prisma.faqItem.create({ data: faq });
  }
  console.log(`✅ Berhasil menambahkan ${faqs.length} daftar FAQ.`);

  console.log('🎉 Seeding database EKSPLOR TANGGAMUS selesai dengan sukses!');
}

main()
  .catch((e) => {
    console.error('❌ Gagal melakukan seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
