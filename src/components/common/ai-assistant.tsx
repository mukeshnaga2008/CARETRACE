'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  ShieldAlert, 
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { SYNTHETIC_PATIENTS_DATASET } from '@/lib/data/synthetic-dashboard-data';

interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  timestamp: string;
  links?: { label: string; href: string }[];
  isBoundaryNote?: boolean;
}

const PREDEFINED_TOPICS = [
  "Where are my medications?",
  "How do I check appointments?",
  "Who is in my Care Circle?",
  "What is Care Continuity?",
  "How do I export my Care Passport?",
];

export function AIAssistant() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activePatientId, setActivePatientId] = React.useState<string>('DEMO-001');
  const [inputValue, setInputValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Sync active patient from cookie or localStorage and listen for changes
  React.useEffect(() => {
    const updatePatientFromStorage = () => {
      try {
        const match = document.cookie.match(/caretrace_active_patient=([^;]+)/);
        const saved = match ? match[1] : (typeof window !== 'undefined' ? localStorage.getItem('caretrace_active_patient') : null);
        if (saved && SYNTHETIC_PATIENTS_DATASET[saved]) {
          setActivePatientId(saved);
        }
      } catch {
        // fallback
      }
    };

    updatePatientFromStorage();

    const handlePatientChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ patientId?: string }>;
      if (customEvent.detail?.patientId && SYNTHETIC_PATIENTS_DATASET[customEvent.detail.patientId]) {
        setActivePatientId(customEvent.detail.patientId);
      } else {
        updatePatientFromStorage();
      }
    };

    window.addEventListener('caretrace_patient_changed', handlePatientChange);
    return () => window.removeEventListener('caretrace_patient_changed', handlePatientChange);
  }, []);

  const currentPatient = SYNTHETIC_PATIENTS_DATASET[activePatientId]?.patient || {
    fullName: 'Margaret Sullivan',
    patientId: 'DEMO-001',
    conditions: ['Type 2 Diabetes'],
  };

  const getWelcomeMessage = React.useCallback((name: string): ChatMessage => ({
    id: `msg-init-${name}`,
    sender: 'assistant',
    text: `Hello! I'm your CARETRACE Assistant. I can help you navigate ${name}'s care network, find medications, review doctor visits, and explain care continuity features.`,
    timestamp: 'Just now',
    links: [
      { label: 'Medications', href: '/medications' },
      { label: 'Appointments', href: '/appointments' },
      { label: 'Care Circle', href: '/care-circle' },
      { label: 'Care Passport', href: '/care-passport' },
    ],
  }), []);

  const [messages, setMessages] = React.useState<ChatMessage[]>([
    getWelcomeMessage(currentPatient.fullName),
  ]);

  // Update greeting when active patient changes
  React.useEffect(() => {
    setMessages([getWelcomeMessage(currentPatient.fullName)]);
  }, [currentPatient.fullName, getWelcomeMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: trimmed,
          patientName: currentPatient.fullName,
          patientId: activePatientId,
        }),
      });

      if (!res.ok) throw new Error('Failed response');

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        links: data.suggestedLinks,
        isBoundaryNote: data.isClinicalBoundaryNote,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      // Offline fallback response
      const fallbackMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: `I can help you navigate ${currentPatient.fullName}'s care records. You can check Medications (/medications), review doctor visits (/appointments), coordinate with Care Circle members (/care-circle), or export the Care Passport (/care-passport).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        links: [
          { label: 'Medications', href: '/medications' },
          { label: 'Care Circle', href: '/care-circle' },
          { label: 'Care Passport', href: '/care-passport' },
        ],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleResetChat = () => {
    setMessages([getWelcomeMessage(currentPatient.fullName)]);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <aside aria-label="CARETRACE AI Assistant" className="fixed bottom-20 sm:bottom-6 right-6 z-40 no-print">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Open CARETRACE AI Navigation Assistant"
          className={cn(
            "h-14 w-14 rounded-full flex items-center justify-center shadow-elevated transition-transform transform active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-secondary touch-target-elder",
            isOpen
              ? "bg-slate-800 text-white dark:bg-slate-700"
              : "bg-primary text-white hover:bg-primary-hover hover:scale-105"
          )}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <div className="relative">
              <Bot className="h-7 w-7" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
              </span>
            </div>
          )}
        </button>
      </aside>

      {/* Floating Chat Modal Panel - Solid 100% Opaque, Zero Dashboard Bleed-Through */}
      {isOpen && (
        <section
          role="dialog"
          aria-label="CARETRACE AI Navigation Assistant"
          className="fixed bottom-24 sm:bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-h-[580px] h-[520px] rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl z-[9999] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 no-print ring-1 ring-black/10 isolate"
          style={{ backgroundColor: '#ffffff', opacity: 1 }}
        >
          {/* Header */}
          <div 
            className="p-3.5 bg-primary text-white flex items-center justify-between shrink-0 border-b border-primary-hover"
            style={{ backgroundColor: '#0D47A1' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm leading-tight text-white">
                  <span>CARETRACE Assistant</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-white/20 text-white rounded border border-white/30 font-semibold">
                    AI Guide
                  </span>
                </div>
                <p className="text-[11px] text-teal-100/90">Navigation & Care Guidance &bull; {currentPatient.fullName.split(' ')[0]}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white">
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                title="Close assistant"
                aria-label="Close assistant"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Safety Clinical Disclaimer */}
          <div 
            className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/70 border-b border-amber-200 dark:border-amber-800/40 flex items-start gap-2 text-[10px] text-amber-900 dark:text-amber-200 shrink-0"
            style={{ backgroundColor: '#fffbeb' }}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-tight">
              <strong>Clinical Boundary:</strong> Care navigation assistant, not a doctor. Cannot diagnose or alter prescriptions.
            </p>
          </div>

          {/* Messages Container */}
          <div 
            className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#F8FAF9] dark:bg-slate-950 scrollbar-thin"
            style={{ backgroundColor: '#F8FAF9' }}
          >
            {messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col text-xs leading-relaxed max-w-[88%]",
                    isAssistant ? "items-start mr-auto" : "items-end ml-auto"
                  )}
                >
                  <div
                    className={cn(
                      "p-3 rounded-2xl shadow-sm text-left",
                      isAssistant
                        ? msg.isBoundaryNote
                          ? "bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-900 text-red-900 dark:text-red-200"
                          : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm border border-slate-200 dark:border-slate-700"
                        : "bg-primary text-white rounded-tr-sm"
                    )}
                    style={isAssistant && !msg.isBoundaryNote ? { backgroundColor: '#ffffff' } : undefined}
                  >
                    <p>{msg.text}</p>

                    {msg.links && msg.links.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap gap-1.5">
                        {msg.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 text-primary dark:text-teal-300 font-semibold text-[11px] hover:bg-mint dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
                          >
                            <span>{link.label}</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-mutedText mt-0.5 px-1">{msg.timestamp}</span>
                </div>
              );
            })}

            {isLoading && (
              <div 
                className="flex items-center gap-1.5 text-xs text-secondaryText p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-fit"
                style={{ backgroundColor: '#ffffff' }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-bounce delay-100" />
                <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-bounce delay-200" />
                <span className="text-[11px] ml-1">Analyzing care query...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Predefined Topic Prompts */}
          <div 
            className="px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0"
            style={{ backgroundColor: '#ffffff' }}
          >
            <span className="text-[10px] font-bold text-mutedText uppercase tracking-wider block mb-1">
              Suggested Queries:
            </span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {PREDEFINED_TOPICS.map((topic, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(topic)}
                  className="px-2 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap bg-slate-50 dark:bg-slate-800 text-secondaryText hover:text-primary dark:hover:text-teal-300 border border-slate-200 dark:border-slate-700 hover:border-secondary transition-colors shrink-0"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box Form */}
          <form
            onSubmit={handleFormSubmit}
            className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 shrink-0"
            style={{ backgroundColor: '#ffffff' }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Ask about ${currentPatient.fullName.split(' ')[0]}'s care, meds, visits...`}
              className="flex-1 h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-main placeholder:text-mutedText focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white dark:focus:bg-slate-800"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="h-9 w-9 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-hover disabled:opacity-40 transition-all shrink-0"
              aria-label="Send query"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
