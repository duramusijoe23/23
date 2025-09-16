import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, X, Filter, Search } from 'lucide-react';

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'bandwidth' | 'security' | 'system' | 'network';
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  source: string;
}

const AlertSystem: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const initialAlerts: Alert[] = [
      {
        id: '1',
        title: 'High Bandwidth Usage',
        description: 'Bandwidth utilization has exceeded 90% for the past 15 minutes',
        severity: 'high',
        category: 'bandwidth',
        timestamp: new Date(Date.now() - 900000),
        status: 'active',
        source: 'Bandwidth Monitor'
      },
      {
        id: '2',
        title: 'Security Breach Attempt',
        description: 'Multiple failed login attempts from IP 192.168.1.100',
        severity: 'critical',
        category: 'security',
        timestamp: new Date(Date.now() - 1200000),
        status: 'acknowledged',
        source: 'Security System'
      },
      {
        id: '3',
        title: 'Server Response Slow',
        description: 'Web server response time increased to 3.2 seconds',
        severity: 'medium',
        category: 'system',
        timestamp: new Date(Date.now() - 1800000),
        status: 'active',
        source: 'Performance Monitor'
      },
      {
        id: '4',
        title: 'Network Device Offline',
        description: 'Router R-001 has been offline for 5 minutes',
        severity: 'high',
        category: 'network',
        timestamp: new Date(Date.now() - 300000),
        status: 'active',
        source: 'Network Monitor'
      },
      {
        id: '5',
        title: 'Storage Space Low',
        description: 'Database server storage is 85% full',
        severity: 'medium',
        category: 'system',
        timestamp: new Date(Date.now() - 2700000),
        status: 'resolved',
        source: 'System Monitor'
      },
      {
        id: '6',
        title: 'Unusual Traffic Pattern',
        description: 'Detected abnormal traffic spike from external sources',
        severity: 'low',
        category: 'security',
        timestamp: new Date(Date.now() - 3600000),
        status: 'acknowledged',
        source: 'Traffic Analyzer'
      }
    ];

    setAlerts(initialAlerts);
    setFilteredAlerts(initialAlerts);
  }, []);

  useEffect(() => {
    let filtered = alerts;

    if (searchTerm) {
      filtered = filtered.filter(alert =>
        alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(alert => alert.severity === selectedSeverity);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(alert => alert.category === selectedCategory);
    }

    setFilteredAlerts(filtered);
  }, [alerts, searchTerm, selectedSeverity, selectedCategory]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-900/20 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'low': return 'text-green-400 bg-green-900/20 border-green-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-400 bg-red-900/20';
      case 'acknowledged': return 'text-yellow-400 bg-yellow-900/20';
      case 'resolved': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const handleAcknowledge = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId && alert.status === 'active'
          ? { ...alert, status: 'acknowledged' }
          : alert
      )
    );
  };

  const handleResolve = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId && alert.status !== 'resolved'
          ? { ...alert, status: 'resolved' }
          : alert
      )
    );
  };

  const handleDismiss = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const stats = {
    active: alerts.filter(a => a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    critical: alerts.filter(a => a.severity === 'critical').length
  };

  return (
    <div className="space-y-6">
      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Alerts</p>
              <p className="text-2xl font-bold text-red-400">{stats.active}</p>
              <p className="text-xs text-red-400">Requires attention</p>
            </div>
            <Bell className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Acknowledged</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.acknowledged}</p>
              <p className="text-xs text-yellow-400">Under review</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Resolved</p>
              <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
              <p className="text-xs text-green-400">Today</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Critical Alerts</p>
              <p className="text-2xl font-bold text-purple-400">{stats.critical}</p>
              <p className="text-xs text-purple-400">High priority</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <h3 className="text-xl font-semibold">Alert Management</h3>
          
          <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 w-full lg:w-64"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="bandwidth">Bandwidth</option>
                <option value="security">Security</option>
                <option value="system">System</option>
                <option value="network">Network</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No alerts match your criteria</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-4 transition-all hover:bg-gray-700/30 ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-white">{alert.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(alert.status)}`}>
                        {alert.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-3">{alert.description}</p>
                    
                    <div className="flex items-center space-x-6 text-xs text-gray-400">
                      <span>Source: {alert.source}</span>
                      <span>Category: {alert.category}</span>
                      <span>{alert.timestamp.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {alert.status === 'active' && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-xs rounded transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                    
                    {alert.status !== 'resolved' && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-xs rounded transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Alert History */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { action: 'Alert resolved', alert: 'Database connection timeout', time: '2 minutes ago' },
            { action: 'Alert acknowledged', alert: 'High CPU usage on Server 03', time: '15 minutes ago' },
            { action: 'New alert created', alert: 'SSL certificate expiring soon', time: '1 hour ago' },
            { action: 'Alert resolved', alert: 'Network latency spike', time: '3 hours ago' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div>
                  <p className="text-sm text-white">{activity.action}</p>
                  <p className="text-xs text-gray-400">{activity.alert}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlertSystem;