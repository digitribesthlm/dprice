'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'

export default function AlertsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('critical')
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

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/alerts')
        const alertsData = await res.json()
        setData(alertsData)
      } catch (error) {
        console.error('Error fetching alerts:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAlerts()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  const alerts = data?.alerts || { critical: [], warning: [], info: [] }
  const summary = data?.summary || {}

  const tabs = [
    { id: 'critical', label: 'Critical', count: summary.criticalCount, color: 'red' },
    { id: 'warning', label: 'Warnings', count: summary.warningCount, color: 'amber' },
    { id: 'info', label: 'Info', count: summary.infoCount, color: 'blue' }
  ]

  const colorClasses = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-700',
      icon: 'text-red-600',
      iconBg: 'bg-red-100'
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-700',
      icon: 'text-amber-600',
      iconBg: 'bg-amber-100'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-700',
      icon: 'text-blue-600',
      iconBg: 'bg-blue-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Price Alerts</h1>
        <p className="text-gray-500">Monitor competitor price changes and take action</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-6 rounded-2xl border-2 transition-all text-left ${
              activeTab === tab.id 
                ? `${colorClasses[tab.id].bg} ${colorClasses[tab.id].border}` 
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${activeTab === tab.id ? colorClasses[tab.id].icon : 'text-gray-500'}`}>
                  {tab.label}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{tab.count || 0}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[tab.id].iconBg}`}>
                {tab.id === 'critical' && (
                  <svg className={`w-6 h-6 ${colorClasses[tab.id].icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                {tab.id === 'warning' && (
                  <svg className={`w-6 h-6 ${colorClasses[tab.id].icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {tab.id === 'info' && (
                  <svg className={`w-6 h-6 ${colorClasses[tab.id].icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${
              activeTab === 'critical' ? 'bg-red-500' : 
              activeTab === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
            }`}></span>
            {activeTab === 'critical' ? 'Critical Alerts' : 
             activeTab === 'warning' ? 'Warning Alerts' : 'Info Alerts'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts[activeTab]?.length > 0 ? (
            <div className="space-y-4">
              {alerts[activeTab].map((alert, idx) => (
                <div 
                  key={idx} 
                  className={`p-5 rounded-xl border ${colorClasses[activeTab].border} ${colorClasses[activeTab].bg}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses[activeTab].iconBg}`}>
                          <svg className={`w-5 h-5 ${colorClasses[activeTab].icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{alert.name || 'Unknown Product'}</h3>
                          <p className="text-sm text-gray-500">{alert.category}</p>
                          <p className={`text-sm font-medium mt-1 ${colorClasses[activeTab].icon}`}>
                            {alert.alertMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 lg:flex-shrink-0">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{alert.price?.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{alert.currency}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/prices/${encodeURIComponent(alert._id)}`}
                          className="p-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors"
                          title="View History"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => copyToClipboard(alert.url, alert._id)}
                          className="p-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors"
                          title="Copy Link"
                        >
                          {copiedId === alert._id ? (
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium">No {activeTab} alerts</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

