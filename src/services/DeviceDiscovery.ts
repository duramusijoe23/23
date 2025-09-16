export interface NetworkDevice {
  id: string;
  name: string;
  type: 'router' | 'laptop' | 'smartphone' | 'server' | 'desktop' | 'unknown';
  ip: string;
  mac?: string;
  status: 'online' | 'offline' | 'responding';
  lastSeen: Date;
  responseTime?: number;
  services: string[];
  vendor?: string;
}

export class DeviceDiscovery {
  private devices: Map<string, NetworkDevice> = new Map();
  private scanInProgress = false;
  private listeners: ((devices: NetworkDevice[]) => void)[] = [];

  constructor() {
    this.startPeriodicScan();
  }

  // Get the local network range based on current IP
  private async getLocalNetworkRange(): Promise<string> {
    try {
      // Try to get local IP using WebRTC
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      pc.createDataChannel('');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      return new Promise((resolve) => {
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidate = event.candidate.candidate;
            const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
            if (ipMatch) {
              const ip = ipMatch[1];
              const parts = ip.split('.');
              const networkBase = `${parts[0]}.${parts[1]}.${parts[2]}`;
              pc.close();
              resolve(networkBase);
              return;
            }
          }
        };
        
        // Fallback to common network ranges
        setTimeout(() => {
          pc.close();
          resolve('192.168.1'); // Most common home network
        }, 2000);
      });
    } catch (error) {
      console.warn('Could not determine local network range:', error);
      return '192.168.1'; // Default fallback
    }
  }

  // Scan for devices on the network
  async scanNetwork(): Promise<NetworkDevice[]> {
    if (this.scanInProgress) {
      return Array.from(this.devices.values());
    }

    this.scanInProgress = true;
    console.log('🔍 Starting network device discovery...');

    try {
      const networkBase = await this.getLocalNetworkRange();
      const scanPromises: Promise<void>[] = [];

      // Scan common IP ranges
      for (let i = 1; i <= 254; i++) {
        const ip = `${networkBase}.${i}`;
        scanPromises.push(this.probeDevice(ip));
      }

      // Also scan some common alternative ranges
      const alternativeRanges = ['192.168.0', '10.0.0', '172.16.0'];
      for (const range of alternativeRanges) {
        if (range !== networkBase) {
          for (let i = 1; i <= 10; i++) { // Limited scan for alternatives
            const ip = `${range}.${i}`;
            scanPromises.push(this.probeDevice(ip));
          }
        }
      }

      // Wait for all probes to complete (with timeout)
      await Promise.allSettled(scanPromises);

      // Add the current device (browser)
      await this.addCurrentDevice();

      console.log(`✅ Network scan completed. Found ${this.devices.size} devices.`);
      
    } catch (error) {
      console.error('Network scan error:', error);
    } finally {
      this.scanInProgress = false;
    }

    const deviceList = Array.from(this.devices.values());
    this.notifyListeners(deviceList);
    return deviceList;
  }

  // Probe a specific IP address
  private async probeDevice(ip: string): Promise<void> {
    const probePromises = [
      this.probeHTTP(ip),
      this.probeHTTPS(ip),
      this.probePing(ip)
    ];

    const results = await Promise.allSettled(probePromises);
    const successful = results.some(result => result.status === 'fulfilled' && result.value);

    if (successful) {
      const services: string[] = [];
      
      // Check which services responded
      if (results[0].status === 'fulfilled' && results[0].value) services.push('HTTP');
      if (results[1].status === 'fulfilled' && results[1].value) services.push('HTTPS');
      if (results[2].status === 'fulfilled' && results[2].value) services.push('ICMP');

      const device: NetworkDevice = {
        id: ip,
        name: this.generateDeviceName(ip),
        type: this.guessDeviceType(ip, services),
        ip,
        status: 'responding',
        lastSeen: new Date(),
        services,
        responseTime: results.find(r => r.status === 'fulfilled' && r.value)?.value?.responseTime
      };

      this.devices.set(ip, device);
    }
  }

  // Probe HTTP service
  private async probeHTTP(ip: string): Promise<{ responseTime: number } | null> {
    try {
      const startTime = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`http://${ip}`, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = performance.now() - startTime;
      
      return { responseTime };
    } catch (error) {
      return null;
    }
  }

  // Probe HTTPS service
  private async probeHTTPS(ip: string): Promise<{ responseTime: number } | null> {
    try {
      const startTime = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`https://${ip}`, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = performance.now() - startTime;
      
      return { responseTime };
    } catch (error) {
      return null;
    }
  }

  // Probe using image loading (alternative ping method)
  private async probePing(ip: string): Promise<{ responseTime: number } | null> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const img = new Image();
      
      const cleanup = () => {
        img.onload = null;
        img.onerror = null;
      };

      img.onload = () => {
        cleanup();
        const responseTime = performance.now() - startTime;
        resolve({ responseTime });
      };

      img.onerror = () => {
        cleanup();
        // Even on error, if it was quick, the device might be responding
        const responseTime = performance.now() - startTime;
        if (responseTime < 1000) {
          resolve({ responseTime });
        } else {
          resolve(null);
        }
      };

      // Set a timeout
      setTimeout(() => {
        cleanup();
        resolve(null);
      }, 2000);

      // Try to load a favicon or common image
      img.src = `http://${ip}/favicon.ico?${Date.now()}`;
    });
  }

  // Add the current device (browser)
  private async addCurrentDevice(): Promise<void> {
    try {
      // Get current device info
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      
      let deviceType: NetworkDevice['type'] = 'unknown';
      let deviceName = 'Current Device';

      // Detect device type from user agent
      if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
        deviceType = 'smartphone';
        deviceName = 'Mobile Device';
      } else if (/Mac/.test(platform)) {
        deviceType = 'laptop';
        deviceName = 'Mac Computer';
      } else if (/Win/.test(platform)) {
        deviceType = 'desktop';
        deviceName = 'Windows PC';
      } else if (/Linux/.test(platform)) {
        deviceType = 'desktop';
        deviceName = 'Linux Computer';
      }

      // Try to get local IP
      const localIP = await this.getCurrentDeviceIP();

      const currentDevice: NetworkDevice = {
        id: localIP || 'current',
        name: deviceName + ' (You)',
        type: deviceType,
        ip: localIP || 'Unknown',
        status: 'online',
        lastSeen: new Date(),
        services: ['Browser'],
        responseTime: 0
      };

      this.devices.set(currentDevice.id, currentDevice);
    } catch (error) {
      console.warn('Could not add current device:', error);
    }
  }

  // Get current device IP using WebRTC
  private async getCurrentDeviceIP(): Promise<string | null> {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      pc.createDataChannel('');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      return new Promise((resolve) => {
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidate = event.candidate.candidate;
            const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
            if (ipMatch) {
              pc.close();
              resolve(ipMatch[1]);
              return;
            }
          }
        };
        
        setTimeout(() => {
          pc.close();
          resolve(null);
        }, 3000);
      });
    } catch (error) {
      return null;
    }
  }

  // Generate device name based on IP and services
  private generateDeviceName(ip: string): string {
    const lastOctet = ip.split('.').pop();
    
    // Common device IP patterns
    if (ip.endsWith('.1')) return 'Router/Gateway';
    if (ip.endsWith('.2')) return 'Secondary Router';
    if (ip.endsWith('.10')) return 'Server';
    if (ip.endsWith('.100')) return 'Admin Device';
    
    return `Device-${lastOctet}`;
  }

  // Guess device type based on IP and services
  private guessDeviceType(ip: string, services: string[]): NetworkDevice['type'] {
    // Router/Gateway detection
    if (ip.endsWith('.1') || ip.endsWith('.254')) {
      return 'router';
    }

    // Server detection
    if (services.includes('HTTP') || services.includes('HTTPS')) {
      if (ip.includes('.10') || ip.includes('.20')) {
        return 'server';
      }
    }

    // Default to unknown for discovered devices
    return 'unknown';
  }

  // Start periodic scanning
  private startPeriodicScan(): void {
    // Initial scan
    this.scanNetwork();

    // Rescan every 30 seconds
    setInterval(() => {
      this.scanNetwork();
    }, 30000);

    // Quick connectivity check every 10 seconds
    setInterval(() => {
      this.quickConnectivityCheck();
    }, 10000);
  }

  // Quick check of known devices
  private async quickConnectivityCheck(): Promise<void> {
    const knownDevices = Array.from(this.devices.values());
    
    for (const device of knownDevices) {
      if (device.ip === 'Unknown' || device.id === 'current') continue;
      
      try {
        const result = await this.probePing(device.ip);
        const updatedDevice = {
          ...device,
          status: result ? 'responding' as const : 'offline' as const,
          lastSeen: result ? new Date() : device.lastSeen,
          responseTime: result?.responseTime
        };
        
        this.devices.set(device.id, updatedDevice);
      } catch (error) {
        // Mark as offline if probe fails
        const updatedDevice = {
          ...device,
          status: 'offline' as const
        };
        this.devices.set(device.id, updatedDevice);
      }
    }

    this.notifyListeners(Array.from(this.devices.values()));
  }

  // Public methods
  getDevices(): NetworkDevice[] {
    return Array.from(this.devices.values());
  }

  onDevicesUpdate(callback: (devices: NetworkDevice[]) => void) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(devices: NetworkDevice[]) {
    this.listeners.forEach(listener => listener(devices));
  }

  // Force a new scan
  async refreshDevices(): Promise<NetworkDevice[]> {
    this.devices.clear();
    return await this.scanNetwork();
  }

  // Get device statistics
  getDeviceStats() {
    const devices = Array.from(this.devices.values());
    return {
      total: devices.length,
      online: devices.filter(d => d.status === 'responding' || d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      routers: devices.filter(d => d.type === 'router').length,
      servers: devices.filter(d => d.type === 'server').length,
      workstations: devices.filter(d => d.type === 'laptop' || d.type === 'desktop').length,
      mobile: devices.filter(d => d.type === 'smartphone').length,
      unknown: devices.filter(d => d.type === 'unknown').length
    };
  }

  // Check if a specific IP is reachable
  async checkDevice(ip: string): Promise<NetworkDevice | null> {
    await this.probeDevice(ip);
    return this.devices.get(ip) || null;
  }

  // Get network topology information
  getNetworkTopology() {
    const devices = Array.from(this.devices.values());
    const router = devices.find(d => d.type === 'router');
    
    return {
      gateway: router?.ip || 'Unknown',
      subnet: router ? router.ip.substring(0, router.ip.lastIndexOf('.')) : 'Unknown',
      deviceCount: devices.length,
      activeConnections: devices.filter(d => d.status !== 'offline').length
    };
  }
}

export const deviceDiscovery = new DeviceDiscovery();