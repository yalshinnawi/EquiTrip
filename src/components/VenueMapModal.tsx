import React, { useState } from 'react';
import { X, MapPin, ExternalLink, Navigation, Compass, Layers, Check } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { ItineraryEvent } from '../types';

interface VenueMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEvent: ItineraryEvent | null;
  dayEvents?: ItineraryEvent[];
}

export const VenueMapModal: React.FC<VenueMapModalProps> = ({
  isOpen,
  onClose,
  selectedEvent,
  dayEvents = [],
}) => {
  if (!isOpen) return null;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Mode: single venue vs entire day itinerary route
  const [viewMode, setViewMode] = useState<'single' | 'all'>(dayEvents.length > 1 ? 'all' : 'single');
  const [activeMarkerEvent, setActiveMarkerEvent] = useState<ItineraryEvent>(selectedEvent || dayEvents[0]);

  // Default coordinate center (Kyoto center or selected event coordinates)
  const defaultPos = activeMarkerEvent?.coordinates || { lat: 35.0116, lng: 135.7681 };

  const googleMapsUrl = activeMarkerEvent?.googleMapsUri || 
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      activeMarkerEvent?.address || activeMarkerEvent?.location || 'Kyoto'
    )}`;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl h-[560px] rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <span>Google Maps Location Link</span>
                {dayEvents.length > 1 && (
                  <span className="text-[10px] text-neutral-400 font-normal">
                    ({dayEvents.length} venue stops)
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-neutral-500 truncate max-w-xs sm:max-w-md">
                {activeMarkerEvent?.location || 'Venue'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {dayEvents.length > 1 && (
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-[11px]">
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-2 py-1 rounded font-bold transition-all ${
                    viewMode === 'all'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                      : 'text-neutral-500'
                  }`}
                >
                  All Day Stops
                </button>
                <button
                  onClick={() => setViewMode('single')}
                  className={`px-2 py-1 rounded font-bold transition-all ${
                    viewMode === 'single'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                      : 'text-neutral-500'
                  }`}
                >
                  This Venue
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Map Viewport Area */}
        <div className="flex-1 relative w-full h-full min-h-[300px] bg-neutral-100 dark:bg-neutral-950">
          {apiKey ? (
            <APIProvider apiKey={apiKey}>
              <Map
                mapId="DEMO_MAP_ID"
                defaultCenter={defaultPos}
                defaultZoom={viewMode === 'all' ? 13 : 15}
                gestureHandling="greedy"
                disableDefaultUI={false}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
              >
                {viewMode === 'all' ? (
                  dayEvents.map((evt, idx) => {
                    const pos = evt.coordinates || { lat: 35.0116 + idx * 0.01, lng: 135.7681 + idx * 0.01 };
                    const isSelected = activeMarkerEvent?.id === evt.id;
                    return (
                      <AdvancedMarker
                        key={evt.id}
                        position={pos}
                        onClick={() => setActiveMarkerEvent(evt)}
                        title={evt.title}
                      >
                        <Pin
                          background={isSelected ? '#4f46e5' : '#059669'}
                          borderColor="#ffffff"
                          glyphColor="#ffffff"
                          glyphText={`${idx + 1}`}
                          scale={isSelected ? 1.2 : 1.0}
                        />
                      </AdvancedMarker>
                    );
                  })
                ) : (
                  <AdvancedMarker
                    position={defaultPos}
                    title={activeMarkerEvent?.title}
                  >
                    <Pin
                      background="#4f46e5"
                      borderColor="#ffffff"
                      glyphColor="#ffffff"
                      scale={1.2}
                    />
                  </AdvancedMarker>
                )}
              </Map>
            </APIProvider>
          ) : (
            /* Fallback Map Mockup if key is not yet provided */
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-indigo-50/50 via-neutral-100 to-emerald-50/50 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md">
                <MapPin className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {activeMarkerEvent?.title}
              </h4>
              <p className="text-xs text-neutral-500 max-w-sm mt-1">
                {activeMarkerEvent?.address || activeMarkerEvent?.location}
              </p>
              {activeMarkerEvent?.coordinates && (
                <span className="font-mono text-[11px] text-neutral-400 mt-1">
                  GPS: {activeMarkerEvent.coordinates.lat.toFixed(4)}, {activeMarkerEvent.coordinates.lng.toFixed(4)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Venue Card & Google Maps Deep Link */}
        <div className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <span className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {activeMarkerEvent?.title}
                </span>
                <span className="text-neutral-300">·</span>
                <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  {activeMarkerEvent?.startTime}
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 truncate">
                {activeMarkerEvent?.address || activeMarkerEvent?.location}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3 opacity-75" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
