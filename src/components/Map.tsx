import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Category, Issue } from '../types';
import { STATUS_LABELS } from '../constants';
import { cn } from '../lib/utils'; 

// Fix Leaflet marker icons issue in Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const getCategorySvg = (category: Category) => {
  switch (category) {
    case 'STREETLIGHT': return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
    case 'FOUNTAIN': return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>`;
    case 'RAMP': return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="18" r="4"/><path d="M12 18h4.5a2 2 0 0 0 1.92-1.42l3-9.5A2 2 0 0 0 19.5 5H14c-1.1 0-2 .9-2 2v6"/><circle cx="14" cy="5" r="1.5"/></svg>`;
    case 'BENCH': return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11v8"/><path d="M20 11v8"/><path d="M4 15h16"/><path d="M4 11h16"/><path d="M6 11v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/></svg>`;
    case 'TOILET': return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 22V12h6v10"/><path d="M9 16h6"/><path d="M14 6h-4a2 2 0 0 0-2 2v4h8V8a2 2 0 0 0-2-2z"/><circle cx="12" cy="4" r="1"/></svg>`;
    default: return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`;
  }
};

const createCustomIcon = (issue: Issue, isSelected: boolean) => {
  let bgColor = '';
  let textColor = '';
  let borderColor = '';
  let shadow = 'shadow-md';

  if (issue.status === 'VERIFIED_GHOST') {
    bgColor = 'bg-red-500/90';
    textColor = 'text-white';
    borderColor = 'border-red-300';
    if (isSelected) shadow = 'shadow-[0_0_20px_rgba(239,68,68,0.8)]';
  } else if (issue.status === 'RESOLVED') {
    bgColor = 'bg-green-500/90';
    textColor = 'text-white';
    borderColor = 'border-green-300';
    if (isSelected) shadow = 'shadow-[0_0_20px_rgba(34,197,94,0.8)]';
  } else {
    // OPEN
    bgColor = 'bg-amber-500/90';
    textColor = 'text-white';
    borderColor = 'border-amber-300';
    if (isSelected) shadow = 'shadow-[0_0_20px_rgba(245,158,11,0.8)]';
  }

  const ringHtml = isSelected ? `<div class="absolute -inset-1.5 rounded-full border-2 ${borderColor} animate-ping opacity-75"></div>` : '';
  const scale = isSelected ? 'scale-110' : 'scale-100';

  return L.divIcon({
    className: 'custom-map-icon bg-transparent border-0',
    html: `<div class="relative w-8 h-8 rounded-full flex items-center justify-center border-2 ${bgColor} ${borderColor} ${textColor} ${shadow} ${scale} transition-all duration-300 backdrop-blur-sm">
            ${ringHtml}
            ${getCategorySvg(issue.category)}
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

interface MapProps {
  issues: Issue[];
  selectedIssueId?: string | null;
  onSelectIssue: (id: string, lat: number, lng: number) => void;
}

function MapUpdater({ selectedIssueId, issues }: { selectedIssueId?: string | null, issues: Issue[] }) {
  const map = useMap();
  useEffect(() => {
    if (selectedIssueId) {
      const issue = issues.find(i => i.id === selectedIssueId);
      if (issue) {
        map.setView([issue.location.lat, issue.location.lng], 16, { animate: true });
      }
    }
  }, [selectedIssueId, issues, map]);
  return null;
}

export default function GroundMap({ issues, selectedIssueId, onSelectIssue }: MapProps) {
  // Center roughly to Bangalore, India
  const center: [number, number] = [12.9716, 77.5946];

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
        />
        <MapUpdater selectedIssueId={selectedIssueId} issues={issues} />
        
        {issues.map(issue => (
          <Marker 
            key={issue.id} 
            position={[issue.location.lat, issue.location.lng]}
            icon={createCustomIcon(issue, issue.id === selectedIssueId)}
            eventHandlers={{
              click: () => onSelectIssue(issue.id, issue.location.lat, issue.location.lng),
            }}
          >
            <Popup className="ghost-popup">
              <div className="p-1 px-[2px] max-w-[200px]">
                <div className="flex justify-between items-start gap-3 mb-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">ID: {issue.id.slice(0, 6)}</span>
                  <span className={cn(
                    "text-[9px] px-1 rounded uppercase font-bold border",
                    issue.status === 'VERIFIED_GHOST' ? "bg-red-50 text-red-600 border-red-200" : issue.status === 'RESOLVED' ? "bg-green-50 text-green-600 border-green-200" : "bg-amber-50 text-amber-600 border-amber-200"
                  )}>
                    {STATUS_LABELS[issue.status]}
                  </span>
                </div>
                <h3 className="font-bold text-[11px] leading-tight mb-1">{issue.title}</h3>
                <p className="text-[10px] text-slate-500 mb-2 truncate">{issue.address}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
