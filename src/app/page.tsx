'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

const GlobeMap = dynamic(() => import('@/components/Map/GlobeMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#07090e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)',
        fontSize: '0.875rem',
      }}
    >
      Loading Earth Viewport...
    </div>
  ),
});
import Navbar from '@/components/Navigation/Navbar';
import MarkersDrawer from '@/components/Sidebar/MarkersDrawer';
import MarkerModal from '@/components/Markers/MarkerModal';
import MarkerDetailCard from '@/components/Markers/MarkerDetailCard';
import CreateWorldModal from '@/components/Modals/CreateWorldModal';
import JoinWorldModal from '@/components/Modals/JoinWorldModal';
import InviteWorldModal from '@/components/Modals/InviteWorldModal';
import AuthModal from '@/components/Modals/AuthModal';
import { User, World, Marker, PendingLocation } from '@/types';

function MainAppContent() {
  const searchParams = useSearchParams();

  // Core Data State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [currentWorld, setCurrentWorld] = useState<World | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);

  // Interaction State
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<PendingLocation | null>(null);
  const [editingMarker, setEditingMarker] = useState<Marker | null>(null);

  // Modal States
  const [isMarkerModalOpen, setIsMarkerModalOpen] = useState(false);
  const [isCreateWorldOpen, setIsCreateWorldOpen] = useState(false);
  const [isJoinWorldOpen, setIsJoinWorldOpen] = useState(false);
  const [isInviteWorldOpen, setIsInviteWorldOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [initialInviteCode, setInitialInviteCode] = useState('');

  // 1. Check Auth Status on Mount
  const fetchAuthAndWorlds = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        fetchWorlds();
      } else {
        // Automatically prompt sign-in or demo login
        setIsAuthModalOpen(true);
      }
    } catch {
      setIsAuthModalOpen(true);
    }
  }, []);

  useEffect(() => {
    fetchAuthAndWorlds();
  }, [fetchAuthAndWorlds]);

  // Handle ?invite=CODE query parameter from invite links
  useEffect(() => {
    const inviteParam = searchParams.get('invite');
    if (inviteParam) {
      setInitialInviteCode(inviteParam.toUpperCase());
      setIsJoinWorldOpen(true);
    }
  }, [searchParams]);

  // 2. Fetch Worlds for Current User
  const fetchWorlds = async () => {
    try {
      const res = await fetch('/api/worlds');
      if (!res.ok) return;
      const data = await res.json();
      const worldList: World[] = data.worlds || [];
      setWorlds(worldList);

      if (worldList.length > 0) {
        // Default to first world or maintain selected world
        setCurrentWorld((prev) => {
          if (prev && worldList.some((w) => w.id === prev.id)) {
            return worldList.find((w) => w.id === prev.id) || worldList[0];
          }
          return worldList[0];
        });
      } else {
        setCurrentWorld(null);
      }
    } catch (err) {
      console.error('Failed to fetch worlds:', err);
    }
  };

  // 3. Fetch Markers whenever currentWorld changes
  const fetchMarkers = useCallback(async (worldId: string) => {
    try {
      const res = await fetch(`/api/worlds/${worldId}/markers`);
      if (!res.ok) return;
      const data = await res.json();
      setMarkers(data.markers || []);
    } catch (err) {
      console.error('Failed to fetch markers:', err);
    }
  }, []);

  useEffect(() => {
    if (currentWorld?.id) {
      fetchMarkers(currentWorld.id);
      setSelectedMarker(null);
    } else {
      setMarkers([]);
    }
  }, [currentWorld?.id, fetchMarkers]);

  // Handler: Select a Marker
  const handleSelectMarker = (marker: Marker | null) => {
    setSelectedMarker(marker);
  };

  // Handler: Click Globe to Add Marker
  const handleInitiateAddMarker = (loc: PendingLocation) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!currentWorld) {
      setIsCreateWorldOpen(true);
      return;
    }

    setPendingLocation(loc);
    setEditingMarker(null);
    setIsMarkerModalOpen(true);
    setIsAddingMarker(false);
  };

  // Handler: Toggle Add Marker Mode
  const handleToggleAddMode = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!currentWorld) {
      setIsCreateWorldOpen(true);
      return;
    }
    setIsAddingMarker(!isAddingMarker);
  };

  // Handler: Save / Create Marker
  const handleSaveMarker = async (data: {
    title: string;
    description: string;
    lat: number;
    lng: number;
    imageUrl?: string | null;
    isResolved: boolean;
  }) => {
    if (!currentWorld) return;

    if (editingMarker) {
      // Edit existing marker
      const res = await fetch(`/api/markers/${editingMarker.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update marker');
      }

      const updated = await res.json();
      setMarkers((prev) => prev.map((m) => (m.id === updated.marker.id ? updated.marker : m)));
      if (selectedMarker?.id === updated.marker.id) {
        setSelectedMarker(updated.marker);
      }
    } else {
      // Create new marker
      const res = await fetch(`/api/worlds/${currentWorld.id}/markers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create marker');
      }

      const created = await res.json();
      setMarkers((prev) => [created.marker, ...prev]);
      setSelectedMarker(created.marker);
    }
  };

  // Handler: Toggle Resolved Status
  const handleToggleResolve = async (markerId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/markers/${markerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: !currentStatus }),
      });

      if (!res.ok) return;

      const data = await res.json();
      setMarkers((prev) => prev.map((m) => (m.id === markerId ? data.marker : m)));
      if (selectedMarker?.id === markerId) {
        setSelectedMarker(data.marker);
      }
    } catch (err) {
      console.error('Failed to toggle resolve:', err);
    }
  };

  // Handler: Delete Marker
  const handleDeleteMarker = async (markerId: string) => {
    try {
      const res = await fetch(`/api/markers/${markerId}`, {
        method: 'DELETE',
      });

      if (!res.ok) return;

      setMarkers((prev) => prev.filter((m) => m.id !== markerId));
      if (selectedMarker?.id === markerId) {
        setSelectedMarker(null);
      }
    } catch (err) {
      console.error('Failed to delete marker:', err);
    }
  };

  // Handler: Edit Marker Trigger
  const handleEditMarker = (marker: Marker) => {
    setEditingMarker(marker);
    setPendingLocation({ lat: marker.lat, lng: marker.lng });
    setIsMarkerModalOpen(true);
  };

  // Handler: Create World
  const handleCreateWorld = async (name: string, description: string) => {
    const res = await fetch('/api/worlds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create world');
    }

    const data = await res.json();
    setWorlds((prev) => [data.world, ...prev]);
    setCurrentWorld(data.world);
  };

  // Handler: Join World via Code
  const handleJoinWorld = async (inviteCode: string): Promise<World> => {
    const res = await fetch('/api/worlds/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Invalid code or join failed');
    }

    const data = await res.json();
    await fetchWorlds();
    setCurrentWorld(data.world);
    return data.world;
  };

  // Handler: Geocoding Search (Fly to City or Coords)
  const handleSearchLocation = async (query: string) => {
    // Check if query is raw lat, lng
    const coordParts = query.split(',').map((p) => parseFloat(p.trim()));
    if (coordParts.length === 2 && !isNaN(coordParts[0]) && !isNaN(coordParts[1])) {
      const lat = coordParts[0];
      const lng = coordParts[1];
      handleInitiateAddMarker({ lat, lng });
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const results = await res.json();
      if (results && results.length > 0) {
        const lat = parseFloat(results[0].lat);
        const lng = parseFloat(results[0].lon);

        // Center on location
        handleInitiateAddMarker({ lat, lng });
      } else {
        alert(`No location found for "${query}"`);
      }
    } catch (err) {
      console.warn('Geocoding lookup failed:', err);
    }
  };

  // Handler: Logout
  const handleLogout = async () => {
    await fetch('/api/auth/me', { method: 'DELETE' });
    setCurrentUser(null);
    setWorlds([]);
    setCurrentWorld(null);
    setMarkers([]);
    setSelectedMarker(null);
    setIsAuthModalOpen(true);
  };

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        worlds={worlds}
        currentWorld={currentWorld}
        onSelectWorld={(w) => setCurrentWorld(w)}
        onOpenCreateWorld={() => setIsCreateWorldOpen(true)}
        onOpenJoinWorld={() => setIsJoinWorldOpen(true)}
        onOpenInviteWorld={() => setIsInviteWorldOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onSearchLocation={handleSearchLocation}
      />

      {/* 3D Map Viewport */}
      <GlobeMap
        markers={markers}
        selectedMarker={selectedMarker}
        onSelectMarker={handleSelectMarker}
        isAddingMarker={isAddingMarker}
        onInitiateAddMarker={handleInitiateAddMarker}
        onToggleAddMode={handleToggleAddMode}
      />

      {/* Markers Sidebar Drawer */}
      <MarkersDrawer
        world={currentWorld}
        markers={markers}
        selectedMarker={selectedMarker}
        onSelectMarker={handleSelectMarker}
        onToggleAddMode={handleToggleAddMode}
        isAddingMarker={isAddingMarker}
        onOpenInviteModal={() => setIsInviteWorldOpen(true)}
      />

      {/* Floating Marker Detail Card */}
      {selectedMarker && (
        <MarkerDetailCard
          marker={selectedMarker}
          onClose={() => setSelectedMarker(null)}
          onToggleResolve={handleToggleResolve}
          onEdit={handleEditMarker}
          onDelete={handleDeleteMarker}
        />
      )}

      {/* Marker Creation / Edit Modal */}
      <MarkerModal
        isOpen={isMarkerModalOpen}
        onClose={() => {
          setIsMarkerModalOpen(false);
          setEditingMarker(null);
        }}
        onSave={handleSaveMarker}
        initialLocation={pendingLocation}
        editingMarker={editingMarker}
      />

      {/* Create World Modal */}
      <CreateWorldModal
        isOpen={isCreateWorldOpen}
        onClose={() => setIsCreateWorldOpen(false)}
        onCreate={handleCreateWorld}
      />

      {/* Join World Modal */}
      <JoinWorldModal
        isOpen={isJoinWorldOpen}
        onClose={() => setIsJoinWorldOpen(false)}
        onJoin={handleJoinWorld}
        initialCode={initialInviteCode}
      />

      {/* Invite World Modal */}
      <InviteWorldModal
        isOpen={isInviteWorldOpen}
        onClose={() => setIsInviteWorldOpen(false)}
        world={currentWorld}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          fetchWorlds();
        }}
      />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ background: '#07090e', width: '100vw', height: '100vh' }} />}>
      <MainAppContent />
    </Suspense>
  );
}
