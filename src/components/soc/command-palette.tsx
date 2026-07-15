'use client';

import { useEffect, useCallback } from 'react';
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
  Zap, Terminal, Activity,
} from 'lucide-react';

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

  const commands: CommandAction[] = [
    // Navigation
    { id: 'nav-dashboard', label: 'Go to Overview', icon: LayoutDashboard, shortcut: '1', action: () => setActiveView('dashboard'), group: 'Navigation' },
    { id: 'nav-alerts', label: 'Go to Alerts', icon: AlertTriangle, shortcut: '2', action: () => setActiveView('alerts'), group: 'Navigation' },
    { id: 'nav-intel', label: 'Go to Intel Map', icon: Globe, shortcut: '3', action: () => setActiveView('intel-map'), group: 'Navigation' },
    { id: 'nav-assets', label: 'Go to Assets', icon: Server, shortcut: '4', action: () => setActiveView('assets'), group: 'Navigation' },
    { id: 'nav-settings', label: 'Go to Settings', icon: Settings, shortcut: '5', action: () => setActiveView('settings'), group: 'Navigation' },

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

  // Global keyboard shortcut: CMD+K (Mac) or CTRL+K (Windows/Linux)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Check for CMD+K or CTRL+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        e.stopPropagation();
        toggleCommandPalette();
        return;
      }
    };

    // Use capture phase to intercept before any other handlers (including browser defaults)
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [toggleCommandPalette]);

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
        {['Navigation', 'Actions', 'System'].map(groupName => {
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
