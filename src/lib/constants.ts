// APEX SOC Constants & Types

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'new' | 'acknowledged' | 'escalated' | 'false_positive' | 'dismissed';
export type AssetStatus = 'online' | 'offline' | 'degraded' | 'unknown';
export type AssetType = 'server' | 'workstation' | 'firewall' | 'router' | 'database' | 'api' | 'cache' | 'load_balancer';
export type AttackType = 'c2_beaconing' | 'spear_phishing' | 'brute_force' | 'ddos' | 'exploit' | 'scan' | 'lateral_move' | 'data_exfil' | 'recon' | 'zero_day';
export type Role = 'admin' | 'analyst' | 'viewer';

export enum Permission {
  ALERT_TRIAGE = 'alert:triage',
  ALERT_ASSIGN = 'alert:assign',
  ASSET_EDIT = 'asset:edit',
  EXPORT_DATA = 'data:export',
  USER_MANAGE = 'user:manage',
  SETTINGS_EDIT = 'settings:edit',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: Object.values(Permission),
  analyst: [Permission.ALERT_TRIAGE, Permission.ALERT_ASSIGN, Permission.ASSET_EDIT, Permission.EXPORT_DATA],
  viewer: [],
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#10b981',
};

export const SEVERITY_BG: Record<Severity, string> = {
  critical: 'rgba(239, 68, 68, 0.1)',
  high: 'rgba(249, 115, 22, 0.1)',
  medium: 'rgba(245, 158, 11, 0.1)',
  low: 'rgba(16, 185, 129, 0.1)',
};

export const SEVERITY_BORDER: Record<Severity, string> = {
  critical: 'rgba(239, 68, 68, 0.3)',
  high: 'rgba(249, 115, 22, 0.3)',
  medium: 'rgba(245, 158, 11, 0.3)',
  low: 'rgba(16, 185, 129, 0.3)',
};

export const STATUS_COLORS: Record<AlertStatus, string> = {
  new: '#3b82f6',
  acknowledged: '#10b981',
  escalated: '#f97316',
  false_positive: '#546380',
  dismissed: '#546380',
};

export const ATTACK_TYPE_COLORS: Record<AttackType, string> = {
  c2_beaconing: '#ef4444',
  spear_phishing: '#f97316',
  brute_force: '#f59e0b',
  ddos: '#ef4444',
  exploit: '#f97316',
  scan: '#f59e0b',
  lateral_move: '#f97316',
  data_exfil: '#ef4444',
  recon: '#10b981',
  zero_day: '#ef4444',
};

export const ATTACK_TYPE_LABELS: Record<AttackType, string> = {
  c2_beaconing: 'C2 Beaconing',
  spear_phishing: 'Spear Phishing',
  brute_force: 'Brute Force',
  ddos: 'DDoS',
  exploit: 'Exploit',
  scan: 'Port Scan',
  lateral_move: 'Lateral Movement',
  data_exfil: 'Data Exfiltration',
  recon: 'Reconnaissance',
  zero_day: 'Zero-Day Exploit',
};

export const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low'];

export const ADVERSARY_PROFILES = [
  {
    id: 'apt-phantom-spider',
    name: 'APT-PHANTOM SPIDER',
    originCountries: ['CN', 'RU'],
    targetSectors: ['finance', 'energy'],
    attackTypes: ['spear_phishing', 'c2_beaconing', 'lateral_move'] as AttackType[],
    sourceIps: ['103.224.182.', '185.220.101.'],
    targetIps: ['10.0.1.', '10.0.2.'],
    intensity: 0.7,
  },
  {
    id: 'apt-dark-helix',
    name: 'APT-DARK HELIX',
    originCountries: ['RU', 'UA'],
    targetSectors: ['government', 'defense'],
    attackTypes: ['brute_force', 'exploit', 'data_exfil'] as AttackType[],
    sourceIps: ['45.33.32.', '91.189.88.'],
    targetIps: ['10.0.3.', '10.0.4.'],
    intensity: 0.5,
  },
  {
    id: 'script-kiddie-collective',
    name: 'Script Kiddie Collective',
    originCountries: ['US', 'DE', 'BR'],
    targetSectors: ['technology', 'retail'],
    attackTypes: ['scan', 'ddos', 'brute_force'] as AttackType[],
    sourceIps: ['203.0.113.', '198.51.100.'],
    targetIps: ['10.0.1.', '10.0.5.'],
    intensity: 0.9,
  },
  {
    id: 'apt-void-serpent',
    name: 'APT-VOID SERPENT',
    originCountries: ['KP', 'CN'],
    targetSectors: ['finance', 'technology'],
    attackTypes: ['spear_phishing', 'zero_day', 'c2_beaconing'] as AttackType[],
    sourceIps: ['175.45.176.', '210.52.109.'],
    targetIps: ['10.0.2.', '10.0.6.'],
    intensity: 0.3,
  },
  {
    id: 'hacktivist-echo',
    name: 'Hacktivist-ECHO',
    originCountries: ['IR', 'SY'],
    targetSectors: ['government', 'media'],
    attackTypes: ['ddos', 'exploit', 'data_exfil'] as AttackType[],
    sourceIps: ['5.160.128.', '91.92.128.'],
    targetIps: ['10.0.3.', '10.0.7.'],
    intensity: 0.6,
  },
];

