import { getDatabase, COLLECTIONS } from '../../lib/mongodb'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const db = await getDatabase()
    const competitorPrices = db.collection(COLLECTIONS.COMPETITOR_PRICES)
    const ownProducts = db.collection(COLLECTIONS.OWN_PRODUCTS)

    // Get date for one week ago
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Get total counts
    const [totalCompetitorRecords, totalOwnProducts] = await Promise.all([
      competitorPrices.countDocuments(),
      ownProducts.countDocuments()
    ])

    // Get unique domains (sources)
    const uniqueDomains = await competitorPrices.distinct('domain')

    // Get this week's price changes (products with price diff)
    const weeklyChanges = await competitorPrices.find({
      $or: [
        { imported_at: { $gte: oneWeekAgo } },
        { date: { $gte: oneWeekAgo } }
      ]
    }).sort({ imported_at: -1 }).limit(100).toArray()

    // Filter to only those with actual price changes
    const priceChanges = weeklyChanges.filter(item => {
      const diff = parseFloat(item['price diff last crawl']) || 0
      return diff !== 0
    }).slice(0, 20)

    // Separate price drops and increases
    const priceDrops = priceChanges.filter(item => parseFloat(item['price diff last crawl']) < 0)
    const priceIncreases = priceChanges.filter(item => parseFloat(item['price diff last crawl']) > 0)

    // Get products with discounts (potential alerts)
    const discountedProducts = await competitorPrices.find({
      has_discount: true
    }).sort({ imported_at: -1 }).limit(20).toArray()

    // Get categories
    const categories = await competitorPrices.distinct('category')

    // Get unique product names for selector
    const productNames = await competitorPrices.distinct('name')

    // Calculate stats
    const priceStats = await competitorPrices.aggregate([
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          totalWithDiscount: { 
            $sum: { $cond: ['$has_discount', 1, 0] } 
          }
        }
      }
    ]).toArray()

    // Weekly stats
    const weeklyStats = {
      totalChanges: priceChanges.length,
      priceDrops: priceDrops.length,
      priceIncreases: priceIncreases.length,
      biggestDrop: priceDrops.length > 0 
        ? Math.min(...priceDrops.map(p => parseFloat(p['price diff last crawl'])))
        : 0,
      biggestIncrease: priceIncreases.length > 0
        ? Math.max(...priceIncreases.map(p => parseFloat(p['price diff last crawl'])))
        : 0
    }

    return res.status(200).json({
      stats: {
        totalCompetitorRecords,
        totalOwnProducts,
        totalSources: uniqueDomains.length,
        totalCategories: categories.length,
        productsWithDiscount: priceStats[0]?.totalWithDiscount || 0,
        avgPrice: priceStats[0]?.avgPrice?.toFixed(2) || '0',
      },
      weeklyStats,
      priceDrops,
      priceIncreases,
      discountedProducts,
      categories,
      productNames: productNames.filter(n => n).slice(0, 200), // Filter nulls, limit to 200
      sources: uniqueDomains
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return res.status(500).json({ message: 'Internal server error', error: error.message })
  }
}
