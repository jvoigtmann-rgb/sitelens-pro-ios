import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

export default function LocationPickerMap({ photos, onLocationSet }) {
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);
  const [center] = useState([40.7128, -74.006]); // NYC default

  const selectedPhoto = photos.find((p) => p.id === selectedPhotoId);

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-sm">Pin Photos on Map</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Select a photo below, then click the map to drop its location pin.
        </p>
      </div>

      {/* Photo selector */}
      <div className="flex gap-2 flex-wrap">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setSelectedPhotoId(photo.id === selectedPhotoId ? null : photo.id)}
            className={`relative inline-flex rounded-lg overflow-hidden border-2 min-h-[44px] min-w-[44px] transition-all ${
              photo.id === selectedPhotoId
                ? "border-primary shadow-md scale-105"
                : "border-transparent opacity-70 hover:opacity-100"
            }`}
            style={{ width: 64, height: 64 }}
          >
            <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
            {photo.lat && (
              <div className="absolute bottom-0 left-0 right-0 bg-green-600/80 flex items-center justify-center py-0.5">
                <MapPin className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {selectedPhoto && (
        <p className="text-xs font-medium text-primary">
          📍 Click on map to place pin for: <span className="font-semibold">{selectedPhoto.room_area || "Photo"}</span>
        </p>
      )}

      <div className="rounded-xl overflow-hidden border border-border" style={{ height: 320 }}>
        <MapContainer center={center} zoom={17} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler
            onMapClick={(latlng) => {
              if (!selectedPhotoId) return;
              onLocationSet(selectedPhotoId, latlng.lat, latlng.lng);
              // Auto-advance to next unlocated photo
              const idx = photos.findIndex((p) => p.id === selectedPhotoId);
              const next = photos.slice(idx + 1).find((p) => !p.lat);
              setSelectedPhotoId(next ? next.id : null);
            }}
          />
          {photos
            .filter((p) => p.lat && p.lng)
            .map((photo) => (
              <Marker key={photo.id} position={[photo.lat, photo.lng]}>
              </Marker>
            ))}
        </MapContainer>
      </div>
    </div>
  );
}
