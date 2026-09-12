import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Navigation, 
  ZoomIn, 
  ZoomOut, 
  AlertCircle, 
  Search, 
  Loader2, 
  Crosshair,
  Layers,
  Check,
  Radio,
  Activity
} from 'lucide-react';
import { GrievanceLocation } from '../types';
import { 
  reverseGeocodeCoords, 
  searchOpenStreetMap, 
  GeocodedPlace, 
  detectDeviceLocation,
  watchLiveLocation 
} from '../utils/locationService';

interface InteractiveMapProps {
  location: GrievanceLocation;
  title?: string;
  nearbyCount?: number;
  interactive?: boolean;
  onLocationChange?: (location: GrievanceLocation) => void;
  heightClass?: string;
  showSearch?: boolean;
  showDetailsBadge?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  location,
  title = 'Civic Grievance Location',
  nearbyCount = 2,
  interactive = false,
  onLocationChange,
  heightClass = 'h-64 sm:h-72',
  showSearch = false,
  showDetailsBadge = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const nearbyLayerRef = useRef<L.LayerGroup | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const liveCleanupRef = useRef<(() => void) | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [liveAccuracy, setLiveAccuracy] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodedPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mapMode, setMapMode] = useState<'standard' | 'humanitarian'>('standard');
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  // Custom DivIcon for civic grievance marker
  const createCivicIcon = (isDraggable: boolean) => {
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full cursor-pointer">
          <span class="absolute -top-1 w-9 h-9 rounded-full bg-[#ba1a1a]/30 animate-ping"></span>
          <div class="relative z-10 w-9 h-9 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shadow-xl border-2 border-white transition-transform hover:scale-110">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          ${isDraggable ? '<div class="absolute -bottom-5 px-1.5 py-0.5 bg-black/80 text-white text-[9px] font-bold rounded shadow whitespace-nowrap">Drag to adjust</div>' : ''}
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const lat = location.lat || 28.6139;
    const lng = location.lng || 77.2090;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    // OpenStreetMap standard tile layer
    const standardTileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
    standardTileLayer.addTo(map);

    // Attribution control bottom right
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>')
      .addTo(map);

    // Primary marker
    const marker = L.marker([lat, lng], {
      icon: createCivicIcon(interactive),
      draggable: interactive
    }).addTo(map);

    marker.bindPopup(`
      <div style="font-family: sans-serif; min-width: 160px; padding: 4px;">
        <div style="font-weight: 700; font-size: 13px; color: #0b1c30; margin-bottom: 2px;">${location.name || title}</div>
        <div style="font-size: 11px; color: #555;">${location.zone} • ${location.ward}</div>
        <div style="font-size: 10px; color: #888; margin-top: 4px;">GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
      </div>
    `);

    // Handle marker drag
    if (interactive && onLocationChange) {
      marker.on('dragend', async () => {
        const position = marker.getLatLng();
        setLocationStatus('Fetching address for pinned point...');
        try {
          const resolved = await reverseGeocodeCoords(position.lat, position.lng);
          onLocationChange(resolved);
          setLocationStatus(null);
        } catch {
          setLocationStatus(null);
        }
      });

      // Handle map click to reposition marker
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        setLocationStatus('Resolving clicked location...');
        try {
          const resolved = await reverseGeocodeCoords(clickLat, clickLng);
          onLocationChange(resolved);
          setLocationStatus(null);
        } catch {
          setLocationStatus(null);
        }
      });
    }

    // Nearby simulated/historical grievance clusters
    const nearbyLayer = L.layerGroup().addTo(map);
    if (nearbyCount > 0) {
      const offsets = [
        { dLat: 0.0022, dLng: -0.0031, count: '2', color: '#006c4a' },
        { dLat: -0.0028, dLng: 0.0025, count: '1', color: '#497cff' }
      ];

      offsets.slice(0, nearbyCount).forEach((offset) => {
        const nLat = lat + offset.dLat;
        const nLng = lng + offset.dLng;
        const clusterIcon = L.divIcon({
          className: 'custom-cluster-icon',
          html: `
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md border border-white" style="background-color: ${offset.color}">
              ${offset.count}
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        L.marker([nLat, nLng], { icon: clusterIcon })
          .bindTooltip(`Nearby civic reports: ${offset.count}`)
          .addTo(nearbyLayer);
      });
    }

    mapInstanceRef.current = map;
    markerRef.current = marker;
    nearbyLayerRef.current = nearbyLayer;

    // Trigger resize once mounted to prevent grey tile artifacts
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (liveCleanupRef.current) {
        liveCleanupRef.current();
        liveCleanupRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map view and marker when `location` changes externally
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    const lat = location.lat;
    const lng = location.lng;

    if (typeof lat === 'number' && typeof lng === 'number') {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.panTo([lat, lng], { animate: true });

      // Update popup content
      markerRef.current.setPopupContent(`
        <div style="font-family: sans-serif; min-width: 160px; padding: 4px;">
          <div style="font-weight: 700; font-size: 13px; color: #0b1c30; margin-bottom: 2px;">${location.name || title}</div>
          <div style="font-size: 11px; color: #555;">${location.zone} • ${location.ward}</div>
          <div style="font-size: 10px; color: #888; margin-top: 4px;">GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
        </div>
      `);
    }
  }, [location.lat, location.lng, location.name, location.zone, location.ward, title]);

  // Handle live device location detect ("Locate Me")
  const handleLocateMe = async () => {
    setIsLocating(true);
    setLocationStatus('Accessing browser GPS...');
    const result = await detectDeviceLocation();
    setIsLocating(false);

    if (result.success && result.location) {
      setLocationStatus(null);
      if (onLocationChange) {
        onLocationChange(result.location);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([result.location.lat, result.location.lng], 16, {
          duration: 1.2
        });
      }
    } else {
      setLocationStatus(result.error || 'Unable to detect location. Please use search or click the map.');
      setTimeout(() => setLocationStatus(null), 6000);
    }
  };

  // Handle continuous live GPS tracking toggle
  const handleToggleLiveTracking = () => {
    if (isLiveTracking) {
      if (liveCleanupRef.current) {
        liveCleanupRef.current();
        liveCleanupRef.current = null;
      }
      if (accuracyCircleRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(accuracyCircleRef.current);
        accuracyCircleRef.current = null;
      }
      setIsLiveTracking(false);
      setLiveAccuracy(null);
      setLocationStatus('Live tracking stopped.');
      setTimeout(() => setLocationStatus(null), 3000);
      return;
    }

    setLocationStatus('Activating continuous live GPS stream...');
    setIsLiveTracking(true);

    const cleanup = watchLiveLocation(
      (newLoc, accuracy) => {
        setLiveAccuracy(Math.round(accuracy));
        setLocationStatus(null);
        if (onLocationChange) {
          onLocationChange(newLoc);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([newLoc.lat, newLoc.lng], { animate: true });

          // Update accuracy radius circle
          if (accuracyCircleRef.current) {
            accuracyCircleRef.current.setLatLng([newLoc.lat, newLoc.lng]);
            accuracyCircleRef.current.setRadius(accuracy);
          } else {
            accuracyCircleRef.current = L.circle([newLoc.lat, newLoc.lng], {
              radius: accuracy,
              color: '#006c4a',
              weight: 1.5,
              fillColor: '#82f5c1',
              fillOpacity: 0.2
            }).addTo(mapInstanceRef.current);
          }
        }
      },
      (errorMsg) => {
        setIsLiveTracking(false);
        setLocationStatus(errorMsg);
        setTimeout(() => setLocationStatus(null), 5000);
      }
    );

    liveCleanupRef.current = cleanup;
  };

  // Handle Place Search
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchResults(true);
    const places = await searchOpenStreetMap(searchQuery);
    setIsSearching(false);
    setSearchResults(places);
  };

  // Select place from search suggestions
  const handleSelectPlace = (place: GeocodedPlace) => {
    setShowSearchResults(false);
    setSearchQuery('');
    const newLoc: GrievanceLocation = {
      name: place.name,
      zone: place.zone,
      ward: place.ward,
      lat: place.lat,
      lng: place.lng,
      address: place.displayName
    };

    if (onLocationChange) {
      onLocationChange(newLoc);
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([place.lat, place.lng], 16, {
        duration: 1.2
      });
    }
  };

  return (
    <div 
      id="grievance-location-map-container"
      className={`relative w-full ${heightClass} bg-[#e5eeff] rounded-2xl overflow-hidden border border-[#c6c6cd]/40 shadow-xs group`}
    >
      {/* Search Bar Overlay (if enabled or interactive) */}
      {(showSearch || interactive) && (
        <div className="absolute top-3 left-3 z-[1000] w-[calc(100%-90px)] max-w-sm">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area, landmark, street (OSM)..."
              className="w-full bg-white/95 backdrop-blur-md text-[#0b1c30] text-xs font-medium pl-8 pr-8 py-2 rounded-xl shadow-md border border-[#c6c6cd]/60 focus:outline-none focus:ring-2 focus:ring-[#006c4a] transition-all"
            />
            <Search className="w-4 h-4 text-[#76777d] absolute left-2.5 pointer-events-none" />
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-[#006c4a] absolute right-2.5 animate-spin" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                className="absolute right-2.5 text-[#76777d] hover:text-black text-xs font-bold"
              >
                ✕
              </button>
            ) : null}
          </form>

          {/* Autocomplete Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="mt-1.5 bg-white rounded-xl shadow-xl border border-[#c6c6cd]/40 overflow-hidden max-h-48 overflow-y-auto divide-y divide-gray-100 z-[1001]">
              {searchResults.map((place, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPlace(place)}
                  className="w-full text-left px-3 py-2 hover:bg-[#eff4ff] flex items-start gap-2 text-xs transition-colors cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#006c4a] shrink-0 mt-0.5" />
                  <div className="truncate">
                    <p className="font-semibold text-[#0b1c30] truncate">{place.name}</p>
                    <p className="text-[10px] text-[#76777d] truncate">{place.displayName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showSearchResults && searchResults.length === 0 && !isSearching && searchQuery.trim().length > 1 && (
            <div className="mt-1.5 bg-white px-3 py-2 rounded-xl shadow-md text-xs text-[#76777d] z-[1001]">
              No places found in OpenStreetMap for "{searchQuery}". Try a nearby landmark.
            </div>
          )}
        </div>
      )}

      {/* Map Interactive Status / Alert Banner */}
      {locationStatus && (
        <div className="absolute top-14 left-3 right-3 sm:right-auto sm:max-w-md z-[1000] bg-[#000000]/90 text-white text-[11px] px-3 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-[#82f5c1] shrink-0" />
          <span className="truncate">{locationStatus}</span>
        </div>
      )}

      {/* Live GPS Active Banner */}
      {isLiveTracking && (
        <div className="absolute top-14 left-3 z-[1000] bg-[#006c4a] text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 border border-[#82f5c1]/50 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-[#82f5c1] animate-ping" />
          <span>Live Tracking Active {liveAccuracy ? `(±${liveAccuracy}m)` : ''}</span>
          <button
            type="button"
            onClick={handleToggleLiveTracking}
            className="ml-2 bg-black/40 hover:bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white cursor-pointer"
          >
            Stop
          </button>
        </div>
      )}

      {/* Actual Leaflet Map Canvas Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-0"
        style={{ minHeight: '100%' }}
      />

      {/* Map Control Buttons (Top-Right) */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-[1000]">
        {/* Continuous Live Tracking Button */}
        <button
          type="button"
          onClick={handleToggleLiveTracking}
          className={`p-2 rounded-xl shadow-md border transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center ${
            isLiveTracking
              ? 'bg-[#006c4a] text-white border-[#82f5c1] shadow-[#006c4a]/30'
              : 'bg-white/95 hover:bg-white text-[#45464d] hover:text-[#006c4a] border-[#c6c6cd]/40'
          }`}
          title={isLiveTracking ? 'Stop Live GPS Tracking' : 'Start Continuous Live GPS Tracking'}
        >
          <Radio className={`w-4 h-4 ${isLiveTracking ? 'animate-pulse text-[#82f5c1]' : ''}`} />
        </button>

        {/* Locate Me (GPS) Single Snapshot Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="p-2 bg-white/95 hover:bg-white text-[#006c4a] rounded-xl shadow-md border border-[#c6c6cd]/40 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
          title="Detect My Real Location (One-time GPS)"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#006c4a]" />
          ) : (
            <Crosshair className="w-4 h-4 text-[#006c4a]" />
          )}
        </button>

        {/* Zoom Controls */}
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="p-2 bg-white/95 hover:bg-white text-[#0b1c30] rounded-xl shadow-md border border-[#c6c6cd]/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="p-2 bg-white/95 hover:bg-white text-[#0b1c30] rounded-xl shadow-md border border-[#c6c6cd]/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (mapInstanceRef.current && location.lat && location.lng) {
              mapInstanceRef.current.flyTo([location.lat, location.lng], 15);
            }
          }}
          className="p-2 bg-white/95 hover:bg-white text-[#0b1c30] rounded-xl shadow-md border border-[#c6c6cd]/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Reset to Pinned Location"
        >
          <Navigation className="w-4 h-4 text-[#006c4a]" />
        </button>
      </div>

      {/* Bottom Floating Location Badge */}
      {showDetailsBadge && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-[#c6c6cd]/30 flex items-center gap-2.5 shadow-md max-w-[85%] sm:max-w-md">
          <div className="w-8 h-8 rounded-full bg-[#131b2e] flex items-center justify-center text-[#82f5c1] shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-xs md:text-sm text-[#0b1c30] truncate">
                {location.name || title}
              </p>
              <span className="text-[9px] font-bold bg-[#82f5c1]/30 text-[#005137] px-1.5 py-0.5 rounded">
                OSM
              </span>
            </div>
            <p className="text-[11px] text-[#45464d] truncate">
              {location.zone} • {location.ward} ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
            </p>
          </div>
        </div>
      )}

      {/* Drag/Click Hint for Interactive Mode */}
      {interactive && (
        <div className="absolute bottom-3 right-3 z-[1000] hidden sm:flex items-center gap-1.5 bg-black/75 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[10px] font-medium pointer-events-none">
          <Check className="w-3 h-3 text-[#82f5c1]" />
          <span>Click map or drag pin to adjust</span>
        </div>
      )}
    </div>
  );
};
