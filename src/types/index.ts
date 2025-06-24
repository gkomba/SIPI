export interface CircuitData {
  info: string;
  saude: 'OK' | 'ALERT' | 'WARNING';
  status: 'on' | 'off';
  time: string;
}

export interface PosteData {
  status: 'on' | 'off';
  type: string;
}

export interface DashboardData {
  circuito: CircuitData | null;
  led: PosteData | null;
}

export interface ScheduledTask {
  id: string;
  action: 'on' | 'off';
  minutes: number;
  seconds: number;
  isActive: boolean;
  remainingTime?: number;
}