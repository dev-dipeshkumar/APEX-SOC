// APEX SOC Asset Store
import { create } from 'zustand';
import { Asset, TopologyNode, TopologyEdge } from '@/lib/constants';
import { generateAssets, generateTopology } from '@/lib/mock-data';

interface AssetStore {
  assets: Asset[];
  selectedAsset: Asset | null;
  topologyNodes: TopologyNode[];
  topologyEdges: TopologyEdge[];
  search: string;
  statusFilter: string | null;
  typeFilter: string | null;

  initialize: () => void;
  selectAsset: (asset: Asset | null) => void;
  setSearch: (s: string) => void;
  setStatusFilter: (s: string | null) => void;
  setTypeFilter: (s: string | null) => void;
  getFilteredAssets: () => Asset[];
  pulseEdge: (sourceName: string, targetName: string) => void;
  updateNodePositions: (nodes: TopologyNode[]) => void;
}

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: [],
  selectedAsset: null,
  topologyNodes: [],
  topologyEdges: [],
  search: '',
  statusFilter: null,
  typeFilter: null,

  initialize: () => {
    const assets = generateAssets();
    const { nodes, edges } = generateTopology();
    set({ assets, topologyNodes: nodes, topologyEdges: edges });
  },

  selectAsset: (asset: Asset | null) => set({ selectedAsset: asset }),

  setSearch: (s: string) => set({ search: s }),
  setStatusFilter: (s: string | null) => set({ statusFilter: s }),
  setTypeFilter: (s: string | null) => set({ typeFilter: s }),

  getFilteredAssets: () => {
    const { assets, search, statusFilter, typeFilter } = get();
    return assets.filter(a => {
      if (statusFilter && a.status !== statusFilter) return false;
      if (typeFilter && a.type !== typeFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return a.name.toLowerCase().includes(s) || a.ip.includes(s) || a.os.toLowerCase().includes(s);
      }
      return true;
    });
  },

  pulseEdge: (sourceName: string, targetName: string) => {
    set(state => ({
      topologyEdges: state.topologyEdges.map(e =>
        (e.source === sourceName && e.target === targetName) ||
        (e.source === targetName && e.target === sourceName)
          ? { ...e, active: true }
          : e
      ),
    }));
    setTimeout(() => {
      set(state => ({
        topologyEdges: state.topologyEdges.map(e =>
          (e.source === sourceName && e.target === targetName) ||
          (e.source === targetName && e.target === sourceName)
            ? { ...e, active: false }
            : e
        ),
      }));
    }, 2000);
  },

  updateNodePositions: (nodes: TopologyNode[]) => set({ topologyNodes: nodes }),
}));
