import React from 'react';
import {
  Play,
  ChevronRight,
  ChevronLeft,
  X,
  Truck,
  Users,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { TOUR_STEPS, type TourStep } from '../../data/tourSteps';

interface GuidedTourBarProps {
  isOpen: boolean;
  currentStep: number;
  onStepChange: (step: number) => void;
  onClose: () => void;
  onTriggerAction?: (step: TourStep) => void;
}

const INK = '#121315';
const DEEP = '#0c0d0f';
const AMBER = '#f0a23b';
const EMERALD = '#10b981';
const MONO = "'IBM Plex Mono', monospace";

export const GuidedTourBar: React.FC<GuidedTourBarProps> = ({
  isOpen,
  currentStep,
  onStepChange,
  onClose,
  onTriggerAction
}) => {
  const [showEconomics, setShowEconomics] = React.useState(false);

  if (!isOpen) return null;

  const currentStepData = TOUR_STEPS.find((s) => s.step === currentStep) || TOUR_STEPS[0];
  const isFirst = currentStep === 1;
  const isLast = currentStep === TOUR_STEPS.length;

  const handleNext = () => {
    if (!isLast) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <aside
      aria-label="Interactive Guided Demo Tour"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'linear-gradient(180deg, #0e1117 0%, #080a0f 100%)',
        borderBottom: `2px solid ${AMBER}`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.65)',
        color: '#f8fafc',
        fontFamily: "'Barlow', system-ui, sans-serif"
      }}
    >
      <div
        style={{
          maxWidth: 1360,
          margin: '0 auto',
          padding: '10px clamp(14px, 3vw, 32px)'
        }}
      >
        {/* Main Bar Flex Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap'
          }}
        >
          {/* Left: Brand Badge & Current Step Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                background: 'rgba(240, 162, 59, 0.16)',
                border: `1px solid ${AMBER}`,
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: '0.08em',
                fontWeight: 700,
                color: AMBER,
                textTransform: 'uppercase'
              }}
            >
              <Play size={12} fill="currentColor" />
              <span>Guided Demo Tour</span>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: EMERALD,
                  boxShadow: `0 0 8px ${EMERALD}`
                }}
              />
            </div>

            {/* 4 Step Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {TOUR_STEPS.map((s) => {
                const isActive = s.step === currentStep;
                const isPassed = s.step < currentStep;
                const Icon =
                  s.step === 1 ? Truck : s.step === 2 ? Users : s.step === 3 ? ShieldCheck : ShieldAlert;

                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => onStepChange(s.step)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 10px',
                      background: isActive
                        ? AMBER
                        : isPassed
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: isActive
                        ? `1px solid ${AMBER}`
                        : isPassed
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.12)',
                      color: isActive ? INK : isPassed ? '#34d399' : 'rgba(255, 255, 255, 0.7)',
                      fontWeight: 700,
                      fontSize: 12,
                      fontFamily: MONO,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title={s.headline}
                  >
                    <Icon size={13} />
                    <span>0{s.step}. {s.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Step Navigation Controls + Exit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setShowEconomics(!showEconomics)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 11px',
                background: showEconomics ? 'rgba(240, 162, 59, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: showEconomics ? `1px solid ${AMBER}` : '1px solid rgba(255, 255, 255, 0.15)',
                color: showEconomics ? AMBER : 'rgba(255, 255, 255, 0.8)',
                fontSize: 11,
                fontFamily: MONO,
                cursor: 'pointer'
              }}
            >
              <HelpCircle size={13} />
              <span>{showEconomics ? 'Hide Economics' : '$4,500 Economics'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrev}
              disabled={isFirst}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                background: isFirst ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: isFirst ? 'rgba(255, 255, 255, 0.3)' : '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: isFirst ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={14} />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={isLast}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 14px',
                background: isLast ? 'rgba(255, 255, 255, 0.03)' : AMBER,
                border: isLast ? '1px solid rgba(255, 255, 255, 0.15)' : `1px solid ${AMBER}`,
                color: isLast ? 'rgba(255, 255, 255, 0.3)' : INK,
                fontSize: 12,
                fontWeight: 700,
                cursor: isLast ? 'not-allowed' : 'pointer'
              }}
            >
              <span>{isLast ? 'Tour Complete' : 'Next Step'}</span>
              <ChevronRight size={14} />
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close tour"
              aria-label="Close tour"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 6,
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: 'rgba(255, 255, 255, 0.65)',
                cursor: 'pointer'
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Narrative Banner & Action Trigger for Current Step */}
        <div
          style={{
            marginTop: 8,
            padding: '10px 14px',
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap'
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: AMBER,
                  fontWeight: 700
                }}
              >
                {currentStepData.badge}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>·</span>
              <strong style={{ fontSize: 13, color: '#fff', letterSpacing: '0.01em' }}>
                {currentStepData.headline}
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.4 }}>
              {currentStepData.description}
            </p>
          </div>

          {currentStepData.actionLabel && onTriggerAction && (
            <button
              type="button"
              onClick={() => onTriggerAction(currentStepData)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 14px',
                background: 'rgba(240, 162, 59, 0.15)',
                border: `1px solid ${AMBER}`,
                color: AMBER,
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Sparkles size={14} />
              <span>{currentStepData.actionLabel}</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* Expandable Commercial Economics Breakdown */}
        {showEconomics && (
          <div
            style={{
              marginTop: 8,
              padding: '12px 16px',
              background: DEEP,
              border: '1px solid rgba(240, 162, 59, 0.35)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 14
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  color: EMERALD,
                  fontWeight: 700,
                  marginBottom: 3
                }}
              >
                DRIVER ECONOMICS
              </div>
              <div style={{ fontSize: 12, color: '#e2e8f0', lineHeight: 1.35 }}>
                {currentStepData.economics.driver}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  color: AMBER,
                  fontWeight: 700,
                  marginBottom: 3
                }}
              >
                CARRIER ECONOMICS
              </div>
              <div style={{ fontSize: 12, color: '#e2e8f0', lineHeight: 1.35 }}>
                {currentStepData.economics.carrier}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  color: '#60a5fa',
                  fontWeight: 700,
                  marginBottom: 3
                }}
              >
                HAULMATCH REVENUE & GUARANTEE
              </div>
              <div style={{ fontSize: 12, color: '#e2e8f0', lineHeight: 1.35 }}>
                {currentStepData.economics.haulmatch}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
