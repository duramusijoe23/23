import { networkMonitor, NetworkStats } from './NetworkMonitor';
import { securityMonitor, SecurityEvent } from './SecurityMonitor';

export interface RealTimeData {
  networkStats: NetworkStats;
  bandwidth: {
    download: number;
    upload: number;
    latency: number;
  };
  security: {
    events: SecurityEvent[];
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    networkQuality: number;
  };
  timestamp: Date;
}

export class RealTimeMonitor {
  private listeners: ((data: RealTimeData) => void)[] = [];
  private isRunning = false;
  private intervalId: number | null = null;

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Start security monitoring
    securityMonitor.monitorDataTransfer();
    
    // Update data every 2 seconds
    this.intervalId = window.setInterval(() => {
      this.collectAndBroadcastData();
    }, 2000);

    // Initial data collection
    this.collectAndBroadcastData();
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async collectAndBroadcastData() {
    try {
      const networkStats = networkMonitor.getConnectionInfo();
      const securityEvents = securityMonitor.getSecurityEvents();
      const networkQuality = networkMonitor.getNetworkQuality();
      
      // Calculate threat level based on recent events
      const recentEvents = securityEvents.filter(
        event => Date.now() - event.timestamp.getTime() < 300000 // Last 5 minutes
      );
      
      const criticalEvents = recentEvents.filter(e => e.severity === 'critical').length;
      const highEvents = recentEvents.filter(e => e.severity === 'high').length;
      
      let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (criticalEvents > 0) threatLevel = 'critical';
      else if (highEvents > 2) threatLevel = 'high';
      else if (recentEvents.length > 5) threatLevel = 'medium';

      // Get performance metrics
      const performance = this.getPerformanceMetrics();

      const data: RealTimeData = {
        networkStats,
        bandwidth: {
          download: networkStats.downlink * 1000, // Convert to Kbps
          upload: networkStats.downlink * 100, // Estimate upload as 10% of download
          latency: networkStats.rtt
        },
        security: {
          events: securityEvents.slice(0, 10), // Last 10 events
          threatLevel
        },
        performance: {
          cpuUsage: performance.cpu,
          memoryUsage: performance.memory,
          networkQuality: networkQuality.score
        },
        timestamp: new Date()
      };

      this.listeners.forEach(listener => listener(data));
    } catch (error) {
      console.error('Error collecting real-time data:', error);
    }
  }

  private getPerformanceMetrics() {
    let cpuUsage = 0;
    let memoryUsage = 0;

    // Estimate CPU usage based on frame rate
    if ('requestIdleCallback' in window) {
      const start = performance.now();
      requestIdleCallback(() => {
        const idle = performance.now() - start;
        cpuUsage = Math.max(0, 100 - (idle / 16.67) * 100); // 60fps = 16.67ms per frame
      });
    }

    // Get memory usage if available
    if ('memory' in performance) {
      // @ts-ignore
      const memory = performance.memory;
      memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    }

    return { cpu: cpuUsage, memory: memoryUsage };
  }

  onDataUpdate(callback: (data: RealTimeData) => void) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Test network connectivity to common services
  async testConnectivity(): Promise<{ service: string; status: 'online' | 'offline'; latency?: number }[]> {
    const services = [
      { name: 'Google DNS', host: '8.8.8.8' },
      { name: 'Cloudflare DNS', host: '1.1.1.1' },
      { name: 'Google', host: 'google.com' },
      { name: 'GitHub', host: 'github.com' },
      { name: 'Cloudflare', host: 'cloudflare.com' }
    ];

    const results = await Promise.all(
      services.map(async (service) => {
        try {
          const result = await networkMonitor.pingHost(service.host);
          return {
            service: service.name,
            status: result.success ? 'online' as const : 'offline' as const,
            latency: result.responseTime
          };
        } catch {
          return {
            service: service.name,
            status: 'offline' as const
          };
        }
      })
    );

    return results;
  }

  // Get current system status
  getSystemStatus() {
    const networkStats = networkMonitor.getConnectionInfo();
    const securityEvents = securityMonitor.getSecurityEvents();
    const networkQuality = networkMonitor.getNetworkQuality();
    
    const recentCriticalEvents = securityEvents.filter(
      event => event.severity === 'critical' && 
      Date.now() - event.timestamp.getTime() < 3600000 // Last hour
    ).length;

    return {
      network: {
        status: networkStats.downlink > 0 ? 'connected' : 'disconnected',
        quality: networkQuality.score,
        issues: networkQuality.issues
      },
      security: {
        status: recentCriticalEvents === 0 ? 'secure' : 'at_risk',
        criticalEvents: recentCriticalEvents,
        totalEvents: securityEvents.length
      },
      performance: {
        status: networkQuality.score > 70 ? 'good' : networkQuality.score > 40 ? 'fair' : 'poor'
      }
    };
  }
}

export const realTimeMonitor = new RealTimeMonitor();