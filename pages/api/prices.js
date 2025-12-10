import { getDatabase, COLLECTIONS } from '../../lib/mongodb'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const db = await getDatabase()
    const collection = db.collection(COLLECTIONS.COMPETITOR_PRICES)

    const { 
      page = 1, 
      limit = 50, 
      category, 
      hasDiscount,
      search,
      sortBy = 'imported_at',
      sortOrder = 'desc'
    } = req.query

    // Build filter - exclude products with no useful data
    const filter = {
      // Must have a name (not null, not empty)
      name: { $exists: true, $ne: null, $ne: '' },
      // Must have a valid price
      price: { $exists: true, $ne: null, $gt: 0 }
    }

    if (category) filter.category = category
    if (hasDiscount === 'true') filter.has_discount = true
    if (search) {
      filter.$and = [
        { name: { $exists: true, $ne: null, $ne: '' } },
        { price: { $exists: true, $ne: null, $gt: 0 } },
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { url: { $regex: search, $options: 'i' } }
          ]
        }
      ]
      // Remove the duplicate conditions since they're in $and now
      delete filter.name
      delete filter.price
    }

    // Build sort
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

    // Get total count for pagination
    const total = await collection.countDocuments(filter)

    // Get paginated results
    const prices = await collection
      .find(filter)
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .toArray()

    // Get categories for filter (only from valid products)
    const categories = await collection.distinct('category', {
      name: { $exists: true, $ne: null, $ne: '' },
      price: { $exists: true, $ne: null, $gt: 0 }
    })

    // Filter out null/empty categories
    const validCategories = categories.filter(cat => cat && cat.trim() !== '')

    return res.status(200).json({
      prices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      categories: validCategories
    })
  } catch (error) {
    console.error('Prices API error:', error)
    return res.status(500).json({ message: 'Internal server error', error: error.message })
  }
}
