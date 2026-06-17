import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetinaUrl,
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
});


interface MapViewerProps {
    latitude: number | null | undefined;
    longitude: number | null | undefined;
    zoom?: number;
    className?: string;
    popupText?: string;
}

const ChangeView = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
        
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 150);

        return () => {
            clearTimeout(timer);
        };
    }, [center, zoom, map]);
    return null;
};

function MapViewer({ latitude, longitude, zoom = 13, className = 'h-64 w-full', popupText }: MapViewerProps) {
    const isValidCoords = latitude != null && longitude != null && !isNaN(latitude) && !isNaN(longitude);

    if (!isValidCoords) {
        return <div className={`${className} flex items-center justify-center bg-gray-100 text-gray-500 text-sm italic`}>Invalid or missing coordinates.</div>;
    }

    const position: [number, number] = [latitude, longitude];

    return (
        <div className={className}>
            <MapContainer center={position} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }} attributionControl={false}>
                <ChangeView center={position} zoom={zoom} />
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position}>
                    {popupText && <Popup>{popupText}</Popup>}
                </Marker>
            </MapContainer>
        </div>
    );
}

export default MapViewer;