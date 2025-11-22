import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapView({ day }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const activities = day.activities.filter((a) => a.lat && a.lng);

    if (activities.length === 0) return;

    // 清除舊地圖
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // 建立新地圖
    const map = L.map(mapRef.current).setView([activities[0].lat, activities[0].lng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // 加入標記
    activities.forEach((activity, idx) => {
      const marker = L.marker([activity.lat, activity.lng]).addTo(map);
      marker.bindPopup(`
        <div style="text-align: center;">
          <strong>${idx + 1}. ${activity.name}</strong><br/>
          <span style="font-size: 12px; color: #666;">${activity.time}</span><br/>
          <span style="font-size: 12px;">${activity.category}</span>
        </div>
      `);
    });

    // 調整視野
    if (activities.length > 1) {
      const bounds = L.latLngBounds(activities.map((a) => [a.lat, a.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [day]);

  const activities = day.activities.filter((a) => a.lat && a.lng);

  return (
    <div className="map-container">
      <h2 className="section-title">🗺️ {day.title}</h2>
      {activities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗺️</div>
          <p>這天沒有包含位置資訊的景點</p>
        </div>
      ) : (
        <div ref={mapRef} className="map-wrapper"></div>
      )}
    </div>
  );
}

export default MapView;
