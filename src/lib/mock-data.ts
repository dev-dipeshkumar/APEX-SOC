// APEX SOC Mock Data Generators
// Generates realistic, correlated data for the entire dashboard

import {
  Alert, AlertStatus, Severity, AttackConnection, Asset, AssetType, AssetStatus,
  LogLine, IOC, DashboardStats, TrendDataPoint, TopologyNode, TopologyEdge,
  AttackType, ADVERSARY_PROFILES, GEO_COORDS, Notification,
} from './constants';
import { generateId } from './formatters';

// --- Utility helpers ---
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomIp(prefix: string): string {
  return `${prefix}${rand(1, 254)}`;
}

function randomPort(): number {
  return pick([22, 80, 443, 3389, 8080, 8443, 3306, 5432, 6379, 27017, 25, 53, 110, 143]);
}

function randomSeverity(weights?: number[]): Severity {
  const w = weights || [0.1, 0.25, 0.35, 0.3];
  const r = Math.random();
  if (r < w[0]) return 'critical';
  if (r < w[0] + w[1]) return 'high';
  if (r < w[0] + w[1] + w[2]) return 'medium';
  return 'low';
}

function isoNow(): string {
  return new Date().toISOString();
}

function isoPast(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60000).toISOString();
}

// --- Alert titles by attack type ---
const ALERT_TITLES: Record<AttackType, string[]> = {
  c2_beaconing: ['C2 Beacon Detected', 'Command & Control Traffic', 'Suspicious Outbound C2', 'C2 Heartbeat Pattern'],
  spear_phishing: ['Spear Phishing Email', 'Malicious Attachment Detected', 'Credential Harvest Link', 'Phishing Domain Contact'],
  brute_force: ['Brute Force SSH Attempt', 'Brute Force RDP', 'Multiple Failed Auth', 'Credential Stuffing Attack'],
  ddos: ['DDoS Attack Detected', 'Volumetric Flood', 'Amplification Attack', 'SYN Flood In Progress'],
  exploit: ['Exploit Attempt Detected', 'Known CVE Exploitation', 'Buffer Overflow Attempt', 'SQL Injection Attack'],
  scan: ['Port Scan Detected', 'Network Reconnaissance', 'Service Enumeration', 'Vulnerability Scan'],
  lateral_move: ['Lateral Movement Detected', 'Pass-the-Hash Activity', 'SMB Relay Attack', 'Credential Reuse'],
  data_exfil: ['Data Exfiltration Detected', 'Large Data Transfer', 'DNS Tunneling Activity', 'Covert Channel'],
  recon: ['Reconnaissance Activity', 'DNS Enumeration', 'WHOIS Query Surge', 'Social Engineering Prep'],
  zero_day: ['Zero-Day Exploit Detected', 'Unknown Vulnerability Exploit', 'Novel Attack Pattern', 'Unknown Malware'],
};

const LOG_SOURCES = ['firewall', 'ids', 'snort', 'suricata', 'sshd', 'nginx', 'apache', 'postgres', 'redis', 'windows-dc'];

const LOG_TEMPLATES: Record<string, string[]> = {
  CRIT: [
    'DENY src={src} dst={dst} rule="C2 Outbound"',
    'IPS alert on {dst} port {port} action=block',
    'ALERT: {src} -> {dst} - known malicious IP',
    'Critical: Unauthorized access attempt from {src}',
  ],
  WARN: [
    'DENY src={src} dst={dst} rule="Suspicious Outbound"',
    'Rate limit exceeded from {src}',
    'SSL certificate mismatch for {dst}',
    'Unusual traffic pattern detected from {src}',
  ],
  INFO: [
    'Connection established {src} -> {dst}:{port}',
    'Session timeout for {src}',
    'DNS query from {src} for {domain}',
    'Health check passed for {dst}',
  ],
  DEBUG: [
    'Packet received from {src}',
    'Rule evaluation: pass',
    'Cache hit for {dst}',
    'Keepalive from {src}',
  ],
};

const DOMAINS = ['c2.phantom.xyz', 'malware-cdn.net', 'api.darkhelix.io', 'update.svc-check.com', 'cdn.evil-corp.org'];
const HASHES = ['a3f2b8c1d4e5f6789012345678901234', 'e4b5c6d7e8f9012345678901234567890', 'b7c8d9e0f11223344556677889900a1b', '1a2b3c4d5e6f7890abcdef0123456789'];

