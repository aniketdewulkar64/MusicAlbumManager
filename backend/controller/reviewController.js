const Review = require('../model/Review');
const { AppError } = require('../middleware/errorHandler');

// POST /api/albums/:id/reviews
exports.createReview = async (req, res, next) => {
  try {
    const review = await Review.create({
      album: req.params.id,
      user: req.user._id,
      rating: req.body.rating,
      review: req.body.review,
    });
    await review.populate('user', 'name avatar');
    res.status(201).json({ status: 'success', data: review });
  } catch (err) {
    next(err);
  }
};

// GET /api/albums/:id/reviews
exports.getAlbumReviews = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ album: req.params.id })
        .populate('user', 'name avatar')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ album: req.params.id }),
    ]);

    res.status(200).json({
      status: 'success',
      total,
      page,
      pages: Math.ceil(total / limit),
      data: reviews,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/reviews/:id
exports.updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return next(new AppError('Review not found', 404));

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to update this review', 403));
    }

    review.rating = req.body.rating ?? review.rating;
    review.review = req.body.review ?? review.review;
    await review.save(); // triggers post('save') hook for rating recalculation

    res.status(200).json({ status: 'success', data: review });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/reviews/:id
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return next(new AppError('Review not found', 404));

    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to delete this review', 403));
    }

    await Review.findByIdAndDelete(req.params.id); // triggers post('findOneAndDelete') hook
    res.status(200).json({ status: 'success', message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
};

// POST /api/reviews/:id/like
exports.toggleLike = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return next(new AppError('Review not found', 404));

    const userId = req.user._id;
    const hasLiked = review.likes.includes(userId);

    if (hasLiked) {
      review.likes.pull(userId);
    } else {
      review.likes.push(userId);
    }

    await review.save({ validateBeforeSave: false });
    res.status(200).json({ status: 'success', liked: !hasLiked, totalLikes: review.likes.length });
  } catch (err) {
    next(err);
  }
};
