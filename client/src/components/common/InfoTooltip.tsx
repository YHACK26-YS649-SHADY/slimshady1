import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
  title?: string;
  iconType?: 'help' | 'info';
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  text,
  title,
  iconType = 'help',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={tooltipRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-amber-300/60 hover:text-amber-400 p-0.5 rounded transition focus:outline-none"
        aria-label="More information"
      >
        {iconType === 'help' ? (
          <HelpCircle className="w-3.5 h-3.5 opacity-80 hover:opacity-100" />
        ) : (
          <Info className="w-3.5 h-3.5 opacity-80 hover:opacity-100" />
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#161224]/95 backdrop-blur-md border border-amber-500/40 text-slate-200 text-xs rounded-xl shadow-2xl z-[9999] pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          {title && (
            <div className="font-heading font-bold text-amber-400 mb-1 flex items-center gap-1.5 border-b border-amber-500/20 pb-1">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>{title}</span>
            </div>
          )}
          <p className="text-slate-200 leading-relaxed">{text}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#161224]" />
        </div>
      )}
    </div>
  );
};
