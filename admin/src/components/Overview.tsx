import React, { useState, useEffect } from 'react';
import { Users, Trophy, Calendar, Activity, TrendingUp, Plus, BarChart } from 'lucide-react'; // Added BarChart
import { useNavigate } from 'react-router-dom';
import '../index.css';

interface Stats {
  totalTickets: number;
  totalWinners: number;
  totalDraws: number;
  pendingTickets: number;
  winRate: number;
  thisMonthTickets: number;
}

const Overview: React.FC = () => {
  console.log('Overview rendering');
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalTickets: 0,
    totalWinners: 0,
    totalDraws: 0,
    pendingTickets: 0,
    winRate: 0,
    thisMonthTickets: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const mockStats = {
      totalTickets: 1247,
      totalWinners: 23,
      totalDraws: 12,
      pendingTickets: 156,
      winRate: 1.8,
      thisMonthTickets: 89,
    };
    setStats(mockStats);
  };

  const StatCard = ({
    icon: Icon,
    title,
    value,
    change,
    color = 'var(--color-primary)',
    onClick,
  }: {
    icon: any;
    title: string;
    value: string | number;
    change?: string;
    color?: string;
    onClick?: () => void;
  }) => (
    <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="stat-header">
        <div className="stat-title">{title}</div>
        <div className="stat-icon" style={{ backgroundColor: color + '20' }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {change && (
        <div className={`stat-change ${change.startsWith('+') ? 'positive' : 'negative'}`}>
          {change}
        </div>
      )}
    </div>
  );

  const QuickAction = ({
    icon: Icon,
    title,
    description,
    onClick,
    color = 'var(--color-primary)',
  }: {
    icon: any;
    title: string;
    description: string;
    onClick: () => void;
    color?: string;
  }) => (
    <div
      className="card"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: color + '20',
          }}
        >
          <Icon size={24} style={{ color }} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
            {title}
          </h3>
          <p style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem' }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="section-title">Dashboard Overview</h1>

      <div className="stats-grid">
        <StatCard
          icon={Users}
          title="Total Tickets"
          value={stats.totalTickets.toLocaleString()}
          change={`+${stats.thisMonthTickets} this month`}
          onClick={() => navigate('/tickets')}
        />
        <StatCard
          icon={Trophy}
          title="Winners"
          value={stats.totalWinners}
          change={`${stats.winRate}% win rate`}
          color="var(--color-success)"
          onClick={() => navigate('/analytics')}
        />
        <StatCard
          icon={Calendar}
          title="Total Draws"
          value={stats.totalDraws}
          color="var(--color-warning)"
          onClick={() => navigate('/winning-numbers')}
        />
        <StatCard
          icon={Activity}
          title="Pending Results"
          value={stats.pendingTickets}
          change="Awaiting draw"
          color="var(--color-danger)"
        />
      </div>

      <h2 className="section-title">Quick Actions</h2>

      <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
        <QuickAction
          icon={Plus}
          title="Add Winning Number"
          description="Announce new lottery results and update winners"
          onClick={() => navigate('/winning-numbers')}
        />
        <QuickAction
          icon={Users}
          title="View All Tickets"
          description="Browse and manage submitted lottery tickets"
          color="var(--color-success)"
          onClick={() => navigate('/tickets')}
        />
        <QuickAction
          icon={BarChart} // Changed from BarChart3 to BarChart
          title="Analytics Dashboard"
          description="View detailed reports and statistics"
          color="var(--color-warning)"
          onClick={() => navigate('/analytics')}
        />
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          System Status
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '50%',
                backgroundColor: 'var(--color-success)',
              }}
            />
            <span>Web Platform: Active</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '50%',
                backgroundColor: 'var(--color-success)',
              }}
            />
            <span>Database: Connected</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '50%',
                backgroundColor: 'var(--color-warning)',
              }}
            />
            <span>Admin Access: Web Only</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;