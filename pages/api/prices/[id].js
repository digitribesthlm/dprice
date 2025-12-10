import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '../../../lib/mongodb'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { id } = req.query
    const db = await getDatabase()
    const collection = db.collection(COLLECTIONS.COMPETITOR_PRICES)

    let product = null

    // Try to find by ObjectId first
    try {
      if (ObjectId.isValid(id)) {
        product = await collection.findOne({ _id: new ObjectId(id) })
      }
    } catch (e) {
      // Not a valid ObjectId, try other methods
    }

    // If not found by ID, search by name or URL
    if (!product) {
      product = await collection.findOne({
        $or: [
          { name: { $regex: decodeURIComponent(id), $options: 'i' } },
          { url: decodeURIComponent(id) }
        ]
      })
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    // Get price history for this product (by name or URL)
    const historyFilter = product.name 
      ? { name: product.name }
      : { url: product.url }
    
    const priceHistory = await collection
      .find(historyFilter)
      .sort({ date: 1, imported_at: 1 })
      .toArray()

    // Calculate stats
    const prices = priceHistory.map(h => h.price).filter(p => p != null)
    const stats = {
      currentPrice: product.price,
      minPrice: prices.length > 0 ? Math.min(...prices) : product.price,
      maxPrice: prices.length > 0 ? Math.max(...prices) : product.price,
      avgPrice: prices.length > 0 ? (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2) : product.price?.toFixed(2),
      priceChange: prices.length > 1 ? (prices[prices.length - 1] - prices[0]).toFixed(2) : '0'
    }

    // Format history for chart
    const history = priceHistory.map(h => ({
      date: h.date || h.imported_at,
      price: h.price,
      hasDiscount: h.has_discount,
      priceDiff: h['price diff last crawl']
    }))

    return res.status(200).json({
      product: {
        ...product,
        stats,
        history
      }
    })
  } catch (error) {
    console.error('Price detail API error:', error)
    return res.status(500).json({ message: 'Internal server error', error: error.message })
  }
}

