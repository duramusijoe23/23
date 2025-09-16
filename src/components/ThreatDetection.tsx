import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, X, Settings, Mail, Bell, BellOff, CheckCircle, RefreshCw, Brain, TrendingUp, Activity } from 'lucide-react';
import { securityMonitor, SecurityEvent } from '../services/SecurityMonitor';
import { mlThreatDetection } from '../services/MLThreatDetection';
import { Theme } from '../hooks/useTheme';

interface AlertSettings {
  emailEnabled: boolean;
  email: string;
  criticalOnly: boolean;
  instantAlerts: boolean;
}

interface ThreatDetectionProps {
  compact?: boolean;
  theme?: Theme;
}

const severityColors = {
  low: 'text-blue-400 bg-blue-900/20 border-blue-500/30',
  medium: 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30',
  high: 'text-orange-400 bg-orange-900/20 border-orange-500/30',
  critical: 'text-red-400 bg-red-900/20 border-red-500/30',
};

const statusColors = {
  active: 'text-red-400 bg-red-900/20',
  resolved: 'text-green-400 bg-green-900/20',
  investigating: 'text-yellow-400 bg-yellow-900/20',
};

const ThreatDetection: React.FC<ThreatDetectionProps> = ({ compact = false, theme = 'dark' }) => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    emailEnabled: false,
    email: '',
    criticalOnly: true,
    instantAlerts: true,
  });
  const [alertsSent, setAlertsSent] = useState<Set<string>>(new Set());
  const [mlStats, setMLStats] = useState<any>(null);
  const [showMLDetails, setShowMLDetails] = useState(false);

  useEffect(() => {
    // Load alert settings from localStorage
    const savedSettings = localStorage.getItem('threatAlertSettings');
    if (savedSettings) {
      setAlertSettings(JSON.parse(savedSettings));
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Get initial security events
    setSecurityEvents(securityMonitor.getSecurityEvents());

    // Listen for new security events
    const unsubscribe = securityMonitor.onSecurityEvent((event) => {
      setSecurityEvents(prev => [event, ...prev.slice(0, 49)]); // Keep last 50 events
      
      // Check if we should send an alert
      if (alertSettings.emailEnabled && alertSettings.instantAlerts) {
        const shouldAlert = !alertSettings.criticalOnly || event.severity === 'critical';
        if (shouldAlert) {
          sendThreatAlert(event);
        }
      }
    });

    // Get ML model stats
    const updateMLStats = () => {
      setMLStats(securityMonitor.getMLModelStats());
    };
    
    updateMLStats();
    const mlStatsInterval = setInterval(updateMLStats, 10000); // Update every 10 seconds

      clearInterval(mlStatsInterval);
    return unsubscribe;
  }, [alertSettings]);

  const sendThreatAlert = (event: SecurityEvent) => {
    if (alertsSent.has(event.id)) return;

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Security Event Detected`, {
        body: `${event.type} from ${event.source}`,
        icon: '/favicon.ico',
      });
    }

    // Simulate email alert (in real implementation, this would call an API)
    console.log('🚨 EMAIL ALERT SENT:', {
      to: alertSettings.email,
      subject: `Security Alert - ${event.type}`,
      body: `
        Event Type: ${event.type}
        Severity: ${event.severity.toUpperCase()}
        Source: ${event.source}
        Description: ${event.description}
        Time: ${event.timestamp.toLocaleString()}
        Details: ${JSON.stringify(event.details, null, 2)}
      `,
    });

    setAlertsSent(prev => new Set([...prev, event.id]));
  };

  const saveAlertSettings = (settings: AlertSettings) => {
    setAlertSettings(settings);
    localStorage.setItem('threatAlertSettings', JSON.stringify(settings));
    setShowSettings(false);
  };

  const handleNetworkScan = async () => {
    setIsScanning(true);
    try {
      const results = await securityMonitor.scanLocalNetwork();
      setScanResults(results);
      
      // Create security event for scan completion
      const openPorts = results.filter(r => r.open).length;
      if (openPorts > 0) {
        // This will automatically be picked up by the security monitor
        console.log(`Network scan completed: ${openPorts} responsive services found`);
      }
    } catch (error) {
      console.error('Network scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const dismissEvent = (eventId: string) => {
    setSecurityEvents(prev => prev.filter(event => event.id !== eventId));
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'suspicious_request':
      case 'failed_auth':
        return AlertTriangle;
      case 'unusual_activity':
        return Shield;
      case 'resource_abuse':
        return RefreshCw;
      default:
        return AlertTriangle;
    }
  };

  const stats = {
    total: securityEvents.length,
    critical: securityEvents.filter(e => e.severity === 'critical').length,
    high: securityEvents.filter(e => e.severity === 'high').length,
    medium: securityEvents.filter(e => e.severity === 'medium').length,
    low: securityEvents.filter(e => e.severity === 'low').length,
    recent: securityEvents.filter(e => Date.now() - e.timestamp.getTime() < 3600000).length // Last hour
  };

  if (compact) {
    return (
      <div className={`rounded-xl p-6 border ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Security Events</h3>
          <Shield className="h-5 w-5 text-red-400" />
        </div>
        
        <div className="space-y-3">
          {securityEvents.slice(0, 3).map((event) => {
            const IconComponent = getEventTypeIcon(event.type);
            return (
              <div key={event.id} className={`p-3 rounded-lg border ${
                theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <IconComponent className={`h-4 w-4 ${
                    event.severity === 'critical' ? 'text-red-400' :
                    event.severity === 'high' ? 'text-orange-400' :
                    event.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.type.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-400">{event.source}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${severityColors[event.severity]}`}>
                    {event.severity}
                  </span>
                </div>
              </div>
            );
          })}
          
          {securityEvents.length === 0 && (
            <div className="text-center py-4">
              <Shield className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No security events detected</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Statistics */}
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
              }`}>Total Events</p>
              <p className="text-2xl font-bold text-blue-400">{stats.total}</p>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>All time</p>
            </div>
            <Shield className="h-8 w-8 text-blue-400" />
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
              }`}>Critical Events</p>
              <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>Immediate attention</p>
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
              }`}>Recent Events</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.recent}</p>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>Last hour</p>
            </div>
            <RefreshCw className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className={`rounded-xl p-6 border cursor-pointer transition-all hover:shadow-lg ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700 hover:border-purple-500/50' 
            : 'bg-white border-gray-200 hover:border-purple-500/50'
        }`} onClick={() => setShowMLDetails(!showMLDetails)}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>ML Detection</p>
              <p className="text-2xl font-bold text-purple-400">
                {mlStats?.modelTrained ? 'Active' : 'Training'}
              </p>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>{mlStats?.trainingDataSize || 0} samples</p>
            </div>
            <Brain className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* ML Model Details */}
      {showMLDetails && mlStats && (
        <div className={`rounded-xl p-6 border ${
          theme === 'dark' 
            ? 'bg-purple-900/20 border-purple-500/30' 
            : 'bg-purple-50 border-purple-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-purple-400">Machine Learning Threat Detection</h4>
            <button
              onClick={() => setShowMLDetails(false)}
              className={`p-1 rounded transition-colors ${
                theme === 'dark'
                  ? 'text-purple-400 hover:text-purple-300'
                  : 'text-purple-600 hover:text-purple-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Brain className="h-5 w-5 text-purple-400" />
                <span className="text-sm font-medium">Random Forest</span>
              </div>
              <p className="text-lg font-bold text-purple-400">50 Trees</p>
              <p className="text-xs text-purple-300">Ensemble classifier</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                <span className="text-sm font-medium">Isolation Forest</span>
              </div>
              <p className="text-lg font-bold text-purple-400">50 Trees</p>
              <p className="text-xs text-purple-300">Anomaly detection</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Activity className="h-5 w-5 text-purple-400" />
                <span className="text-sm font-medium">Training Data</span>
              </div>
              <p className="text-lg font-bold text-purple-400">{mlStats.trainingDataSize}</p>
              <p className="text-xs text-purple-300">Samples collected</p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-purple-300">Model Status:</span>
              <span className={`font-medium ${mlStats.modelTrained ? 'text-green-400' : 'text-yellow-400'}`}>
                {mlStats.modelTrained ? 'Trained & Active' : 'Training...'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-300">Feature History:</span>
              <span className="text-purple-400">{mlStats.featureHistorySize} records</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-300">Algorithm:</span>
              <span className="text-purple-400">Ensemble (RF + IF)</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-purple-900/30 rounded-lg">
            <h5 className="text-sm font-medium text-purple-300 mb-2">Features Analyzed:</h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-purple-400">
              <span>• Request patterns</span>
              <span>• Response times</span>
              <span>• Failed requests</span>
              <span>• Data transfer volume</span>
              <span>• Domain diversity</span>
              <span>• HTTP errors</span>
              <span>• Memory usage</span>
              <span>• CPU utilization</span>
              <span>• Click patterns</span>
              <span>• Navigation behavior</span>
              <span>• Suspicious patterns</span>
              <span>• Resource abuse</span>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className={`rounded-xl p-6 border ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-semibold">Real-time Security Monitoring</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">Active</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleNetworkScan}
              disabled={isScanning}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isScanning
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Network Scan'}</span>
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Alert Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Network Scan Results */}
      {scanResults.length > 0 && (
        <div className={`rounded-xl p-6 border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h4 className="text-lg font-medium mb-4">Network Scan Results</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scanResults.map((result, index) => (
              <div key={index} className={`p-3 rounded-lg border ${
                theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{result.ip}</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      result.open ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <span className={`text-xs ${
                      result.open ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {result.open ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>
                {result.service && (
                  <p className="text-xs text-gray-400 mt-1">
                    Service: {result.service}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real Security Events */}
      <div className={`rounded-xl p-6 border ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <h4 className="text-lg font-medium mb-4">Security Events</h4>
        
        <div className="space-y-4">
          {securityEvents.length === 0 ? (
            <div className="text-center py-8">
              <Shield className={`h-12 w-12 mx-auto mb-4 ${
                theme === 'dark' ? 'text-green-600' : 'text-green-500'
              }`} />
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                No security events detected
              </p>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>
                Security monitoring is active and watching for threats
              </p>
            </div>
          ) : (
            securityEvents.map((event) => {
              const IconComponent = getEventTypeIcon(event.type);
              return (
                <div
                  key={event.id}
                  className={`p-4 border rounded-lg transition-all ${
                    event.severity === 'critical' ? 'ring-2 ring-red-500 ring-opacity-50' : 
                    theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                  } hover:shadow-md`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <IconComponent className={`h-5 w-5 mt-0.5 ${
                        event.severity === 'critical' ? 'text-red-400' :
                        event.severity === 'high' ? 'text-orange-400' :
                        event.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                      }`} />
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h5 className={`font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {event.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h5>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${severityColors[event.severity]}`}>
                            {event.severity.toUpperCase()}
                          </span>
                          {event.mlPrediction && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              event.mlPrediction.riskLevel === 'critical' ? 'bg-red-900/20 text-red-400 border border-red-500/30' :
                              event.mlPrediction.riskLevel === 'high' ? 'bg-orange-900/20 text-orange-400 border border-orange-500/30' :
                              event.mlPrediction.riskLevel === 'medium' ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/30' :
                              'bg-green-900/20 text-green-400 border border-green-500/30'
                            }`}>
                              <Brain className="w-3 h-3 mr-1" />
                              ML: {Math.round(event.mlPrediction.threatScore * 100)}%
                            </span>
                          )}
                          {alertSettings.emailEnabled && alertsSent.has(event.id) && event.severity === 'critical' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/20 text-blue-400 border border-blue-500/30">
                              <Mail className="w-3 h-3 mr-1" />
                              Alert sent
                            </span>
                          )}
                        </div>
                        
                        <p className={`text-sm mb-2 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {event.description}
                        </p>
                        
                        {event.mlPrediction && event.mlPrediction.features.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-purple-400 mb-1">ML Analysis:</p>
                            <div className="flex flex-wrap gap-1">
                              {event.mlPrediction.features.map((feature, idx) => (
                                <span key={idx} className="text-xs px-2 py-1 bg-purple-900/20 text-purple-300 rounded">
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Source: {event.source}</span>
                          <span>Time: {event.timestamp.toLocaleString()}</span>
                          {event.mlPrediction && (
                            <span>Confidence: {Math.round(event.mlPrediction.confidence * 100)}%</span>
                          )}
                        </div>
                        
                        {Object.keys(event.details).length > 0 && (
                          <details className="mt-2">
                            <summary className={`text-xs cursor-pointer ${
                              theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
                            }`}>
                              View Details
                            </summary>
                            <div className={`mt-2 p-2 rounded text-xs font-mono ${
                              theme === 'dark' ? 'bg-gray-900/50 text-gray-400' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {JSON.stringify(event.details, null, 2)}
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => dismissEvent(event.id)}
                      className={`p-1 rounded transition-colors ${
                        theme === 'dark'
                          ? 'text-gray-400 hover:text-white hover:bg-gray-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Alert Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg shadow-xl p-6 w-full max-w-md mx-4 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Alert Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className={theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email Alerts
                </label>
                <button
                  onClick={() => setAlertSettings(prev => ({ ...prev, emailEnabled: !prev.emailEnabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    alertSettings.emailEnabled ? 'bg-blue-600' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      alertSettings.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {alertSettings.emailEnabled && (
                <>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={alertSettings.email}
                      onChange={(e) => setAlertSettings(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        theme === 'dark'
                          ? 'border-gray-600 bg-gray-700 text-white'
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                      placeholder="admin@company.com"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Critical Threats Only
                    </label>
                    <button
                      onClick={() => setAlertSettings(prev => ({ ...prev, criticalOnly: !prev.criticalOnly }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        alertSettings.criticalOnly ? 'bg-blue-600' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          alertSettings.criticalOnly ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Instant Alerts
                    </label>
                    <button
                      onClick={() => setAlertSettings(prev => ({ ...prev, instantAlerts: !prev.instantAlerts }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        alertSettings.instantAlerts ? 'bg-blue-600' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          alertSettings.instantAlerts ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-300 bg-gray-700 hover:bg-gray-600'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => saveAlertSettings(alertSettings)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Monitoring Status */}
      <div className={`rounded-xl p-4 border ${
        theme === 'dark' 
          ? 'bg-blue-900/20 border-blue-500/30' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-400">AI-Powered Security Monitoring Active</h4>
            <p className={`text-sm mt-1 ${
              theme === 'dark' ? 'text-blue-300' : 'text-blue-600'
            }`}>
              Using Random Forest and Isolation Forest algorithms to detect threats in real-time by analyzing network patterns, user behavior, and system metrics.
            </p>
            <div className="mt-2 text-xs text-blue-400">
              <p>• Machine learning anomaly detection</p>
              <p>• Ensemble classification (Random Forest + Isolation Forest)</p>
              <p>• Real-time feature extraction and analysis</p>
              <p>• Adaptive learning from security events</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreatDetection;