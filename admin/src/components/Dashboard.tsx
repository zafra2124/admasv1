import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { 
  Home, 
  Trophy, 
  Ticket, 
  BarChart3, 
  Settings, 
  LogOut,
  Globe
} from 'lucide-react'
import Sidebar from './Sidebar'
import Overview from './Overview'
import WinningNumbers from './WinningNumbers'
import Tickets from './Tickets'
import Analytics from './Analytics'
import SystemSettings from './SystemSettings'

interface DashboardProps {
  onLogout: () => void
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Lottery Admin Dashboard</h1>
          <p>Comprehensive lottery management system</p>
        </div>
        <div className="header-right">
          <div className="web-badge">
            <Globe size={16} />
            <span>Web Only</span>
          </div>
          <button onClick={onLogout} className="logout-button">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/winning-numbers" element={<WinningNumbers />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<SystemSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default Dashboard