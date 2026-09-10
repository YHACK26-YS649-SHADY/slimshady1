import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Camera,
  Upload,
  CheckCircle2,
  WifiOff,
  Navigation,
  Loader2
} from 'lucide-react';
import type { FieldReport, ZoneWithRisk } from '../../types';

interface FieldReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (report: Omit<FieldReport, 'id' | 'timestamp' | 'isVerified'>) => Promise<void>;
  zones: ZoneWithRisk[];
  isOnline: boolean;
}

export const FieldReportModal: React.FC<FieldReportModalProps> = ({
  isOpen,
  onClose,
  onSubmitReport,
  zones,
  isOnline
}) => {
  const [reporterName, setReporterName] = useState('');
  const [reporterRole, setReporterRole] = useState<FieldReport['reporterRole']>('Citizen');
  const [severity, setSeverity] = useState<FieldReport['severity']>('Severe Fissure');
  const [crackWidthCm, setCrackWidthCm] = useState<number>(10);
  const [hasWaterSeepage, setHasWaterSeepage] = useState(true);
  const [hasRetainingWallDamage, setHasRetainingWallDamage] = useState(true);
  const [affectedRoadName, setAffectedRoadName] = useState('');
  const [description, setDescription] = useState('');
  const [zoneId, setZoneId] = useState(zones[0]?.zone.id || 'ner-sk-01');

  const [latitude, setLatitude] = useState<number>(zones[0]?.zone.lat || 27.3389);
  const [longitude, setLongitude] = useState<number>(zones[0]?.zone.lon || 88.6065);
  const [isLocating, setIsLocating] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Update default coordinates when selected zone changes
  useEffect(() => {
    const z = zones.find(item => item.zone.id === zoneId);
    if (z) {
      setLatitude(z.zone.lat);
      setLongitude(z.zone.lon);
    }
  }, [zoneId, zones]);

  if (!isOpen) return null;

  // Auto GPS Capture
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(5)));
        setLongitude(Number(pos.coords.longitude.toFixed(5)));
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        alert('Could not acquire precise GPS fix. Using chosen sector coordinates.');
      },
      { timeout: 8000 }
    );
  };

  // Mock Photo Upload / FileReader
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !reporterName.trim()) {
      alert('Please fill out reporter name and observation description.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitReport({
        zoneId,
        latitude,
        longitude,
        reporterName,
        reporterRole,
        severity,
        crackWidthCm: Number(crackWidthCm),
        hasWaterSeepage,
        hasRetainingWallDamage,
        affectedRoadName,
        description,
        photoUrl: photoPreview || undefined,
        syncedFromOffline: !isOnline
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        onClose();
      }, 1800);
    } catch (err) {
      console.error(err);
      alert('Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-[#08060cb3] backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg glass-panel p-6 rounded-2xl border border-amber-500/30 shadow-2xl bg-[#0e0c15]/95 my-8">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-amber-200/60 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-lg text-white">
              Crowdsourced Landslide & Fissure Report
            </h3>
            <p className="text-xs text-amber-200/70">
              Your field observations calibrate the AI risk engine in real-time.
            </p>
          </div>
        </div>

        {/* Offline notice if disconnected */}
        {!isOnline && (
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2 mb-4">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Offline Mode Active:</strong> This report will be queued locally and automatically synchronized with disaster authorities as soon as internet connectivity returns.
            </span>
          </div>
        )}

        {submitSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-heading font-bold text-lg text-white">
              Field Report Successfully Recorded!
            </h4>
            <p className="text-xs text-slate-300 max-w-xs">
              Thank you for reporting. This ground truth data has been factored into the local sector risk evaluation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">

            {/* Sector Selector */}
            <div>
              <label className="text-amber-200 font-semibold block mb-1">
                Monitored Sector / Area
              </label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full bg-[#161224] border border-amber-500/30 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              >
                {zones.map(z => (
                  <option key={z.zone.id} value={z.zone.id}>
                    {z.zone.name} ({z.zone.state})
                  </option>
                ))}
              </select>
            </div>

            {/* Reporter Name & Role */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-amber-200 font-semibold block mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tenzing Norbu"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full bg-[#161224] border border-amber-500/30 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-amber-200 font-semibold block mb-1">
                  Designation / Role
                </label>
                <select
                  value={reporterRole}
                  onChange={(e) => setReporterRole(e.target.value as any)}
                  className="w-full bg-[#161224] border border-amber-500/30 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="Citizen">Citizen / Resident</option>
                  <option value="Aapda Mitra Volunteer">Aapda Mitra Volunteer</option>
                  <option value="Forest Guard">Forest Guard / Ranger</option>
                  <option value="Highway Patrol">Highway Patrol / BRO</option>
                  <option value="SDRF Officer">SDRF / Police Officer</option>
                </select>
              </div>
            </div>

            {/* Severity Selector */}
            <div>
              <label className="text-amber-200 font-semibold block mb-1">
                Observed Hazard Severity *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Minor Slump', val: 'Minor Slump' },
                  { label: 'Moderate Cracking', val: 'Moderate Cracking' },
                  { label: 'Severe Fissure', val: 'Severe Fissure' },
                  { label: 'Active Mudslide / Debris Flow', val: 'Active Debris Flow / Mudslide' }
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setSeverity(opt.val as any)}
                    className={`p-2 rounded-xl border text-left font-medium transition ${severity === opt.val
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                      : 'bg-[#161224] border-amber-500/20 text-slate-300 hover:border-amber-500/40'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* GPS Coordinates & Auto-Fix */}
            <div className="p-3 rounded-xl bg-[#161224] border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-amber-200 font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Geo-Tagged Coordinates
                </span>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg flex items-center gap-1 text-[11px] font-bold transition"
                >
                  {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                  <span>Auto GPS Fix</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div>
                  <span className="text-amber-200/60 block">Latitude</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(Number(e.target.value))}
                    className="w-full bg-[#0e0c15] border border-amber-500/30 rounded px-2 py-1 text-slate-200 focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <span className="text-amber-200/60 block">Longitude</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(Number(e.target.value))}
                    className="w-full bg-[#0e0c15] border border-amber-500/30 rounded px-2 py-1 text-slate-200 focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Detailed Hazard Signs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-amber-200 font-semibold block mb-1">
                  Est. Crack Width (cm)
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={crackWidthCm}
                  onChange={(e) => setCrackWidthCm(Number(e.target.value))}
                  className="w-full bg-[#161224] border border-amber-500/30 text-white rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-amber-500 font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-amber-200 font-semibold block mb-1">
                  Affected Road / Highway
                </label>
                <input
                  type="text"
                  placeholder="e.g. NH-10 near 29th Mile"
                  value={affectedRoadName}
                  onChange={(e) => setAffectedRoadName(e.target.value)}
                  className="w-full bg-[#161224] border border-amber-500/30 text-white rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap items-center gap-4 text-slate-200 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasWaterSeepage}
                  onChange={(e) => setHasWaterSeepage(e.target.checked)}
                  className="rounded bg-[#161224] border-amber-500/30 text-amber-500 focus:ring-amber-500 accent-amber-500"
                />
                <span>Muddy Water Weeping from Slope</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasRetainingWallDamage}
                  onChange={(e) => setHasRetainingWallDamage(e.target.checked)}
                  className="rounded bg-[#161224] border-amber-500/30 text-amber-500 focus:ring-amber-500 accent-amber-500"
                />
                <span>Retaining Wall Bulging / Cracking</span>
              </label>
            </div>

            {/* Detailed Description */}
            <div>
              <label className="text-amber-200 font-semibold block mb-1">
                Visual Description & Ground Context *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe crack length, tree tilting, soil slumping, or whether traffic is blocked..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#161224] border border-amber-500/30 text-white rounded-xl p-3 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* Photo Upload Attachment */}
            <div>
              <label className="text-amber-200 font-semibold block mb-1">
                Upload Ground Evidence Photo
              </label>
              <label className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-amber-500/30 hover:border-amber-500/60 bg-[#161224] cursor-pointer transition">
                <Upload className="w-5 h-5 text-amber-400 mb-1" />
                <span className="text-[11px] text-amber-200/70">
                  {photoPreview ? 'Photo attached (click to change)' : 'Click to take photo or upload image'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {photoPreview && (
                <div className="mt-2 relative rounded-lg overflow-hidden border border-amber-500/30 h-24 w-full bg-black">
                  <img src={photoPreview} alt="Preview" className="object-cover w-full h-full" />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Report...</span>
                  </>
                ) : (
                  <span>Submit Field Report</span>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
