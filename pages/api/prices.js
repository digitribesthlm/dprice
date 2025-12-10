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

    // Build filter
    const filter = {}
    if (category) filter.category = category
    if (hasDiscount === 'true') filter.has_discount = true
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { url: { $regex: search, $options: 'i' } }
      ]
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

    // Get categories for filter
    const categories = await collection.distinct('category')

    return res.status(200).json({
      prices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      categories
    })
  } catch (error) {
    console.error('Prices API error:', error)
    return res.status(500).json({ message: 'Internal server error', error: error.message })
  }
}

