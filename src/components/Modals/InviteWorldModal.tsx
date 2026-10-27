'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Users, ShieldAlert, Share2, Crown, Sparkles } from 'lucide-react';
import { World } from '@/types';

interface InviteWorldModalProps {
  isOpen: boolean;
  onClose: () => void;
  world: World | null;
}

export default function InviteWorldModal({
  isOpen,
  onClose,
  world,
}: InviteWorldModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !world) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(world.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}?invite=${world.inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: 24, maxWidth: 480 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(0, 114, 255, 0.2))',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Share2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ffffff' }}>Invite to {world.name}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Grant collaborator access with this invite code
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ border: 'none' }}>
            <X size={18} />
          </button>
        </div>

        {/* Large Invite Code Box */}
        <div
          style={{
            padding: '20px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-glow-cyan)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Unique World Invite Code
          </span>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '1.75rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: 'var(--accent-cyan)',
              textShadow: '0 0 16px rgba(0, 240, 255, 0.5)',
            }}
          >
            {world.inviteCode}
          </div>

          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <button
              onClick={handleCopyCode}
              className="btn btn-primary"
              style={{ flex: 1, padding: '8px 14px' }}
            >
              {copiedCode ? <Check size={16} /> : <Copy size={16} />}
              <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '8px 14px' }}
            >
              {copiedLink ? <Check size={16} /> : <Sparkles size={16} />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Direct Link'}</span>
            </button>
          </div>
        </div>

        {/* Explanation */}
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
          Anyone with this code can join and view your world, place markers, and collaborate in real-time. Without this code, your world remains completely private.
        </p>

        {/* Members Roster */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={14} />
              <span>Current Members ({world.members?.length || 1})</span>
            </h4>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              maxHeight: 180,
              overflowY: 'auto',
            }}
          >
            {world.members && world.members.length > 0 ? (
              world.members.map((member) => (
                <div
                  key={member.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 'var(--radius-full)',
                        background: 'linear-gradient(135deg, #00c6ff, #0072ff)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    >
                      {(member.user.name || member.user.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{member.user.name || 'Member'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{member.user.email}</div>
                    </div>
                  </div>

                  {member.role === 'OWNER' ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: 'var(--accent-amber)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                    >
                      <Crown size={12} />
                      <span>Owner</span>
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Member</span>
                  )}
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No additional members yet.</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} className="btn btn-secondary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