// --- Asset definitions ---
const ASSET_DEFS = [
  { name: 'WEB-01', ip: '10.0.1.10', type: 'server' as AssetType, os: 'Ubuntu 22.04', ports: [80, 443, 8080] },
  { name: 'WEB-02', ip: '10.0.1.11', type: 'server' as AssetType, os: 'Ubuntu 22.04', ports: [80, 443] },
  { name: 'DB-01', ip: '10.0.2.20', type: 'database' as AssetType, os: 'CentOS 8', ports: [5432, 22] },
  { name: 'DB-02', ip: '10.0.2.21', type: 'database' as AssetType, os: 'CentOS 8', ports: [5432] },
  { name: 'FW-01', ip: '10.0.0.1', type: 'firewall' as AssetType, os: 'Palo Alto PAN-OS 11', ports: [443, 22] },
  { name: 'FW-02', ip: '10.0.0.2', type: 'firewall' as AssetType, os: 'FortiGate 7.0', ports: [443] },
  { name: 'API-01', ip: '10.0.3.30', type: 'api' as AssetType, os: 'Alpine Linux 3.18', ports: [8443, 9090] },
  { name: 'API-02', ip: '10.0.3.31', type: 'api' as AssetType, os: 'Alpine Linux 3.18', ports: [8443] },
  { name: 'CACHE-01', ip: '10.0.4.40', type: 'cache' as AssetType, os: 'Redis 7.2', ports: [6379] },
  { name: 'LB-01', ip: '10.0.0.10', type: 'load_balancer' as AssetType, os: 'HAProxy 2.8', ports: [80, 443, 8404] },
  { name: 'RTR-01', ip: '10.0.0.5', type: 'router' as AssetType, os: 'Cisco IOS 17.6', ports: [22, 161] },
  { name: 'WS-01', ip: '10.0.5.50', type: 'workstation' as AssetType, os: 'Windows 11', ports: [3389, 445] },
  { name: 'WS-02', ip: '10.0.5.51', type: 'workstation' as AssetType, os: 'macOS Sonoma', ports: [22, 5900] },
  { name: 'WS-03', ip: '10.0.5.52', type: 'workstation' as AssetType, os: 'Windows 10', ports: [3389] },
];

const CONNECTION_MAP: Record<string, string[]> = {
  'WEB-01': ['FW-01', 'LB-01', 'API-01', 'CACHE-01'],
  'WEB-02': ['FW-01', 'LB-01', 'API-01'],
  'DB-01': ['API-01', 'API-02', 'FW-01'],
  'DB-02': ['API-02', 'FW-01'],
  'FW-01': ['RTR-01', 'LB-01', 'WEB-01', 'WEB-02', 'DB-01', 'DB-02'],
  'FW-02': ['RTR-01', 'WS-01', 'WS-02', 'WS-03'],
  'API-01': ['WEB-01', 'DB-01', 'CACHE-01', 'FW-01'],
  'API-02': ['WEB-02', 'DB-02', 'FW-01'],
  'CACHE-01': ['WEB-01', 'API-01'],
  'LB-01': ['FW-01', 'WEB-01', 'WEB-02'],
  'RTR-01': ['FW-01', 'FW-02'],
  'WS-01': ['FW-02'],
  'WS-02': ['FW-02'],
  'WS-03': ['FW-02'],
};

const VULNS = ['CVE-2024-21762', 'CVE-2024-3400', 'CVE-2023-44487', 'CVE-2024-0204', 'CVE-2023-46805', 'CVE-2024-23897', 'CVE-2023-22515', 'CVE-2024-27198'];

// --- Generator functions ---

export function generateAlert(overrides?: Partial<Alert>): Alert {
  const adversary = pick(ADVERSARY_PROFILES);
  const attackType = pick(adversary.attackTypes);
  const severity = randomSeverity(
    attackType === 'zero_day' ? [0.5, 0.3, 0.15, 0.05] :
    attackType === 'c2_beaconing' ? [0.4, 0.35, 0.2, 0.05] :
    attackType === 'scan' ? [0.02, 0.1, 0.4, 0.48] :
    undefined
  );

  const sourceIp = randomIp(pick(adversary.sourceIps));
  const targetIp = randomIp(pick(adversary.targetIps));

  return {
    id: generateId(),
    title: pick(ALERT_TITLES[attackType]),
    description: `${pick(ALERT_TITLES[attackType])} detected from ${sourceIp} targeting ${targetIp}. Adversary profile: ${adversary.name}. Rule triggered: SOC-RULE-${rand(1000, 9999)}.`,
    severity,
    status: pick(['new', 'new', 'new', 'acknowledged', 'escalated'] as AlertStatus[]),
    sourceIp,
    targetIp,
    sourcePort: rand(30000, 65000),
    targetPort: randomPort(),
    attackType,
    adversary: adversary.name,
    timestamp: isoNow(),
    assignee: null,
    iocs: [sourceIp, pick(DOMAINS), pick(HASHES)],
    rawLog: `<${rand(30, 150)}>1 ${new Date().toISOString()} ${pick(LOG_SOURCES)} - - - ${pick(ALERT_TITLES[attackType])} src=${sourceIp} dst=${targetIp}`,
    ...overrides,
  };
}

