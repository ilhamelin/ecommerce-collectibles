"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import {
  LatLngPoint,
  OMNI_WAREHOUSE_COORDINATES,
  generateRouteWaypoints,
} from "@/lib/geo/chilean-coordinates";
import {
  Truck,
  Building2,
  MapPin,
  Compass,
  Play,
  Pause,
  RotateCcw,
  Navigation,
  ShieldCheck,
  FastForward,
  CheckCircle2,
} from "lucide-react";

interface LiveTrackingMapProps {
  destination: LatLngPoint;
  destinationLabel: string;
  orderNumber: string;
  courierName: string;
  trackingNumber: string;
  currentStatus: string;
  onProgressChange?: (progressPercent: number, currentEtaMinutes: number) => void;
  onDestinationReached?: () => void;
}

export default function LiveTrackingMap({
  destination,
  destinationLabel,
  orderNumber,
  courierName,
  trackingNumber,
  currentStatus,
  onProgressChange,
  onDestinationReached,
}: LiveTrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const truckMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  const isAlreadyDelivered = (currentStatus || "").toUpperCase() === "DELIVERED";
  const [routeWaypoints, setRouteWaypoints] = useState<LatLngPoint[]>([]);
  // If already delivered, start at 100%, otherwise 0 if bodega, or 30% if dispatched
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(isAlreadyDelivered ? 29 : 6);
  const [isPlaying, setIsPlaying] = useState(!isAlreadyDelivered);
  const [isClient, setIsClient] = useState(false);
  const [simSpeed, setSimSpeed] = useState<1 | 2 | 4>(2);
  const [hasTriggeredDelivered, setHasTriggeredDelivered] = useState(isAlreadyDelivered);

  // Set client mounted
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Compute route waypoints
  useEffect(() => {
    const points = generateRouteWaypoints(OMNI_WAREHOUSE_COORDINATES, destination, 30);
    setRouteWaypoints(points);
  }, [destination]);

  // Initialize Leaflet Map on client
  useEffect(() => {
    if (!isClient || !mapContainerRef.current || routeWaypoints.length === 0) return;

    let L: any;
    let map: any;

    const initMap = async () => {
      L = (await import("leaflet")).default;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Compute center and bounds
      const midLat = (OMNI_WAREHOUSE_COORDINATES.lat + destination.lat) / 2;
      const midLng = (OMNI_WAREHOUSE_COORDINATES.lng + destination.lng) / 2;

      map = L.map(mapContainerRef.current, {
        center: [midLat, midLng],
        zoom: 12,
        zoomControl: false,
      });
      mapInstanceRef.current = map;

      // Add Zoom control at top right
      L.control.zoom({ position: "topright" }).addTo(map);

      // Add High-Quality Tile Layer (OpenStreetMap with clean aesthetics)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom Warehouse DivIcon
      const warehouseIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="background: #1F3A5F; color: white; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border-radius: 12px; padding: 7px; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
              <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
              <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      // Custom Home Destination DivIcon
      const homeIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="background: #FF6B35; color: white; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(255,107,53,0.4); border-radius: 12px; padding: 7px; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      // Custom Moving Truck DivIcon with Live Radar Pulse
      const truckIcon = L.divIcon({
        className: "custom-leaflet-truck-marker",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
            <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(0, 158, 227, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
            <div style="position: relative; background: #009EE3; color: white; border: 2.5px solid white; box-shadow: 0 4px 14px rgba(0, 158, 227, 0.6); border-radius: 50%; padding: 8px; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
                <path d="M15 18H9"/>
                <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
                <circle cx="17" cy="18" r="2"/>
                <circle cx="7" cy="18" r="2"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      // Add Warehouse Marker
      L.marker([OMNI_WAREHOUSE_COORDINATES.lat, OMNI_WAREHOUSE_COORDINATES.lng], {
        icon: warehouseIcon,
      })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
            <strong style="color: #1F3A5F; font-size: 13px;">Bodega Central OmniCollector</strong><br/>
            Centro Logístico ENEA, Pudahuel<br/>
            <span style="color: #2E9E5B; font-weight: bold;">✓ Despacho Collector-Grade</span>
          </div>
        `);

      // Add Destination Marker
      L.marker([destination.lat, destination.lng], { icon: homeIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
            <strong style="color: #FF6B35; font-size: 13px;">Dirección de Entrega</strong><br/>
            ${destinationLabel}<br/>
            <span style="color: #666;">Destinatario verificado</span>
          </div>
        `);

      // Draw Polyline for Route
      const latLngs = routeWaypoints.map((p) => [p.lat, p.lng]);
      const polyline = L.polyline(latLngs, {
        color: "#FF6B35",
        weight: 5,
        opacity: 0.85,
        dashArray: "8, 8",
        lineJoin: "round",
      }).addTo(map);
      polylineRef.current = polyline;

      // Add Initial Truck Marker at current waypoint
      const currentPoint = routeWaypoints[currentWaypointIndex] || routeWaypoints[0];
      const truckMarker = L.marker([currentPoint.lat, currentPoint.lng], {
        icon: truckIcon,
      })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
            <strong style="color: #009EE3; font-size: 13px;">Móvil de Reparto • ${courierName}</strong><br/>
            Seguimiento N°: <span style="font-family: monospace; font-weight: bold;">${trackingNumber}</span><br/>
            <span style="color: #FF6B35; font-weight: bold;">En ruta hacia tu domicilio</span>
          </div>
        `);
      truckMarkerRef.current = truckMarker;

      // Fit map bounds with padding
      const group = L.featureGroup([polyline]);
      map.fitBounds(group.getBounds(), { padding: [50, 50] });
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, routeWaypoints]);

  // Live simulation tick: move truck along waypoints
  useEffect(() => {
    if (!isPlaying || routeWaypoints.length === 0) return;

    const intervalMs = simSpeed === 4 ? 500 : simSpeed === 2 ? 1200 : 2500;

    const interval = setInterval(() => {
      setCurrentWaypointIndex((prev) => {
        const lastIdx = routeWaypoints.length - 1;
        if (prev >= lastIdx) {
          setIsPlaying(false);
          if (!hasTriggeredDelivered) {
            setHasTriggeredDelivered(true);
            onDestinationReached?.();
          }
          return lastIdx;
        }

        const next = prev + 1;

        if (truckMarkerRef.current && routeWaypoints[next]) {
          const pt = routeWaypoints[next];
          truckMarkerRef.current.setLatLng([pt.lat, pt.lng]);
        }

        // Notify parent of ETA and progress
        const percent = Math.round((next / lastIdx) * 100);
        const etaMinutes = Math.max(0, Math.round((1 - next / lastIdx) * 45));
        onProgressChange?.(percent, etaMinutes);

        if (next >= lastIdx) {
          setIsPlaying(false);
          if (!hasTriggeredDelivered) {
            setHasTriggeredDelivered(true);
            onDestinationReached?.();
          }
        }

        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, routeWaypoints, simSpeed, hasTriggeredDelivered, onDestinationReached]);

  const handleCenterTruck = () => {
    if (!mapInstanceRef.current || !routeWaypoints[currentWaypointIndex]) return;
    const pt = routeWaypoints[currentWaypointIndex];
    mapInstanceRef.current.flyTo([pt.lat, pt.lng], 14, { duration: 1.2 });
  };

  const handleFitRoute = () => {
    if (!mapInstanceRef.current || !polylineRef.current) return;
    mapInstanceRef.current.fitBounds(polylineRef.current.getBounds(), { padding: [50, 50] });
  };

  const handleRestart = () => {
    setCurrentWaypointIndex(0);
    setHasTriggeredDelivered(false);
    if (truckMarkerRef.current && routeWaypoints[0]) {
      truckMarkerRef.current.setLatLng([routeWaypoints[0].lat, routeWaypoints[0].lng]);
    }
    setIsPlaying(true);
    onProgressChange?.(0, 45);
  };

  const handleInstantArrival = () => {
    if (routeWaypoints.length === 0) return;
    const lastIdx = routeWaypoints.length - 1;
    setCurrentWaypointIndex(lastIdx);
    if (truckMarkerRef.current && routeWaypoints[lastIdx]) {
      const pt = routeWaypoints[lastIdx];
      truckMarkerRef.current.setLatLng([pt.lat, pt.lng]);
    }
    setIsPlaying(false);
    onProgressChange?.(100, 0);
    if (!hasTriggeredDelivered) {
      setHasTriggeredDelivered(true);
      onDestinationReached?.();
    }
  };

  const progressPercent =
    routeWaypoints.length > 0
      ? Math.round((currentWaypointIndex / (routeWaypoints.length - 1)) * 100)
      : 30;

  return (
    <div className="relative w-full h-full min-h-[480px] rounded-3xl overflow-hidden border border-[#E5E5E5] shadow-lg bg-slate-100 flex flex-col">
      {/* Map Target Div */}
      <div ref={mapContainerRef} className="w-full flex-1 z-0" style={{ minHeight: "420px" }} />

      {/* Floating Map Controls Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <button
          onClick={handleCenterTruck}
          className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md hover:bg-white text-[#1F3A5F] font-bold text-xs shadow-md border border-[#E5E5E5] flex items-center gap-1.5 transition hover:scale-105 active:scale-95"
          title="Centrar mapa en el vehículo de reparto"
        >
          <Navigation className="w-3.5 h-3.5 text-[#009EE3]" />
          <span>Centrar Móvil</span>
        </button>

        <button
          onClick={handleFitRoute}
          className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md hover:bg-white text-[#1F3A5F] font-bold text-xs shadow-md border border-[#E5E5E5] flex items-center gap-1.5 transition hover:scale-105 active:scale-95"
          title="Ver ruta completa de origen a destino"
        >
          <Compass className="w-3.5 h-3.5 text-[#FF6B35]" />
          <span>Ruta Completa</span>
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-md border transition flex items-center gap-1.5 ${
            isPlaying
              ? "bg-[#1F3A5F] text-white border-[#1F3A5F]"
              : "bg-amber-500 text-white border-amber-600"
          }`}
          title={isPlaying ? "Pausar simulación" : "Reanudar simulación"}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isPlaying ? "En Vivo" : "Pausado"}</span>
        </button>

        {/* Speed Toggle: 1x, 2x, 4x */}
        <button
          onClick={() => setSimSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 4 : 1))}
          className="px-2.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md hover:bg-white text-[#1F3A5F] font-mono font-black text-xs shadow-md border border-[#E5E5E5] flex items-center gap-1 transition"
          title="Cambiar velocidad de la simulación"
        >
          <FastForward className="w-3 h-3 text-[#FF6B35]" />
          <span>{simSpeed}x</span>
        </button>

        {/* Quick Instant Arrival Test Button */}
        {progressPercent < 100 && (
          <button
            onClick={handleInstantArrival}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1 transition hover:scale-105 active:scale-95"
            title="Acelerar y confirmar entrega en destino"
          >
            <CheckCircle2 className="w-3 h-3 text-white" />
            <span>Completar Ruta</span>
          </button>
        )}

        <button
          onClick={handleRestart}
          className="p-2 rounded-xl bg-white/95 backdrop-blur-md hover:bg-white text-[#666666] hover:text-[#1A1A1A] text-xs shadow-md border border-[#E5E5E5] transition"
          title="Reiniciar trayecto desde bodega"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Bottom Status Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-10 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E5E5E5] shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#009EE3]/10 text-[#009EE3] flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-[#1A1A1A] font-black text-xs">
                Móvil {courierName} en Ruta
              </strong>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">
                {progressPercent}% completado
              </span>
            </div>
            <p className="text-[11px] text-[#666666]">
              Destino: <strong className="text-[#1A1A1A]">{destinationLabel}</strong> • Tracking #{trackingNumber}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-48 space-y-1">
          <div className="w-full h-2 rounded-full bg-[#E5E5E5] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#009EE3] to-[#FF6B35] transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#666666]">
            <span>Bodega ENEA</span>
            <span>Tu Domicilio</span>
          </div>
        </div>
      </div>
    </div>
  );
}
