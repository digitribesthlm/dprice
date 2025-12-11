'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// Extract domain from URL
function getDomain(url) {
  if (!url) return 'Unknown'
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url.split('/')[2]?.replace('www.', '') || url
  }
}

export default function ComparePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])
  const [copiedId, setCopiedId] = useState(null)

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Country flag mapping
  const countryFlags = {
    'SE': '🇸🇪', 'ES': '🇪🇸', 'DE': '🇩🇪', 'FR': '🇫🇷', 'IT': '🇮🇹',
    'UK': '🇬🇧', 'US': '🇺🇸', 'NL': '🇳🇱', 'BE': '🇧🇪', 'DK': '🇩🇰',
    'NO': '🇳🇴', 'FI': '🇫🇮', 'PL': '🇵🇱', 'PT': '🇵🇹', 'AT': '🇦🇹'
  }

  const handleSearch = async (term) => {
    if (!term || term.length < 2) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/compare-product?search=${encodeURIComponent(term)}`)
      const data = await res.json()
      setSearchResults(data)
      
      // Save to recent searches
      if (!recentSearches.includes(term)) {
        setRecentSearches(prev => [term, ...prev.slice(0, 4)])
      }
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleSearch(searchTerm)
  }

  // Chart data
  const chartData = searchResults?.countryComparison?.map(c => ({
    country: c.country,
    avgPrice: c.avgPrice,
    productCount: c.productCount,
    flag: countryFlags[c.country] || '🏳️'
  })) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cross-Country Price Comparison</h1>
        <p className="text-gray-500">Compare product prices across different countries to detect price dumping</p>
      </div>

      {/* Search Card */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter product code or name (e.g., C70, K17, Moldura)
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by product code like C70..."
                    className="w-full pl-12 pr-4 py-3 border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors text-lg"
                  />
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button
                  type="submit"
                  disabled={loading || searchTerm.length < 2}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      Compare
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500">Recent:</span>
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchTerm(term)
                      handleSearch(term)
                    }}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {searchResults && (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-sm text-gray-500">Search Term</p>
                <p className="text-xl font-bold text-gray-900">"{searchResults.searchTerm}"</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-sm text-gray-500">Countries Found</p>
                <p className="text-2xl font-bold text-indigo-600">{searchResults.stats.countriesFound}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-sm text-gray-500">Overall Avg Price</p>
                <p className="text-2xl font-bold text-gray-900">{searchResults.stats.overallAvgPrice} SEK</p>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="pt-5 pb-5">
                <p className="text-sm text-emerald-700">Lowest Price Country</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {countryFlags[searchResults.stats.lowestCountry]} {searchResults.stats.lowestCountry}
                </p>
                <p className="text-sm text-emerald-600">{searchResults.stats.lowestPrice} SEK avg</p>
              </CardContent>
            </Card>
          </div>

          {/* Dumping Alerts */}
          {searchResults.dumpingAlerts?.length > 0 && (
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Price Dumping Alert!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700 mb-4">
                  The following countries have prices more than 20% below the overall average:
                </p>
                <div className="flex flex-wrap gap-3">
                  {searchResults.dumpingAlerts.map((alert, idx) => (
                    <div key={idx} className="px-4 py-3 bg-white border border-red-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{countryFlags[alert.country] || '🏳️'}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{alert.country}</p>
                          <p className="text-red-600 font-bold">{alert.avgPrice.toFixed(2)} SEK avg</p>
                          <p className="text-xs text-gray-500">{alert.productCount} products</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Price Comparison Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Average Price by Country
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis 
                        dataKey="country" 
                        stroke="#9ca3af" 
                        fontSize={12}
                        tickFormatter={(value) => `${countryFlags[value] || ''} ${value}`}
                      />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px' }}
                        formatter={(value, name) => [
                          name === 'avgPrice' ? `${value.toFixed(2)} SEK` : value,
                          name === 'avgPrice' ? 'Avg Price' : 'Products'
                        ]}
                        labelFormatter={(label) => `${countryFlags[label] || ''} ${label}`}
                      />
                      <Bar dataKey="avgPrice" name="avgPrice" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={searchResults.dumpingAlerts?.find(a => a.country === entry.country) ? '#ef4444' : '#6366f1'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Country Details */}
          <Card>
            <CardHeader>
              <CardTitle>Price Details by Country</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Country</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">Products</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">Avg Price</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">Min Price</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">Max Price</th>
                      <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {searchResults.countryComparison?.map((country, idx) => {
                      const isDumping = searchResults.dumpingAlerts?.find(a => a.country === country.country)
                      return (
                        <tr key={idx} className={`hover:bg-gray-50 ${isDumping ? 'bg-red-50' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{countryFlags[country.country] || '🏳️'}</span>
                              <span className="font-semibold text-gray-900">{country.country}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-gray-900">{country.productCount}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`font-bold ${isDumping ? 'text-red-600' : 'text-gray-900'}`}>
                              {country.avgPrice.toFixed(2)} {country.currency}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-emerald-600 font-medium">
                            {country.minPrice.toFixed(2)} {country.currency}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-600">
                            {country.maxPrice.toFixed(2)} {country.currency}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isDumping ? (
                              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold">
                                ⚠️ Dumping
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">
                                ✓ Normal
                              </span>
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

          {/* Product Details per Country */}
          {searchResults.countryComparison?.map((countryData, cIdx) => (
            <Card key={cIdx}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{countryFlags[countryData.country] || '🏳️'}</span>
                  {countryData.country} - Products Found
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {countryData.products?.slice(0, 6).map((product, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-4 border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all"
                    >
                      <p className="text-xs text-indigo-600 font-medium mb-1">{getDomain(product.url)}</p>
                      <p className="font-medium text-gray-900 truncate mb-1">{product.name}</p>
                      <p className="text-sm text-gray-500 truncate mb-2">{product.category}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-indigo-600">{product.price?.toFixed(2)} {product.currency}</span>
                        <div className="flex items-center gap-2">
                          {product.has_discount && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">SALE</span>
                          )}
                          <button
                            onClick={() => copyToClipboard(product.url, `${cIdx}-${pIdx}`)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Copy Link"
                          >
                            {copiedId === `${cIdx}-${pIdx}` ? (
                              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {/* Empty State */}
      {!searchResults && !loading && (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="py-16 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Compare Product Prices Across Countries</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Enter a product code (like C70, K17) or name to see how prices compare across different countries. 
              The system will highlight any countries with potential price dumping.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
