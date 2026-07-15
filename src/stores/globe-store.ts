// ─────────────────────────────────────────────────────────────
// Globe Store - Zustand state management for globe/threat data
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { type AttackConnection, type Severity, type AttackType } from '@/lib/constants';

export interface GlobeThreat extends AttackConnection {
  // Extended properties for cinematic visualization
  animationProgress: number; // 0-1 how much of the arc has been drawn
  pulsePhase: number; // current pulse animation phase
  isActive: boolean; // whether threat is still active
  createdAt: number; // timestamp for animation sequencing
  fadeOut: number; // 0-1 for fade out when expired
}

export interface CameraTarget {
  lat: number;
  lng: number;
  zoom: number; // camera distance
  transitionDuration: number; // ms
}

export type GlobeInteractionState = 'idle' | 'hovering' | 'selected' | 'transitioning';

interface GlobeStore {
  // Threats
  threats: GlobeThreat[];
  maxThreats: number;

  // Interaction
  interactionState: GlobeInteractionState;
  selectedThreatId: string | null;
  hoveredThreatId: string | null;

  // Camera
  cameraTarget: CameraTarget | null;
  isAutoRotating: boolean;
  cameraZoom: number;

  // Filters
  severityFilter: Severity | '';
  typeFilter: AttackType | '';

  // UI
  infoPanelOpen: boolean;
  infoPanelThreatId: string | null;
  showCityLabels: boolean;
  showCountryBorders: boolean;

  // Globe state
  globeReady: boolean;
  fps: number;

  // Actions
  addThreat: (attack: AttackConnection) => void;
  removeThreat: (id: string) => void;
  updateThreatProgress: (id: string, progress: number) => void;
  selectThreat: (id: string) => void;
  deselectThreat: () => void;
  hoverThreat: (id: string | null) => void;
  setInteractionState: (state: GlobeInteractionState) => void;
  setCameraTarget: (target: CameraTarget | null) => void;
  setAutoRotating: (v: boolean) => void;
  setCameraZoom: (v: number) => void;
  setSeverityFilter: (v: Severity | '') => void;
  setTypeFilter: (v: AttackType | '') => void;
  setInfoPanelOpen: (v: boolean) => void;
  setInfoPanelThreatId: (id: string | null) => void;
  setGlobeReady: (v: boolean) => void;
  setFps: (v: number) => void;
  cleanupExpired: () => void;
}

export const useGlobeStore = create<GlobeStore>((set, get) => ({
  threats: [],
  maxThreats: 150,

  interactionState: 'idle',
  selectedThreatId: null,
  hoveredThreatId: null,

  cameraTarget: null,
  isAutoRotating: true,
  cameraZoom: 4.5,

  severityFilter: '',
  typeFilter: '',

  infoPanelOpen: false,
  infoPanelThreatId: null,
  showCityLabels: false,
  showCountryBorders: true,

  globeReady: false,
  fps: 60,

  addThreat: (attack: AttackConnection) => {
    const state = get();
    const existing = state.threats.find(t => t.id === attack.id);
    if (existing) return;

    const threat: GlobeThreat = {
      ...attack,
      animationProgress: 0,
      pulsePhase: Math.random() * Math.PI * 2,
      isActive: true,
      createdAt: Date.now(),
      fadeOut: 1,
    };

    set({
      threats: [...state.threats, threat].slice(-state.maxThreats),
    });
  },

  removeThreat: (id: string) => {
    set(state => ({
      threats: state.threats.filter(t => t.id !== id),
    }));
  },

  updateThreatProgress: (id: string, progress: number) => {
    set(state => ({
      threats: state.threats.map(t =>
        t.id === id ? { ...t, animationProgress: progress } : t
      ),
    }));
  },

  selectThreat: (id: string) => {
    const threat = get().threats.find(t => t.id === id);
    if (!threat) return;

    set({
      selectedThreatId: id,
      interactionState: 'transitioning',
      cameraTarget: {
        lat: (threat.sourceCoords[0] + threat.targetCoords[0]) / 2,
        lng: (threat.sourceCoords[1] + threat.targetCoords[1]) / 2,
        zoom: 3.0,
        transitionDuration: 1500,
      },
      isAutoRotating: false,
    });

    // After camera transition, open info panel
    setTimeout(() => {
      set({
        interactionState: 'selected',
        infoPanelOpen: true,
        infoPanelThreatId: id,
      });
    }, 1600);
  },

  deselectThreat: () => {
    set({
      selectedThreatId: null,
      interactionState: 'idle',
      cameraTarget: null,
      isAutoRotating: true,
      infoPanelOpen: false,
      infoPanelThreatId: null,
    });
  },

  hoverThreat: (id: string | null) => {
    set({
      hoveredThreatId: id,
      interactionState: id ? 'hovering' : (get().selectedThreatId ? 'selected' : 'idle'),
    });
  },

  setInteractionState: (state: GlobeInteractionState) => set({ interactionState: state }),
  setCameraTarget: (target: CameraTarget | null) => set({ cameraTarget: target }),
  setAutoRotating: (v: boolean) => set({ isAutoRotating: v }),
  setCameraZoom: (v: number) => set({ cameraZoom: v }),
  setSeverityFilter: (v: Severity | '') => set({ severityFilter: v }),
  setTypeFilter: (v: AttackType | '') => set({ typeFilter: v }),
  setInfoPanelOpen: (v: boolean) => set({ infoPanelOpen: v }),
  setInfoPanelThreatId: (id: string | null) => set({ infoPanelThreatId: id }),
  setGlobeReady: (v: boolean) => set({ globeReady: v }),
  setFps: (v: number) => set({ fps: v }),

  cleanupExpired: () => {
    const now = Date.now();
    set(state => ({
      threats: state.threats.filter(t => {
        if (!t.isActive && now - t.createdAt > 30000) return false;
        return true;
      }),
    }));
  },
}));
