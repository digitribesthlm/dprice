import { getDatabase, COLLECTIONS } from '../../lib/mongodb'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const db = await getDatabase()
    const collection = db.collection(COLLECTIONS.OWN_PRODUCTS)

    const { 
      page = 1, 
      limit = 50, 
      hasDiscount,
      search,
      sortBy = 'imported_at',
      sortOrder = 'desc'
    } = req.query

    // Build filter
    const filter = {}
    if (hasDiscount === 'true') filter.discount = true
    if (search) {
      filter.url = { $regex: search, $options: 'i' }
    }

    // Build sort
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

    // Get total count for pagination
    const total = await collection.countDocuments(filter)

    // Get paginated results
    const products = await collection
      .find(filter)
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .toArray()

    return res.status(200).json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Products API error:', error)
    return res.status(500).json({ message: 'Internal server error', error: error.message })
  }
}

