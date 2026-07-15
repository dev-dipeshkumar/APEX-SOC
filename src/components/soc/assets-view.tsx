'use client';

import { useCallback, useRef, useState } from 'react';
import { useAssetStore } from '@/stores/asset-store';
import { SEVERITY_COLORS, type Severity, type AssetType } from '@/lib/constants';
import { Search, Plus, Network, Server, Monitor, Shield, Database, Cloud, Radio, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  server: Server,
  workstation: Monitor,
  firewall: Shield,
  router: Radio,
  database: Database,
  api: Cloud,
  cache: Box,
  load_balancer: Network,
};

const RISK_COLORS: Record<string, string> = {
  high: '#ff9500',
  medium: '#ffd60a',
  low: '#30d158',
};

// --- Topology Graph ---
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
    setDragOffset({
      x: e.clientX - rect.left - pos.x,
      y: e.clientY - rect.top - pos.y,
    });
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

  const handleMouseUp = () => {
    setDragNode(null);
  };

  const handleNodeClick = (nodeId: string) => {
    const asset = assets.find(a => a.name === nodeId);
    if (asset) selectAsset(asset);
  };

  return (
    <svg
      ref={svgRef}
      className="h-full w-full"
      viewBox="0 0 800 600"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <rect width="800" height="600" fill="#050810" rx="8" />

      {/* Grid pattern */}
      <defs>
        <pattern id="topo-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,240,255,0.02)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="800" height="600" fill="url(#topo-grid)" />

      {/* Edges */}
      {topologyEdges.map((edge, i) => {
        const source = effectivePositions.get(edge.source);
        const target = effectivePositions.get(edge.target);
        if (!source || !target) return null;

        const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target;

        return (
          <line
            key={i}
            x1={source.x}
            y1={source.y}
            x2={target.x}
            y2={target.y}
            stroke={edge.active ? '#ff2d55' : isHighlighted ? 'rgba(0,240,255,0.25)' : 'rgba(0,240,255,0.06)'}
            strokeWidth={edge.active ? 2.5 : isHighlighted ? 1.5 : 0.8}
            className="transition-all duration-300"
          />
        );
      })}

      {/* Nodes */}
      {topologyNodes.map(node => {
        const pos = effectivePositions.get(node.id);
        if (!pos) return null;
        const isHovered = hoveredNode === node.id;
        const color = RISK_COLORS[node.risk] || '#475569';

        return (
          <g
            key={node.id}
            onMouseDown={e => handleMouseDown(e, node.id)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={() => handleNodeClick(node.id)}
            className="cursor-pointer"
          >
            {isHovered && (
              <circle cx={pos.x} cy={pos.y} r="22" fill={`${color}08`} />
            )}

            <circle
              cx={pos.x}
              cy={pos.y}
              r={isHovered ? 12 : 10}
              fill={`${color}10`}
              stroke={color}
              strokeWidth={isHovered ? 2 : 1}
              className="transition-all duration-200"
            />

            <circle cx={pos.x} cy={pos.y} r="3" fill={color} />

            <text
              x={pos.x}
              y={pos.y + 22}
              textAnchor="middle"
              fill={isHovered ? '#e2e8f0' : '#475569'}
              fontSize="9"
              fontFamily="monospace"
              className="transition-all duration-200"
            >
              {node.label}
            </text>

            <circle cx={pos.x + 8} cy={pos.y - 8} r="3" fill={color} opacity={0.8} />
          </g>
        );
      })}
    </svg>
  );
}

// --- Main Assets View ---
export function AssetsView() {
  const { assets, selectedAsset, selectAsset, search, setSearch, statusFilter, setStatusFilter, typeFilter, setTypeFilter, getFilteredAssets } = useAssetStore();
  const [view, setView] = useState<'table' | 'topology' | 'split'>('split');

  const filtered = getFilteredAssets();

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3 rounded-xl glass px-3 py-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#475569]" />
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[rgba(0,240,255,0.08)] bg-[#050810]/60 py-1.5 pl-7 pr-2 text-[11px] text-[#94a3b8] placeholder-[#475569] focus:border-cyan-500/20 focus:outline-none backdrop-blur-sm"
          />
        </div>

        <select
          value={statusFilter || ''}
          onChange={e => setStatusFilter(e.target.value || null)}
          className="rounded-lg border border-[rgba(0,240,255,0.08)] bg-[#050810]/60 px-2.5 py-1.5 text-[11px] text-[#94a3b8] focus:outline-none backdrop-blur-sm"
        >
          <option value="">All Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="degraded">Degraded</option>
        </select>

        <select
          value={typeFilter || ''}
          onChange={e => setTypeFilter(e.target.value || null)}
          className="rounded-lg border border-[rgba(0,240,255,0.08)] bg-[#050810]/60 px-2.5 py-1.5 text-[11px] text-[#94a3b8] focus:outline-none backdrop-blur-sm"
        >
          <option value="">All Types</option>
          <option value="server">Server</option>
          <option value="workstation">Workstation</option>
          <option value="firewall">Firewall</option>
          <option value="router">Router</option>
          <option value="database">Database</option>
          <option value="api">API</option>
        </select>

        <div className="flex items-center gap-1 rounded-lg glass-light p-0.5">
          {(['table', 'split', 'topology'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-2.5 py-1 text-[10px] capitalize transition-all ${
                view === v ? 'bg-[rgba(0,240,255,0.08)] text-cyan-400' : 'text-[#475569] hover:text-[#94a3b8]'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 gap-4 min-h-0">
        {(view === 'table' || view === 'split') && (
          <div className={`${view === 'split' ? 'w-1/2' : 'w-full'} overflow-hidden rounded-xl glass`}>
            <div className="overflow-x-auto max-h-[calc(100vh-220px)]">
              <table className="w-full text-xs">
                <thead className="sticky top-0">
                  <tr className="border-b border-[rgba(0,240,255,0.04)] bg-[#050810]/40">
                    <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Name</th>
                    <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">IP</th>
                    <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Type</th>
                    <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Status</th>
                    <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Risk</th>
                    <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">OS</th>
                    <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Vulns</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((asset, i) => {
                    const Icon = TYPE_ICONS[asset.type] || Server;
                    return (
                      <motion.tr
                        key={asset.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        onClick={() => selectAsset(asset)}
                        className={`border-b border-[rgba(0,240,255,0.02)] cursor-pointer hover:bg-[rgba(0,240,255,0.02)] transition-all ${
                          selectedAsset?.id === asset.id ? 'bg-[rgba(0,240,255,0.03)] border-l-2 border-l-cyan-500' : ''
                        }`}
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Icon className="h-3 w-3 text-[#475569]" />
                            <span className="text-[#e2e8f0] font-medium">{asset.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 font-mono text-[#94a3b8]">{asset.ip}</td>
                        <td className="px-3 py-2 text-[#94a3b8] capitalize">{asset.type.replace('_', ' ')}</td>
                        <td className="px-3 py-2"><StatusBadge status={asset.status} /></td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: RISK_COLORS[asset.risk] }} />
                            <span className="text-[10px] capitalize" style={{ color: RISK_COLORS[asset.risk] }}>{asset.risk}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-[#475569] max-w-[100px] truncate">{asset.os}</td>
                        <td className="px-3 py-2">
                          {asset.vulnerabilities.length > 0 ? (
                            <span className="rounded-full glass-light px-1.5 py-0.5 text-[9px] text-red-400">{asset.vulnerabilities.length}</span>
                          ) : (
                            <span className="text-[10px] text-[#475569]">None</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(view === 'topology' || view === 'split') && (
          <div className={`${view === 'split' ? 'w-1/2' : 'w-full'} overflow-hidden rounded-xl glass`}>
            <div className="flex items-center justify-between border-b border-[rgba(0,240,255,0.04)] px-3 py-2">
              <span className="text-[10px] uppercase tracking-wider text-[#475569]">Network Topology</span>
              <span className="text-[9px] text-[#475569]">Drag nodes to rearrange</span>
            </div>
            <TopologyGraph />
          </div>
        )}
      </div>

      {/* Selected asset detail */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="rounded-xl glass p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RISK_COLORS[selectedAsset.risk] }} />
                <h3 className="text-sm font-semibold text-[#e2e8f0]">{selectedAsset.name}</h3>
                <span className="font-mono text-xs text-[#94a3b8]">{selectedAsset.ip}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => selectAsset(null)}
                className="text-[#475569] hover:text-[#94a3b8] transition-colors rounded p-1 hover:bg-white/5"
              >
                <span className="text-sm">x</span>
              </motion.button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#475569]">Type</span>
                <p className="text-[#e2e8f0] capitalize">{selectedAsset.type.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#475569]">OS</span>
                <p className="text-[#e2e8f0]">{selectedAsset.os}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#475569]">Open Ports</span>
                <p className="font-mono text-[#94a3b8]">{selectedAsset.openPorts.join(', ')}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#475569]">Vulnerabilities</span>
                <p className="text-red-400">{selectedAsset.vulnerabilities.join(', ') || 'None'}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    online: '#30d158',
    offline: '#ff2d55',
    degraded: '#ff9500',
    unknown: '#475569',
  };
  const color = colors[status] || colors.unknown;

  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] capitalize" style={{ color }}>{status}</span>
    </div>
  );
}
