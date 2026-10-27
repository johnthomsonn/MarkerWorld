'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  Compass,
  Image as ImageIcon,
} from 'lucide-react';
import { Marker, World } from '@/types';

interface MarkersDrawerProps {
  world: World | null;
  markers: Marker[];
  selectedMarker: Marker | null;
  onSelectMarker: (marker: Marker) => void;
  onToggleAddMode: () => void;
  isAddingMarker: boolean;
  onOpenInviteModal: () => void;
}

type FilterType = 'all' | 'open' | 'resolved';

export default function MarkersDrawer({
  world,
  markers,
  selectedMarker,
  onSelectMarker,
  onToggleAddMode,
  isAddingMarker,
  onOpenInviteModal,
}: MarkersDrawerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMarkers = useMemo(() => {
    return markers.filter((m) => {
      const matchesSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filter === 'open') return !m.isResolved;
      if (filter === 'resolved') return m.isResolved;
      return true;
    });
  }, [markers, filter, searchQuery]);

  const openCount = useMemo(() => markers.filter((m) => !m.isResolved).length, [markers]);
  const resolvedCount = useMemo(() => markers.filter((m) => m.isResolved).length, [markers]);

  return (
    <>
      {/* Toggle Button when Closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="glass-panel btn-icon"
          style={{
            position: 'absolute',
            top: 80,
            left: 20,
            zIndex: 35,
            width: 42,
            height: 42,
            borderRadius: 'var(--radius-md)',
          }}
          title="Open Markers Drawer"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Main Drawer Panel */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          top: 80,
          left: isOpen ? 20 : -380,
          bottom: 24,
          width: 360,
          borderRadius: 'var(--radius-lg)',
          zIndex: 35,
          display: 'flex',
          flexDirection: 'column',
          transition: 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-hud)',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '18px 20px 14px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0, 240, 255, 0.15)',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Compass size={16} />
              </div>
              <h2
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={world?.name}
              >
                {world?.name || 'World Explorer'}
              </h2>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="btn-icon"
              style={{ width: 28, height: 28, border: 'none' }}
              title="Collapse Drawer"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          {world?.description && (
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginBottom: 10,
                lineHeight: 1.4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {world.description}
            </p>
          )}

          {/* Members & Invite bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.04)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={14} style={{ color: 'var(--accent-cyan)' }} />
              <span>
                {world?.members?.length || 1} {world?.members?.length === 1 ? 'member' : 'members'}
              </span>
            </div>
            <button
              onClick={onOpenInviteModal}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-cyan)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              + Invite Friends
            </button>
          </div>
        </div>

        {/* Quick Drop Action & Search */}
        <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onToggleAddMode}
            className={`btn ${isAddingMarker ? 'btn-emerald' : 'btn-primary'}`}
            style={{ width: '100%', padding: '10px 14px', fontWeight: 600 }}
          >
            <Plus size={16} />
            <span>{isAddingMarker ? 'Click Globe to Drop Pin' : 'Drop New Marker'}</span>
          </button>

          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                top: '50%',
                left: 12,
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search markers or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 34, fontSize: '0.8125rem', height: 36 }}
            />
          </div>

          {/* Filter Pills */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: 3,
              gap: 2,
            }}
          >
            {(
              [
                { id: 'all', label: 'All', count: markers.length },
                { id: 'open', label: 'Open', count: openCount },
                { id: 'resolved', label: 'Resolved', count: resolvedCount },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: filter === tab.id ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  color: filter === tab.id ? '#ffffff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    opacity: 0.75,
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-full)',
                    background:
                      filter === tab.id
                        ? tab.id === 'resolved'
                          ? 'var(--accent-emerald)'
                          : 'var(--accent-cyan)'
                        : 'rgba(255, 255, 255, 0.08)',
                    color: filter === tab.id ? '#000000' : 'var(--text-secondary)',
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Markers List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {filteredMarkers.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                gap: 10,
              }}
            >
              <MapPin size={32} style={{ opacity: 0.4 }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                {searchQuery ? 'No matching markers found' : 'No markers in this world yet'}
              </p>
              <p style={{ fontSize: '0.75rem' }}>
                {searchQuery
                  ? 'Try adjusting your search query or filter'
                  : 'Click on the map or use "Drop New Marker" to place your first pin!'}
              </p>
            </div>
          ) : (
            filteredMarkers.map((marker) => {
              const isSelected = selectedMarker?.id === marker.id;
              return (
                <div
                  key={marker.id}
                  onClick={() => onSelectMarker(marker)}
                  className="glass-card"
                  style={{
                    padding: 12,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    borderColor: isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                    background: isSelected ? 'rgba(0, 240, 255, 0.08)' : 'var(--bg-glass-card)',
                  }}
                >
                  {/* Thumbnail / Pin Icon */}
                  {marker.imageUrl ? (
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <img
                        src={marker.imageUrl}
                        alt={marker.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 'var(--radius-sm)',
                        background: marker.isResolved
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(239, 68, 68, 0.15)',
                        color: marker.isResolved ? 'var(--accent-emerald)' : '#f87171',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {marker.isResolved ? <CheckCircle2 size={24} /> : <MapPin size={24} />}
                    </div>
                  )}

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: marker.isResolved ? 'var(--accent-emerald)' : '#ef4444',
                          flexShrink: 0,
                        }}
                      />
                      <h4
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#ffffff',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {marker.title}
                      </h4>
                    </div>

                    {marker.description && (
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          marginBottom: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {marker.description}
                      </p>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      <span>
                        {marker.lat.toFixed(2)}°, {marker.lng.toFixed(2)}°
                      </span>
                      <span>•</span>
                      <span style={{ color: marker.isResolved ? 'var(--accent-emerald)' : '#f87171' }}>
                        {marker.isResolved ? 'Resolved' : 'Open'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