export function generateAttackConnection(overrides?: Partial<AttackConnection>): AttackConnection {
  const adversary = pick(ADVERSARY_PROFILES);
  const attackType = pick(adversary.attackTypes);
  const severity = randomSeverity(
    attackType === 'zero_day' ? [0.5, 0.3, 0.15, 0.05] :
    attackType === 'c2_beaconing' ? [0.4, 0.35, 0.2, 0.05] :
    attackType === 'scan' ? [0.02, 0.1, 0.4, 0.48] :
    undefined
  );

  const sourceCountry = pick(adversary.originCountries);
  const sourceCoords = GEO_COORDS[sourceCountry] || [35.86, 104.19];
  // Add slight jitter to source coords
  const jitteredSource: [number, number] = [
    sourceCoords[0] + (Math.random() - 0.5) * 10,
    sourceCoords[1] + (Math.random() - 0.5) * 10,
  ];

  const targetLocation = pick(['NYC', 'LON', 'TYO', 'FRA', 'SIN']);
  const targetCoords = GEO_COORDS[targetLocation] || [40.71, -74.0];
  const jitteredTarget: [number, number] = [
    targetCoords[0] + (Math.random() - 0.5) * 3,
    targetCoords[1] + (Math.random() - 0.5) * 3,
  ];

  return {
    id: generateId(),
    sourceIp: randomIp(pick(adversary.sourceIps)),
    sourceCountry,
    sourceCoords: jitteredSource,
    targetIp: randomIp(pick(adversary.targetIps)),
    targetLocation,
    targetCoords: jitteredTarget,
    attackType,
    severity,
    adversary: adversary.name,
    timestamp: isoNow(),
    ...overrides,
  };
}

export function generateAssets(): Asset[] {
  return ASSET_DEFS.map(def => {
    const vulns = Math.random() > 0.5 ? [pick(VULNS)] : Math.random() > 0.3 ? [pick(VULNS), pick(VULNS)] : [];
    const riskLevel = vulns.length >= 2 ? 'high' : vulns.length === 1 ? 'medium' : 'low';
    return {
      id: generateId(),
      name: def.name,
      ip: def.ip,
      type: def.type,
      status: Math.random() > 0.1 ? 'online' : Math.random() > 0.5 ? 'degraded' : 'offline',
      risk: riskLevel as Severity,
      os: def.os,
      openPorts: def.ports,
      vulnerabilities: vulns,
      lastSeen: isoPast(rand(0, 30)),
      notes: '',
      connections: CONNECTION_MAP[def.name] || [],
    };
  });
}

export function generateLogLine(overrides?: Partial<LogLine>): LogLine {
  const level = pick(['CRIT', 'CRIT', 'WARN', 'WARN', 'WARN', 'INFO', 'INFO', 'INFO', 'INFO', 'DEBUG'] as const);
  const source = pick(LOG_SOURCES);
  const srcIp = `${rand(1, 254)}.${rand(1, 254)}.${rand(1, 254)}.${rand(1, 254)}`;
  const dstIp = `10.0.${rand(1, 7)}.${rand(1, 254)}`;
  const port = randomPort();
  const domain = pick(DOMAINS);

  const template = pick(LOG_TEMPLATES[level]);
  const message = template
    .replace('{src}', srcIp)
    .replace('{dst}', dstIp)
    .replace('{port}', String(port))
    .replace('{domain}', domain);

  return {
    id: generateId(),
    timestamp: isoNow(),
    level,
    source,
    message,
    ...overrides,
  };
}

