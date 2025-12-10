'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts'

export default function ComparePage() {
  const [ownProducts, setOwnProducts] = useState([])
  const [competitorPrices, setCompetitorPrices] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, pricesRes] = await Promise.all([
          fetch('/api/products?limit=100'),
          fetch('/api/prices?limit=100')
        ])
        const productsData = await productsRes.json()
        const pricesData = await pricesRes.json()
        
        setOwnProducts(productsData.products || [])
        setCompetitorPrices(pricesData.prices || [])
        setCategories(pricesData.categories || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter prices by category
  const filteredCompetitorPrices = selectedCategory 
    ? competitorPrices.filter(p => p.category === selectedCategory)
    : competitorPrices

  // Calculate price comparison stats
  const calculateStats = () => {
    if (filteredCompetitorPrices.length === 0) return null

    const prices = filteredCompetitorPrices.map(p => p.price).filter(p => p != null)
    const discountedCount = filteredCompetitorPrices.filter(p => p.has_discount).length
    
    return {
      avgCompetitorPrice: (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2),
      minCompetitorPrice: Math.min(...prices).toFixed(2),
      maxCompetitorPrice: Math.max(...prices).toFixed(2),
      totalProducts: filteredCompetitorPrices.length,
      discountedProducts: discountedCount,
      discountPercentage: ((discountedCount / filteredCompetitorPrices.length) * 100).toFixed(1)
    }
  }

  const stats = calculateStats()

  // Prepare chart data - group by category
  const categoryChartData = categories.map(cat => {
    const catPrices = competitorPrices.filter(p => p.category === cat)
    const prices = catPrices.map(p => p.price).filter(p => p != null)
    return {
      category: cat || 'Other',
      avgPrice: prices.length > 0 ? (prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      count: catPrices.length,
      discounted: catPrices.filter(p => p.has_discount).length
    }
  }).filter(d => d.count > 0).sort((a, b) => b.count - a.count).slice(0, 10)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Price Comparison</h1>
          <p className="text-gray-500">Analyze competitor pricing across categories</p>
        </div>
        <div className="md:w-64">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat || 'Uncategorized'}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Price</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgCompetitorPrice} SEK</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Min Price</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.minCompetitorPrice} SEK</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Max Price</p>
              <p className="text-2xl font-bold text-red-600">{stats.maxCompetitorPrice} SEK</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Discounted</p>
              <p className="text-2xl font-bold text-amber-600">{stats.discountedProducts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Discount %</p>
              <p className="text-2xl font-bold text-purple-600">{stats.discountPercentage}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Price Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Average Price by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryChartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                    <YAxis 
                      dataKey="category" 
                      type="category" 
                      stroke="#9ca3af" 
                      fontSize={11}
                      width={90}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      formatter={(value) => [`${value.toFixed(2)} SEK`, 'Avg Price']}
                    />
                    <Bar dataKey="avgPrice" fill="#059669" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No category data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              Product Count by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryChartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                    <YAxis 
                      dataKey="category" 
                      type="category" 
                      stroke="#9ca3af" 
                      fontSize={11}
                      width={90}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" name="Total Products" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="discounted" name="Discounted" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No category data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Our Products vs Competitor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Our Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ownProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Product URL</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-900">Our Price</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-900">Ord. Price</th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-gray-900">Discount</th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ownProducts.slice(0, 20).map((product, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900 truncate max-w-md">{product.url}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-gray-900">
                          {product.correct_price?.toFixed(2)} {product.currency}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-gray-500">
                          {product.ord_price?.toFixed(2)} {product.currency}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {product.discount ? (
                          <span className="inline-flex items-center px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">
                            Yes
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors inline-block"
                          title="View Product"
                        >
                          <svg className="w-4 h-4 text-gray-500 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p>No own products found in database</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

