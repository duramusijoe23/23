import React, { useState, useEffect } from 'react';
import { Wifi, Router, Smartphone, Laptop, Monitor, Server, AlertTriangle, CheckCircle, RefreshCw, Search, Filter } from 'lucide-react';
import { deviceDiscovery, NetworkDevice } from '../services/DeviceDiscovery';
import { Theme } from '../hooks/useTheme';

interface NetworkDevicesProps {
  theme?: Theme;
}

const deviceIcons = {
  router: Router,
  laptop: Laptop,
  smartphone: Smartphone,
  server: Server,
  desktop: Monitor,
  unknown: Monitor,
};

const statusColors = {
  online: 'text-green-500',
  responding: 'text-green-500',
  offline: 'text-red-500',
};

const NetworkDevices: React.FC<NetworkDevicesProps> = ({ theme = 'dark' }) => {
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  useEffect(() => {
    // Get initial devices
    setDevices(deviceDiscovery.getDevices());

    // Listen for device updates
    const unsubscribe = deviceDiscovery.onDevicesUpdate((updatedDevices) => {
      setDevices(updatedDevices);
      setLastScanTime(new Date());
    });

    return unsubscribe;
  }, []);

  const handleRefreshScan = async () => {
    setIsScanning(true);
    try {
      const discoveredDevices = await deviceDiscovery.refreshDevices();
      setDevices(discoveredDevices);
      setLastScanTime(new Date());
    } catch (error) {
      console.error('Device scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  // Filter devices based on search and filters
  const filteredDevices = devices.filter(device => {
    const matchesSearch = searchTerm === '' || 
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.ip.includes(searchTerm);
    
    const matchesType = filterType === 'all' || device.type === filterType;
    const matchesStatus = filterStatus === 'all' || device.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = deviceDiscovery.getDeviceStats();
  const topology = deviceDiscovery.getNetworkTopology();

  return (
    <div className="space-y-6">
      {/* Network Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`rounded-xl p-6 border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Total Devices</p>
              <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>Discovered</p>
            </div>
            <Wifi className="h-8 w-8 text-blue-400" />
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
              }`}>Online</p>
              <p className="text-2xl font-bold text-green-400">{stats.online}</p>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>Responding</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
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
              }`}>Offline</p>
              <p className="text-2xl font-bold text-red-400">{stats.offline}</p>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>Not responding</p>
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
              }`}>Gateway</p>
              <p className="text-lg font-bold text-purple-400">{topology.gateway}</p>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>Network: {topology.subnet}.0/24</p>
            </div>
            <Router className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={`rounded-xl p-6 border ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-semibold">Network Devices</h3>
            {lastScanTime && (
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Last scan: {lastScanTime.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 w-full lg:w-64 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400'
                    : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border border-gray-600 text-white'
                    : 'bg-gray-50 border border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">All Types</option>
                <option value="router">Routers</option>
                <option value="server">Servers</option>
                <option value="laptop">Laptops</option>
                <option value="desktop">Desktops</option>
                <option value="smartphone">Mobile</option>
                <option value="unknown">Unknown</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border border-gray-600 text-white'
                    : 'bg-gray-50 border border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="responding">Responding</option>
                <option value="offline">Offline</option>
              </select>

              <button
                onClick={handleRefreshScan}
                disabled={isScanning}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isScanning
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning...' : 'Scan Network'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Device List */}
      <div className={`rounded-xl p-6 border ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="space-y-4">
          {filteredDevices.length === 0 ? (
            <div className="text-center py-12">
              <Wifi className={`h-12 w-12 mx-auto mb-4 ${
                theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                {devices.length === 0 ? 'No devices discovered yet' : 'No devices match your filters'}
              </p>
              {devices.length === 0 && (
                <button
                  onClick={handleRefreshScan}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Start Network Scan
                </button>
              )}
            </div>
          ) : (
            filteredDevices.map((device) => {
              const IconComponent = deviceIcons[device.type];
              return (
                <div
                  key={device.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'border-gray-700 hover:bg-gray-700/50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <IconComponent className={`w-6 h-6 ${statusColors[device.status]}`} />
                    </div>
                    <div>
                      <h3 className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {device.name}
                      </h3>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {device.ip} • Last seen: {device.lastSeen.toLocaleTimeString()}
                      </p>
                      {device.services.length > 0 && (
                        <p className={`text-xs ${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          Services: {device.services.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      {device.responseTime && (
                        <p className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {device.responseTime.toFixed(0)}ms
                        </p>
                      )}
                      <div className="flex items-center space-x-1">
                        {device.status === 'online' || device.status === 'responding' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-xs capitalize ${statusColors[device.status]}`}>
                          {device.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Network Topology */}
      <div className={`rounded-xl p-6 border ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <h3 className="text-lg font-semibold mb-4">Network Topology</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Gateway</p>
            <p className="text-lg font-semibold text-purple-400">{topology.gateway}</p>
          </div>
          <div className="text-center">
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Subnet</p>
            <p className="text-lg font-semibold text-blue-400">{topology.subnet}.0/24</p>
          </div>
          <div className="text-center">
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Active Connections</p>
            <p className="text-lg font-semibold text-green-400">{topology.activeConnections}</p>
          </div>
          <div className="text-center">
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Device Types</p>
            <p className="text-lg font-semibold text-yellow-400">
              {Object.values(stats).filter((v, i) => i > 2).reduce((a: number, b: number) => a + b, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Device Type Breakdown */}
      <div className={`rounded-xl p-6 border ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <h3 className="text-lg font-semibold mb-4">Device Type Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { type: 'routers', label: 'Routers', icon: Router, count: stats.routers, color: 'text-purple-400' },
            { type: 'servers', label: 'Servers', icon: Server, count: stats.servers, color: 'text-blue-400' },
            { type: 'workstations', label: 'Workstations', icon: Monitor, count: stats.workstations, color: 'text-green-400' },
            { type: 'mobile', label: 'Mobile', icon: Smartphone, count: stats.mobile, color: 'text-yellow-400' },
            { type: 'unknown', label: 'Unknown', icon: Monitor, count: stats.unknown, color: 'text-gray-400' }
          ].map(({ type, label, icon: Icon, count, color }) => (
            <div key={type} className="text-center">
              <Icon className={`h-8 w-8 mx-auto mb-2 ${color}`} />
              <p className="text-2xl font-bold">{count}</p>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scanning Status */}
      {isScanning && (
        <div className={`rounded-xl p-4 border ${
          theme === 'dark' 
            ? 'bg-blue-900/20 border-blue-500/30' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
            <div>
              <h4 className="font-medium text-blue-400">Network Scan in Progress</h4>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-blue-300' : 'text-blue-600'
              }`}>
                Discovering devices on your network... This may take up to 30 seconds.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className={`rounded-xl p-4 border ${
        theme === 'dark' 
          ? 'bg-yellow-900/20 border-yellow-500/30' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-400">Real Network Discovery</h4>
            <p className={`text-sm mt-1 ${
              theme === 'dark' ? 'text-yellow-300' : 'text-yellow-600'
            }`}>
              This tool performs actual network discovery by probing IP addresses in your local network range. 
              Due to browser security limitations, some devices may not respond to probes even if they're online.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkDevices;