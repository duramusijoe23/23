export interface NetworkStats {
  rtt: number;
  downlink: number;
  effectiveType: string;
  saveData: boolean;
}

export interface PingResult {
  host: string;
  success: boolean;
  responseTime: number;
  timestamp: Date;
  error?: string;
}

export interface BandwidthTest {
  downloadSpeed: number;
  uploadSpeed: number;
  latency: number;
  timestamp: Date;
}

export class NetworkMonitor {
  private connection: any;
  private pingResults: Map<string, PingResult[]> = new Map();
  private bandwidthHistory: BandwidthTest[] = [];

  constructor() {
    // @ts-ignore - Navigator connection is experimental but widely supported
    this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  }

  // Get real network connection info
  getConnectionInfo(): NetworkStats {
    if (this.connection) {
      return {
        rtt: this.connection.rtt || 0,
        downlink: this.connection.downlink || 0,
        effectiveType: this.connection.effectiveType || 'unknown',
        saveData: this.connection.saveData || false
      };
    }
    return {
      rtt: 0,
      downlink: 0,
      effectiveType: 'unknown',
      saveData: false
    };
  }

  // Ping a host using fetch with timeout
  async pingHost(host: string, timeout: number = 5000): Promise<PingResult> {
    const startTime = performance.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`https://${host}`, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      const result: PingResult = {
        host,
        success: true,
        responseTime,
        timestamp: new Date()
      };

      // Store ping history
      if (!this.pingResults.has(host)) {
        this.pingResults.set(host, []);
      }
      const hostResults = this.pingResults.get(host)!;
      hostResults.push(result);
      if (hostResults.length > 50) {
        hostResults.shift(); // Keep only last 50 results
      }

      return result;
    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      const result: PingResult = {
        host,
        success: false,
        responseTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      // Store failed ping
      if (!this.pingResults.has(host)) {
        this.pingResults.set(host, []);
      }
      this.pingResults.get(host)!.push(result);

      return result;
    }
  }

  // Get ping history for a host
  getPingHistory(host: string): PingResult[] {
    return this.pingResults.get(host) || [];
  }

  // Test bandwidth using a small file download
  async testBandwidth(): Promise<BandwidthTest> {
    const testUrl = 'https://httpbin.org/bytes/1048576'; // 1MB test file
    const startTime = performance.now();
    
    try {
      const response = await fetch(testUrl);
      const data = await response.blob();
      const endTime = performance.now();
      
      const duration = (endTime - startTime) / 1000; // Convert to seconds
      const sizeInMB = data.size / (1024 * 1024);
      const downloadSpeed = Math.round((sizeInMB / duration) * 8); // Convert to Mbps
      
      // Estimate upload speed (simplified)
      const uploadSpeed = Math.round(downloadSpeed * 0.1); // Typically 10% of download
      
      const result: BandwidthTest = {
        downloadSpeed,
        uploadSpeed,
        latency: this.getConnectionInfo().rtt,
        timestamp: new Date()
      };

      this.bandwidthHistory.push(result);
      if (this.bandwidthHistory.length > 20) {
        this.bandwidthHistory.shift();
      }

      return result;
    } catch (error) {
      throw new Error('Bandwidth test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // Get bandwidth test history
  getBandwidthHistory(): BandwidthTest[] {
    return this.bandwidthHistory;
  }

  // Monitor page load performance
  getPagePerformance() {
    if ('performance' in window && performance.getEntriesByType) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        return {
          dnsLookup: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
          tcpConnect: Math.round(navigation.connectEnd - navigation.connectStart),
          tlsHandshake: navigation.secureConnectionStart > 0 ? 
            Math.round(navigation.connectEnd - navigation.secureConnectionStart) : 0,
          serverResponse: Math.round(navigation.responseStart - navigation.requestStart),
          pageLoad: Math.round(navigation.loadEventEnd - navigation.navigationStart),
          domReady: Math.round(navigation.domContentLoadedEventEnd - navigation.navigationStart)
        };
      }
    }
    return null;
  }

  // Check if user is on a metered connection
  isMeteredConnection(): boolean {
    return this.connection?.saveData || false;
  }

  // Get estimated data usage
  getEstimatedDataUsage(): number {
    // Estimate based on page loads and resources
    if ('performance' in window && performance.getEntriesByType) {
      const resources = performance.getEntriesByType('resource');
      return resources.reduce((total, resource: any) => {
        return total + (resource.transferSize || 0);
      }, 0);
    }
    return 0;
  }

  // Get network quality metrics
  getNetworkQuality(): { score: number; issues: string[] } {
    const stats = this.getConnectionInfo();
    const issues: string[] = [];
    let score = 100;

    if (stats.rtt > 100) {
      issues.push('High latency');
      score -= 20;
    }

    if (stats.downlink < 5) {
      issues.push('Low bandwidth');
      score -= 30;
    }

    if (stats.effectiveType === '2g' || stats.effectiveType === 'slow-2g') {
      issues.push('Poor connection quality');
      score -= 40;
    }

    return { score: Math.max(0, score), issues };
  }

  // Listen for connection changes
  onConnectionChange(callback: (stats: NetworkStats) => void) {
    if (this.connection) {
      this.connection.addEventListener('change', () => {
        callback(this.getConnectionInfo());
      });
    }
  }

  // Detect potential network issues
  detectNetworkIssues(): string[] {
    const issues: string[] = [];
    const stats = this.getConnectionInfo();
    
    if (stats.rtt > 200) {
      issues.push('High latency detected (>200ms)');
    }
    
    if (stats.downlink < 1) {
      issues.push('Slow connection detected (<1 Mbps)');
    }
    
    if (stats.effectiveType === 'slow-2g' || stats.effectiveType === '2g') {
      issues.push('Very slow connection type detected');
    }
    
    if (stats.saveData) {
      issues.push('Data saver mode is enabled');
    }
    
    return issues;
  }
}

export const networkMonitor = new NetworkMonitor();