export function generateIOCs(): IOC[] {
  const iocs: IOC[] = [];
  // IPs
  for (let i = 0; i < 8; i++) {
    const adversary = pick(ADVERSARY_PROFILES);
    iocs.push({
      id: generateId(),
      type: 'ip',
      value: randomIp(pick(adversary.sourceIps)),
      severity: randomSeverity([0.2, 0.3, 0.3, 0.2]),
      firstSeen: isoPast(rand(60, 4320)),
      lastSeen: isoPast(rand(0, 60)),
      relatedAlerts: rand(1, 25),
    });
  }
  // Domains
  for (let i = 0; i < 5; i++) {
    iocs.push({
      id: generateId(),
      type: 'domain',
      value: pick(DOMAINS),
      severity: randomSeverity([0.3, 0.3, 0.2, 0.2]),
      firstSeen: isoPast(rand(120, 4320)),
      lastSeen: isoPast(rand(0, 120)),
      relatedAlerts: rand(1, 15),
    });
  }
  // Hashes
  for (let i = 0; i < 4; i++) {
    iocs.push({
      id: generateId(),
      type: 'hash',
      value: pick(HASHES),
      severity: randomSeverity([0.4, 0.3, 0.2, 0.1]),
      firstSeen: isoPast(rand(240, 4320)),
      lastSeen: isoPast(rand(0, 240)),
      relatedAlerts: rand(1, 10),
    });
  }
  return iocs;
}

export function generateDashboardStats(): DashboardStats {
  return {
    activeThreats: rand(30, 80),
    criticalAlerts: rand(5, 20),
    untriaged: rand(10, 40),
    assetsAtRisk: rand(3, 15),
    threatScore: rand(55, 95),
  };
}

export function generateTrendData(): TrendDataPoint[] {
  const data: TrendDataPoint[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 3600000);
    const base = Math.sin((23 - i) / 23 * Math.PI) * 8 + 5;
    data.push({
      time: `${hour.getHours().toString().padStart(2, '0')}:00`,
      critical: Math.max(0, Math.round(base * 0.2 + (Math.random() - 0.5) * 3)),
      high: Math.max(0, Math.round(base * 0.35 + (Math.random() - 0.5) * 4)),
      medium: Math.max(0, Math.round(base * 0.7 + (Math.random() - 0.5) * 5)),
      low: Math.max(0, Math.round(base * 0.5 + (Math.random() - 0.5) * 4)),
    });
  }
  return data;
}

export function generateTopology(): { nodes: TopologyNode[]; edges: TopologyEdge[] } {
  const cx = 400, cy = 300;
  const nodes: TopologyNode[] = ASSET_DEFS.map((def, i) => {
    const angle = (i / ASSET_DEFS.length) * Math.PI * 2;
    const radius = def.type === 'firewall' || def.type === 'router' || def.type === 'load_balancer' ? 80 : 180;
    return {
      id: def.name,
      label: def.name,
      type: def.type,
      risk: (Math.random() > 0.5 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low') as Severity,
      x: cx + Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
      y: cy + Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
      vx: 0,
      vy: 0,
    };
  });

  const edges: TopologyEdge[] = [];
  const seen = new Set<string>();
  for (const def of ASSET_DEFS) {
    const conns = CONNECTION_MAP[def.name] || [];
    for (const target of conns) {
      const key = [def.name, target].sort().join('-');
      if (!seen.has(key)) {
        seen.add(key);
        edges.push({ source: def.name, target, active: false });
      }
    }
  }

  return { nodes, edges };
}

export function generateNotification(alert: Alert): Notification {
  return {
    id: alert.id,
    title: `${alert.severity.toUpperCase()} Alert`,
    message: `${alert.title} from ${alert.sourceIp}`,
    severity: alert.severity,
    timestamp: alert.timestamp,
    read: false,
  };
}

// Generate initial dataset
export function generateInitialAlerts(count: number = 50): Alert[] {
  const alerts: Alert[] = [];
  for (let i = 0; i < count; i++) {
    alerts.push(generateAlert({
      timestamp: isoPast(rand(1, 1440)),
      status: i < 10 ? 'new' : pick(['new', 'acknowledged', 'escalated', 'dismissed', 'false_positive'] as AlertStatus[]),
    }));
  }
  return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function generateInitialAttacks(count: number = 30): AttackConnection[] {
  const attacks: AttackConnection[] = [];
  for (let i = 0; i < count; i++) {
    attacks.push(generateAttackConnection({
      timestamp: isoPast(rand(0, 60)),
    }));
  }
  return attacks;
}

export function generateInitialLogs(count: number = 100): LogLine[] {
  const logs: LogLine[] = [];
  for (let i = 0; i < count; i++) {
    logs.push(generateLogLine({
      timestamp: isoPast(rand(0, 30)),
    }));
  }
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
