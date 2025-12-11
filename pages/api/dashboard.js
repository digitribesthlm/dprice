import { getDatabase, COLLECTIONS } from '../../lib/mongodb'
import { getCountryFromUrl } from '../../lib/countryMapping'

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
    let validProductFilter = {
      name: { $exists: true, $ne: null, $ne: '' },
      price: { $exists: true, $ne: null, $gt: 0 }
    }

    // Add category filter if provided (case-insensitive)
    if (category) {
      validProductFilter.category = { $regex: new RegExp(`^${category}$`, 'i') }
    }

    // Get date for one week ago
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Get unique countries from OWN PRODUCTS collection
    const ownCountries = await ownProducts.distinct('country')
    const validCountries = ownCountries.filter(c => c && c.trim() !== '')

    // Get ALL competitor prices to analyze by country (derived from URL)
    const allCompetitorPrices = await competitorPrices.find(validProductFilter).toArray()

    // Derive country from URL for each competitor price
    const competitorWithCountry = allCompetitorPrices.map(p => ({
      ...p,
      derivedCountry: p.country || getCountryFromUrl(p.url) || getCountryFromUrl(p.domain)
    }))

    // Filter by country if provided
    let filteredCompetitors = competitorWithCountry
    if (country) {
      filteredCompetitors = competitorWithCountry.filter(p => p.derivedCountry === country)
    }

    // Get unique domains (sources)
    const uniqueDomains = [...new Set(filteredCompetitors.map(p => p.domain).filter(d => d))]

    // Get this week's price changes
    const weeklyChanges = filteredCompetitors.filter(item => {
      const itemDate = new Date(item.imported_at || item.date)
      return itemDate >= oneWeekAgo
    }).slice(0, 100)

    // Filter to only those with actual price changes
    const priceChanges = weeklyChanges.filter(item => {
      const diff = parseFloat(item['price diff last crawl']) || 0
      return diff !== 0
    }).slice(0, 20)

    // Separate price drops and increases
    const priceDrops = priceChanges.filter(item => parseFloat(item['price diff last crawl']) < 0)
    const priceIncreases = priceChanges.filter(item => parseFloat(item['price diff last crawl']) > 0)

    // Get products with discounts (unique by URL)
    const discountedMap = new Map()
    filteredCompetitors
      .filter(p => p.has_discount)
      .sort((a, b) => new Date(b.imported_at) - new Date(a.imported_at))
      .forEach(p => {
        if (!discountedMap.has(p.url)) {
          discountedMap.set(p.url, p)
        }
      })
    const discountedProducts = [...discountedMap.values()].slice(0, 50)

    // Get categories (normalized to handle case differences)
    const categoryMap = new Map()
    filteredCompetitors.forEach(p => {
      if (p.category && p.category.trim()) {
        const normalized = p.category.trim().toLowerCase()
        // Keep the first occurrence's original casing but capitalize first letter
        if (!categoryMap.has(normalized)) {
          const formatted = p.category.trim().charAt(0).toUpperCase() + p.category.trim().slice(1).toLowerCase()
          categoryMap.set(normalized, formatted)
        }
      }
    })
    const categories = [...categoryMap.values()].sort()

    // Get unique product names for selector
    const productNames = [...new Set(filteredCompetitors.map(p => p.name).filter(n => n && n.trim() !== ''))]

    // Calculate stats
    const prices = filteredCompetitors.map(p => p.price).filter(p => p != null)
    const priceStats = {
      avgPrice: prices.length > 0 ? (prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      totalWithDiscount: discountedProducts.length // Use unique count
    }

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

    // Get country stats from competitor prices (derived from URLs)
    const countryGroups = {}
    competitorWithCountry.forEach(p => {
      const c = p.derivedCountry
      if (c) {
        if (!countryGroups[c]) {
          countryGroups[c] = { products: [], prices: [], discountUrls: new Set() }
        }
        countryGroups[c].products.push(p)
        if (p.price) countryGroups[c].prices.push(p.price)
        // Track unique discounts by URL
        if (p.has_discount && p.url) {
          countryGroups[c].discountUrls.add(p.url)
        }
      }
    })

    const countryStats = Object.keys(countryGroups).map(c => ({
      _id: c,
      productCount: countryGroups[c].products.length,
      avgPrice: countryGroups[c].prices.length > 0 
        ? countryGroups[c].prices.reduce((a, b) => a + b, 0) / countryGroups[c].prices.length
        : 0,
      discountCount: countryGroups[c].discountUrls.size // Unique discounts
    })).sort((a, b) => b.productCount - a.productCount)

    // Combine countries from own products and derived from competitor URLs
    const allCountries = [...new Set([...validCountries, ...Object.keys(countryGroups)])]

    // Own products count
    const totalOwnProducts = await ownProducts.countDocuments(country ? { country } : {})

    return res.status(200).json({
      stats: {
        totalCompetitorRecords: filteredCompetitors.length,
        totalOwnProducts,
        totalSources: uniqueDomains.length,
        totalCategories: categories.length,
        productsWithDiscount: priceStats.totalWithDiscount,
        avgPrice: priceStats.avgPrice?.toFixed(2) || '0',
      },
      weeklyStats,
      priceDrops: priceDrops.map(p => ({ ...p, country: p.derivedCountry })),
      priceIncreases: priceIncreases.map(p => ({ ...p, country: p.derivedCountry })),
      discountedProducts: discountedProducts.map(p => ({ ...p, country: p.derivedCountry })),
      categories,
      countries: allCountries.filter(c => c).sort(),
      countryStats,
      productNames: productNames.slice(0, 200),
      sources: uniqueDomains
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return res.status(500).json({ message: 'Internal server error', error: error.message })
  }
}
