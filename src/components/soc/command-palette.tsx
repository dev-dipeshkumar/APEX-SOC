'use client';

import { useEffect, useCallback, useRef } from 'react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command';
import { useUIStore } from '@/stores/ui-store';
import {
  LayoutDashboard, AlertTriangle, Globe, Server, Settings,
  Shield, Search, Download, Bell, LogOut, Maximize2,
  Zap, Terminal, Activity, Crosshair, Eye, RotateCcw,
} from 'lucide-react';
import { useGlobeStore } from '@/stores/globe-store';

interface CommandAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
  group: string;
}

export function CommandPalette() {
  const {
    commandPaletteOpen, setCommandPaletteOpen, toggleCommandPalette,
    setActiveView, toggleNotificationDrawer, toggleSidebar, logout,
  } = useUIStore();
  const deselectThreat = useGlobeStore(s => s.deselectThreat);
  const setSeverityFilter = useGlobeStore(s => s.setSeverityFilter);
  const setTypeFilter = useGlobeStore(s => s.setTypeFilter);

  // Track if we've registered the global listener to prevent duplicates
  const registeredRef = useRef(false);

  const commands: CommandAction[] = [
    // Navigation
    { id: 'nav-dashboard', label: 'Go to Overview', icon: LayoutDashboard, shortcut: '1', action: () => setActiveView('dashboard'), group: 'Navigation' },
    { id: 'nav-alerts', label: 'Go to Alerts', icon: AlertTriangle, shortcut: '2', action: () => setActiveView('alerts'), group: 'Navigation' },
    { id: 'nav-intel', label: 'Go to Intel Map', icon: Globe, shortcut: '3', action: () => setActiveView('intel-map'), group: 'Navigation' },
    { id: 'nav-assets', label: 'Go to Assets', icon: Server, shortcut: '4', action: () => setActiveView('assets'), group: 'Navigation' },
    { id: 'nav-settings', label: 'Go to Settings', icon: Settings, shortcut: '5', action: () => setActiveView('settings'), group: 'Navigation' },

    // Intel Map Actions
    { id: 'intel-critical', label: 'Filter: Critical Threats', icon: Crosshair, action: () => { setActiveView('intel-map'); setSeverityFilter('critical'); }, group: 'Intel Map' },
    { id: 'intel-high', label: 'Filter: High Severity', icon: AlertTriangle, action: () => { setActiveView('intel-map'); setSeverityFilter('high'); }, group: 'Intel Map' },
    { id: 'intel-clear', label: 'Clear All Filters', icon: RotateCcw, action: () => { setSeverityFilter(''); setTypeFilter(''); }, group: 'Intel Map' },
    { id: 'intel-deselect', label: 'Deselect Threat', icon: Eye, action: () => deselectThreat(), group: 'Intel Map' },

    // Actions
    { id: 'action-notifications', label: 'Toggle Notifications', icon: Bell, shortcut: 'N', action: () => toggleNotificationDrawer(), group: 'Actions' },
    { id: 'action-sidebar', label: 'Toggle Sidebar', icon: Maximize2, shortcut: 'B', action: () => toggleSidebar(), group: 'Actions' },
    { id: 'action-export', label: 'Export Data', icon: Download, shortcut: 'E', action: () => {}, group: 'Actions' },
    { id: 'action-search', label: 'Search Threats', icon: Search, shortcut: 'S', action: () => {}, group: 'Actions' },

    // System
    { id: 'sys-status', label: 'System Status', icon: Activity, action: () => {}, group: 'System' },
    { id: 'sys-terminal', label: 'Open Terminal', icon: Terminal, action: () => {}, group: 'System' },
    { id: 'sys-shield', label: 'Threat Summary', icon: Shield, action: () => {}, group: 'System' },
    { id: 'sys-logout', label: 'Sign Out', icon: LogOut, action: () => logout(), group: 'System' },
  ];

  // ──── FIX: Global keyboard shortcut with capture phase ────
  // Uses capture phase + stopPropagation to ensure CMD/CTRL+K
  // works globally regardless of focus or other handlers.
  useEffect(() => {
    if (registeredRef.current) return;
    registeredRef.current = true;

    const handler = (e: KeyboardEvent) => {
      // CMD+K on Mac, CTRL+K on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        toggleCommandPalette();
        return;
      }
    };

    // Use capture: true to intercept before any other handler
    // This ensures the shortcut works even when Canvas or other elements have focus
    window.addEventListener('keydown', handler, { capture: true });

    return () => {
      window.removeEventListener('keydown', handler, { capture: true });
      registeredRef.current = false;
    };
  }, [toggleCommandPalette]);

  // Also close on ESC when open
  useEffect(() => {
    if (!commandPaletteOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true });
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const runCommand = useCallback((command: CommandAction) => {
    setCommandPaletteOpen(false);
    command.action();
  }, [setCommandPaletteOpen]);

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
      title="Command Palette"
      description="Search for commands, navigate views, and perform actions..."
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Group commands */}
        {['Navigation', 'Intel Map', 'Actions', 'System'].map(groupName => {
          const groupCommands = commands.filter(c => c.group === groupName);
          if (groupCommands.length === 0) return null;
          return (
            <CommandGroup key={groupName} heading={groupName}>
              {groupCommands.map(command => (
                <CommandItem
                  key={command.id}
                  onSelect={() => runCommand(command)}
                  className="cursor-pointer"
                >
                  <command.icon className="h-4 w-4 text-[#94a3b8]" />
                  <span className="flex-1">{command.label}</span>
                  {command.shortcut && (
                    <CommandShortcut>
                      {command.shortcut}
                    </CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
