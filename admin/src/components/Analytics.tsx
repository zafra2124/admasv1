import React, { useState, useEffect } from 'react'
import { TrendingUp, Users, Trophy, Calendar } from 'lucide-react'

interface AnalyticsData {
  totalTickets: number
  totalWinners: number
  winRate: number
  monthlyStats: MonthlyStats[]
  sourceBreakdown: SourceStats
}

interface MonthlyStats {
  month: string
  tickets: number
  winners: number
  winRate: number
}

interface SourceStats {
  manual: number
  sms: number
}

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalTickets: 0,
    totalWinners: 0,
    winRate: 0,
    monthlyStats: [],
    sourceBreakdown: { manual: 0, sms: 0 }
  })

  const [selectedPeriod, setSelectedPeriod] = useState<'3m' | '6m' | '1y' | 'all'>('all')

  useEffect(() => {
    loadAnalytics()
  }, [selectedPeriod])

  const loadAnalytics = () => {
    // Mock analytics data
    const mockData: AnalyticsData = {
      totalTickets: 1247,
      totalWinners: 23,
      winRate: 1.8,
      monthlyStats: [
        { month: '2024-10', tickets: 156, winners: 3, winRate: 1.9 },
        { month: '2024-11', tickets: 203, winners: 4, winRate: 2.0 },
        { month: '2024-12', tickets: 298, winners: 5, winRate: 1.7 },
        { month: '2025-01', tickets: 590, winners: 11, winRate: 1.9 }
      ],
      sourceBreakdown: { manual: 823, sms: 424 }
    }
    setAnalytics(mockData)
  }

  const formatMonth = (month: string): string => {
    return new Date(month + '-01').toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="section-title" style={{ marginBottom: 0 }}>Analytics Dashboard</h1>
        
        <select 
          value={selectedPeriod} 
          onChange={(e) => setSelectedPeriod(e.target.value as any)}
          style={{ 
            padding: '0.75rem 1rem', 
            borderRadius: 'var(--radius-md)', 
            border: '2px solid var(--color-gray-200)',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          <option value="3m">Last 3 Months</option>
          <option value="6m">Last 6 Months</option>
          <option value="1y">Last Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">Total Tickets</div>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-primary)20' }}>
              <Users size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
          </div>
          <div className="stat-value">{analytics.totalTickets.toLocaleString()}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">Winners</div>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-success)20' }}>
              <Trophy size={20} style={{ color: 'var(--color-success)' }} />
            </div>
          </div>
          <div className="stat-value">{analytics.totalWinners}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">Win Rate</div>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-warning)20' }}>
              <TrendingUp size={20} style={{ color: 'var(--color-warning)' }} />
            </div>
          </div>
          <div className="stat-value">{analytics.winRate.toFixed(1)}%</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">Avg Monthly</div>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-danger)20' }}>
              <Calendar size={20} style={{ color: 'var(--color-danger)' }} />
            </div>
          </div>
          <div className="stat-value">
            {analytics.monthlyStats.length > 0 
              ? Math.round(analytics.totalTickets / analytics.monthlyStats.length)
              : 0
            }
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          Monthly Trends
        </h3>
        
        {analytics.monthlyStats.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Tickets</th>
                  <th>Winners</th>
                  <th>Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.monthlyStats.map((stat) => (
                  <tr key={stat.month}>
                    <td>{formatMonth(stat.month)}</td>
                    <td>{stat.tickets.toLocaleString()}</td>
                    <td>
                      <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>
                        {stat.winners}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--color-warning)', fontWeight: '600' }}>
                        {stat.winRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <TrendingUp size={48} />
            <h3>No data available</h3>
            <p>Analytics will appear here once there's enough data</p>
          </div>
        )}
      </div>

      {/* Source Breakdown */}
      <div className="card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          Ticket Sources
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ 
              width: '4rem', 
              height: '4rem', 
              borderRadius: '50%', 
              backgroundColor: 'var(--color-primary)20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <Users size={24} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {analytics.sourceBreakdown.manual.toLocaleString()}
            </div>
            <div style={{ color: 'var(--color-gray-600)', fontWeight: '500' }}>
              Manual Entry
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)' }}>
              {((analytics.sourceBreakdown.manual / analytics.totalTickets) * 100).toFixed(1)}%
            </div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ 
              width: '4rem', 
              height: '4rem', 
              borderRadius: '50%', 
              backgroundColor: 'var(--color-success)20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <TrendingUp size={24} style={{ color: 'var(--color-success)' }} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {analytics.sourceBreakdown.sms.toLocaleString()}
            </div>
            <div style={{ color: 'var(--color-gray-600)', fontWeight: '500' }}>
              SMS Detection
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)' }}>
              {((analytics.sourceBreakdown.sms / analytics.totalTickets) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics