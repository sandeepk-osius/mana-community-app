import React from "react";
import { X, MapPin, Clock, Loader2, Edit2 } from "lucide-react";
import { cn } from "../../ui/utils";
import type { Venue } from "../../../../types/api";

interface VenueDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVenueDetails: Venue | null;
  loadingVenueDetails: boolean;
  onEditVenue?: () => void;
}

export const VenueDetailsModal: React.FC<VenueDetailsModalProps> = ({
  isOpen,
  onClose,
  selectedVenueDetails,
  loadingVenueDetails,
  onEditVenue,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-[#141c2e] border border-[#2a3a5c] rounded-2xl w-full max-w-2xl shadow-2xl text-left"
        style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.6), 0 0 40px rgba(249,115,22,0.08)" }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a3a5c] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#f97316]/10 flex items-center justify-center text-[#f97316]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#f1f5f9]">Venue Specifications</h2>
              <p className="text-xs text-[#64748b] mt-0.5">Details, capacity, courts and contact information</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-[#1e293b] rounded-lg text-[#94a3b8] hover:text-white transition-colors border-none bg-transparent cursor-pointer text-base"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {loadingVenueDetails ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-sm text-[#94a3b8]">
              <Loader2 className="w-6 h-6 animate-spin text-[#f97316]" />
              <span>Fetching venue details...</span>
            </div>
          ) : selectedVenueDetails ? (
            <div className="space-y-6">
              {/* Header Details */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#2a3a5c]/60 pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#f1f5f9]">{selectedVenueDetails.name}</h3>
                  {selectedVenueDetails.area || selectedVenueDetails.city ? (
                    <p className="text-xs text-[#94a3b8] mt-1">
                      {[selectedVenueDetails.area, selectedVenueDetails.city].filter(Boolean).join(", ")}
                    </p>
                  ) : null}
                </div>
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border",
                  selectedVenueDetails.venueType === "OUTSIDE" 
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                )}>
                  {selectedVenueDetails.venueType === "OUTSIDE" ? "Outside Venue" : "Community Venue"}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs leading-relaxed">
                {/* Location Details */}
                <div className="space-y-1.5 p-4 rounded-xl bg-[#0c1220]/40 border border-[#2a3a5c]/60">
                  <span className="text-[10px] text-[#64748b] uppercase tracking-wider block font-bold">Location Details</span>
                  <p className="text-[#cbd5e1] font-medium">
                    {selectedVenueDetails.address || "No address provided"}
                  </p>
                  {selectedVenueDetails.pinCode && (
                    <p className="text-[#94a3b8] font-mono">PIN: {selectedVenueDetails.pinCode}</p>
                  )}
                  {selectedVenueDetails.mapLink && (
                    <a 
                      href={selectedVenueDetails.mapLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1 text-[#f97316] hover:text-[#ea580c] transition-colors mt-2 font-semibold hover:underline cursor-pointer"
                    >
                      Open in Maps ↗
                    </a>
                  )}
                </div>

                {/* Capacity & Timings */}
                <div className="space-y-3.5 p-4 rounded-xl bg-[#0c1220]/40 border border-[#2a3a5c]/60">
                  <div>
                    <span className="text-[10px] text-[#64748b] uppercase tracking-wider block font-bold mb-1">Capacity</span>
                    <p className="text-[#cbd5e1] font-semibold text-sm">
                      {selectedVenueDetails.capacity ? `${selectedVenueDetails.capacity} People` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748b] uppercase tracking-wider block font-bold mb-1">Operating Hours</span>
                    <div className="flex items-center gap-1.5 text-[#cbd5e1] font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#94a3b8]" />
                      <span>
                        {selectedVenueDetails.openingTime || "N/A"} - {selectedVenueDetails.closingTime || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Person Card */}
              <div className="p-4 rounded-xl bg-[#0c1220]/40 border border-[#2a3a5c]/60 space-y-2">
                <span className="text-[10px] text-[#64748b] uppercase tracking-wider block font-bold">Contact Person</span>
                {selectedVenueDetails.contactName ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[9px] text-[#475569] uppercase font-bold block">Name</span>
                      <p className="text-[#f1f5f9] font-semibold mt-0.5">{selectedVenueDetails.contactName}</p>
                    </div>
                    {selectedVenueDetails.contactNumber && (
                      <div>
                        <span className="text-[9px] text-[#475569] uppercase font-bold block">Phone</span>
                        <p className="text-[#cbd5e1] mt-0.5 font-mono">{selectedVenueDetails.contactNumber}</p>
                      </div>
                    )}
                    {selectedVenueDetails.contactEmail && (
                      <div className="min-w-0">
                        <span className="text-[9px] text-[#475569] uppercase font-bold block">Email</span>
                        <p className="text-[#cbd5e1] mt-0.5 truncate font-mono">{selectedVenueDetails.contactEmail}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[#64748b] text-xs italic">No contact specified</p>
                )}
              </div>

              {/* Courts Available */}
              {selectedVenueDetails.courts && selectedVenueDetails.courts.length > 0 && (
                <div className="border-t border-[#2a3a5c]/60 pt-4">
                  <span className="text-[10px] text-[#64748b] uppercase tracking-wider block font-bold mb-2">Courts Available ({selectedVenueDetails.courts.length})</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedVenueDetails.courts.map((court, i) => (
                      <span 
                        key={court.id || i} 
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0c1220] border border-[#2a3a5c] text-[#f1f5f9]"
                      >
                        <span 
                          className="w-2.5 h-2.5 rounded-full inline-block mr-2 shadow-inner" 
                          style={{ backgroundColor: court.color || "#3b82f6" }} 
                        />
                        {court.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-red-400 font-medium">
              Failed to load venue details. Please select another venue.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#2a3a5c] bg-[#0c1220]/40 flex-shrink-0 rounded-b-2xl">
          {selectedVenueDetails && onEditVenue ? (
            <button
              type="button"
              onClick={() => {
                onEditVenue();
                onClose();
              }}
              className="px-4 py-2 bg-[#f97316]/10 hover:bg-[#f97316]/20 border border-[#f97316]/30 text-[#f97316] text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Venue
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer border-none"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
