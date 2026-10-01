import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Compass, Search, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

// Configure Leaflet custom pin icon to avoid broken asset paths in bundled Vite
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Preset Maharashtra regions for fast jumping
const MAHARASHTRA_PRESETS = [
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, pin: '400001' },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, pin: '411001' },
  { name: 'Nagpur', lat: 21.1458, lng: 79.0882, pin: '440001' },
  { name: 'Nashik', lat: 19.9975, lng: 73.7898, pin: '422001' },
  { name: 'Sambhajinagar', lat: 19.8762, lng: 75.3433, pin: '431001' },
  { name: 'Thane', lat: 19.2183, lng: 72.9781, pin: '400601' },
];

// Inner component to handle clicking on the map
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Inner component to smoothly move map center
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || map.getZoom(), { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function OpenStreetMapPicker({
  value = { lat: 19.0760, lng: 72.8777 },
  onChange,
  onAutoFill,
  height = 320,
}) {
  const [position, setPosition] = useState({
    lat: Number(value?.lat) || 19.0760,
    lng: Number(value?.lng) || 72.8777,
  });
  const [mapCenter, setMapCenter] = useState([position.lat, position.lng]);
  const [locating, setLocating] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [resolvedName, setResolvedName] = useState('');
  const markerRef = useRef(null);

  // Sync external coords if changed
  useEffect(() => {
    if (value?.lat && value?.lng) {
      const newLat = Number(value.lat);
      const newLng = Number(value.lng);
      if (newLat !== position.lat || newLng !== position.lng) {
        setPosition({ lat: newLat, lng: newLng });
        setMapCenter([newLat, newLng]);
      }
    }
  }, [value?.lat, value?.lng]);

  // Reverse Geocoding with OpenStreetMap Nominatim API
  const reverseGeocode = async (lat, lng) => {
    setResolvingAddress(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      if (!res.ok) throw new Error('Geocoding service unavailable');
      const data = await res.json();
      
      const addr = data.address || {};
      const road = addr.road || addr.suburb || addr.neighbourhood || addr.quarter || '';
      const city = addr.city || addr.town || addr.municipality || addr.district || addr.state_district || 'Maharashtra';
      const pincode = addr.postcode || '';
      const fullDisplay = data.display_name ? data.display_name.split(',').slice(0, 3).join(', ') : `${road}, ${city}`;

      setResolvedName(fullDisplay);

      if (onAutoFill) {
        onAutoFill({
          address: road ? `${road}, ${city}` : fullDisplay,
          city: city,
          pincode: pincode,
          display: fullDisplay,
        });
      }
    } catch (err) {
      // Nominatim might be rate limited or offline; gracefully fallback
      setResolvedName(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
    } finally {
      setResolvingAddress(false);
    }
  };

  const handleSelectCoords = (lat, lng, doReverse = true) => {
    const nextPos = {
      lat: parseFloat(Number(lat).toFixed(6)),
      lng: parseFloat(Number(lng).toFixed(6)),
    };
    setPosition(nextPos);
    setMapCenter([nextPos.lat, nextPos.lng]);

    if (onChange) {
      onChange(nextPos);
    }

    if (doReverse) {
      reverseGeocode(nextPos.lat, nextPos.lng);
    }
  };

  // Drag marker event
  const markerEventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          handleSelectCoords(lat, lng, true);
        }
      },
    }),
    []
  );

  // GPS geolocation
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        handleSelectCoords(latitude, longitude, true);
        toast.success('Exact GPS location pinned on OpenStreetMap!');
      },
      (err) => {
        setLocating(false);
        toast.error('Could not detect GPS location. You can click anywhere on the map.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Top Controls Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          <Compass size={16} color="var(--color-primary)" />
          <span>OpenStreetMap Location Picker</span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 500,
              background: '#e0f2fe',
              color: '#0369a1',
              padding: '2px 8px',
              borderRadius: 12,
            }}
          >
            Live OSM Map
          </span>
        </div>

        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={locating}
          className="btn btn-outline btn-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            fontSize: '0.785rem',
            fontWeight: 600,
            color: 'var(--color-primary)',
            borderColor: 'var(--color-primary)',
          }}
        >
          {locating ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
          {locating ? 'Acquiring GPS...' : 'Use My Current Location'}
        </button>
      </div>

      {/* Quick City Jump Presets */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 6,
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', fontWeight: 500 }}>
          Quick Jump:
        </span>
        {MAHARASHTRA_PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => {
              handleSelectCoords(p.lat, p.lng, true);
              if (onAutoFill) {
                onAutoFill({ city: p.name, pincode: p.pin });
              }
            }}
            style={{
              fontSize: '0.725rem',
              padding: '3px 9px',
              borderRadius: 14,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.background = '#e8f4fd';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.background = 'var(--color-bg)';
            }}
          >
            📍 {p.name}
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div
        style={{
          position: 'relative',
          height,
          width: '100%',
          borderRadius: 8,
          overflow: 'hidden',
          border: '2px solid var(--color-border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={14}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          attributionControl={true}
        >
          {/* Standard OpenStreetMap Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          <MapController center={mapCenter} />
          <MapClickHandler onLocationSelect={(lat, lng) => handleSelectCoords(lat, lng, true)} />

          <Marker
            draggable={true}
            eventHandlers={markerEventHandlers}
            position={[position.lat, position.lng]}
            ref={markerRef}
            icon={customMarkerIcon}
          >
            <Popup minWidth={160}>
              <div style={{ textAlign: 'center', padding: '2px 0' }}>
                <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: 2 }}>
                  Selected Grievance Spot
                </strong>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                </span>
                <p style={{ fontSize: '0.7rem', color: '#059669', marginTop: 4 }}>
                  Drag pin or click map to move
                </p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Floating Instruction / Detected Info Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
            zIndex: 400,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: 6,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            fontSize: '0.785rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <MapPin size={16} color="var(--color-danger)" style={{ flexShrink: 0 }} />
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {resolvingAddress ? (
                <span style={{ color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Loader2 size={12} className="animate-spin" /> Resolving address from OpenStreetMap...
                </span>
              ) : resolvedName ? (
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                  {resolvedName}
                </span>
              ) : (
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  Click anywhere on the OpenStreetMap to set grievance location
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '0.725rem',
              background: '#f1f5f9',
              padding: '2px 6px',
              borderRadius: 4,
              color: '#334155',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
          </div>
        </div>
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
        💡 <strong>Tip:</strong> Click anywhere on the map or drag the marker to pinpoint the exact location of the issue.
      </p>
    </div>
  );
}
