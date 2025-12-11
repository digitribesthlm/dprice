import { getDatabase, COLLECTIONS } from '../../lib/mongodb'
import { getCountryFromUrl } from '../../lib/countryMapping'

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

    // Find OWN products matching the search term (in URL) - these have country data
    const ownResults = await ownProducts.find({
      url: { $regex: searchTerm, $options: 'i' }
    }).sort({ country: 1, imported_at: -1 }).toArray()

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
    }).sort({ imported_at: -1 }).toArray()

    // Add derived country to competitor results based on URL
    const competitorWithCountry = competitorResults.map(p => ({
      ...p,
      country: p.country || getCountryFromUrl(p.url) || getCountryFromUrl(p.domain),
      source: 'competitor'
    }))

    // Group OWN products by country
    const ownByCountry = {}
    ownResults.forEach(product => {
      const country = product.country
      if (country) {
        if (!ownByCountry[country]) {
          ownByCountry[country] = []
        }
        ownByCountry[country].push({
          ...product,
          price: product.correct_price || product.ord_price,
          name: product.url.split('/').pop() || product.url,
          source: 'own'
        })
      }
    })

    // Group competitor products by derived country
    const competitorByCountry = {}
    competitorWithCountry.forEach(product => {
      const country = product.country
      if (country) {
        if (!competitorByCountry[country]) {
          competitorByCountry[country] = []
        }
        competitorByCountry[country].push(product)
      }
    })

    // Combine all countries
    const allCountries = new Set([...Object.keys(ownByCountry), ...Object.keys(competitorByCountry)])
    
    // Calculate stats per country
    const countryPrices = Array.from(allCountries).map(country => {
      const ownProds = ownByCountry[country] || []
      const compProds = competitorByCountry[country] || []
      const allProds = [...ownProds, ...compProds]
      
      // Deduplicate by URL
      const seen = new Set()
      const uniqueProds = allProds.filter(p => {
        if (seen.has(p.url)) return false
        seen.add(p.url)
        return true
      })

      const prices = uniqueProds.map(p => p.price).filter(p => p != null && p > 0)
      
      return {
        country,
        productCount: uniqueProds.length,
        ownProductCount: ownProds.length,
        competitorCount: compProds.length,
        avgPrice: prices.length > 0 ? (prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
        minPrice: prices.length > 0 ? Math.min(...prices) : 0,
        maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
        currency: uniqueProds[0]?.currency || 'SEK',
        products: uniqueProds.slice(0, 10)
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
      totalResults: ownResults.length + competitorResults.length,
      countryComparison: countryPrices,
      ownProducts: ownResults,
      competitorProducts: competitorWithCountry,
      dumpingAlerts,
      stats: {
        countriesFound: countryPrices.length,
        overallAvgPrice: overallAvg.toFixed(2),
        lowestCountry: countryPrices[0]?.country || 'N/A',
        lowestPrice: countryPrices[0]?.avgPrice?.toFixed(2) || 'N/A',
        ownProductsFound: ownResults.length,
        competitorProductsFound: competitorResults.length
      }
    })
  } catch (error) {
    console.error('Compare Product API error:', error)
    return res.status(500).json({ message: 'Internal server error', error: error.message })
  }
}
