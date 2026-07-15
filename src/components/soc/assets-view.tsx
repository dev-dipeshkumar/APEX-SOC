'use client';

import { useCallback, useRef, useState } from 'react';
import { useAssetStore } from '@/stores/asset-store';
import { SEVERITY_COLORS, type Severity, type AssetType } from '@/lib/constants';
import { Search, Plus, Network, Server, Monitor, Shield, Database, Cloud, Radio, Box } from 'lucide-react';

const TYPE_ICONS: Record<string, React.ElementType> = {
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
  const { topologyNodes, topologyEdges, selectAsset, assets, pulseEdge } = useAssetStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const { updateNodePositions } = useAssetStore();

  // Initialize positions from topologyNodes (using useMemo-like pattern)
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
      {/* Background */}
      <rect width="800" height="600" fill="#0a0e17" rx="8" />

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
            stroke={edge.active ? '#ff2d55' : isHighlighted ? '#00f0ff40' : '#1e293b'}
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
            {/* Glow */}
            {isHovered && (
              <circle cx={pos.x} cy={pos.y} r="20" fill={`${color}15`} />
            )}

            {/* Node circle */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={isHovered ? 12 : 10}
              fill={`${color}15`}
              stroke={color}
              strokeWidth={isHovered ? 2 : 1}
              className="transition-all duration-200"
            />

            {/* Icon center dot */}
            <circle cx={pos.x} cy={pos.y} r="3" fill={color} />

            {/* Label */}
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

            {/* Risk indicator */}
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
      <div className="flex items-center gap-3 rounded-lg border border-[#1e293b] bg-[#1a2332] px-3 py-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#475569]" />
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded border border-[#1e293b] bg-[#0a0e17] py-1 pl-7 pr-2 text-[11px] text-[#94a3b8] placeholder-[#475569] focus:border-cyan-500/30 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter || ''}
          onChange={e => setStatusFilter(e.target.value || null)}
          className="rounded border border-[#1e293b] bg-[#0a0e17] px-2 py-1 text-[11px] text-[#94a3b8] focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="degraded">Degraded</option>
        </select>

        <select
          value={typeFilter || ''}
          onChange={e => setTypeFilter(e.target.value || null)}
          className="rounded border border-[#1e293b] bg-[#0a0e17] px-2 py-1 text-[11px] text-[#94a3b8] focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="server">Server</option>
          <option value="workstation">Workstation</option>
          <option value="firewall">Firewall</option>
          <option value="router">Router</option>
          <option value="database">Database</option>
          <option value="api">API</option>
        </select>

        <div className="flex items-center gap-1 rounded border border-[#1e293b] bg-[#0a0e17] p-0.5">
          {(['table', 'split', 'topology'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded px-2 py-1 text-[10px] capitalize transition-colors ${
                view === v ? 'bg-[#1a2332] text-cyan-400' : 'text-[#475569] hover:text-[#94a3b8]'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Table */}
        {(view === 'table' || view === 'split') && (
          <div className={`${view === 'split' ? 'w-1/2' : 'w-full'} overflow-hidden rounded-lg border border-[#1e293b] bg-[#1a2332]`}>
            <div className="overflow-x-auto max-h-[calc(100vh-220px)]">
              <table className="w-full text-xs">
                <thead className="sticky top-0">
                  <tr className="border-b border-[#1e293b] bg-[#111827]">
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Name</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">IP</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Type</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Status</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Risk</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">OS</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#475569] font-medium">Vulns</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(asset => {
                    const Icon = TYPE_ICONS[asset.type] || Server;
                    return (
                      <tr
                        key={asset.id}
                        onClick={() => selectAsset(asset)}
                        className={`border-b border-[#1e293b]/50 cursor-pointer hover:bg-[#1a2332] transition-colors ${
                          selectedAsset?.id === asset.id ? 'bg-cyan-500/5 border-l-2 border-l-cyan-500' : ''
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
                        <td className="px-3 py-2">
                          <StatusBadge status={asset.status} />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: RISK_COLORS[asset.risk] }} />
                            <span className="text-[10px] capitalize" style={{ color: RISK_COLORS[asset.risk] }}>{asset.risk}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-[#475569] max-w-[100px] truncate">{asset.os}</td>
                        <td className="px-3 py-2">
                          {asset.vulnerabilities.length > 0 ? (
                            <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[9px] text-red-400 border border-red-500/20">
                              {asset.vulnerabilities.length}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#475569]">None</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Topology */}
        {(view === 'topology' || view === 'split') && (
          <div className={`${view === 'split' ? 'w-1/2' : 'w-full'} overflow-hidden rounded-lg border border-[#1e293b] bg-[#1a2332]`}>
            <div className="flex items-center justify-between border-b border-[#1e293b] px-3 py-2">
              <span className="text-[10px] uppercase tracking-wider text-[#475569]">Network Topology</span>
              <span className="text-[9px] text-[#475569]">Drag nodes to rearrange</span>
            </div>
            <TopologyGraph />
          </div>
        )}
      </div>

      {/* Selected asset detail */}
      {selectedAsset && (
        <div className="rounded-lg border border-cyan-500/20 bg-[#1a2332] p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RISK_COLORS[selectedAsset.risk] }} />
              <h3 className="text-sm font-semibold text-[#e2e8f0]">{selectedAsset.name}</h3>
              <span className="font-mono text-xs text-[#94a3b8]">{selectedAsset.ip}</span>
            </div>
            <button onClick={() => selectAsset(null)} className="text-[#475569] hover:text-[#94a3b8]">
              x
            </button>
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
        </div>
      )}
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
