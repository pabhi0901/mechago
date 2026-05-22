import React, { useEffect, useRef } from "react";
import { MapPin, Navigation } from "lucide-react";

const MapTracking = ({ customerCoords, mechanicCoords }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const mechanicMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

  useEffect(() => {
    // Check if Leaflet is loaded in the window
    const L = window.L;
    if (!L || !mapContainerRef.current) return;

    const custLat = customerCoords?.latitude;
    const custLon = customerCoords?.longitude;
    const mechLat = mechanicCoords?.latitude;
    const mechLon = mechanicCoords?.longitude;

    if (!custLat || !custLon) return;

    // Initialize map if it doesn't exist
    if (!mapInstanceRef.current) {
      const centerCoords = mechLat && mechLon ? [ (custLat + mechLat) / 2, (custLon + mechLon) / 2 ] : [custLat, custLon];
      const zoomLevel = mechLat && mechLon ? 13 : 15;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView(centerCoords, zoomLevel);

      // Apply gorgeous premium Dark Matter tiles
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Setup custom marker icons
    const customerIcon = L.divIcon({
      className: "custom-customer-icon",
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></div>
          <div class="w-7 h-7 rounded-full bg-blue-600 border border-white flex items-center justify-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-white"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    const mechanicIcon = L.divIcon({
      className: "custom-mechanic-icon",
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-amber-500/30 animate-pulse"></div>
          <div class="w-7 h-7 rounded-full bg-amber-600 border border-white flex items-center justify-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-white"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    // Update Customer Marker
    if (customerMarkerRef.current) {
      customerMarkerRef.current.setLatLng([custLat, custLon]);
    } else {
      customerMarkerRef.current = L.marker([custLat, custLon], { icon: customerIcon })
        .addTo(map)
        .bindPopup("<div class='text-slate-900 font-semibold text-xs'>Your stranded vehicle location</div>");
    }

    // Update Mechanic Marker
    if (mechLat && mechLon) {
      if (mechanicMarkerRef.current) {
        mechanicMarkerRef.current.setLatLng([mechLat, mechLon]);
      } else {
        mechanicMarkerRef.current = L.marker([mechLat, mechLon], { icon: mechanicIcon })
          .addTo(map)
          .bindPopup("<div class='text-slate-900 font-semibold text-xs'>Mechanic moving on the way</div>");
      }
    } else if (mechanicMarkerRef.current) {
      map.removeLayer(mechanicMarkerRef.current);
      mechanicMarkerRef.current = null;
    }

    // Update Connection Polyline
    if (custLat && custLon && mechLat && mechLon) {
      const points = [
        [custLat, custLon],
        [mechLat, mechLon]
      ];

      if (routeLineRef.current) {
        routeLineRef.current.setLatLngs(points);
      } else {
        routeLineRef.current = L.polyline(points, {
          color: "#3b82f6",
          weight: 4,
          dashArray: "6, 12",
          opacity: 0.8
        }).addTo(map);
      }

      // Auto fit map view to show both coordinates
      map.fitBounds(points, { padding: [60, 60] });
    } else {
      // Just focus on customer if no mechanic coordinates
      map.setView([custLat, custLon], 15);
      if (routeLineRef.current) {
        map.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      // Keep map reference intact between renders but destroy on complete unmount if container leaves
    };
  }, [customerCoords, mechanicCoords]);

  // Secondary Cleanup on complete component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        console.log("Destroying Leaflet map instance");
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        customerMarkerRef.current = null;
        mechanicMarkerRef.current = null;
        routeLineRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full min-h-[400px]"></div>

      {/* Map Utilities Info */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-950/85 backdrop-blur-md border border-slate-800/80 px-3 py-2 rounded-xl text-[11px] text-slate-300 flex items-center gap-2 shadow-lg">
        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
        <span>Stranded Location</span>
        {mechanicCoords?.latitude && (
          <>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse ml-2"></div>
            <span>Mechanic on the way</span>
          </>
        )}
      </div>
    </div>
  );
};

export default MapTracking;
