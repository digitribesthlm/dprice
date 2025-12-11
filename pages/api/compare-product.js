import { getDatabase, COLLECTIONS } from '../../lib/mongodb'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { search, productCode } = req.query
    
    if (!search && !productCode) {
      return res.status(400).json({ message: 'Please provide search term or productCode parameter' })
    }

    const db = await getDatabase()
    const competitorPrices = db.collection(COLLECTIONS.COMPETITOR_PRICES)
    const ownProducts = db.collection(COLLECTIONS.OWN_PRODUCTS)

    const searchTerm = productCode || search

    // Find competitor products matching the search term (in URL or name)
    const competitorResults = await competitorPrices.find({
      $and: [
        { name: { $exists: true, $ne: null, $ne: '' } },
        { price: { $exists: true, $ne: null, $gt: 0 } },
        {
          $or: [
            { url: { $regex: searchTerm, $options: 'i' } },
            { name: { $regex: searchTerm, $options: 'i' } }
          ]
        }
      ]
    }).sort({ country: 1, imported_at: -1 }).toArray()

    // Find own products matching the search term
    const ownResults = await ownProducts.find({
      url: { $regex: searchTerm, $options: 'i' }
    }).sort({ country: 1, imported_at: -1 }).toArray()

    // Group competitor results by country
    const byCountry = {}
    competitorResults.forEach(product => {
      const country = product.country || 'Unknown'
      if (!byCountry[country]) {
        byCountry[country] = []
      }
      byCountry[country].push(product)
    })

    // Get latest price per country (deduplicate by URL)
    const latestByCountry = {}
    Object.keys(byCountry).forEach(country => {
      const seen = new Set()
      latestByCountry[country] = byCountry[country].filter(p => {
        if (seen.has(p.url)) return false
        seen.add(p.url)
        return true
      })
    })

    // Calculate price comparison stats
    const countryPrices = Object.keys(latestByCountry).map(country => {
      const products = latestByCountry[country]
      const prices = products.map(p => p.price).filter(p => p != null)
      return {
        country,
        productCount: products.length,
        avgPrice: prices.length > 0 ? (prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
        minPrice: prices.length > 0 ? Math.min(...prices) : 0,
        maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
        currency: products[0]?.currency || 'SEK',
        products: products.slice(0, 10) // Limit to 10 per country
      }
    })

    // Sort by average price to highlight cheapest countries
    countryPrices.sort((a, b) => a.avgPrice - b.avgPrice)

    // Find price dumping (countries significantly below average)
    const allAvgPrices = countryPrices.filter(c => c.avgPrice > 0).map(c => c.avgPrice)
    const overallAvg = allAvgPrices.length > 0 
      ? allAvgPrices.reduce((a, b) => a + b, 0) / allAvgPrices.length 
      : 0
    
    const dumpingThreshold = overallAvg * 0.8 // 20% below average
    const dumpingAlerts = countryPrices.filter(c => c.avgPrice > 0 && c.avgPrice < dumpingThreshold)

    return res.status(200).json({
      searchTerm,
      totalResults: competitorResults.length,
      countryComparison: countryPrices,
      ownProducts: ownResults,
      dumpingAlerts,
      stats: {
        countriesFound: Object.keys(latestByCountry).length,
        overallAvgPrice: overallAvg.toFixed(2),
        lowestCountry: countryPrices[0]?.country || 'N/A',
        lowestPrice: countryPrices[0]?.avgPrice?.toFixed(2) || 'N/A'
      }
    })
  } catch (error) {
    console.error('Compare Product API error:', error)
    return res.status(500).json({ message: 'Internal server error', error: error.message })
  }
}

