import { getDatabase, COLLECTIONS } from '../../lib/mongodb'

export default async function handler(req, res) {
  const db = await getDatabase()
  const collection = db.collection(COLLECTIONS.COMPETITOR_PRICES)

  if (req.method === 'GET') {
    try {
      // Get unique sources/domains with their stats
      const sources = await collection.aggregate([
        {
          $match: {
            name: { $exists: true, $ne: null, $ne: '' },
            price: { $exists: true, $ne: null, $gt: 0 }
          }
        },
        {
          $group: {
            _id: '$domain',
            productCount: { $sum: 1 },
            categories: { $addToSet: '$category' },
            avgPrice: { $avg: '$price' },
            lastUpdated: { $max: '$imported_at' },
            sampleProducts: { $push: { name: '$name', price: '$price', url: '$url' } }
          }
        },
        {
          $project: {
            _id: 1,
            domain: '$_id',
            productCount: 1,
            categoryCount: { $size: '$categories' },
            categories: { $slice: ['$categories', 5] },
            avgPrice: { $round: ['$avgPrice', 2] },
            lastUpdated: 1,
            sampleProducts: { $slice: ['$sampleProducts', 3] }
          }
        },
        { $sort: { productCount: -1 } }
      ]).toArray()

      // Filter out null domains
      const validSources = sources.filter(s => s._id && s._id.trim() !== '')

      return res.status(200).json({
        sources: validSources,
        totalSources: validSources.length
      })
    } catch (error) {
      console.error('Sources API GET error:', error)
      return res.status(500).json({ message: 'Internal server error', error: error.message })
    }
  }

  if (req.method === 'POST') {
    try {
      const { url, name, category } = req.body

      if (!url) {
        return res.status(400).json({ message: 'URL is required' })
      }

      // Extract domain from URL
      let domain = url
      try {
        const urlObj = new URL(url)
        domain = urlObj.origin + urlObj.pathname
      } catch (e) {
        // Keep original if URL parsing fails
      }

      // Create new entry for monitoring
      const newEntry = {
        url: url,
        domain: domain,
        name: name || 'New Product to Monitor',
        category: category || 'Uncategorized',
        price: null, // Will be filled when crawled
        currency: 'SEK',
        has_discount: false,
        stock: null,
        'price diff last crawl': '0',
        imported_at: new Date(),
        date: new Date(),
        status: 'pending', // Mark as pending for crawler
        added_manually: true
      }

      const result = await collection.insertOne(newEntry)

      return res.status(201).json({
        message: 'Source added successfully',
        id: result.insertedId,
        entry: newEntry
      })
    } catch (error) {
      console.error('Sources API POST error:', error)
      return res.status(500).json({ message: 'Internal server error', error: error.message })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { url } = req.body

      if (!url) {
        return res.status(400).json({ message: 'URL is required' })
      }

      const result = await collection.deleteMany({ url: url })

      return res.status(200).json({
        message: 'Source deleted successfully',
        deletedCount: result.deletedCount
      })
    } catch (error) {
      console.error('Sources API DELETE error:', error)
      return res.status(500).json({ message: 'Internal server error', error: error.message })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

