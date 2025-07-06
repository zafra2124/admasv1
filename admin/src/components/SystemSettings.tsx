import React, { useState } from 'react'
import { Settings, Database, Bell, Shield, Download, Upload, Trash2 } from 'lucide-react'

interface SystemSettings {
  autoNotifications: boolean
  smsMonitoring: boolean
  dataRetentionDays: number
  maxTicketsPerUser: number
  systemMaintenance: boolean
}

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    autoNotifications: true,
    smsMonitoring: false,
    dataRetentionDays: 365,
    maxTicketsPerUser: 100,
    systemMaintenance: false
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Save to localStorage or API
      localStorage.setItem('systemSettings', JSON.stringify(settings))
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      alert('Settings saved successfully!')
    } catch (error) {
      alert('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    setIsLoading(true)
    try {
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Data exported successfully!')
    } catch (error) {
      alert('Failed to export data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    setIsLoading(true)
    try {
      // Simulate data import
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Data imported successfully!')
    } catch (error) {
      alert('Failed to import data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.clear()
      alert('All data has been cleared')
    }
  }

  const Toggle = ({ 
    checked, 
    onChange 
  }: {
    checked: boolean
    onChange: (checked: boolean) => void
  }) => (
    <div 
      onClick={() => onChange(!checked)}
      style={{
        width: '3rem',
        height: '1.5rem',
        borderRadius: '0.75rem',
        backgroundColor: checked ? 'var(--color-primary)' : 'var(--color-gray-300)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease'
      }}
    >
      <div
        style={{
          width: '1.25rem',
          height: '1.25rem',
          borderRadius: '50%',
          backgroundColor: 'white',
          position: 'absolute',
          top: '0.125rem',
          left: checked ? '1.625rem' : '0.125rem',
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      />
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="section-title" style={{ marginBottom: 0 }}>System Settings</h1>
        <button 
          className="btn btn-primary"
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* System Configuration */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          System Configuration
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Bell size={20} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontWeight: '500' }}>Auto Notifications</span>
              </div>
              <p style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem' }}>
                Automatically notify users of new results
              </p>
            </div>
            <Toggle
              checked={settings.autoNotifications}
              onChange={(checked) => setSettings(prev => ({ ...prev, autoNotifications: checked }))}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Database size={20} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontWeight: '500' }}>SMS Monitoring</span>
              </div>
              <p style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem' }}>
                Monitor SMS for automatic ticket detection
              </p>
            </div>
            <Toggle
              checked={settings.smsMonitoring}
              onChange={(checked) => setSettings(prev => ({ ...prev, smsMonitoring: checked }))}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Shield size={20} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontWeight: '500' }}>System Maintenance</span>
              </div>
              <p style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem' }}>
                Enable maintenance mode
              </p>
            </div>
            <Toggle
              checked={settings.systemMaintenance}
              onChange={(checked) => setSettings(prev => ({ ...prev, systemMaintenance: checked }))}
            />
          </div>
        </div>
      </div>

      {/* System Limits */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          System Limits
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div className="form-group">
            <label>Data Retention (Days)</label>
            <input
              type="number"
              value={settings.dataRetentionDays}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                dataRetentionDays: parseInt(e.target.value) || 365 
              }))}
              min="1"
              max="3650"
            />
            <small style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
              How long to keep lottery data before automatic cleanup
            </small>
          </div>
          
          <div className="form-group">
            <label>Max Tickets Per User</label>
            <input
              type="number"
              value={settings.maxTicketsPerUser}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                maxTicketsPerUser: parseInt(e.target.value) || 100 
              }))}
              min="1"
              max="1000"
            />
            <small style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>
              Maximum number of tickets a user can submit per month
            </small>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          Data Management
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <button 
            className="btn btn-secondary"
            onClick={handleExport}
            disabled={isLoading}
            style={{ justifyContent: 'flex-start' }}
          >
            <Download size={20} />
            Export Data
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={handleImport}
            disabled={isLoading}
            style={{ justifyContent: 'flex-start' }}
          >
            <Upload size={20} />
            Import Data
          </button>
          
          <button 
            className="btn btn-danger"
            onClick={handleClearData}
            disabled={isLoading}
            style={{ justifyContent: 'flex-start' }}
          >
            <Trash2 size={20} />
            Clear All Data
          </button>
        </div>
      </div>

      {/* System Information */}
      <div className="card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          System Information
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              Version
            </div>
            <div style={{ fontWeight: '500' }}>1.0.0</div>
          </div>
          
          <div>
            <div style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              Platform
            </div>
            <div style={{ fontWeight: '500' }}>Web Admin</div>
          </div>
          
          <div>
            <div style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              Last Updated
            </div>
            <div style={{ fontWeight: '500' }}>
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemSettings