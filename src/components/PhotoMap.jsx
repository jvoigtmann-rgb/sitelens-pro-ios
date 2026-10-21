import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import SeverityBadge from "./SeverityBadge";

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const severityColor = {
  low: "#16a34a",
  medium: "#ca8a04",
  high: "#ea580c",
  critical: "#dc2626",
};

function makeIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);transform:rotate(-45deg)"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

export default function PhotoMap({ photos, id }) {
  const located = photos.filter((p) => p.lat && p.lng);
  if (located.length === 0) return null;

  const center = [
    located.reduce((s, p) => s + p.lat, 0) / located.length,
    located.reduce((s, p) => s + p.lng, 0) / located.length,
  ];

  const worstSeverity = (issues) => {
    const order = ["critical", "high", "medium", "low"];
    for (const s of order) {
      if ((issues || []).some((i) => i.severity === s)) return s;
    }
    return "low";
  };

  return (
    <div id={id} className="rounded-xl overflow-hidden border border-border" style={{ height: 380 }}>
      <MapContainer center={center} zoom={18} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          crossOrigin="anonymous"
          attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <TileLayer
          crossOrigin="anonymous"
          attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
          url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
        />
        {located.map((photo) => {
          const severity = worstSeverity(photo.issues);
          return (
            <Marker
              key={photo.id}
              position={[photo.lat, photo.lng]}
              icon={makeIcon(severityColor[severity] || "#3b82f6")}
            >
              <Popup>
                <div className="w-48">
                  <img src={photo.photo_url} alt="" className="w-full h-28 object-cover rounded mb-2" />
                  <p className="font-medium text-sm">{photo.room_area || "Photo"}</p>
                  {(photo.issues || []).slice(0, 2).map((issue, i) => (
                    <div key={i} className="mt-1">
                      <span className="text-xs font-medium">{issue.title}</span>
                      {issue.cost_min != null && (
                        <span className="text-xs text-green-700 ml-1">
                          ${issue.cost_min.toLocaleString()}–${(issue.cost_max || 0).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                  {(photo.issues || []).length > 2 && (
                    <p className="text-xs text-muted-foreground mt-1">+{photo.issues.length - 2} more</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
