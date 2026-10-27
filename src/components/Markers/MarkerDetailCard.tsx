'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Copy,
  Check,
  Edit2,
  Trash2,
  Maximize2,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { Marker } from '@/types';

interface MarkerDetailCardProps {
  marker: Marker;
  onClose: () => void;
  onToggleResolve: (markerId: string, currentStatus: boolean) => Promise<void>;
  onEdit: (marker: Marker) => void;
  onDelete: (markerId: string) => Promise<void>;
}

export default function MarkerDetailCard({
  marker,
  onClose,
  onToggleResolve,
  onEdit,
  onDelete,
}: MarkerDetailCardProps) {
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showLightbox) {
          setShowLightbox(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLightbox, onClose]);

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${marker.lat.toFixed(6)}, ${marker.lng.toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleToggleResolveClick = async () => {
    setIsToggling(true);
    try {
      const willBeResolved = !marker.isResolved;
      if (willBeResolved) {
        // Trigger celebratory confetti burst!
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#00f0ff', '#ffffff'],
        });
      }
      await onToggleResolve(marker.id, marker.isResolved);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDeleteClick = async () => {
    if (window.confirm('Are you sure you want to delete this marker from the world?')) {
      setIsDeleting(true);
      try {
        await onDelete(marker.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <>
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          bottom: 24,
          left: 'calc(360px + 36px)',
          width: 380,
          maxHeight: 'calc(100vh - 120px)',
          overflowY: 'auto',
          borderRadius: 'var(--radius-lg)',
          zIndex: 40,
          boxShadow: 'var(--shadow-hud)',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header Photo if Available */}
        {marker.imageUrl && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 180,
              overflow: 'hidden',
              cursor: 'pointer',
            }}
            onClick={() => setShowLightbox(true)}
          >
            <img
              src={marker.imageUrl}
              alt={marker.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(13, 18, 29, 0.9) 0%, transparent 60%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 8px',
                color: '#ffffff',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Maximize2 size={12} />
              <span>Expand</span>
            </div>
          </div>
        )}

        <div style={{ padding: 20 }}>
          {/* Top Status & Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                background: marker.isResolved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: marker.isResolved ? 'var(--accent-emerald)' : '#f87171',
                border: `1px solid ${marker.isResolved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}
            >
              {marker.isResolved ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              <span>{marker.isResolved ? 'Resolved' : 'Open Issue'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => onEdit(marker)}
                className="btn-icon"
                title="Edit Marker"
                style={{ width: 30, height: 30 }}
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="btn-icon"
                title="Delete Marker"
                style={{ width: 30, height: 30, color: 'var(--accent-rose)' }}
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={onClose}
                className="btn-icon"
                title="Close"
                style={{ width: 30, height: 30 }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Marker Title */}
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', marginBottom: 8, lineHeight: 1.3 }}>
            {marker.title}
          </h2>

          {/* Coordinates Bar */}
          <div
            onClick={handleCopyCoords}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              marginBottom: 16,
              transition: 'background 0.2s',
            }}
            title="Click to copy coordinates"
          >
            <MapPin size={13} style={{ color: 'var(--accent-cyan)' }} />
            <span>
              {marker.lat.toFixed(5)}°, {marker.lng.toFixed(5)}°
            </span>
            {copiedCoords ? (
              <Check size={12} style={{ color: 'var(--accent-emerald)' }} />
            ) : (
              <Copy size={12} />
            )}
          </div>

          {/* Description */}
          {marker.description ? (
            <p
              style={{
                fontSize: '0.875rem',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                marginBottom: 18,
                whiteSpace: 'pre-wrap',
              }}
            >
              {marker.description}
            </p>
          ) : (
            <p style={{ fontSize: '0.8125rem', fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: 18 }}>
              No description added for this location pin.
            </p>
          )}

          {/* Resolution / Metadata details */}
          <div
            style={{
              padding: 12,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-subtle)',
              marginBottom: 18,
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={12} />
              <span>
                Reported by <strong style={{ color: 'var(--text-primary)' }}>{marker.createdBy?.name || 'Explorer'}</strong>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={12} />
              <span>
                Added {new Date(marker.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            {marker.isResolved && marker.resolvedAt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-emerald)' }}>
                <CheckCircle2 size={12} />
                <span>
                  Resolved by {marker.resolvedBy || 'World Member'} on {new Date(marker.resolvedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Toggle Resolve Action Button */}
          <button
            onClick={handleToggleResolveClick}
            disabled={isToggling}
            className={`btn ${marker.isResolved ? 'btn-secondary' : 'btn-emerald'}`}
            style={{ width: '100%', padding: '10px 16px', fontWeight: 600 }}
          >
            {marker.isResolved ? (
              <>
                <AlertCircle size={16} />
                <span>Re-open Issue</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Mark as Resolved</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Full Lightbox Modal for Photo */}
      {showLightbox && marker.imageUrl && (
        <div
          className="modal-overlay"
          onClick={() => setShowLightbox(false)}
          style={{ zIndex: 1200 }}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={marker.imageUrl}
              alt={marker.title}
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', display: 'block' }}
            />
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                display: 'flex',
                gap: 8,
              }}
            >
              <a
                href={marker.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-icon"
                style={{ background: 'rgba(0, 0, 0, 0.7)' }}
              >
                <ExternalLink size={16} />
              </a>
              <button
                onClick={() => setShowLightbox(false)}
                className="btn-icon"
                style={{ background: 'rgba(0, 0, 0, 0.7)' }}
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                padding: '12px 18px',
                background: 'rgba(13, 18, 29, 0.95)',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {marker.title}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
