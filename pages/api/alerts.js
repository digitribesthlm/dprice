import { getDatabase, COLLECTIONS } from '../../lib/mongodb'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const db = await getDatabase()
    const competitorPrices = db.collection(COLLECTIONS.COMPETITOR_PRICES)
    const ownProducts = db.collection(COLLECTIONS.OWN_PRODUCTS)

    // Filter for valid products only
    const validProductFilter = {
      name: { $exists: true, $ne: null, $ne: '' },
      price: { $exists: true, $ne: null, $gt: 0 }
    }

    // Get all own products
    const ownProductsList = await ownProducts.find({}).toArray()

    // Get competitor products with discounts or recent price drops - only valid products
    const competitorAlerts = await competitorPrices.find({
      ...validProductFilter,
      $or: [
        { has_discount: true },
        { 'price diff last crawl': { $lt: 0 } },
        { 'price diff last crawl': { $regex: /^-/ } }
      ]
    }).sort({ imported_at: -1 }).toArray()

    // Categorize alerts
    const alerts = {
      critical: [], // Competitor price significantly lower
      warning: [],  // Competitor has discount
      info: []      // Price change detected
    }

    competitorAlerts.forEach(item => {
      const priceDiff = parseFloat(item['price diff last crawl']) || 0
      
      if (priceDiff < -5) {
        alerts.critical.push({
          ...item,
          alertType: 'critical',
          alertMessage: `Price dropped by ${Math.abs(priceDiff).toFixed(2)} ${item.currency}`
        })
      } else if (item.has_discount) {
        alerts.warning.push({
          ...item,
          alertType: 'warning',
          alertMessage: 'Competitor has active discount'
        })
      } else if (priceDiff !== 0) {
        alerts.info.push({
          ...item,
          alertType: 'info',
          alertMessage: `Price changed by ${priceDiff > 0 ? '+' : ''}${priceDiff.toFixed(2)} ${item.currency}`
        })
      }
    })

    // Summary stats
    const summary = {
      totalAlerts: alerts.critical.length + alerts.warning.length + alerts.info.length,
      criticalCount: alerts.critical.length,
      warningCount: alerts.warning.length,
      infoCount: alerts.info.length,
      ownProductsCount: ownProductsList.length
    }

    return res.status(200).json({
      summary,
      alerts,
      ownProducts: ownProductsList
    })
  } catch (error) {
    console.error('Alerts API error:', error)
    return res.status(500).json({ message: 'Internal server error', error: error.message })
  }
}
