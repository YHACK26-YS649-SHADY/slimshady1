import React, { useState } from 'react';
import {
  Volume2,
  PhoneCall,
  Share2,
  MapPin,
  Check,
  Home,
  Search,
  Phone,
  Copy,
  VolumeX,
  ArrowRight,
  ShieldCheck,
  Navigation
} from 'lucide-react';
import type {
  ZoneWithRisk,
  EarlyWarningAlert
} from '../../types';

interface PublicCommunityPortalProps {
  zones: ZoneWithRisk[];
  alerts: EarlyWarningAlert[];
  selectedLanguage: 'en' | 'hi' | 'as' | 'kha' | 'mz' | 'bn';
  onOpenReportModal: () => void;
  onSelectZone: (zoneId: string) => void;
}

export const PublicCommunityPortal: React.FC<PublicCommunityPortalProps> = ({
  zones,
  alerts,
  selectedLanguage,
  onOpenReportModal,
  onSelectZone
}) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string>(zones[0]?.zone?.id || 'ner-sk-01');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    bag: false,
    phone: true,
    shelter: false,
    docs: false
  });

  const activeZone = zones.find(z => z.zone?.id === selectedZoneId) || zones[0] || null;
  const activeAlert = alerts.find(a => a.zoneId === selectedZoneId);

  // States list for quick state filter buttons
  const stateList = ['all', 'Sikkim', 'Meghalaya', 'Mizoram', 'Nagaland', 'Arunachal Pradesh', 'Assam', 'Manipur', 'Tripura'];

  // Quick select popular hill stations
  const popularTowns = [
    { name: 'Gangtok', id: 'ner-sk-01' },
    { name: 'Shillong', id: 'ner-ml-01' },
    { name: 'Aizawl', id: 'ner-mz-01' },
    { name: 'Kohima', id: 'ner-nl-01' },
    { name: 'Itanagar', id: 'ner-ar-01' },
    { name: 'Haflong', id: 'ner-as-01' },
    { name: 'Darjeeling', id: 'ner-wb-01' }
  ];

  // Multilingual text dictionary for community safety
  const langLabels = {
    en: {
      selectArea: "Search or Select Your Hill Area / District:",
      currentStatus: "Current Slope & Weather Safety",
      emergencyActions: "What You Should Do Right Now",
      audioBroadcast: "Play Voice Safety Announcement",
      audioPlaying: "Playing Audio...",
      helplines: "24x7 Emergency Helplines",
      shelters: "Safe Relief Shelters Near You",
      shareAlert: "Share Warning to WhatsApp Group",
      copied: "Alert Copied to Clipboard!",
      reportBtn: "Report Mudslide or Ground Crack",
      safeStatus: "Safe & Stable Conditions",
      safeDesc: "Weather is calm. Slopes are dry and stable. Safe for outdoor travel.",
      warningStatus: "Warning: High Landslide Threat",
      warningDesc: "Saturated soil and continuous rain detected. Stay away from steep road cuts.",
      criticalStatus: "RED ALERT: Imminent Slope Collapse!",
      criticalDesc: "Dangerous soil movement detected. Evacuate prone areas to safe shelters immediately!"
    },
    hi: {
      selectArea: "अपना पहाड़ी क्षेत्र या जिला चुनें:",
      currentStatus: "वर्तमान सुरक्षा और मौसम स्थिति",
      emergencyActions: "सुरक्षा निर्देश और तैयारी",
      audioBroadcast: "ध्वनि चेतावनी सुनें",
      audioPlaying: "चेतावनी चल रही है...",
      helplines: "24x7 आपातकालीन हेल्पलाइन",
      shelters: "आपके निकटतम सुरक्षित राहत शिविर",
      shareAlert: "व्हाट्सएप ग्रुप पर चेतावनी भेजें",
      copied: "कॉपी हो गया!",
      reportBtn: "भूस्खलन या दरार की सूचना दें",
      safeStatus: "सुरक्षित स्थिति — कोई खतरा नहीं",
      safeDesc: "मौसम सामान्य है। पहाड़ी ढलान सुरक्षित हैं।",
      warningStatus: "चेतावनी: भूस्खलन का खतरा",
      warningDesc: "लगातार बारिश से मिट्टी कमजोर हो रही है। सतर्क रहें।",
      criticalStatus: "रेड अलर्ट: तुरंत सुरक्षित स्थान पर जाएं!",
      criticalDesc: "ढलान खिसकने की अत्यधिक संभावना। तुरंत राहत शिविर में जाएं!"
    },
    as: {
      selectArea: "আপোনাৰ পাহাৰীয়া অঞ্চল বা জিলা বাছনি কৰক:",
      currentStatus: "বৰ্তমান সুৰক্ষা আৰু বতৰৰ অৱস্থা",
      emergencyActions: "জনসাধাৰণৰ সুৰক্ষা নিৰ্দেশনা",
      audioBroadcast: "ধ্বনি সতৰ্কবাণী শুনক",
      audioPlaying: "শব্দ বাজি আছে...",
      helplines: "২৪x৭ জৰুৰীকালীন হেল্পলাইন",
      shelters: "নিকটৱৰ্তী সুৰক্ষিত আশ্ৰয় শিবিৰ",
      shareAlert: "হোৱাটছএপত সতৰ্কবাণী প্ৰেৰণ কৰক",
      copied: "কপি কৰা হ'ল!",
      reportBtn: "ফাট বা ভূমিস্খলনৰ খবৰ দিয়ক",
      safeStatus: "স্বাভাৱিক অৱস্থা — কোনো শংকা নাই",
      safeDesc: "বতৰ শান্ত আৰু পাহাৰৰ অৱস্থা সুৰক্ষিত।",
      warningStatus: "সাৱধানবাণী: ভূমিস্খলনৰ সম্ভাৱনা",
      warningDesc: "প্ৰৱল বৰষুণৰ বাবে সতৰ্ক থাকক।",
      criticalStatus: "ৰেড এলাৰ্ট: আশ্ৰয় শিবিৰলৈ প্ৰস্থান কৰক!",
      criticalDesc: "ভূমিস্খলনৰ প্ৰৱল আশংকা। পলম নকৰি সুৰক্ষিত আশ্ৰয়লৈ যাওক!"
    },
    kha: {
      selectArea: "Jied ia ka jaka shnong jong phi:",
      currentStatus: "Ka Kyrdan Jingma na ka Jingkhyllem Khndew",
      emergencyActions: "Ki Jingbthah ia ka Shnong",
      audioBroadcast: "Sngap ia ka Jingmaham",
      audioPlaying: "Dang pynsngap...",
      helplines: "Emergency Helplines (24x7)",
      shelters: "Ki Jaka Ri Tngen ba Shngain",
      shareAlert: "Phah sha WhatsApp Group",
      copied: "La copy!",
      reportBtn: "Ai khubor lada don jingpep khndew",
      safeStatus: "Shngain — Normal",
      safeDesc: "Ka khyndew ka shngain.",
      warningStatus: "JINGMAHAM: Don ka jingma ba khraw",
      warningDesc: "Shongthait na ki jaka khongdong lum.",
      criticalStatus: "JINGMAHAM BASA: Kynriah mardor sha jaka shngain!",
      criticalDesc: "Ka khyndew ka lah ban khyllem mardor!"
    },
    mz: {
      selectArea: "I awmna Veng / Tlang hmun thlang rawh:",
      currentStatus: "Leitlah Theihna Hlauhawm Dinhmun",
      emergencyActions: "Khawtlang Himna Thuchhuah",
      audioBroadcast: "Thuchhuah Aw Ngaithla Rawh",
      audioPlaying: "Thuchhuah a ri e...",
      helplines: "Emergency Helplines (24x7)",
      shelters: "Himna Hmun / Relief Camp",
      shareAlert: "WhatsApp Group-ah thawn rawh",
      copied: "Copy a ni tawh e!",
      reportBtn: "Leitlah / Khi hriattirna siam rawh",
      safeStatus: "Him Dinhmun — Hlauhthawnna a awm lo",
      safeDesc: "Sik leh sa a tha a, tlang a him tawk e.",
      warningStatus: "FIMKHUR RAWH: Leitlah a hlauhawm",
      warningDesc: "Ruah a sur nasat avangin kawngpui kam leh tlangpang fimkhur rawh.",
      criticalStatus: "HLUAHAWM LUTUK: Himna hmunah insuan rawh!",
      criticalDesc: "Leitlah a thlen dawn hnaih avangin insuan nghal rawh!"
    },
    bn: {
      selectArea: "আপনার পাহাড়ী এলাকা বা জেলা নির্বাচন করুন:",
      currentStatus: "বর্তমান ভূমিধস ও আবহাওয়ার নিরাপত্তা",
      emergencyActions: "আপনার করণীয় নির্দেশাবলী",
      audioBroadcast: "সতর্কবার্তা শুনুন (অডিও)",
      audioPlaying: "অডিও চলছে...",
      helplines: "২৪x৭ জরুরী হেল্পলাইন",
      shelters: "নিকটবর্তী নিরাপদ আশ্রয়কেন্দ্র",
      shareAlert: "হোয়াটসঅ্যাপে সতর্কতা শেয়ার করুন",
      copied: "কপি হয়েছে!",
      reportBtn: "ভূমিধস বা ফাটলের তথ্য দিন",
      safeStatus: "নিরাপদ অবস্থা — কোনো বিপদ নেই",
      safeDesc: "আবহাওয়া শান্ত এবং পাহাড়ের মাটি স্থিতিশীল।",
      warningStatus: "সতর্কতা: ভূমিধসের সম্ভাবনা রয়েছে",
      warningDesc: "ভারী বৃষ্টির কারণে পাহাড়ি রাস্তা এড়িয়ে চলুন।",
      criticalStatus: "রেড অ্যালার্ট: নিরাপদ আশ্রয়ে যান!",
      criticalDesc: "ভূমিধসের প্রবল সম্ভাবনা! দ্রুত নিরাপদ আশ্রয়ে যান।"
    }
  };

  const t = langLabels[selectedLanguage] || langLabels.en;

  const handleZoneSelect = (id: string) => {
    setSelectedZoneId(id);
    onSelectZone(id);
  };

  const filteredZones = zones.filter(item => {
    const matchesState = selectedStateFilter === 'all' || item.zone?.state.toLowerCase().includes(selectedStateFilter.toLowerCase());
    const matchesSearch = !searchQuery || 
      item.zone?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.zone?.district.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesState && matchesSearch;
  });

  const riskScore = activeZone?.risk?.riskScore || 20;
  const riskLevel = activeZone?.risk?.riskLevel || 'Low';
  const rain24h = activeZone?.weather?.current?.rainfall_24h_mm || 0;
  const soilPct = activeZone?.risk?.simulatedSoilMoisturePct || 45;

  // Text-To-Speech Audio Voice Playback
  const handleToggleVoice = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        const textToSpeak = activeAlert?.multilingual?.[selectedLanguage]?.body || 
          `${activeZone?.zone?.name}, ${activeZone?.zone?.state}. Current risk is ${riskLevel}. ${riskLevel === 'Critical' ? t.criticalDesc : riskLevel === 'High' ? t.warningDesc : t.safeDesc}`;
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        
        if (selectedLanguage === 'hi') utterance.lang = 'hi-IN';
        else if (selectedLanguage === 'bn') utterance.lang = 'bn-IN';
        else utterance.lang = 'en-US';

        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);

        setIsPlayingAudio(true);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      alert("Audio speech synthesis is not supported on this browser.");
    }
  };

  const handleShareWhatsApp = () => {
    const text = `🚨 *DisManager Disaster Alert* 🚨\n📍 Location: *${activeZone?.zone?.name} (${activeZone?.zone?.state})*\n⚠️ Risk Level: *${riskLevel.toUpperCase()}* (${riskScore}%)\n🌧️ 24h Rainfall: *${rain24h.toFixed(1)} mm*\n💧 Soil Saturation: *${soilPct}%*\n\n📋 *Instruction:* ${riskLevel === 'Critical' ? t.criticalDesc : t.warningDesc}\n\nCheck live updates: ${window.location.href}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
    }
    
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyPhone = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const completedChecklistCount = Object.values(checklist).filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* 1. Top Search & Quick District Selector with State Filter Tabs */}
      <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950/90 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-400" />
            <h2 className="font-heading font-extrabold text-base text-white">
              {t.selectArea}
            </h2>
          </div>
          <span className="text-xs text-slate-300">
            Viewing: <strong className="text-emerald-300">{activeZone?.zone?.name}</strong> ({activeZone?.zone?.state})
          </span>
        </div>

        {/* State Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {stateList.map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStateFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedStateFilter === st
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
              }`}
            >
              {st === 'all' ? 'All NER States' : st}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Type district, town or area name to filter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Dropdown with filtered zones */}
        <div className="relative">
          <select
            value={selectedZoneId}
            onChange={(e) => handleZoneSelect(e.target.value)}
            className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
          >
            {filteredZones.map(z => (
              <option key={z.zone?.id} value={z.zone?.id} className="bg-slate-900 text-slate-100">
                {z.zone?.name} — {z.zone?.district}, {z.zone?.state} (Risk: {z.risk?.riskLevel || 'Normal'} {z.risk?.riskScore || 0}%)
              </option>
            ))}
          </select>
        </div>

        {/* Quick select popular hill stations */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-xs text-slate-400 font-medium mr-1">Quick Jump:</span>
          {popularTowns.map(town => (
            <button
              key={town.id}
              onClick={() => handleZoneSelect(town.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                selectedZoneId === town.id
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>{town.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Visual Safety Card */}
      <div className={`glass-panel p-6 rounded-3xl border shadow-2xl transition-all duration-300 ${
        riskLevel === 'Critical'
          ? 'bg-gradient-to-br from-red-950/60 via-slate-900/90 to-slate-950 border-red-500/60 shadow-red-500/10'
          : riskLevel === 'High'
          ? 'bg-gradient-to-br from-amber-950/50 via-slate-900/90 to-slate-950 border-amber-500/50 shadow-amber-500/10'
          : 'bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950 border-emerald-500/40 shadow-emerald-500/10'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Left: Big Risk Gauge Visual */}
          <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Circular Meter Ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="text-slate-800 stroke-current"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className={`transition-all duration-1000 stroke-current ${
                    riskLevel === 'Critical'
                      ? 'text-red-500'
                      : riskLevel === 'High'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * Math.min(100, Math.max(10, riskScore))) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Center Risk Value */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading font-black text-3xl text-white">
                  {riskScore}%
                </span>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  riskLevel === 'Critical' ? 'text-red-400' : riskLevel === 'High' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {riskLevel} Risk
                </span>
              </div>
            </div>

            {/* Plain English Status Pill */}
            <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/60 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${
                riskLevel === 'Critical' ? 'bg-red-500 animate-ping' : riskLevel === 'High' ? 'bg-amber-400' : 'bg-emerald-400'
              }`} />
              <span className="font-semibold text-slate-200">
                {riskLevel === 'Critical' ? 'Danger: High Alert' : riskLevel === 'High' ? 'Caution Needed' : 'Safe to Travel'}
              </span>
            </div>
          </div>

          {/* Right: Plain-English Meaning & Local Advice */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-2xl text-white">
                  {activeZone?.zone?.name}
                </h3>
                <span className="text-xs text-slate-400 font-medium">({activeZone?.zone?.state})</span>
              </div>
              <p className="text-sm font-semibold text-emerald-300 mt-1">
                {riskLevel === 'Critical' ? t.criticalStatus : riskLevel === 'High' ? t.warningStatus : t.safeStatus}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
                {riskLevel === 'Critical' ? t.criticalDesc : riskLevel === 'High' ? t.warningDesc : t.safeDesc}
              </p>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] text-slate-400">Past 24h Rain</div>
                <div className="font-data font-bold text-sky-400 text-sm mt-0.5">
                  {rain24h.toFixed(1)} mm
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] text-slate-400">Soil Wetness</div>
                <div className="font-data font-bold text-amber-400 text-sm mt-0.5">
                  {soilPct}%
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] text-slate-400">Safety Status</div>
                <div className={`font-data font-bold text-sm mt-0.5 ${
                  riskLevel === 'Critical' ? 'text-red-400' : riskLevel === 'High' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {riskLevel === 'Critical' ? 'Evacuate' : riskLevel === 'High' ? 'Watch' : 'Stable'}
                </div>
              </div>
            </div>

            {/* Action Buttons: Voice Warning & WhatsApp Broadcast */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                onClick={handleToggleVoice}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  isPlayingAudio
                    ? 'bg-amber-500 text-slate-950 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                <span>{isPlayingAudio ? t.audioPlaying : t.audioBroadcast}</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="px-4 py-2 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>{copiedShare ? t.copied : t.shareAlert}</span>
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* 3. Emergency Safety Checklist & Preparedness */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Safety Checklist Card with Progress */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-heading font-bold text-sm text-white">
                {t.emergencyActions}
              </h3>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {completedChecklistCount}/4 Completed
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Check off steps as you prepare your household:
          </p>

          <div className="space-y-2 text-xs">
            <label className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/50 border border-slate-800/80 cursor-pointer hover:bg-slate-950 transition">
              <input
                type="checkbox"
                checked={checklist.bag}
                onChange={(e) => setChecklist({ ...checklist, bag: e.target.checked })}
                className="mt-0.5 rounded text-emerald-500 focus:ring-0 cursor-pointer"
              />
              <span className={checklist.bag ? 'line-through text-slate-500' : 'text-slate-200'}>
                <strong>Emergency Go-Bag:</strong> Pack drinking water, torch, first aid, and copies of IDs in a waterproof bag.
              </span>
            </label>

            <label className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/50 border border-slate-800/80 cursor-pointer hover:bg-slate-950 transition">
              <input
                type="checkbox"
                checked={checklist.phone}
                onChange={(e) => setChecklist({ ...checklist, phone: e.target.checked })}
                className="mt-0.5 rounded text-emerald-500 focus:ring-0 cursor-pointer"
              />
              <span className={checklist.phone ? 'line-through text-slate-500' : 'text-slate-200'}>
                <strong>Charge Mobile Phones & Power Banks:</strong> Ensure radios and communication devices are charged.
              </span>
            </label>

            <label className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/50 border border-slate-800/80 cursor-pointer hover:bg-slate-950 transition">
              <input
                type="checkbox"
                checked={checklist.shelter}
                onChange={(e) => setChecklist({ ...checklist, shelter: e.target.checked })}
                className="mt-0.5 rounded text-emerald-500 focus:ring-0 cursor-pointer"
              />
              <span className={checklist.shelter ? 'line-through text-slate-500' : 'text-slate-200'}>
                <strong>Locate Evacuation Route:</strong> Know the safest high-ground path to your nearest relief camp.
              </span>
            </label>

            <label className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/50 border border-slate-800/80 cursor-pointer hover:bg-slate-950 transition">
              <input
                type="checkbox"
                checked={checklist.docs}
                onChange={(e) => setChecklist({ ...checklist, docs: e.target.checked })}
                className="mt-0.5 rounded text-emerald-500 focus:ring-0 cursor-pointer"
              />
              <span className={checklist.docs ? 'line-through text-slate-500' : 'text-slate-200'}>
                <strong>Family Communication Plan:</strong> Agree on a safe meeting point if family members get separated.
              </span>
            </label>
          </div>
        </div>

        {/* 24x7 Emergency Helplines with 1-Click Call/Copy */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-sky-400" />
            <h3 className="font-heading font-bold text-sm text-white">
              {t.helplines}
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Toll-free emergency numbers available 24 hours every day:
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">National Disaster (NDMA)</span>
                <div className="font-heading font-extrabold text-lg text-emerald-400">1078</div>
              </div>
              <button
                onClick={() => handleCopyPhone('1078')}
                className="mt-2 text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedNumber === '1078' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedNumber === '1078' ? 'Copied' : 'Copy Number'}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">State Disaster (SDRF)</span>
                <div className="font-heading font-extrabold text-lg text-sky-400">112</div>
              </div>
              <button
                onClick={() => handleCopyPhone('112')}
                className="mt-2 text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedNumber === '112' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedNumber === '112' ? 'Copied' : 'Copy Number'}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Ambulance & Medical</span>
                <div className="font-heading font-extrabold text-lg text-rose-400">108</div>
              </div>
              <button
                onClick={() => handleCopyPhone('108')}
                className="mt-2 text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedNumber === '108' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedNumber === '108' ? 'Copied' : 'Copy Number'}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Fire & Rescue</span>
                <div className="font-heading font-extrabold text-lg text-amber-400">101</div>
              </div>
              <button
                onClick={() => handleCopyPhone('101')}
                className="mt-2 text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedNumber === '101' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedNumber === '101' ? 'Copied' : 'Copy Number'}</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* 4. Designated Safe Relief Shelters for the Selected Zone */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-emerald-400" />
            <h3 className="font-heading font-bold text-sm text-white">
              {t.shelters} in {activeZone?.zone?.name}
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Official NDMA/SDMA Relief Facilities
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {(activeZone?.zone?.designated_shelters || [
            { name: "Community Hall & Relief Center", capacity: 450, phone: "03592-202742", address: "Upper Ridge Road, Safe Zone A" },
            { name: "Government Higher Secondary School", capacity: 800, phone: "03592-202111", address: "Main Bazaar High Grounds" },
            { name: "District Sports Stadium Indoor Hall", capacity: 1200, phone: "03592-203344", address: "Valley Ring Road" }
          ]).map((shelter, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{shelter.name}</span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">{shelter.address}</p>
              <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
                <span>Cap: <strong>{shelter.capacity} people</strong></span>
                <a
                  href={`tel:${shelter.phone}`}
                  className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call Shelter</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Crowdsource Citizen Reporting Callout */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-sky-950/60 border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="font-heading font-extrabold text-base text-white">
            See mud movement, fallen boulders, or ground cracks?
          </h4>
          <p className="text-xs text-slate-300 max-w-xl">
            Help protect your neighbors. Submit a quick field report with photos or GPS location. Works seamlessly even in offline or low-connectivity mountain areas!
          </p>
        </div>
        <button
          onClick={onOpenReportModal}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 flex-shrink-0 transition cursor-pointer"
        >
          <span>{t.reportBtn}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
