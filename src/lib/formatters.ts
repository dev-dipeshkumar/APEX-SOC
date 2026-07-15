// APEX SOC Formatters

export function formatIp(ip: string): string {
  return ip;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function severityLabel(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function truncateMiddle(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  const start = str.slice(0, Math.floor(maxLen / 2) - 1);
  const end = str.slice(-(Math.floor(maxLen / 2) - 2));
  return `${start}...${end}`;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}
