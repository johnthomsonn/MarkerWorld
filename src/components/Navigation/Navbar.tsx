'use client';

import React, { useState } from 'react';
import {
  Globe2,
  ChevronDown,
  Plus,
  KeyRound,
  Share2,
  Copy,
  Check,
  Search,
  User as UserIcon,
  LogOut,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { User, World } from '@/types';

interface NavbarProps {
  currentUser: User | null;
  worlds: World[];
  currentWorld: World | null;
  onSelectWorld: (world: World) => void;
  onOpenCreateWorld: () => void;
  onOpenJoinWorld: () => void;
  onOpenInviteWorld: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSearchLocation: (query: string) => void;
}

export default function Navbar({
  currentUser,
  worlds,
  currentWorld,
  onSelectWorld,
  onOpenCreateWorld,
  onOpenJoinWorld,
  onOpenInviteWorld,
  onOpenAuth,
  onLogout,
  onSearchLocation,
}: NavbarProps) {
  const [worldDropdownOpen, setWorldDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentWorld?.inviteCode) return;
    navigator.clipboard.writeText(currentWorld.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onSearchLocation(searchQuery.trim());
  };

  return (
    <header
      className="glass-panel"
      style={{
        position: 'absolute',
        top: 14,
        left: 20,
        right: 20,
        height: 56,
        borderRadius: 'var(--radius-lg)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        boxShadow: 'var(--shadow-hud)',
      }}
    >
      {/* Left: Branding & World Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'default' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 14px rgba(0, 198, 255, 0.4)',
            }}
          >
            <Globe2 size={18} />
          </div>
          <span
            style={{
              fontSize: '1rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Marker<span style={{ color: 'var(--accent-cyan)', WebkitTextFillColor: 'var(--accent-cyan)' }}>World</span>
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--border-subtle)' }} />

        {/* World Switcher Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setWorldDropdownOpen(!worldDropdownOpen)}
            className="btn btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.8125rem',
              height: 36,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--accent-cyan)',
                boxShadow: '0 0 8px var(--accent-cyan)',
              }}
            />
            <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
              {currentWorld?.name || 'Select World'}
            </span>
            <ChevronDown size={14} style={{ opacity: 0.6 }} />
          </button>

          {/* Worlds Dropdown Menu */}
          {worldDropdownOpen && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: 44,
                left: 0,
                width: 280,
                borderRadius: 'var(--radius-md)',
                padding: 6,
                boxShadow: 'var(--shadow-hud)',
                zIndex: 100,
                animation: 'slideUp 0.18s ease-out',
              }}
            >
              <div
                style={{
                  padding: '6px 10px',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                }}
              >
                Your Worlds
              </div>

              <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {worlds.map((w) => {
                  const isActive = currentWorld?.id === w.id;
                  return (
                    <button
                      key={w.id}
                      onClick={() => {
                        onSelectWorld(w);
                        setWorldDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: isActive ? 'rgba(0, 240, 255, 0.12)' : 'transparent',
                        border: 'none',
                        color: isActive ? 'var(--accent-cyan)' : '#ffffff',
                        fontSize: '0.8125rem',
                        fontWeight: isActive ? 600 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {w.name}
                      </span>
                      {isActive && <Check size={14} />}
                    </button>
                  );
                })}
              </div>

              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '6px 0' }} />

              <button
                onClick={() => {
                  setWorldDropdownOpen(false);
                  onOpenCreateWorld();
                }}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  fontSize: '0.75rem',
                  padding: '7px 10px',
                  border: 'none',
                }}
              >
                <Plus size={14} style={{ color: 'var(--accent-cyan)' }} />
                <span>Create New World</span>
              </button>

              <button
                onClick={() => {
                  setWorldDropdownOpen(false);
                  onOpenJoinWorld();
                }}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  fontSize: '0.75rem',
                  padding: '7px 10px',
                  border: 'none',
                }}
              >
                <KeyRound size={14} style={{ color: 'var(--accent-emerald)' }} />
                <span>Join World with Code</span>
              </button>
            </div>
          )}
        </div>

        {/* Active Invite Code Badge */}
        {currentWorld && (
          <div
            onClick={onOpenInviteWorld}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(0, 240, 255, 0.08)',
              border: '1px solid var(--border-glow-cyan)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              transition: 'background 0.2s',
            }}
            title="Click to manage & share invite code"
          >
            <Share2 size={13} style={{ color: 'var(--accent-cyan)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Code:</span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                color: 'var(--accent-cyan)',
              }}
            >
              {currentWorld.inviteCode}
            </span>
            <button
              onClick={handleCopyCode}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
              }}
              title="Copy code"
            >
              {copiedCode ? <Check size={12} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={12} />}
            </button>
          </div>
        )}
      </div>

      {/* Center: Search City / Geocoder */}
      <form
        onSubmit={handleSearchSubmit}
        style={{
          position: 'relative',
          width: 260,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: 12,
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Fly to city or coords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field"
          style={{
            height: 34,
            paddingLeft: 34,
            paddingRight: 10,
            fontSize: '0.8125rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(0, 0, 0, 0.4)',
          }}
        />
      </form>

      {/* Right: User Profile / Auth */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {currentUser ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="btn btn-secondary"
              style={{
                padding: '4px 10px',
                fontSize: '0.8125rem',
                height: 36,
                borderRadius: 'var(--radius-full)',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00c6ff, #0072ff)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              >
                {(currentUser.name || currentUser.email)[0].toUpperCase()}
              </div>
              <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.name || currentUser.email.split('@')[0]}
              </span>
              <ChevronDown size={14} style={{ opacity: 0.6 }} />
            </button>

            {userDropdownOpen && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: 44,
                  right: 0,
                  width: 220,
                  borderRadius: 'var(--radius-md)',
                  padding: 8,
                  boxShadow: 'var(--shadow-hud)',
                  zIndex: 100,
                  animation: 'slideUp 0.18s ease-out',
                }}
              >
                <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#ffffff' }}>
                    {currentUser.name || 'Explorer'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser.email}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onLogout();
                  }}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    fontSize: '0.8125rem',
                    padding: '8px 10px',
                    border: 'none',
                    color: 'var(--accent-rose)',
                  }}
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="btn btn-primary"
            style={{ padding: '6px 16px', fontSize: '0.8125rem', height: 36 }}
          >
            <UserIcon size={14} />
            <span>Sign In / Join</span>
          </button>
        )}
      </div>
    </header>
  );
}
