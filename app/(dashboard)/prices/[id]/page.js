'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts'

export default function PriceDetailPage({ params }) {
  const { id } = use(params)
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/prices/${encodeURIComponent(id)}`)
        if (!res.ok) {
          throw new Error('Product not found')
        }
        const data = await res.json()
        setProduct(data.product)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="text-center py-16">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg font-medium text-gray-900">Product not found</p>
        <p className="text-gray-500 mt-1">{error}</p>
        <Link href="/prices" className="text-emerald-600 hover:text-emerald-700 mt-4 inline-block font-medium">
          ← Back to prices
        </Link>
      </div>
    )
  }

  const stats = product.stats || {}
  const history = product.history || []

  // Format data for chart
  const chartData = history.map(h => ({
    date: new Date(h.date).toLocaleDateString('sv-SE'),
    price: h.price,
    hasDiscount: h.hasDiscount
  }))

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/prices" className="text-gray-500 hover:text-gray-700 transition-colors">Prices</Link>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium truncate max-w-md">{product.name || 'Product Details'}</span>
      </div>

      {/* Header Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                {product.has_discount && (
                  <span className="px-3 py-1 bg-amber-400 text-amber-900 rounded-lg text-sm font-semibold">
                    DISCOUNT
                  </span>
                )}
                {product.stock ? (
                  <span className="px-3 py-1 bg-emerald-400/30 text-white rounded-lg text-sm font-medium">
                    In Stock
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-white/20 text-white/80 rounded-lg text-sm font-medium">
                    Out of Stock
                  </span>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">{product.name || 'Unknown Product'}</h1>
              <p className="text-white/80">{product.category}</p>
              <button 
                onClick={() => copyToClipboard(product.url)}
                className="text-white/90 hover:text-white text-sm inline-flex items-center gap-1 mt-3 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy Link
                  </>
                )}
              </button>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-white/70 text-sm mb-1">Current Price</p>
              <p className="text-4xl lg:text-5xl font-bold">{stats.currentPrice?.toFixed(2)}</p>
              <p className="text-white/80 text-lg">{product.currency}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="overflow-hidden">
          <div className="h-1 bg-emerald-500"></div>
          <CardContent className="pt-5">
            <p className="text-sm text-gray-500 mb-1">Lowest Price</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.minPrice?.toFixed(2)}</p>
            <p className="text-xs text-gray-400">{product.currency}</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <div className="h-1 bg-red-500"></div>
          <CardContent className="pt-5">
            <p className="text-sm text-gray-500 mb-1">Highest Price</p>
            <p className="text-2xl font-bold text-red-600">{stats.maxPrice?.toFixed(2)}</p>
            <p className="text-xs text-gray-400">{product.currency}</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <div className="h-1 bg-blue-500"></div>
          <CardContent className="pt-5">
            <p className="text-sm text-gray-500 mb-1">Average Price</p>
            <p className="text-2xl font-bold text-gray-900">{stats.avgPrice}</p>
            <p className="text-xs text-gray-400">{product.currency}</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <div className="h-1 bg-purple-500"></div>
          <CardContent className="pt-5">
            <p className="text-sm text-gray-500 mb-1">Total Change</p>
            <p className={`text-2xl font-bold ${parseFloat(stats.priceChange) < 0 ? 'text-red-600' : parseFloat(stats.priceChange) > 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
              {parseFloat(stats.priceChange) > 0 ? '+' : ''}{stats.priceChange}
            </p>
            <p className="text-xs text-gray-400">{product.currency}</p>
          </CardContent>
        </Card>
      </div>

      {/* Price History Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Price History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 1 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px -10px rgb(0 0 0 / 0.2)'
                    }}
                    formatter={(value) => [`${value.toFixed(2)} ${product.currency}`, 'Price']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#059669" 
                    strokeWidth={2}
                    fill="url(#priceGradient)"
                    dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#059669', stroke: 'white', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="font-medium">Not enough data points to display chart</p>
              <p className="text-sm">Price history will be available after more crawls</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Price History Records</span>
            <span className="text-sm font-normal text-gray-500">{history.length} records</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Date</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-900">Price</th>
                  <th className="text-center px-6 py-3 text-sm font-semibold text-gray-900">Discount</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-gray-900">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((record, idx) => {
                  const priceDiff = parseFloat(record.priceDiff) || 0
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString('sv-SE', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        {record.price?.toFixed(2)} {product.currency}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {record.hasDiscount ? (
                          <span className="inline-flex items-center px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold">
                            SALE
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {priceDiff !== 0 ? (
                          <span className={`inline-flex items-center text-sm font-semibold ${priceDiff < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {priceDiff < 0 ? '↓' : '↑'} {Math.abs(priceDiff).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
