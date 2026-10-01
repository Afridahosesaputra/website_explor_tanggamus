const prisma = require('../config/db');

// Ambil semua ulasan pengunjung
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        destination: {
          select: { name: true, category: true }
        }
      }
    });

    res.json({ success: true, total: reviews.length, data: reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat ulasan' });
  }
};

// Kirim ulasan baru (dari Modal "Tulis Ulasan Kamu")
exports.createReview = async (req, res) => {
  try {
    const { author, city, rating, comment, destinationId } = req.body;

    if (!author || !city || !comment) {
      return res.status(400).json({ success: false, message: 'Nama, kota, dan ulasan wajib diisi' });
    }

    // Buat inisial avatar
    const words = author.trim().split(/\s+/);
    const avatar = words.length > 1
      ? (words[0][0] + words[1][0]).toUpperCase()
      : words[0].slice(0, 2).toUpperCase();

    const newReview = await prisma.review.create({
      data: {
        author: author.trim(),
        city: city.trim(),
        rating: Math.min(5, Math.max(1, Number(rating) || 5)),
        comment: comment.trim(),
        avatar,
        isVerified: true,
        destinationId: destinationId ? Number(destinationId) : null
      }
    });

    // Update review count pada destinasi jika terkait
    if (destinationId) {
      await prisma.destination.update({
        where: { id: Number(destinationId) },
        data: { reviewCount: { increment: 1 } }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Ulasan Anda berhasil dikirim dan tersimpan di database!',
      data: newReview
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ success: false, message: 'Gagal mengirim ulasan' });
  }
};