export const GEO_COORDS: Record<string, [number, number]> = {
  'CN': [35.86, 104.19],
  'RU': [61.52, 105.31],
  'UA': [48.37, 31.16],
  'US': [37.09, -95.71],
  'DE': [51.16, 10.45],
  'BR': [-14.23, -51.92],
  'KP': [40.33, 127.51],
  'IR': [32.42, 53.68],
  'SY': [34.80, 38.99],
  'NYC': [40.71, -74.00],
  'LON': [51.50, -0.12],
  'TYO': [35.67, 139.65],
  'FRA': [50.11, 8.68],
  'SIN': [1.35, 103.81],
  'SYD': [-33.86, 151.20],
  'MOW': [55.75, 37.61],
  'BEJ': [39.90, 116.40],
  'PYO': [39.03, 125.75],
  'TEH': [35.68, 51.38],
  'DAM': [33.51, 36.29],
  'SAO': [-23.55, -46.63],
  'BER': [52.52, 13.40],
};

export const DEFAULT_USERS = [
  { username: 'admin', password: 'apex-admin-2024', role: 'admin' as Role, name: 'SOC Commander' },
  { username: 'analyst', password: 'apex-analyst-2024', role: 'analyst' as Role, name: 'Jane Reyes' },
  { username: 'viewer', password: 'apex-viewer-2024', role: 'viewer' as Role, name: 'Guest Observer' },
];

// Alert interface
export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: AlertStatus;
  sourceIp: string;
  targetIp: string;
  sourcePort: number;
  targetPort: number;
  attackType: AttackType;
  adversary: string;
  timestamp: string;
  assignee: string | null;
  iocs: string[];
  rawLog: string;
}

// Attack connection for globe
export interface AttackConnection {
  id: string;
  sourceIp: string;
  sourceCountry: string;
  sourceCoords: [number, number];
  targetIp: string;
  targetLocation: string;
  targetCoords: [number, number];
  attackType: AttackType;
  severity: Severity;
  adversary: string;
  timestamp: string;
}

// Asset interface
export interface Asset {
  id: string;
  name: string;
  ip: string;
  type: AssetType;
  status: AssetStatus;
  risk: Severity;
  os: string;
  openPorts: number[];
  vulnerabilities: string[];
  lastSeen: string;
  notes: string;
  connections: string[]; // IDs of connected assets
}

// Log line
export interface LogLine {
  id: string;
  timestamp: string;
  level: 'CRIT' | 'WARN' | 'INFO' | 'DEBUG';
  source: string;
  message: string;
}

// IOC
export interface IOC {
  id: string;
  type: 'ip' | 'domain' | 'hash' | 'url';
  value: string;
  severity: Severity;
  firstSeen: string;
  lastSeen: string;
  relatedAlerts: number;
}

// Dashboard stats
export interface DashboardStats {
  activeThreats: number;
  criticalAlerts: number;
  untriaged: number;
  assetsAtRisk: number;
  threatScore: number;
}

// Trend data point
export interface TrendDataPoint {
  time: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

// Topology data
export interface TopologyNode {
  id: string;
  label: string;
  type: AssetType;
  risk: Severity;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface TopologyEdge {
  source: string;
  target: string;
  active: boolean;
}

// User
export interface User {
  username: string;
  role: Role;
  name: string;
}

// Notification
export interface Notification {
  id: string;
  title: string;
  message: string;
  severity: Severity;
  timestamp: string;
  read: boolean;
}

export type ViewType = 'dashboard' | 'alerts' | 'intel-map' | 'assets' | 'settings';
