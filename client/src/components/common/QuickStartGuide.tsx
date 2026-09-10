import React, { useState } from 'react';
import { 
  Compass, 
  MapPin, 
  PhoneCall, 
  Sliders, 
  Camera, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  X,
  Sparkles,
  Users,
  ShieldCheck
} from 'lucide-react';

interface QuickStartGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole?: (role: 'community' | 'authority') => void;
}

export const QuickStartGuide: React.FC<QuickStartGuideProps> = ({
  isOpen,
  onClose,
  onSelectRole
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      badge: "Step 1 of 4",
      title: "Welcome to DisManager! 🌿",
      subtitle: "Your early-warning safety radar for landslides & heavy rain across North Eastern India.",
      icon: Compass,
      color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            DisManager monitors <strong>18 high-risk hill sectors</strong> across Sikkim, Meghalaya, Assam, Mizoram, Nagaland, and Arunachal Pradesh using live weather radar and terrain physics.
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-400 mb-1"></span>
              <div className="font-bold text-emerald-300">Green (0-40%)</div>
              <div className="text-[11px] text-slate-400">Safe & Stable</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30">
              <span className="inline-block w-3 h-3 rounded-full bg-amber-400 mb-1"></span>
              <div className="font-bold text-amber-300">Yellow (40-70%)</div>
              <div className="text-[11px] text-slate-400">Watch Out</div>
            </div>
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30">
              <span className="inline-block w-3 h-3 rounded-full bg-red-400 mb-1"></span>
              <div className="font-bold text-red-300">Red (70-100%)</div>
              <div className="text-[11px] text-slate-400">Evacuate / Alert</div>
            </div>
          </div>
        </div>
      )
    },
    {
      badge: "Step 2 of 4",
      title: "Check Your Local District 🔍",
      subtitle: "Quickly find out if your town, village, or highway is at risk.",
      icon: MapPin,
      color: "from-sky-500/20 to-blue-500/20 border-sky-500/40 text-sky-400",
      content: (
        <div className="space-y-3 text-sm text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Easy 1-Click Search:</span>
            </div>
            <p className="text-xs text-slate-300">
              Select your city (e.g. <em>Gangtok, Shillong, Aizawl, Kohima</em>) from the top search bar to view:
            </p>
            <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-300">
              <li><strong>Current Risk Score</strong> in plain English</li>
              <li><strong>Rainfall in last 24 hours</strong> & slope moisture</li>
              <li><strong>Designated Relief Shelters</strong> near you with contact numbers</li>
              <li><strong>Local Voice Broadcast</strong> in your regional language</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      badge: "Step 3 of 4",
      title: "Interactive Rain Simulator 🌧️",
      subtitle: "See how heavy rainfall changes landslide threats in real-time.",
      icon: Sliders,
      color: "from-indigo-500/20 to-purple-500/20 border-indigo-500/40 text-indigo-400",
      content: (
        <div className="space-y-3 text-sm text-slate-300">
          <p>
            Curious what happens if a sudden cloudburst hits your hill area? DisManager has a built-in <strong>What-If Simulation Sandbox</strong>.
          </p>
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>How to use the Simulator:</span>
            </div>
            <p className="text-xs text-slate-300">
              1. Choose a zone.<br />
              2. Drag the rainfall slider from <strong>0mm (Normal)</strong> to <strong>200mm+ (Extreme Storm)</strong>.<br />
              3. Click <strong>"Run Simulation"</strong> to watch the AI recalculate soil stability and road blockages!
            </p>
          </div>
        </div>
      )
    },
    {
      badge: "Step 4 of 4",
      title: "Crowdsource Reports & Helplines 📢",
      subtitle: "Report danger to help your community, or get instant emergency help.",
      icon: Camera,
      color: "from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-400",
      content: (
        <div className="space-y-3 text-sm text-slate-300">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Report Hazards</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Notice ground cracks or small rockfalls? Click <strong>"Report"</strong> to alert disaster officers in seconds. Works even offline!
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5 mb-1">
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>24x7 Helplines</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Direct one-tap buttons for <strong>NDMA (1078)</strong>, <strong>SDRF</strong>, <strong>Ambulance (108)</strong>, and local relief camps.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
            <span className="text-xs font-bold text-white block">Choose your starting view:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onSelectRole?.('community');
                  onClose();
                }}
                className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Citizen Mode</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectRole?.('authority');
                  onClose();
                }}
                className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Operations Desk</span>
              </button>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>You're all set! You can reopen this guide anytime from the top bar.</span>
          </div>
        </div>
      )
    }
  ];

  const current = steps[currentStep];
  const StepIcon = current.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br border shadow-md ${current.color}`}>
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {current.badge}
              </span>
              <h3 className="font-heading font-extrabold text-lg text-white mt-1">
                {current.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            title="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 flex-1">
          <p className="text-xs text-slate-400 font-medium">{current.subtitle}</p>
          {current.content}
        </div>

        {/* Step Indicator & Footer Controls */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep ? 'w-6 bg-emerald-400' : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center gap-1 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
            >
              <span>{currentStep === steps.length - 1 ? 'Start Exploring' : 'Next Tip'}</span>
              {currentStep === steps.length - 1 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
