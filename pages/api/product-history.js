import { getDatabase, COLLECTIONS } from '../../lib/mongodb'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { name } = req.query
    
    if (!name) {
      return res.status(400).json({ message: 'Product name is required' })
    }

    const db = await getDatabase()
    const collection = db.collection(COLLECTIONS.COMPETITOR_PRICES)

    // Get all price records for this product
    const priceRecords = await collection
      .find({ name: name })
      .sort({ date: 1, imported_at: 1 })
      .toArray()

    if (priceRecords.length === 0) {
      return res.status(404).json({ message: 'No price history found for this product' })
    }

    // Get the latest record for product details
    const latestRecord = priceRecords[priceRecords.length - 1]

    // Format history for chart
    const history = priceRecords.map(record => ({
      date: record.date || record.imported_at,
      dateFormatted: new Date(record.date || record.imported_at).toLocaleDateString('sv-SE'),
      price: record.price,
      hasDiscount: record.has_discount,
      priceDiff: parseFloat(record['price diff last crawl']) || 0
    }))

    // Calculate stats
    const prices = history.map(h => h.price).filter(p => p != null)
    const stats = {
      currentPrice: latestRecord.price,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      avgPrice: (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2),
      totalChange: prices.length > 1 ? (prices[prices.length - 1] - prices[0]).toFixed(2) : '0',
      recordCount: priceRecords.length
    }

    return res.status(200).json({
      product: {
        name: latestRecord.name,
        category: latestRecord.category,
        url: latestRecord.url,
        currency: latestRecord.currency,
        hasDiscount: latestRecord.has_discount,
        inStock: latestRecord.stock
      },
      stats,
      history
    })
  } catch (error) {
    console.error('Product History API error:', error)
    return res.status(500).json({ message: 'Internal server error', error: error.message })
  }
}

