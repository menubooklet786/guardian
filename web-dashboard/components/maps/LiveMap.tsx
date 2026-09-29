'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '@/lib/api';
import { useParentSocket } from '@/hooks/useSocket';

const DEFAULT_CENTER: [number, number] = [40.7128, -74.006];

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  recordedAt: string;
}

interface Geofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  type: string;
}

export default function LiveMap({ childId }: { childId: string }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const { on } = useParentSocket(childId);

  useEffect(() => {
    loadLocation();
    loadGeofences();
  }, [childId]);

  useEffect(() => {
    const unsub = on('device:location', (data: Location) => {
      setLocation(data);
    });
    return unsub;
  }, [on, childId]);

  const loadLocation = async () => {
    try {
      const data = await api.get<{ location: Location | null }>(`/children/${childId}/location/current`);
      if (data.location) setLocation(data.location);
    } catch {}
  };

  const loadGeofences = async () => {
    try {
      const data = await api.get<Geofence[]>(`/children/${childId}/geofences`);
      setGeofences(data || []);
    } catch {}
  };

  const center = location ? [location.latitude, location.longitude] as [number, number] : DEFAULT_CENTER;

  return (
    <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {location && (
        <>
          <Marker position={[location.latitude, location.longitude]} icon={markerIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-medium">Current Location</p>
                <p className="text-xs text-gray-500">
                  {new Date(location.recordedAt).toLocaleString()}
                </p>
                {location.accuracy && (
                  <p className="text-xs text-gray-500">Accuracy: {Math.round(location.accuracy)}m</p>
                )}
                {location.speed && (
                  <p className="text-xs text-gray-500">Speed: {(location.speed * 3.6).toFixed(1)} km/h</p>
                )}
              </div>
            </Popup>
          </Marker>
          {location.accuracy && (
            <Circle
              center={[location.latitude, location.longitude]}
              radius={location.accuracy}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 }}
            />
          )}
        </>
      )}

      {geofences.map((geofence) => (
        <Circle
          key={geofence.id}
          center={[geofence.latitude, geofence.longitude]}
          radius={geofence.radiusMeters}
          pathOptions={{
            color: geofence.type === 'safe' ? '#22c55e' : geofence.type === 'danger' ? '#ef4444' : '#3b82f6',
            fillColor: geofence.type === 'safe' ? '#22c55e' : geofence.type === 'danger' ? '#ef4444' : '#3b82f6',
            fillOpacity: 0.1,
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-medium">{geofence.name}</p>
              <p className="text-xs text-gray-500">Radius: {geofence.radiusMeters}m</p>
              <p className="text-xs text-gray-500">Type: {geofence.type}</p>
            </div>
          </Popup>
        </Circle>
      ))}

      {location && <MapUpdater center={[location.latitude, location.longitude]} />}
    </MapContainer>
  );
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}
