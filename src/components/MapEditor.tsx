import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useState, useEffect, useCallback } from 'react';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetinaUrl,
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
});

interface MapEditorProps {
    initialLatitude: number | null | undefined;
    initialLongitude: number | null | undefined;
    onCoordsChange: (lat: number, lng: number) => void;
    zoom?: number;
    className?: string;
}

const MapEvents = ({ onCoordsChange, center }: { onCoordsChange: (lat: number, lng: number) => void, center: [number, number] }) => {
    const map = useMap();

    useEffect(() => {
        const currentCenter = map.getCenter();
        if (Math.abs(currentCenter.lat - center[0]) > 0.0001 || Math.abs(currentCenter.lng - center[1]) > 0.0001) {
            map.setView(center, map.getZoom());
        }
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 150);

        return () => clearTimeout(timer);

    }, [center, map]);

    useMapEvents({
        click(e) {
            onCoordsChange(e.latlng.lat, e.latlng.lng);
            map.setView(e.latlng, map.getZoom());
        },
    });
    return null;
};


function MapEditor({ initialLatitude, initialLongitude, onCoordsChange, zoom = 13, className = 'h-75 w-full' }: MapEditorProps) {
    const defaultCenter: [number, number] = [8.7139, 77.7567];
    const isValidInitialCoords = initialLatitude != null && initialLongitude != null && !isNaN(initialLatitude) && !isNaN(initialLongitude);

    const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(
        isValidInitialCoords ? [initialLatitude, initialLongitude] : null
    );

    const [prevCoords, setPrevCoords] = useState<[number | null | undefined, number | null | undefined]>([initialLatitude, initialLongitude]);

    if (initialLatitude !== prevCoords[0] || initialLongitude !== prevCoords[1]) {
        const newPosition = (initialLatitude != null && initialLongitude != null && !isNaN(initialLatitude) && !isNaN(initialLongitude))
            ? [initialLatitude, initialLongitude] as [number, number]
            : null;
        setCurrentPosition(newPosition);
        setPrevCoords([initialLatitude, initialLongitude]);
    }

    const handleCoordsChange = useCallback((lat: number, lng: number) => {
        setCurrentPosition([lat, lng]);
        onCoordsChange(lat, lng);
    }, [onCoordsChange]);

    const displayCenter = currentPosition || defaultCenter;

    return (
        <div className={className}>
            <MapContainer center={displayCenter} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }} attributionControl={false}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {currentPosition && (
                    <Marker position={currentPosition}>
                        <Popup>Selected Location: <br /> Lat: {currentPosition[0].toFixed(6)}, Lng: {currentPosition[1].toFixed(6)}</Popup>
                    </Marker>
                )}
                <MapEvents onCoordsChange={handleCoordsChange} center={displayCenter} />
            </MapContainer>
            {!currentPosition && (
                <p className="text-xs text-center text-gray-500 mt-1 italic">Click on the map to set coordinates.</p>
            )}
        </div>
    );
}

export default MapEditor;