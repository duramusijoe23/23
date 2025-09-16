export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      bandwidth_rules: {
        Row: {
          id: string;
          ip_address: string;
          device_name: string | null;
          upload_limit: number;
          download_limit: number;
          priority: string;
          status: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ip_address: string;
          device_name?: string | null;
          upload_limit?: number;
          download_limit?: number;
          priority?: string;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ip_address?: string;
          device_name?: string | null;
          upload_limit?: number;
          download_limit?: number;
          priority?: string;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      network_devices: {
        Row: {
          id: string;
          name: string;
          type: string;
          ip_address: string;
          mac_address: string;
          status: string;
          location: string | null;
          uptime_start: string;
          last_seen: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          ip_address: string;
          mac_address: string;
          status?: string;
          location?: string | null;
          uptime_start?: string;
          last_seen?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          ip_address?: string;
          mac_address?: string;
          status?: string;
          location?: string | null;
          uptime_start?: string;
          last_seen?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      bandwidth_usage: {
        Row: {
          id: string;
          device_id: string | null;
          upload_mbps: number;
          download_mbps: number;
          timestamp: string;
        };
        Insert: {
          id?: string;
          device_id?: string | null;
          upload_mbps: number;
          download_mbps: number;
          timestamp?: string;
        };
        Update: {
          id?: string;
          device_id?: string | null;
          upload_mbps?: number;
          download_mbps?: number;
          timestamp?: string;
        };
      };
      security_events: {
        Row: {
          id: string;
          event_type: string;
          severity: string;
          source_ip: string;
          target: string;
          description: string;
          status: string;
          detected_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          event_type: string;
          severity: string;
          source_ip: string;
          target: string;
          description: string;
          status?: string;
          detected_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          event_type?: string;
          severity?: string;
          source_ip?: string;
          target?: string;
          description?: string;
          status?: string;
          detected_at?: string;
          resolved_at?: string | null;
        };
      };
      alerts: {
        Row: {
          id: string;
          title: string;
          description: string;
          severity: string;
          category: string;
          source: string;
          status: string;
          created_at: string;
          acknowledged_at: string | null;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          severity: string;
          category: string;
          source: string;
          status?: string;
          created_at?: string;
          acknowledged_at?: string | null;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          severity?: string;
          category?: string;
          source?: string;
          status?: string;
          created_at?: string;
          acknowledged_at?: string | null;
          resolved_at?: string | null;
        };
      };
    };
  };
}