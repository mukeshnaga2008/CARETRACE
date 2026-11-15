'use client';

import * as React from 'react';
import { 
  Type, 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  Eye, 
  Settings2,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface AccessibilitySettings {
  fontSize: 'standard' | 'large' | 'extra_large';
  highContrast: boolean;
  voiceReadout: boolean;
}

export function AccessibilityToolbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [settings, setSettings] = React.useState<AccessibilitySettings>({
    fontSize: 'large',
    highContrast: false,
    voiceReadout: true,
  });

  // Apply settings to document body
  React.useEffect(() => {
    const saved = localStorage.getItem('caretrace_a11y');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        applySettings(parsed);
      } catch (e) {
        console.error('Failed to parse a11y preferences', e);
      }
    } else {
      applySettings(settings);
    }
  }, []);

  const applySettings = (s: AccessibilitySettings) => {
    if (typeof document === 'undefined') return;
    const body = document.body;

    // Font scaling
    body.classList.remove('font-scale-standard', 'font-scale-large', 'font-scale-extra-large');
    body.classList.add(`font-scale-${s.fontSize}`);

    // High contrast
    if (s.highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    val: AccessibilitySettings[K]
  ) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    applySettings(updated);
    localStorage.setItem('caretrace_a11y', JSON.stringify(updated));
  };

  const handleSpeechReadout = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower, clear cadence for elder comprehension
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Elder Accessibility Controls"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-subtleBorder bg-white text-secondaryText hover:text-primary hover:border-secondary transition-colors text-xs font-semibold focus-visible:ring-2 focus-visible:ring-secondary touch-target-min"
      >
        <Eye className="h-4 w-4 text-secondary" aria-hidden="true" />
        <span className="hidden sm:inline">Accessibility</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Accessibility Settings"
          className="absolute right-0 mt-2 w-72 rounded-2xl border border-subtleBorder bg-white p-4 shadow-elevated z-50 animate-in fade-in zoom-in-95 duration-150 text-left"
        >
          <div className="flex items-center justify-between pb-3 border-b border-subtleBorder">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <h4 className="font-bold text-sm text-main">Elder Accessibility</h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-secondaryText hover:text-main"
            >
              Done
            </button>
          </div>

          <div className="py-3 space-y-4">
            {/* Font Size Tier */}
            <div>
              <span className="block text-xs font-semibold text-secondaryText mb-2">
                Reading Text Size
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'standard', label: 'Regular (A)' },
                  { id: 'large', label: 'Large (A+)' },
                  { id: 'extra_large', label: 'Max (A++)' },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => updateSetting('fontSize', tier.id as any)}
                    className={cn(
                      'py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-center',
                      settings.fontSize === tier.id
                        ? 'bg-mint text-primary border-primary'
                        : 'border-subtleBorder text-secondaryText hover:bg-canvas-subtle'
                    )}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="block text-xs font-semibold text-main">High Contrast</span>
                <span className="text-[11px] text-secondaryText">Enhanced edge definition</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.highContrast}
                onClick={() => updateSetting('highContrast', !settings.highContrast)}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors',
                  settings.highContrast ? 'bg-primary' : 'bg-strongBorder'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
                    settings.highContrast ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {/* Voice Readout Test */}
            <div className="pt-2 border-t border-subtleBorder">
              <button
                type="button"
                onClick={() => handleSpeechReadout("Welcome to Care Trace. Today is Sunday, November 15. All your morning medications have been taken on schedule.")}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-mint text-primary text-xs font-bold hover:bg-mint-hover transition-colors"
              >
                <Volume2 className="h-4 w-4" />
                Listen to Daily Schedule (Voice)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
