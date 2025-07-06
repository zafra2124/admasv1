import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  Home, 
  Trophy, 
  Ticket, 
  BarChart3, 
  Settings
} from 'lucide-react'

const Sidebar: React.FC = () => {
  const navItems = [
    { path: '/', icon: Home, label: 'Overview' },
    { path: '/winning-numbers', icon: Trophy, label: 'Winning Numbers' },
    { path: '/tickets', icon: Ticket, label: 'Tickets' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <nav className="sidebar">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => 
            `nav-item ${isActive ? 'active' : ''}`
          }
          end={item.path === '/'}
        >
          <item.icon size={20} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default Sidebar