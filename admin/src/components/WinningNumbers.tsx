import React, { useState, useEffect } from 'react'
import { Plus, Calendar, Edit, Trash2, Trophy } from 'lucide-react'

interface WinningNumber {
  id: string
  numbers: string
  drawDate: string
  month: string
}

const WinningNumbers: React.FC = () => {
  const [winningNumbers, setWinningNumbers] = useState<WinningNumber[]>([])
  const [isAddingNumber, setIsAddingNumber] = useState(false)
  const [editingNumber, setEditingNumber] = useState<WinningNumber | null>(null)
  const [formData, setFormData] = useState({
    numbers: '',
    month: '',
    drawDate: ''
  })

  useEffect(() => {
    loadWinningNumbers()
    
    // Set default values
    const currentMonth = new Date().toISOString().substring(0, 7)
    const currentDate = new Date().toISOString().substring(0, 10)
    setFormData(prev => ({
      ...prev,
      month: currentMonth,
      drawDate: currentDate
    }))
  }, [])

  const loadWinningNumbers = () => {
    // Load from localStorage or API
    const stored = localStorage.getItem('winningNumbers')
    if (stored) {
      setWinningNumbers(JSON.parse(stored))
    }
  }

  const saveWinningNumbers = (numbers: WinningNumber[]) => {
    localStorage.setItem('winningNumbers', JSON.stringify(numbers))
    setWinningNumbers(numbers)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!/^\d{10}$/.test(formData.numbers)) {
      alert('Please enter exactly 10 digits')
      return
    }

    const newNumber: WinningNumber = {
      id: editingNumber?.id || Date.now().toString(),
      numbers: formData.numbers,
      month: formData.month,
      drawDate: new Date(formData.drawDate).toISOString()
    }

    let updatedNumbers = [...winningNumbers]
    
    if (editingNumber) {
      updatedNumbers = updatedNumbers.map(n => n.id === editingNumber.id ? newNumber : n)
    } else {
      updatedNumbers.push(newNumber)
    }

    saveWinningNumbers(updatedNumbers)
    resetForm()
    alert(editingNumber ? 'Winning number updated!' : 'Winning number added!')
  }

  const handleEdit = (number: WinningNumber) => {
    setEditingNumber(number)
    setFormData({
      numbers: number.numbers,
      month: number.month,
      drawDate: number.drawDate.substring(0, 10)
    })
    setIsAddingNumber(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this winning number?')) {
      const updatedNumbers = winningNumbers.filter(n => n.id !== id)
      saveWinningNumbers(updatedNumbers)
    }
  }

  const resetForm = () => {
    setFormData({ numbers: '', month: '', drawDate: '' })
    setIsAddingNumber(false)
    setEditingNumber(null)
  }

  const formatNumbers = (numbers: string): string => {
    return numbers.replace(/(\d{2})/g, '$1 ').trim()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="section-title" style={{ marginBottom: 0 }}>Winning Numbers</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setIsAddingNumber(true)}
        >
          <Plus size={20} />
          Add Number
        </button>
      </div>

      {isAddingNumber && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            {editingNumber ? 'Edit Winning Number' : 'Add New Winning Number'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Winning Numbers (10 digits)</label>
              <input
                type="text"
                value={formData.numbers}
                onChange={(e) => setFormData(prev => ({ ...prev, numbers: e.target.value }))}
                placeholder="Enter 10 digits"
                maxLength={10}
                pattern="\d{10}"
                required
              />
              <small style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
                Example: 1234567890
              </small>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Month</label>
                <input
                  type="month"
                  value={formData.month}
                  onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Draw Date</label>
                <input
                  type="date"
                  value={formData.drawDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, drawDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingNumber ? 'Update' : 'Add'} Number
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          Winning Numbers History ({winningNumbers.length})
        </h3>
        
        {winningNumbers.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Winning Numbers</th>
                  <th>Month</th>
                  <th>Draw Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {winningNumbers
                  .sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime())
                  .map((number) => (
                  <tr key={number.id}>
                    <td>
                      <span style={{ 
                        fontFamily: 'monospace', 
                        fontSize: '1.125rem', 
                        fontWeight: '600',
                        color: 'var(--color-warning)',
                        letterSpacing: '0.1em'
                      }}>
                        {formatNumbers(number.numbers)}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info">
                        {new Date(number.month + '-01').toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} style={{ color: 'var(--color-gray-400)' }} />
                        {new Date(number.drawDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleEdit(number)}
                          style={{ padding: '0.5rem' }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(number.id)}
                          style={{ padding: '0.5rem' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Trophy size={48} />
            <h3>No winning numbers yet</h3>
            <p>Add the first winning number to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WinningNumbers