'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [alerts, setAlerts] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Product selector state
  const [selectedProduct, setSelectedProduct] = useState('')
  const [productHistory, setProductHistory] = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, alertsRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/alerts')
        ])
        const dashboardData = await dashboardRes.json()
        const alertsData = await alertsRes.json()
        setData(dashboardData)
        setAlerts(alertsData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Fetch product history when a product is selected
  useEffect(() => {
    if (!selectedProduct) {
      setProductHistory(null)
      return
    }

    const fetchProductHistory = async () => {
      setLoadingHistory(true)
      try {
        const res = await fetch(`/api/product-history?name=${encodeURIComponent(selectedProduct)}`)
        if (res.ok) {
          const data = await res.json()
          setProductHistory(data)
        }
      } catch (error) {
        console.error('Error fetching product history:', error)
      } finally {
        setLoadingHistory(false)
      }
    }
    fetchProductHistory()
  }, [selectedProduct])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  const stats = data?.stats || {}
  const weeklyStats = data?.weeklyStats || {}
  const alertSummary = alerts?.summary || {}

  return (
    <div className="space-y-8">
      {/* Alert Banner */}
      {alertSummary.criticalCount > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Price Alert!</h2>
                <p className="text-white/80">{alertSummary.criticalCount} competitor{alertSummary.criticalCount > 1 ? 's' : ''} dropped prices significantly</p>
              </div>
            </div>
            <Link 
              href="/alerts" 
              className="px-5 py-2.5 bg-white text-red-600 rounded-xl font-semibold hover:bg-white/90 transition-colors"
            >
              View Alerts
            </Link>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Competitor Prices</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCompetitorRecords?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-400 mt-1">records monitored</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Our Products</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalOwnProducts?.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-400 mt-1">in catalog</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Sources Tracked</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSources || 0}</p>
                <p className="text-xs text-gray-400 mt-1">competitor sites</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent"></div>
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active Discounts</p>
                <p className="text-3xl font-bold text-amber-600">{stats.productsWithDiscount || 0}</p>
                <p className="text-xs text-gray-400 mt-1">competitor offers</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* This Week's Price Changes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{weeklyStats.totalChanges || 0}</p>
                <p className="text-xs text-gray-400">price changes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Price Drops</p>
                <p className="text-2xl font-bold text-red-600">{weeklyStats.priceDrops || 0}</p>
                <p className="text-xs text-gray-400">competitors lowered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Price Increases</p>
                <p className="text-2xl font-bold text-emerald-600">{weeklyStats.priceIncreases || 0}</p>
                <p className="text-xs text-gray-400">competitors raised</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Biggest Drop</p>
                <p className="text-2xl font-bold text-orange-600">{weeklyStats.biggestDrop?.toFixed(2) || '0'}</p>
                <p className="text-xs text-gray-400">SEK this week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Price History Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Product Price Movement
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Product Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select a competitor product to view price history</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full md:w-96 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors bg-white text-sm"
            >
              <option value="">-- Select a product --</option>
              {data?.productNames?.map((name, idx) => (
                <option key={idx} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Chart */}
          {loadingHistory ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
            </div>
          ) : productHistory ? (
            <div>
              {/* Product Info */}
              <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500">Current Price</p>
                  <p className="text-2xl font-bold text-gray-900">{productHistory.stats.currentPrice?.toFixed(2)} {productHistory.product.currency}</p>
                </div>
                <div className="w-px h-12 bg-gray-300 hidden sm:block"></div>
                <div>
                  <p className="text-xs text-gray-500">Min</p>
                  <p className="text-lg font-semibold text-emerald-600">{productHistory.stats.minPrice?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Max</p>
                  <p className="text-lg font-semibold text-red-600">{productHistory.stats.maxPrice?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg</p>
                  <p className="text-lg font-semibold text-gray-700">{productHistory.stats.avgPrice}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Change</p>
                  <p className={`text-lg font-semibold ${parseFloat(productHistory.stats.totalChange) < 0 ? 'text-red-600' : parseFloat(productHistory.stats.totalChange) > 0 ? 'text-emerald-600' : 'text-gray-700'}`}>
                    {parseFloat(productHistory.stats.totalChange) > 0 ? '+' : ''}{productHistory.stats.totalChange}
                  </p>
                </div>
                <div className="ml-auto">
                  <a 
                    href={productHistory.product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    View Product
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Price Chart */}
              {productHistory.history.length > 1 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={productHistory.history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="priceGradientDashboard" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis 
                        dataKey="dateFormatted" 
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
                        formatter={(value) => [`${value?.toFixed(2)} ${productHistory.product.currency}`, 'Price']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#059669" 
                        strokeWidth={2.5}
                        fill="url(#priceGradientDashboard)"
                        dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#059669', stroke: 'white', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="font-medium">Only one data point available</p>
                  <p className="text-sm">More history will appear after additional crawls</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-lg font-medium">Select a product above</p>
              <p className="text-sm">to view its price movement over time</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Changes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Drops This Week */}
        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
              Price Drops This Week
            </CardTitle>
            <span className="text-sm text-gray-500">{data?.priceDrops?.length || 0} products</span>
          </CardHeader>
          <CardContent>
            {data?.priceDrops?.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {data.priceDrops.slice(0, 10).map((product, idx) => {
                  const priceDiff = parseFloat(product['price diff last crawl']) || 0
                  return (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{product.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{product.category}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{product.price?.toFixed(2)} {product.currency}</p>
                          <p className="text-sm text-red-600 font-semibold">↓ {Math.abs(priceDiff).toFixed(2)}</p>
                        </div>
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white hover:bg-red-200 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No price drops this week</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Price Increases This Week */}
        <Card className="border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Price Increases This Week
            </CardTitle>
            <span className="text-sm text-gray-500">{data?.priceIncreases?.length || 0} products</span>
          </CardHeader>
          <CardContent>
            {data?.priceIncreases?.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {data.priceIncreases.slice(0, 10).map((product, idx) => {
                  const priceDiff = parseFloat(product['price diff last crawl']) || 0
                  return (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{product.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{product.category}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{product.price?.toFixed(2)} {product.currency}</p>
                          <p className="text-sm text-emerald-600 font-semibold">↑ {priceDiff.toFixed(2)}</p>
                        </div>
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white hover:bg-emerald-200 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No price increases this week</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Competitor Discounts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Active Competitor Discounts
          </CardTitle>
          <Link href="/prices?hasDiscount=true" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {data?.discountedProducts?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.discountedProducts.slice(0, 6).map((product, idx) => (
                <div 
                  key={idx} 
                  className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="px-2 py-1 bg-amber-200 text-amber-800 rounded-lg text-xs font-bold">SALE</span>
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:text-amber-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                  <p className="font-medium text-gray-900 truncate mb-1">{product.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                  <p className="text-xl font-bold text-amber-700">{product.price?.toFixed(2)} {product.currency}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No active competitor discounts</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
