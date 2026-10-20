import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Loader2, MapPin, RefreshCw } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { base44 } from "@/api/base44Client";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const severityColor = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#ca8a04",
  low: "#16a34a",
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

export default function LocationsMap() {
  const [loading, setLoading] = useState(true);
  const [pins, setPins] = useState([]);

  const load = useCallback(async () => {
    const [allPhotos, allReports] = await Promise.all([
      base44.entities.InspectionPhoto.list("-created_date", 500),
      base44.entities.InspectionReport.list("-created_date", 200),
    ]);
    const reportMap = Object.fromEntries(allReports.map(r => [r.id, r]));
    const located = allPhotos
      .filter(p => p.lat && p.lng && reportMap[p.report_id])
      .map(p => ({ ...p, report: reportMap[p.report_id] }));
    setPins(located);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const { refreshing } = usePullToRefresh(load);

  const worstSeverity = (issues) => {
    for (const s of ["critical", "high", "medium", "low"]) {
      if ((issues || []).some(i => i.severity === s)) return s;
    }
    return "low";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  if (pins.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
          <MapPin className="w-12 h-12 opacity-30 mb-3" />
          <p className="text-sm">No located photos yet.</p>
          <p className="text-xs mt-1 opacity-70">Pin photo locations on the inspection screen to see them here.</p>
        </div>
      </div>
    );
  }

  const center = [
    pins.reduce((s, p) => s + p.lat, 0) / pins.length,
    pins.reduce((s, p) => s + p.lng, 0) / pins.length,
  ];

  return (
    <div className="space-y-4">
      {refreshing && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Refreshing…
        </div>
      )}
      <p className="text-sm text-muted-foreground">{pins.length} located photo{pins.length !== 1 ? "s" : ""} — tap a pin to view the report</p>

      <div className="rounded-xl overflow-hidden border border-border" style={{ height: "70vh" }}>
        <MapContainer center={center} zoom={4} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
            url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          />
          {pins.map(photo => {
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
                    <p className="font-medium text-sm">{photo.report.title}</p>
                    {photo.room_area && (
                      <p className="text-xs text-muted-foreground">{photo.room_area}</p>
                    )}
                    <Link
                      to={`/report/${photo.report_id}`}
                      className="text-xs text-primary font-medium hover:underline mt-2 inline-block"
                    >
                      View Report →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}