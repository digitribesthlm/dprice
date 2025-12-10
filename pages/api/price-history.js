import { getDatabase, COLLECTIONS } from '../../lib/mongodb'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const db = await getDatabase()
    const collection = db.collection(COLLECTIONS.COMPETITOR_PRICES)

    const { name, url, category } = req.query

    if (!name && !url && !category) {
      return res.status(400).json({ message: 'Please provide name, url, or category parameter' })
    }

    // Build filter for finding related price records
    const filter = {}
    if (name) filter.name = { $regex: name, $options: 'i' }
    if (url) filter.url = url
    if (category) filter.category = category

    // Get price history sorted by date
    const priceHistory = await collection
      .find(filter)
      .sort({ date: 1, imported_at: 1 })
      .toArray()

    // Group by product name for chart data
    const groupedData = {}
    priceHistory.forEach(record => {
      const key = record.name || record.url
      if (!groupedData[key]) {
        groupedData[key] = {
          name: record.name,
          url: record.url,
          category: record.category,
          currency: record.currency,
          history: []
        }
      }
      groupedData[key].history.push({
        date: record.date || record.imported_at,
        price: record.price,
        hasDiscount: record.has_discount,
        priceDiff: record['price diff last crawl']
      })
    })

    // Convert to array and calculate stats
    const products = Object.values(groupedData).map(product => {
      const prices = product.history.map(h => h.price).filter(p => p != null)
      return {
        ...product,
        stats: {
          currentPrice: prices[prices.length - 1],
          minPrice: Math.min(...prices),
          maxPrice: Math.max(...prices),
          avgPrice: (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2),
          priceChange: prices.length > 1 ? (prices[prices.length - 1] - prices[0]).toFixed(2) : 0
        }
      }
    })

    return res.status(200).json({
      products,
      totalRecords: priceHistory.length
    })
  } catch (error) {
    console.error('Price History API error:', error)
    return res.status(500).json({ message: 'Internal server error', error: error.message })
  }
}

