import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wifi, Download, Upload } from 'lucide-react';
import BandwidthAllocation from './BandwidthAllocation';
import { Theme } from '../hooks/useTheme';
import { networkMonitor, NetworkStats } from '../services/NetworkMonitor';
import { realTimeMonitor, RealTimeData } from '../services/RealTimeMonitor';

interface BandwidthData {
  time: string;
  upload: number;
  download: number;
  total: number;
}

interface BandwidthMonitorProps {
  compact?: boolean;
  theme?: Theme;
}

const BandwidthMonitor: React.FC<BandwidthMonitorProps> = ({ compact = false, theme = 'dark' }) => {
  const [data, setData] = useState<BandwidthData[]>([]);
  const [activeView, setActiveView] = useState<'monitor' | 'allocation'>('monitor');
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [connectivityTest, setConnectivityTest] = useState<any[]>([]);

  useEffect(() => {
    // Start real-time monitoring
    realTimeMonitor.start();
    
    // Get initial network stats
    setNetworkStats(networkMonitor.getConnectionInfo());
    
    // Listen for real-time updates
    const unsubscribe = realTimeMonitor.onDataUpdate((data) => {
      setRealTimeData(data);
      
      // Update bandwidth chart data
      setData(prev => {
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          upload: data.bandwidth.upload / 1000, // Convert to Mbps
          download: data.bandwidth.download / 1000, // Convert to Mbps
          total: (data.bandwidth.upload + data.bandwidth.download) / 1000
        };
        
        const newData = [...prev.slice(-19), newPoint]; // Keep last 20 points
        return newData;
      });
    });

    // Listen for connection changes
    networkMonitor.onConnectionChange((stats) => {
      setNetworkStats(stats);
    });

    // Test connectivity to common services
    realTimeMonitor.testConnectivity().then(setConnectivityTest);

    return () => {
      unsubscribe();
      realTimeMonitor.stop();
    };
  }, []);

  const currentStats = realTimeData ? {
    upload: Math.round(realTimeData.bandwidth.upload / 1000),
    download: Math.round(realTimeData.bandwidth.download / 1000),
    peak: Math.max(...data.map(d => d.total), realTimeData.bandwidth.download / 1000),
    average: Math.round(data.reduce((sum, d) => sum + d.total, 0) / Math.max(data.length, 1))
  } : {
    upload: 0,
    download: 0,
    peak: 0,
    average: 0
  };

  const maxValue = Math.max(...data.map(d => d.total), 800);

  if (compact) {
    return (
      <div className={`rounded-xl p-6 border ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Bandwidth Usage</h3>
          <Wifi className="h-5 w-5 text-blue-400" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-green-400 mb-1">
              <Upload className="h-4 w-4" />
              <span className="text-sm">Upload</span>
            </div>
            <p className="text-xl font-bold">{currentStats.upload} Mbps</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-blue-400 mb-1">
              <Download className="h-4 w-4" />
              <span className="text-sm">Download</span>
            </div>
            <p className="text-xl font-bold">{currentStats.download} Mbps</p>
          </div>
        </div>

        <div className="h-32 flex items-end space-x-1">
          {data.slice(-15).map((point, index) => (
            <div key={index} className="flex-1 flex flex-col justify-end">
              <div
                className="bg-blue-500 rounded-t transition-all duration-500"
                style={{
                  height: `${(point.download / maxValue) * 100}%`,
                  minHeight: '2px'
                }}
              />
              <div
                className="bg-green-500 rounded-b transition-all duration-500"
                style={{
                  height: `${(point.upload / maxValue) * 100}%`,
                  minHeight: '2px'
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      {!compact && (
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setActiveView('monitor')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeView === 'monitor'
                ? 'bg-blue-600 text-white'
                : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bandwidth Monitor
          </button>
          <button
            onClick={() => setActiveView('allocation')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeView === 'allocation'
                ? 'bg-blue-600 text-white'
                : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bandwidth Allocation
          </button>
        </div>
      )}

      {/* Render based on active view */}
      {activeView === 'allocation' && !compact ? (
        <BandwidthAllocation theme={theme} />
      ) : (
        <>
      {/* Current Stats */}
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
              }`}>Current Upload</p>
              <p className="text-2xl font-bold text-green-400">{currentStats.upload}</p>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>Mbps</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-400" />
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
              }`}>Current Download</p>
              <p className="text-2xl font-bold text-blue-400">{currentStats.download}</p>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>Mbps</p>
            </div>
            <TrendingDown className="h-8 w-8 text-blue-400" />
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
              }`}>Peak Usage</p>
              <p className="text-2xl font-bold text-yellow-400">{currentStats.peak}</p>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>Mbps</p>
            </div>
            <Wifi className="h-8 w-8 text-yellow-400" />
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
              }`}>Average Usage</p>
              <p className="text-2xl font-bold text-purple-400">{currentStats.average}</p>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>Mbps</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Real-time Chart */}
      <div className={`rounded-xl p-6 border ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Real-time Bandwidth Usage</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Download</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Upload</span>
            </div>
          </div>
        </div>

        <div className="h-64 flex items-end space-x-2">
          {data.map((point, index) => (
            <div key={index} className="flex-1 flex flex-col justify-end group">
              <div
                className="bg-blue-500 rounded-t transition-all duration-500 group-hover:bg-blue-400"
                style={{
                  height: `${(point.download / maxValue) * 100}%`,
                  minHeight: '4px'
                }}
              />
              <div
                className="bg-green-500 rounded-b transition-all duration-500 group-hover:bg-green-400"
                style={{
                  height: `${(point.upload / maxValue) * 100}%`,
                  minHeight: '4px'
                }}
              />
            </div>
          ))}
        </div>

        <div className={`flex justify-between mt-4 text-xs ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <span>{data.length > 0 ? data[0].time : ''}</span>
          <span>Real-time</span>
          <span>{data.length > 0 ? data[data.length - 1].time : ''}</span>
        </div>
      </div>

      {/* Real Network Information */}
      <div className={`rounded-xl p-6 border ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <h3 className="text-xl font-semibold mb-4">Real Network Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {networkStats && (
            <>
              <div className="text-center">
                <p className="text-sm text-gray-400">Connection Type</p>
                <p className="text-lg font-semibold text-blue-400 capitalize">
                  {networkStats.effectiveType}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Downlink Speed</p>
                <p className="text-lg font-semibold text-green-400">
                  {networkStats.downlink} Mbps
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Round Trip Time</p>
                <p className="text-lg font-semibold text-yellow-400">
                  {networkStats.rtt} ms
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Data Saver</p>
                <p className={`text-lg font-semibold ${
                  networkStats.saveData ? 'text-orange-400' : 'text-green-400'
                }`}>
                  {networkStats.saveData ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Connectivity Test Results */}
      {connectivityTest.length > 0 && (
        <div className={`rounded-xl p-6 border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h3 className="text-xl font-semibold mb-4">External Connectivity Test</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectivityTest.map((test, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{test.service}</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      test.status === 'online' ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <span className={`text-xs ${
                      test.status === 'online' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {test.status}
                    </span>
                  </div>
                </div>
                {test.latency && (
                  <p className="text-xs text-gray-400 mt-1">
                    Latency: {test.latency}ms
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Traffic Analysis */}
        </>
      )}
    </div>
  );
};

export default BandwidthMonitor;