'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, MapPin, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Marker, PendingLocation } from '@/types';

interface MarkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    lat: number;
    lng: number;
    imageUrl?: string | null;
    isResolved: boolean;
  }) => Promise<void>;
  initialLocation: PendingLocation | null;
  editingMarker?: Marker | null;
}

export default function MarkerModal({
  isOpen,
  onClose,
  onSave,
  initialLocation,
  editingMarker,
}: MarkerModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState<number>(0);
  const [lng, setLng] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isResolved, setIsResolved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingMarker) {
      setTitle(editingMarker.title);
      setDescription(editingMarker.description || '');
      setLat(editingMarker.lat);
      setLng(editingMarker.lng);
      setImageUrl(editingMarker.imageUrl || null);
      setIsResolved(editingMarker.isResolved);
      setDetectedAddress(null);
    } else if (initialLocation) {
      setTitle('');
      setDescription('');
      setLat(initialLocation.lat);
      setLng(initialLocation.lng);
      setImageUrl(null);
      setIsResolved(false);

      // Reverse geocode to find street, city, area name
      setIsGeocoding(true);
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${initialLocation.lat}&lon=${initialLocation.lng}&zoom=16&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
        .then((res) => res.json())
        .then((data) => {
          if (data?.display_name) {
            setDetectedAddress(data.display_name);
            // Suggest auto-title if field is still empty
            const shortName = data.address?.road
              ? `${data.address.road}, ${data.address.city || data.address.town || data.address.suburb || data.address.country || ''}`
              : data.address?.city || data.address?.town || data.address?.village || data.address?.county || data.display_name.split(',').slice(0, 2).join(',');
            if (shortName) {
              setTitle((curr) => (!curr ? shortName : curr));
            }
          }
        })
        .catch(() => {})
        .finally(() => setIsGeocoding(false));
    }
    setError(null);
  }, [editingMarker, initialLocation, isOpen]);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      setError('Image must be under 8MB in size');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setImageUrl(data.url);
    } catch (err: any) {
      setError(err.message || 'Image upload failed. Try another image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a marker title');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        lat,
        lng,
        imageUrl,
        isResolved,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save marker');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: 24,
          border: '1px solid var(--border-glass)',
          boxShadow: 'var(--shadow-hud)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: isResolved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 240, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isResolved ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
              }}
            >
              <MapPin size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ffffff' }}>
                {editingMarker ? 'Edit Location Marker' : 'Drop New Marker'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Coordinates: {lat.toFixed(4)}°, {lng.toFixed(4)}°
              </p>
              {detectedAddress && (
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--accent-cyan)',
                    marginTop: 3,
                    maxWidth: 320,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={detectedAddress}
                >
                  📍 {detectedAddress}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ border: 'none' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fda4af',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Marker Title <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Northern Ridge Outpost, Coral Survey Station..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Description Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Description & Notes
            </label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Record observations, mission notes, or details about this location..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Coordinates row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                Latitude
              </label>
              <input
                type="number"
                step="any"
                className="input-field"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                Longitude
              </label>
              <input
                type="number"
                step="any"
                className="input-field"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Optional Image Upload */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Optional Photo / Field Image
            </label>

            {imageUrl ? (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 160,
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-glass)',
                }}
              >
                <img
                  src={imageUrl}
                  alt="Marker preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-glass)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--bg-glass-input)',
                  transition: 'border-color 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent-cyan)' }} />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Uploading image to storage...</span>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Upload size={18} />
                    </div>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      Click to upload location photo
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      PNG, JPG, WEBP up to 8MB
                    </span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageFileChange}
                />
              </div>
            )}
          </div>

          {/* Is Resolved Flag */}
          <div
            onClick={() => setIsResolved(!isResolved)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: isResolved ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${isResolved ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-subtle)'}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {isResolved ? (
                <CheckCircle2 size={20} style={{ color: 'var(--accent-emerald)' }} />
              ) : (
                <AlertCircle size={20} style={{ color: 'var(--accent-amber)' }} />
              )}
              <div>
                <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: isResolved ? 'var(--accent-emerald)' : '#ffffff' }}>
                  {isResolved ? 'Marked as Resolved' : 'Open / Needs Attention'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {isResolved ? 'Status is verified & resolved' : 'Flag this pin as an active unresolved marker'}
                </span>
              </div>
            </div>

            {/* Styled Switch */}
            <div
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                background: isResolved ? 'var(--accent-emerald)' : 'rgba(255, 255, 255, 0.2)',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: 3,
                  left: isResolved ? 23 : 3,
                  transition: 'left 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving || isUploading}
              style={{ minWidth: 120 }}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{editingMarker ? 'Update Marker' : 'Drop Marker'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
