'use client';

import { useCallback, useRef, useState } from 'react';
import { useAssetStore } from '@/stores/asset-store';
import { SEVERITY_COLORS, type Severity, type AssetType } from '@/lib/constants';
import { Search, Network, Server, Monitor, Shield, Database, Cloud, Radio, Box, Cpu, HardDrive, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  server: Server, workstation: Monitor, firewall: Shield, router: Radio,
  database: Database, api: Cloud, cache: Box, load_balancer: Network,
};

const RISK_COLORS: Record<string, string> = { high: '#f97316', medium: '#f59e0b', low: '#10b981' };

// ─── Asset Card ───
function AssetCard({ asset, isSelected, onClick }: { asset: any; isSelected: boolean; onClick: () => void }) {
  const Icon = TYPE_ICONS[asset.type] || Server;
  const riskColor = RISK_COLORS[asset.risk] || '#546380';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`soc-card soc-card-interactive p-4 cursor-pointer ${isSelected ? 'border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.08)]' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg p-2" style={{ backgroundColor: `${riskColor}10` }}>
            <Icon className="h-4 w-4" style={{ color: riskColor }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#e8ecf4]">{asset.name}</p>
            <p className="text-[10px] font-mono text-[#546380]">{asset.ip}</p>
          </div>
        </div>
        <div className="status-chip" style={{
          color: asset.status === 'online' ? '#34d399' : asset.status === 'offline' ? '#f87171' : '#fbbf24',
          background: asset.status === 'online' ? 'rgba(16,185,129,0.1)' : asset.status === 'offline' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
          border: `1px solid ${asset.status === 'online' ? 'rgba(16,185,129,0.15)' : asset.status === 'offline' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'}`,
        }}>
          {asset.status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="flex items-center gap-1.5">
          <Cpu className="h-3 w-3 text-[#546380]" />
          <span className="text-[#546380] truncate">{asset.os}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <HardDrive className="h-3 w-3 text-[#546380]" />
          <span className="text-[#546380]">{asset.openPorts.length} ports</span>
        </div>
      </div>

      {/* Risk score bar */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[9px] text-[#546380] uppercase tracking-wider font-semibold">Risk</span>
        <div className="flex-1 h-1.5 rounded-full bg-[#1a2744] overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{
            width: asset.risk === 'high' ? '85%' : asset.risk === 'medium' ? '55%' : '25%',
            backgroundColor: riskColor,
          }} />
        </div>
        <span className="text-[9px] font-semibold capitalize" style={{ color: riskColor }}>{asset.risk}</span>
      </div>

      {asset.vulnerabilities.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="rounded-md bg-red-500/10 border border-red-500/15 px-1.5 py-0.5">
            <span className="text-[9px] font-semibold text-red-400">{asset.vulnerabilities.length} vulns</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Topology Graph ───
function TopologyGraph() {
  const { topologyNodes, topologyEdges, selectAsset, assets } = useAssetStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const initialPositions = (() => {
    const map = new Map<string, { x: number; y: number }>();
    topologyNodes.forEach(n => map.set(n.id, { x: n.x, y: n.y }));
    return map;
  })();
  const effectivePositions = nodePositions.size > 0 ? nodePositions : initialPositions;

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    const pos = effectivePositions.get(nodeId);
    if (!pos) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setDragNode(nodeId);
    setDragOffset({ x: e.clientX - rect.left - pos.x, y: e.clientY - rect.top - pos.y });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragNode) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    setNodePositions(prev => {
      const next = new Map(prev);
      next.set(dragNode, { x, y });
      return next;
    });
  }, [dragNode, dragOffset]);

  const handleMouseUp = () => { setDragNode(null); };
  const handleNodeClick = (nodeId: string) => {
    const asset = assets.find(a => a.name === nodeId);
    if (asset) selectAsset(asset);
  };

  return (
    <svg ref={svgRef} className="h-full w-full" viewBox="0 0 800 600"
      onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <rect width="800" height="600" fill="#060b18" rx="8" />
      <defs>
        <pattern id="topo-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(59,130,246,0.02)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="800" height="600" fill="url(#topo-grid)" />
      {topologyEdges.map((edge, i) => {
        const source = effectivePositions.get(edge.source);
        const target = effectivePositions.get(edge.target);
        if (!source || !target) return null;
        const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target;
        return (
          <line key={i} x1={source.x} y1={source.y} x2={target.x} y2={target.y}
            stroke={edge.active ? '#ef4444' : isHighlighted ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.06)'}
            strokeWidth={edge.active ? 2.5 : isHighlighted ? 1.5 : 0.8}
            className="transition-all duration-300" />
        );
      })}
      {topologyNodes.map(node => {
        const pos = effectivePositions.get(node.id);
        if (!pos) return null;
        const isHovered = hoveredNode === node.id;
        const color = RISK_COLORS[node.risk] || '#546380';
        return (
          <g key={node.id} onMouseDown={e => handleMouseDown(e, node.id)}
            onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)}
            onClick={() => handleNodeClick(node.id)} className="cursor-pointer">
            {isHovered && <circle cx={pos.x} cy={pos.y} r="22" fill={`${color}08`} />}
            <circle cx={pos.x} cy={pos.y} r={isHovered ? 12 : 10} fill={`${color}10`}
              stroke={color} strokeWidth={isHovered ? 2 : 1} className="transition-all duration-200" />
            <circle cx={pos.x} cy={pos.y} r="3" fill={color} />
            <text x={pos.x} y={pos.y + 22} textAnchor="middle" fill={isHovered ? '#e8ecf4' : '#546380'}
              fontSize="9" fontFamily="monospace" className="transition-all duration-200">{node.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main Assets View ───
export function AssetsView() {
  const { assets, selectedAsset, selectAsset, search, setSearch, statusFilter, setStatusFilter, typeFilter, setTypeFilter, getFilteredAssets } = useAssetStore();
  const [view, setView] = useState<'cards' | 'table' | 'topology'>('cards');
  const filtered = getFilteredAssets();

  const onlineCount = filtered.filter(a => a.status === 'online').length;
  const atRiskCount = filtered.filter(a => a.risk === 'high').length;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#e8ecf4] tracking-tight">Asset Inventory</h2>
          <p className="text-xs text-[#546380] mt-0.5">{filtered.length} assets monitored · {onlineCount} online · {atRiskCount} at risk</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 rounded-xl soc-card px-3 py-2.5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#546380]" />
          <input type="text" placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#1a2744] bg-[#060b18]/70 py-1.5 pl-7 pr-2 text-[11px] text-[#94a3b8] placeholder-[#546380] focus:border-blue-500/20 focus:outline-none backdrop-blur-sm" />
        </div>
        <select value={statusFilter || ''} onChange={e => setStatusFilter(e.target.value || null)}
          className="rounded-lg border border-[#1a2744] bg-[#060b18]/70 px-2.5 py-1.5 text-[11px] text-[#94a3b8] focus:outline-none backdrop-blur-sm">
          <option value="">All Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="degraded">Degraded</option>
        </select>
        <select value={typeFilter || ''} onChange={e => setTypeFilter(e.target.value || null)}
          className="rounded-lg border border-[#1a2744] bg-[#060b18]/70 px-2.5 py-1.5 text-[11px] text-[#94a3b8] focus:outline-none backdrop-blur-sm">
          <option value="">All Types</option>
          <option value="server">Server</option>
          <option value="workstation">Workstation</option>
          <option value="firewall">Firewall</option>
          <option value="router">Router</option>
          <option value="database">Database</option>
          <option value="api">API</option>
        </select>
        <div className="flex items-center gap-0.5 rounded-lg glass-light p-0.5">
          {(['cards', 'table', 'topology'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`rounded-md px-2.5 py-1 text-[10px] capitalize transition-all font-medium ${
                view === v ? 'bg-[rgba(59,130,246,0.08)] text-blue-400' : 'text-[#546380] hover:text-[#94a3b8]'
              }`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 gap-4 min-h-0">
        {view === 'cards' && (
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(asset => (
                <AssetCard key={asset.id} asset={asset} isSelected={selectedAsset?.id === asset.id} onClick={() => selectAsset(asset)} />
              ))}
            </div>
          </div>
        )}

        {view === 'table' && (
          <div className="flex-1 overflow-hidden rounded-xl soc-card">
            <div className="overflow-x-auto max-h-[calc(100vh-220px)]">
              <table className="w-full text-xs">
                <thead className="sticky top-0">
                  <tr className="border-b border-[#1a2744]/60 bg-[#060b18]/40">
                    <th className="px-3 py-3 text-left text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">Name</th>
                    <th className="px-3 py-3 text-left text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">IP</th>
                    <th className="px-3 py-3 text-left text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">Type</th>
                    <th className="px-3 py-3 text-left text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">Status</th>
                    <th className="px-3 py-3 text-left text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">Risk</th>
                    <th className="px-3 py-3 text-left text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">OS</th>
                    <th className="px-3 py-3 text-left text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">Vulns</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((asset, i) => {
                    const Icon = TYPE_ICONS[asset.type] || Server;
                    return (
                      <motion.tr key={asset.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                        onClick={() => selectAsset(asset)}
                        className={`border-b border-[#1a2744]/30 cursor-pointer hover:bg-[rgba(59,130,246,0.02)] transition-all ${
                          selectedAsset?.id === asset.id ? 'bg-[rgba(59,130,246,0.03)] border-l-2 border-l-blue-500' : ''
                        }`}>
                        <td className="px-3 py-2.5"><div className="flex items-center gap-2"><Icon className="h-3 w-3 text-[#546380]" /><span className="text-[#e8ecf4] font-medium">{asset.name}</span></div></td>
                        <td className="px-3 py-2.5 font-mono text-[#94a3b8]">{asset.ip}</td>
                        <td className="px-3 py-2.5 text-[#94a3b8] capitalize">{asset.type.replace('_', ' ')}</td>
                        <td className="px-3 py-2.5"><StatusBadge status={asset.status} /></td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: RISK_COLORS[asset.risk] }} />
                            <span className="text-[10px] capitalize" style={{ color: RISK_COLORS[asset.risk] }}>{asset.risk}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-[#546380] max-w-[100px] truncate">{asset.os}</td>
                        <td className="px-3 py-2.5">
                          {asset.vulnerabilities.length > 0 ? (
                            <span className="status-chip severity-critical">{asset.vulnerabilities.length}</span>
                          ) : (<span className="text-[10px] text-[#546380]">None</span>)}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'topology' && (
          <div className="flex-1 overflow-hidden rounded-xl soc-card">
            <div className="flex items-center justify-between border-b border-[#1a2744]/60 px-3 py-2.5">
              <span className="text-[10px] uppercase tracking-[0.1em] text-[#546380] font-semibold">Network Topology</span>
              <span className="text-[9px] text-[#546380]">Drag nodes to rearrange</span>
            </div>
            <TopologyGraph />
          </div>
        )}
      </div>

      {/* Selected asset detail */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="soc-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RISK_COLORS[selectedAsset.risk] }} />
                <h3 className="text-sm font-semibold text-[#e8ecf4]">{selectedAsset.name}</h3>
                <span className="font-mono text-xs text-[#94a3b8]">{selectedAsset.ip}</span>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => selectAsset(null)}
                className="text-[#546380] hover:text-[#94a3b8] transition-colors rounded p-1 hover:bg-white/5">
                <X className="h-4 w-4" />
              </motion.button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div><span className="text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">Type</span><p className="text-[#e8ecf4] capitalize mt-0.5">{selectedAsset.type.replace('_', ' ')}</p></div>
              <div><span className="text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">OS</span><p className="text-[#e8ecf4] mt-0.5">{selectedAsset.os}</p></div>
              <div><span className="text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">Open Ports</span><p className="font-mono text-[#94a3b8] mt-0.5">{selectedAsset.openPorts.join(', ')}</p></div>
              <div><span className="text-[9px] uppercase tracking-[0.1em] text-[#546380] font-semibold">Vulnerabilities</span><p className="text-red-400 mt-0.5">{selectedAsset.vulnerabilities.join(', ') || 'None'}</p></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = { online: '#34d399', offline: '#f87171', degraded: '#fbbf24', unknown: '#546380' };
  const color = colors[status] || colors.unknown;
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] capitalize" style={{ color }}>{status}</span>
    </div>
  );
}
