const prisma = require('../config/db');

// Ambil semua destinasi wisata dengan opsional filter kategori & pencarian
exports.getAllDestinations = async (req, res) => {
  try {
    const { category, search, sort, maxPrice } = req.query;

    let whereClause = {};

    if (category && category !== 'Semua') {
      whereClause.category = category;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { location: { contains: search } },
        { description: { contains: search } }
      ];
    }

    if (maxPrice) {
      whereClause.ticketPrice = { lte: Number(maxPrice) };
    }

    let orderBy = { id: 'asc' };
    if (sort === 'rating-desc') orderBy = { rating: 'desc' };
    else if (sort === 'rating-asc') orderBy = { rating: 'asc' };
    else if (sort === 'price-asc') orderBy = { ticketPrice: 'asc' };
    else if (sort === 'price-desc') orderBy = { ticketPrice: 'desc' };
    else if (sort === 'name-asc') orderBy = { name: 'asc' };
    else if (sort === 'recommend') orderBy = [{ isRecommended: 'desc' }, { rating: 'desc' }];

    const destinations = await prisma.destination.findMany({
      where: whereClause,
      orderBy: orderBy,
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    const parsed = destinations.map(d => ({
      ...d,
      facilities: typeof d.facilities === 'string' ? JSON.parse(d.facilities || '[]') : d.facilities
    }));

    res.json({
      success: true,
      total: parsed.length,
      data: parsed
    });
  } catch (error) {
    console.error('Error fetching destinations:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat destinasi wisata' });
  }
};

// Ambil detail 1 destinasi berdasarkan ID
exports.getDestinationById = async (req, res) => {
  try {
    const { id } = req.params;
    const destination = await prisma.destination.findUnique({
      where: { id: Number(id) },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!destination) {
      return res.status(404).json({ success: false, message: 'Destinasi tidak ditemukan' });
    }

    destination.facilities = typeof destination.facilities === 'string'
      ? JSON.parse(destination.facilities || '[]')
      : destination.facilities;

    res.json({ success: true, data: destination });
  } catch (error) {
    console.error('Error detail destination:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat detail destinasi' });
  }
};

// Tambah destinasi baru (Admin / API)
exports.createDestination = async (req, res) => {
  try {
    const {
      name,
      category,
      location,
      district,
      description,
      ticketPrice,
      rating,
      facilities,
      image,
      isRecommended,
      latitude,
      longitude,
      bestTime,
      openHours
    } = req.body;

    const count = await prisma.destination.count();
    const code = `DST-${String(count + 1).padStart(2, '0')}`;

    const newDest = await prisma.destination.create({
      data: {
        code,
        name,
        category: category || 'Alam',
        location: location || 'Tanggamus, Lampung',
        district: district || 'Kota Agung',
        description: description || '',
        ticketPrice: Number(ticketPrice) || 0,
        rating: Number(rating) || 4.5,
        facilities: Array.isArray(facilities) ? JSON.stringify(facilities) : (typeof facilities === 'string' ? facilities : '[]'),
        image: image || 'batutegi.jpg',
        isRecommended: Boolean(isRecommended),
        latitude: Number(latitude) || -5.4678,
        longitude: Number(longitude) || 104.7214,
        bestTime: bestTime || 'Pagi - Sore',
        openHours: openHours || '08.00 - 17.00 WIB'
      }
    });

    res.status(201).json({ success: true, message: 'Destinasi berhasil ditambahkan', data: newDest });
  } catch (error) {
    console.error('Error creating destination:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan destinasi: ' + error.message });
  }
};

// Update destinasi
exports.updateDestination = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.ticketPrice) data.ticketPrice = Number(data.ticketPrice);
    if (data.rating) data.rating = Number(data.rating);
    if (data.latitude) data.latitude = Number(data.latitude);
    if (data.longitude) data.longitude = Number(data.longitude);
    if (data.isRecommended !== undefined) data.isRecommended = Boolean(data.isRecommended);
    if (data.facilities && Array.isArray(data.facilities)) {
      data.facilities = JSON.stringify(data.facilities);
    }

    const updated = await prisma.destination.update({
      where: { id: Number(id) },
      data
    });

    res.json({ success: true, message: 'Destinasi berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('Error updating destination:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui destinasi' });
  }
};

// Hapus destinasi
exports.deleteDestination = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.destination.delete({
      where: { id: Number(id) }
    });

    res.json({ success: true, message: 'Destinasi berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting destination:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus destinasi' });
  }
};
