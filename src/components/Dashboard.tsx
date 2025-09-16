import React, { useState, useEffect } from 'react';
import { Wifi, Shield, AlertTriangle, Activity, Server, Users, TrendingUp, Eye, LogOut, User, Sun, Moon } from 'lucide-react';
import BandwidthMonitor from './BandwidthMonitor';
import ThreatDetection from './ThreatDetection';
import AlertSystem from './AlertSystem';
import NetworkDevices from './NetworkDevices';
import { useTheme } from '../hooks/useTheme';
import { realTimeMonitor, RealTimeData } from '../services/RealTimeMonitor';
import { deviceDiscovery, NetworkDevice } from '../services/DeviceDiscovery';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  username: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface DashboardProps {
  user: SupabaseUser;
  onLogout: () => void;
}

interface DashboardStats {
  totalBandwidth: number;
  usedBandwidth: number;
  activeDevices: number;
  threats: number;
  alerts: number;
  uptime: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [networkDevices, setNetworkDevices] = useState<NetworkDevice[]>([]);

  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Start real-time monitoring
    realTimeMonitor.start();
    
    // Get initial devices
    setNetworkDevices(deviceDiscovery.getDevices());
    
    // Listen for real-time updates
    const unsubscribe = realTimeMonitor.onDataUpdate((data) => {
      setRealTimeData(data);
    });

    // Listen for device updates
    const unsubscribeDevices = deviceDiscovery.onDevicesUpdate((devices) => {
      setNetworkDevices(devices);
    });

    // Get system status
    const updateSystemStatus = () => {
      setSystemStatus(realTimeMonitor.getSystemStatus());
    };
    
    updateSystemStatus();
    const statusInterval = setInterval(updateSystemStatus, 5000);

    return () => {
      unsubscribe();
      unsubscribeDevices();
      realTimeMonitor.stop();
      clearInterval(statusInterval);
    };
  }, []);

  const activeDevicesCount = networkDevices.filter(device => 
    device.status === 'online' || device.status === 'responding'
  ).length;

  const stats = realTimeData ? {
    totalBandwidth: 1000,
    usedBandwidth: Math.round(realTimeData.bandwidth.download / 1000),
    activeDevices: activeDevicesCount,
    threats: realTimeData.security.events.length,
    alerts: realTimeData.security.events.filter(e => e.severity === 'high' || e.severity === 'critical').length,
    uptime: `${realTimeData.performance.networkQuality}%`
  } : {
    totalBandwidth: 1000,
    usedBandwidth: 0,
    activeDevices: activeDevicesCount,
    threats: 0,
    alerts: 0,
    uptime: '0%'
  };

  const bandwidthPercentage = stats.totalBandwidth > 0 ? (stats.usedBandwidth / stats.totalBandwidth) * 100 : 0;

  return (
    <div className={`min-h-screen ${
      theme === 'dark' 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`border-b px-6 py-4 ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold">NetWatch Pro</h1>
              <p className="text-gray-400 text-sm">Network Monitoring & Security</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <User className="h-5 w-5 text-blue-400" />
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>{user.email?.split('@')[0] || 'User'}</p>
                <p className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Network Admin</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>System Uptime</p>
              <p className="text-lg font-semibold text-green-400">{stats.uptime}</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <button
                onClick={onLogout}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className={`border-b px-6 py-3 ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'bandwidth', label: 'Bandwidth', icon: TrendingUp },
            { id: 'threats', label: 'Security', icon: Shield },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
            { id: 'devices', label: 'Devices', icon: Server }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === id
                  ? 'bg-blue-600 text-white'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`rounded-xl p-6 border ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>Bandwidth Usage</p>
                    <p className="text-2xl font-bold">{stats.usedBandwidth} Mbps</p>
                    <p className={`text-xs ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    }`}>of {stats.totalBandwidth} Mbps</p>
                    {realTimeData && (
                      <p className="text-xs text-blue-400">
                        Real connection: {realTimeData.networkStats.effectiveType}
                      </p>
                    )}
                  </div>
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke={theme === 'dark' ? 'rgb(55, 65, 81)' : 'rgb(229, 231, 235)'}
                        strokeWidth="4"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke={bandwidthPercentage > 80 ? "rgb(239, 68, 68)" : bandwidthPercentage > 60 ? "rgb(251, 191, 36)" : "rgb(34, 197, 94)"}
                        strokeWidth="4"
                        strokeDasharray={`${bandwidthPercentage * 1.76} 176`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold">{Math.round(bandwidthPercentage)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`rounded-xl p-6 border ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>Active Devices</p>
                    <p className="text-2xl font-bold text-blue-400">{stats.activeDevices}</p>
                    <p className="text-xs text-blue-400">
                      {networkDevices.length} total discovered
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
              </div>

              <div className={`rounded-xl p-6 border ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>Security Threats</p>
                    <p className="text-2xl font-bold text-red-400">{stats.threats}</p>
                    <p className="text-xs text-red-400">
                      {realTimeData?.security.threatLevel || 'low'} threat level
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>
              </div>

              <div className={`rounded-xl p-6 border ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>Active Alerts</p>
                    <p className="text-2xl font-bold text-yellow-400">{stats.alerts}</p>
                    <p className="text-xs text-yellow-400">
                      {realTimeData?.security.events.filter(e => e.severity === 'critical').length || 0} critical
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-yellow-400" />
                </div>
              </div>
            </div>

            {/* Quick Overview Components */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BandwidthMonitor compact={true} theme={theme} />
              <ThreatDetection compact={true} theme={theme} />
            </div>
          </div>
        )}

        {/* Bandwidth Tab */}
        {activeTab === 'bandwidth' && <BandwidthMonitor theme={theme} />}

        {/* Threats Tab */}
        {activeTab === 'threats' && <ThreatDetection theme={theme} />}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && <AlertSystem theme={theme} />}

        {/* Devices Tab */}
        {activeTab === 'devices' && <NetworkDevices theme={theme} />}
      </div>
    </div>
  );
};

export default Dashboard;