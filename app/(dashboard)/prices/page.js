'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'

export default function PricesPage() {
  const searchParams = useSearchParams()
  const [prices, setPrices] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    hasDiscount: searchParams.get('hasDiscount') || '',
    search: searchParams.get('search') || '',
    page: 1
  })

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (filters.category) params.set('category', filters.category)
        if (filters.hasDiscount) params.set('hasDiscount', filters.hasDiscount)
        if (filters.search) params.set('search', filters.search)
        params.set('page', filters.page)
        params.set('limit', '25')

        const res = await fetch(`/api/prices?${params}`)
        const data = await res.json()
        setPrices(data.prices || [])
        setCategories(data.categories || [])
        setPagination(data.pagination || {})
      } catch (error) {
        console.error('Error fetching prices:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPrices()
  }, [filters])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Competitor Prices</h1>
          <p className="text-gray-500">Monitor and track competitor pricing</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {pagination.total?.toLocaleString() || 0} records
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors bg-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat || 'Uncategorized'}</option>
                ))}
              </select>
            </div>

            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
              <select
                value={filters.hasDiscount}
                onChange={(e) => handleFilterChange('hasDiscount', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors bg-white"
              >
                <option value="">All Products</option>
                <option value="true">With Discount</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
            </div>
          ) : prices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Product</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Category</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">Price</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Discount</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Stock</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">Change</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {prices.map((price, idx) => {
                    const priceDiff = parseFloat(price['price diff last crawl']) || 0
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <p className="font-medium text-gray-900 truncate">{price.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500 truncate">{price.domain}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                            {price.category || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-semibold text-gray-900">
                            {price.price?.toFixed(2)} {price.currency}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {price.has_discount ? (
                            <span className="inline-flex items-center px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
                              <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
                              </svg>
                              Yes
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {price.stock ? (
                            <span className="inline-flex items-center px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">
                              In Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-sm">
                              Out
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {priceDiff !== 0 ? (
                            <span className={`inline-flex items-center font-medium ${priceDiff < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {priceDiff < 0 ? '↓' : '↑'} {Math.abs(priceDiff).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/prices/${encodeURIComponent(price._id)}`}
                              className="p-2 hover:bg-emerald-100 rounded-lg transition-colors group"
                              title="View Details"
                            >
                              <svg className="w-4 h-4 text-gray-500 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                            <a
                              href={price.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                              title="Open URL"
                            >
                              <svg className="w-4 h-4 text-gray-500 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium">No prices found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                disabled={filters.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => handleFilterChange('page', Math.min(pagination.totalPages, filters.page + 1))}
                disabled={filters.page === pagination.totalPages}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

