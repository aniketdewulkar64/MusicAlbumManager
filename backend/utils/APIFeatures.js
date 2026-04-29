class APIFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  // Full-text regex search on title, artist, tags
  search() {
    const searchStr = this.queryStr.search;
    if (searchStr && typeof searchStr === 'string' && searchStr.trim() !== '') {
      const regex = new RegExp(searchStr.trim(), 'i');
      this.query = this.query.find({
        $or: [{ title: regex }, { artist: regex }, { tags: regex }],
      });
    }
    return this;
  }

  // Filter: genre, year, minRating
  filter() {
    const queryObj = { ...this.queryStr };
    const excludedFields = ['search', 'sort', 'order', 'page', 'limit', 'fields'];
    excludedFields.forEach((f) => delete queryObj[f]);

    const filterQuery = {};
    if (queryObj.genre && typeof queryObj.genre === 'string' && queryObj.genre.trim() !== '') {
      filterQuery.genre = queryObj.genre.trim();
    }
    if (queryObj.year) filterQuery.releaseYear = Number(queryObj.year);
    if (queryObj.minRating) filterQuery.avgRating = { $gte: Number(queryObj.minRating) };

    this.query = this.query.find(filterQuery);
    return this;
  }

  // Sort
  sort() {
    if (this.queryStr.sort) {
      const order = this.queryStr.order === 'desc' ? '-' : '';
      const sortBy = `${order}${this.queryStr.sort}`;
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  // Field projection
  project() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    }
    return this;
  }

  // Pagination
  paginate() {
    const page = Math.max(1, parseInt(this.queryStr.page) || 1);
    const limit = Math.min(100, parseInt(this.queryStr.limit) || 10);
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    this.page = page;
    this.limit = limit;
    return this;
  }
}

module.exports = APIFeatures;
