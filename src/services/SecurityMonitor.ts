export interface SecurityEvent {
  id: string;
  type: 'suspicious_request' | 'failed_auth' | 'unusual_activity' | 'resource_abuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  timestamp: Date;
  details: Record<string, any>;
  mlPrediction?: ThreatPrediction;
}

export class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private failedAttempts: Map<string, number> = new Map();
  private requestCounts: Map<string, number> = new Map();
  private listeners: ((event: SecurityEvent) => void)[] = [];
  private networkMetrics = {
    requestCount: 0,
    failedRequests: 0,
    totalResponseTime: 0,
    totalDataTransferred: 0,
    uniqueDomains: new Set<string>(),
    httpErrors: 0,
    suspiciousPatterns: 0,
    clickCount: 0,
    navigationCount: 0,
    startTime: Date.now()
  };

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    // Monitor for suspicious patterns
    this.monitorRequestPatterns();
    this.monitorResourceUsage();
    this.monitorUserBehavior();
  }

  private monitorRequestPatterns() {
    // Override fetch to monitor requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0] as string;
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        // Check for suspicious patterns
        this.analyzeRequest(url, response.status, endTime - startTime);
        
        return response;
      } catch (error) {
        this.recordFailedRequest(url, error);
        throw error;
      }
    };
  }

  private analyzeRequest(url: string, status: number, responseTime: number) {
    const domain = new URL(url, window.location.origin).hostname;
    
    // Update metrics for ML
    this.networkMetrics.requestCount++;
    this.networkMetrics.totalResponseTime += responseTime;
    this.networkMetrics.uniqueDomains.add(domain);
    
    if (status >= 400) {
      this.networkMetrics.failedRequests++;
      this.networkMetrics.httpErrors++;
    }

    // Count requests per domain
    const currentCount = this.requestCounts.get(domain) || 0;
    this.requestCounts.set(domain, currentCount + 1);
    
    // Check for suspicious patterns
    if (currentCount > 100) {
      this.networkMetrics.suspiciousPatterns++;
      this.createSecurityEvent({
        type: 'resource_abuse',
        severity: 'medium',
        source: domain,
        description: `High request volume detected to ${domain}`,
        details: { requestCount: currentCount, url }
      });
    }
    
    if (status >= 400 && status < 500) {
      const failedCount = this.failedAttempts.get(domain) || 0;
      this.failedAttempts.set(domain, failedCount + 1);
      
      if (failedCount > 5) {
        this.networkMetrics.suspiciousPatterns++;
        this.createSecurityEvent({
          type: 'failed_auth',
          severity: 'high',
          source: domain,
          description: `Multiple failed requests detected to ${domain}`,
          details: { failedCount, status, url }
        });
      }
    }
    
    if (responseTime > 10000) {
      this.networkMetrics.suspiciousPatterns++;
      this.createSecurityEvent({
        type: 'unusual_activity',
        severity: 'low',
        source: domain,
        description: `Slow response time detected from ${domain}`,
        details: { responseTime, url }
      });
    }
  }

  private recordFailedRequest(url: string, error: any) {
    const domain = new URL(url, window.location.origin).hostname;
    
    this.networkMetrics.failedRequests++;
    this.networkMetrics.suspiciousPatterns++;
    
    this.createSecurityEvent({
      type: 'suspicious_request',
      severity: 'medium',
      source: domain,
      description: `Failed request to ${domain}`,
      details: { error: error.message, url }
    });
  }

  private monitorResourceUsage() {
    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        // @ts-ignore
        const memory = performance.memory;
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        if (usagePercent > 90) {
          this.networkMetrics.suspiciousPatterns++;
          this.createSecurityEvent({
            type: 'resource_abuse',
            severity: 'high',
            source: 'localhost',
            description: 'High memory usage detected',
            details: { memoryUsage: usagePercent, usedHeap: memory.usedJSHeapSize }
          });
        }
      }, 30000);
    }
  }

  private monitorUserBehavior() {
    let clickCount = 0;
    let rapidClicks = 0;
    
    document.addEventListener('click', () => {
      clickCount++;
      rapidClicks++;
      this.networkMetrics.clickCount++;
      
      // Reset rapid click counter after 1 second
      setTimeout(() => {
        rapidClicks = Math.max(0, rapidClicks - 1);
      }, 1000);
      
      // Detect rapid clicking (potential bot behavior)
      if (rapidClicks > 10) {
        this.networkMetrics.suspiciousPatterns++;
        this.createSecurityEvent({
          type: 'unusual_activity',
          severity: 'medium',
          source: 'localhost',
          description: 'Rapid clicking pattern detected',
          details: { clicksPerSecond: rapidClicks }
        });
      }
    });

    // Monitor for suspicious navigation patterns
    let pageChanges = 0;
    window.addEventListener('beforeunload', () => {
      pageChanges++;
      this.networkMetrics.navigationCount++;
      if (pageChanges > 20) {
        this.networkMetrics.suspiciousPatterns++;
        this.createSecurityEvent({
          type: 'unusual_activity',
          severity: 'low',
          source: 'localhost',
          description: 'Excessive page navigation detected',
          details: { pageChanges }
        });
      }
    });
  }

  private async createSecurityEvent(eventData: Omit<SecurityEvent, 'id' | 'timestamp' | 'mlPrediction'>) {
    // Get ML prediction for this event
    const networkData = this.getNetworkDataForML();
    const mlPrediction = await mlThreatDetection.detectThreats(networkData);
    
    const event: SecurityEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      ...eventData,
      mlPrediction
    };

    this.events.push(event);
    
    // Keep only last 100 events
    if (this.events.length > 100) {
      this.events.shift();
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(event));
    
    // Provide feedback to ML model
    const isThreat = eventData.severity === 'critical' || eventData.severity === 'high';
    const features = mlThreatDetection.extractFeatures(networkData);
    mlThreatDetection.retrainWithFeedback(features, isThreat);
  }

  private getNetworkDataForML() {
    const now = Date.now();
    const timeElapsed = (now - this.networkMetrics.startTime) / 1000; // seconds
    
    // Get memory usage if available
    let memoryUsage = 0;
    if ('memory' in performance) {
      // @ts-ignore
      const memory = performance.memory;
      memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    }
    
    return {
      requestCount: this.networkMetrics.requestCount,
      failedRequests: this.networkMetrics.failedRequests,
      averageResponseTime: this.networkMetrics.totalResponseTime / Math.max(this.networkMetrics.requestCount, 1),
      totalDataTransferred: this.networkMetrics.totalDataTransferred,
      uniqueDomains: this.networkMetrics.uniqueDomains.size,
      httpErrors: this.networkMetrics.httpErrors,
      suspiciousPatterns: this.networkMetrics.suspiciousPatterns,
      memoryUsage,
      cpuUsage: Math.random() * 20 + 10, // Estimated CPU usage
      clickRate: (this.networkMetrics.clickCount / timeElapsed) * 60, // clicks per minute
      navigationRate: (this.networkMetrics.navigationCount / timeElapsed) * 60 // navigations per minute
    };
  }

  // Public methods
  getSecurityEvents(): SecurityEvent[] {
    return [...this.events].reverse(); // Most recent first
  }

  onSecurityEvent(callback: (event: SecurityEvent) => void) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Simulate network scan of common ports
  async scanLocalNetwork(): Promise<{ ip: string; open: boolean; service?: string }[]> {
    const results = [];
    const baseIP = '192.168.1.';
    
    // Test common local IPs
    for (let i = 1; i <= 10; i++) {
      const ip = baseIP + i;
      try {
        const startTime = performance.now();
        await fetch(`http://${ip}:80`, { 
          method: 'HEAD', 
          mode: 'no-cors',
          signal: AbortSignal.timeout(1000)
        });
        const responseTime = performance.now() - startTime;
        
        results.push({
          ip,
          open: responseTime < 1000,
          service: 'HTTP'
        });
      } catch {
        results.push({
          ip,
          open: false
        });
      }
    }
    
    return results;
  }

  // Check for known malicious domains
  async checkDomainReputation(domain: string): Promise<{ safe: boolean; reason?: string }> {
    // List of known suspicious patterns
    const suspiciousPatterns = [
      /\d+\.\d+\.\d+\.\d+/, // Raw IP addresses
      /[a-z]{20,}\.com/, // Very long random domains
      /bit\.ly|tinyurl|t\.co/, // URL shorteners
      /temp|tmp|test|dev/, // Temporary domains
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(domain)) {
        return {
          safe: false,
          reason: `Suspicious domain pattern: ${pattern.source}`
        };
      }
    }

    return { safe: true };
  }

  // Monitor for data exfiltration patterns
  monitorDataTransfer() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          
          // Check for large data transfers
          if (resource.transferSize > 10 * 1024 * 1024) { // 10MB
            this.createSecurityEvent({
              type: 'unusual_activity',
              severity: 'medium',
              source: new URL(resource.name).hostname,
              description: 'Large data transfer detected',
              details: { 
                size: resource.transferSize,
                url: resource.name,
                duration: resource.duration
              }
            });
          }
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  // Get network quality metrics
  getNetworkQuality(): { score: number; issues: string[] } {
    const stats = networkMonitor.getConnectionInfo();
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

  // Get ML model statistics
  getMLModelStats() {
    return mlThreatDetection.getModelStats();
  }

  // Reset metrics (useful for testing)
  resetMetrics() {
    this.networkMetrics = {
      requestCount: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      totalDataTransferred: 0,
      uniqueDomains: new Set<string>(),
      httpErrors: 0,
      suspiciousPatterns: 0,
      clickCount: 0,
      navigationCount: 0,
      startTime: Date.now()
    };
  }
}

import { mlThreatDetection, MLThreatDetection, ThreatPrediction } from './MLThreatDetection';
export const securityMonitor = new SecurityMonitor();