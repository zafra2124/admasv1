import React, { useState, useEffect } from 'react'
import { Search, Filter, Calendar, MessageSquare, User, Trophy } from 'lucide-react'

interface Ticket {
  id: string
  numbers: string
  purchaseDate: string
  source: 'manual' | 'sms'
  isWinner?: boolean
  matchCount?: number
}

const Tickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSource, setFilterSource] = useState<'all' | 'manual' | 'sms'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'winner' | 'loser'>('all')

  useEffect(() => {
    loadTickets()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [tickets, searchQuery, filterSource, filterStatus])

  const loadTickets = () => {
    // Load from localStorage or API
    const stored = localStorage.getItem('tickets')
    if (stored) {
      setTickets(JSON.parse(stored))
    } else {
      // Mock data
      const mockTickets: Ticket[] = [
        {
          id: '1',
          numbers: '1234567890',
          purchaseDate: '2025-01-10T10:00:00.000Z',
          source: 'manual',
          isWinner: true,
          matchCount: 10
        },
        {
          id: '2',
          numbers: '9876543210',
          purchaseDate: '2025-01-12T14:30:00.000Z',
          source: 'sms',
          isWinner: false,
          matchCount: 3
        },
        {
          id: '3',
          numbers: '5555555555',
          purchaseDate: '2025-01-15T09:15:00.000Z',
          source: 'manual',
          isWinner: false,
          matchCount: 0
        }
      ]
      setTickets(mockTickets)
    }
  }

  const applyFilters = () => {
    let filtered = tickets

    if (searchQuery) {
      filtered = filtered.filter(ticket => 
        ticket.numbers.includes(searchQuery) ||
        ticket.id.includes(searchQuery)
      )
    }

    if (filterSource !== 'all') {
      filtered = filtered.filter(ticket => ticket.source === filterSource)
    }

    if (filterStatus === 'winner') {
      filtered = filtered.filter(ticket => ticket.isWinner)
    } else if (filterStatus === 'loser') {
      filtered = filtered.filter(ticket => !ticket.isWinner)
    }

    setFilteredTickets(filtered)
  }

  const formatNumbers = (numbers: string): string => {
    return numbers.replace(/(\d{2})/g, '$1 ').trim()
  }

  const getMatchColor = (matchCount: number): string => {
    if (matchCount >= 10) return 'var(--color-success)'
    if (matchCount >= 7) return 'var(--color-warning)'
    if (matchCount >= 4) return 'var(--color-primary)'
    return 'var(--color-gray-400)'
  }

  const stats = {
    total: tickets.length,
    manual: tickets.filter(t => t.source === 'manual').length,
    sms: tickets.filter(t => t.source === 'sms').length,
    winners: tickets.filter(t => t.isWinner).length
  }

  return (
    <div>
      <h1 className="section-title">Tickets Management</h1>
      
      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">Total Tickets</div>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-primary)20' }}>
              <User size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
          </div>
          <div className="stat-value">{stats.total}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">Manual Entry</div>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-success)20' }}>
              <User size={20} style={{ color: 'var(--color-success)' }} />
            </div>
          </div>
          <div className="stat-value">{stats.manual}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">SMS Detected</div>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-warning)20' }}>
              <MessageSquare size={20} style={{ color: 'var(--color-warning)' }} />
            </div>
          </div>
          <div className="stat-value">{stats.sms}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">Winners</div>
            <div className="stat-icon" style={{ backgroundColor: 'var(--color-danger)20' }}>
              <Trophy size={20} style={{ color: 'var(--color-danger)' }} />
            </div>
          </div>
          <div className="stat-value">{stats.winners}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={20} style={{ 
              position: 'absolute', 
              left: '0.75rem', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--color-gray-400)'
            }} />
            <input
              type="text"
              placeholder="Search by ticket numbers or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          
          <select 
            value={filterSource} 
            onChange={(e) => setFilterSource(e.target.value as any)}
            style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--color-gray-200)' }}
          >
            <option value="all">All Sources</option>
            <option value="manual">Manual</option>
            <option value="sms">SMS</option>
          </select>
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value as any)}
            style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--color-gray-200)' }}
          >
            <option value="all">All Status</option>
            <option value="winner">Winners</option>
            <option value="loser">Non-Winners</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          Tickets ({filteredTickets.length})
        </h3>
        
        {filteredTickets.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket Numbers</th>
                  <th>Source</th>
                  <th>Purchase Date</th>
                  <th>Status</th>
                  <th>Matches</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets
                  .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
                  .map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <span style={{ 
                        fontFamily: 'monospace', 
                        fontSize: '1.125rem', 
                        fontWeight: '600',
                        letterSpacing: '0.1em'
                      }}>
                        {formatNumbers(ticket.numbers)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${ticket.source === 'sms' ? 'badge-success' : 'badge-warning'}`}>
                        {ticket.source.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} style={{ color: 'var(--color-gray-400)' }} />
                        {new Date(ticket.purchaseDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${ticket.isWinner ? 'badge-success' : 'badge-danger'}`}>
                        {ticket.isWinner ? 'WINNER' : 'NO WIN'}
                      </span>
                    </td>
                    <td>
                      {ticket.matchCount !== undefined && (
                        <span style={{ 
                          color: getMatchColor(ticket.matchCount),
                          fontWeight: '600'
                        }}>
                          {ticket.matchCount}/10
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <User size={48} />
            <h3>No tickets found</h3>
            <p>
              {searchQuery || filterSource !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Tickets will appear here once users start adding them'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Tickets