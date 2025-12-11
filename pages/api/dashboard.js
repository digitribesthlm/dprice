import { getDatabase, COLLECTIONS } from '../../lib/mongodb'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const db = await getDatabase()
    const competitorPrices = db.collection(COLLECTIONS.COMPETITOR_PRICES)
    const ownProducts = db.collection(COLLECTIONS.OWN_PRODUCTS)

    const { country, category } = req.query

    // Filter for valid products only
    const validProductFilter = {
      name: { $exists: true, $ne: null, $ne: '' },
      price: { $exists: true, $ne: null, $gt: 0 }
    }

    // Add country filter if provided
    if (country) {
      validProductFilter.country = country
    }

    // Add category filter if provided
    if (category) {
      validProductFilter.category = category
    }

    // Get date for one week ago
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Get total counts (only valid products)
    const [totalCompetitorRecords, totalOwnProducts] = await Promise.all([
      competitorPrices.countDocuments(validProductFilter),
      ownProducts.countDocuments(country ? { country } : {})
    ])

    // Get unique countries
    const countries = await competitorPrices.distinct('country', {
      name: { $exists: true, $ne: null, $ne: '' },
      price: { $exists: true, $ne: null, $gt: 0 }
    })
    const validCountries = countries.filter(c => c && c.trim() !== '')

    // Get unique domains (sources) from valid products
    const uniqueDomains = await competitorPrices.distinct('domain', validProductFilter)

    // Get this week's price changes (products with price diff) - only valid products
    const weeklyChanges = await competitorPrices.find({
      ...validProductFilter,
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

    // Get products with discounts (potential alerts) - only valid products
    const discountedProducts = await competitorPrices.find({
      ...validProductFilter,
      has_discount: true
    }).sort({ imported_at: -1 }).limit(20).toArray()

    // Get categories (only from valid products, optionally filtered by country)
    const categoryFilter = {
      name: { $exists: true, $ne: null, $ne: '' },
      price: { $exists: true, $ne: null, $gt: 0 }
    }
    if (country) categoryFilter.country = country
    
    const categories = await competitorPrices.distinct('category', categoryFilter)
    const validCategories = categories.filter(cat => cat && cat.trim() !== '')

    // Get unique product names for selector (only valid products)
    const productNames = await competitorPrices.distinct('name', validProductFilter)
    const validProductNames = productNames.filter(name => name && name.trim() !== '')

    // Calculate stats (only from valid products)
    const priceStats = await competitorPrices.aggregate([
      { $match: validProductFilter },
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

    // Get country stats for overview
    const countryStats = await competitorPrices.aggregate([
      { 
        $match: {
          name: { $exists: true, $ne: null, $ne: '' },
          price: { $exists: true, $ne: null, $gt: 0 },
          country: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$country',
          productCount: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          discountCount: { $sum: { $cond: ['$has_discount', 1, 0] } }
        }
      },
      { $sort: { productCount: -1 } }
    ]).toArray()

    return res.status(200).json({
      stats: {
        totalCompetitorRecords,
        totalOwnProducts,
        totalSources: uniqueDomains.filter(d => d).length,
        totalCategories: validCategories.length,
        productsWithDiscount: priceStats[0]?.totalWithDiscount || 0,
        avgPrice: priceStats[0]?.avgPrice?.toFixed(2) || '0',
      },
      weeklyStats,
      priceDrops,
      priceIncreases,
      discountedProducts,
      categories: validCategories,
      countries: validCountries,
      countryStats,
      productNames: validProductNames.slice(0, 200),
      sources: uniqueDomains.filter(d => d)
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return res.status(500).json({ message: 'Internal server error', error: error.message })
  }
}
