import { DollarSign, Shield, Zap, Award, ChevronDown } from 'lucide-react';

interface DriverHeroProps {
  onStartApply: () => void;
}

export const DriverHero: React.FC<DriverHeroProps> = ({ onStartApply }) => {
  return (
    <div style={{ marginBottom: '40px' }}>
      {/* Top Banner Tag */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: 'var(--primary-light)',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }}
          />
          US Commercial Logistics Recruiting & Driver Retention Network
        </div>
      </div>

      {/* Hero Headline */}
      <div style={{ textAlign: 'center', maxWidth: '840px', margin: '0 auto 28px auto' }}>
        <h1
          style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: '16px',
            background: 'linear-gradient(180deg, #ffffff 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Drive for America's Best Fleets. Get an Extra <span style={{ background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>$1,500 Retention Bonus</span>.
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.18rem)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '680px',
            margin: '0 auto'
          }}
        >
          Apply once in 3 minutes. Record a 2-minute automated video introduction. Get matched to 40+ pre-vetted carriers with transparent pay, no recruiter spam, and guaranteed cash rewards.
        </p>
      </div>

      {/* Hero CTA & Quick Perks */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '40px', flexWrap: 'wrap' }}>
        <button onClick={onStartApply} className="btn-gold" style={{ padding: '16px 36px', fontSize: '1.05rem' }}>
          <DollarSign size={20} /> Start Express Application (Earn $1,500)
        </button>
        <a href="#how-it-works" className="btn-secondary" style={{ padding: '16px 28px', fontSize: '1.05rem' }}>
          See How It Works <ChevronDown size={18} />
        </a>
      </div>

      {/* 4 Value Pillars (Why drivers stick with us and don't bypass) */}
      <div
        id="how-it-works"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
          marginBottom: '36px'
        }}
      >
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
              marginBottom: '14px'
            }}
          >
            <DollarSign size={24} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>$1,500 90-Day Stay Bonus</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            We share the carrier placement fee with you. Stay 90 days on the job and receive a $1,500 direct cash bonus from our platform.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-light)',
              marginBottom: '14px'
            }}
          >
            <Zap size={24} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>One Application, 45+ Fleets</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            No more filling out 15 different Tenstreet or IntelliApp applications. Submit your qualifications once and let vetted carriers compete for you.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
              marginBottom: '14px'
            }}
          >
            <Shield size={24} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Zero Recruiter Spam</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Your contact details remain 100% blind until a logistics company reviews your video and signs our binding placement agreement.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc',
              marginBottom: '14px'
            }}
          >
            <Award size={24} />
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Your Personal Driver Agent</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            If a carrier fails to honor home-time or miles, our platform immediately redeploys you to another premier fleet without missing a paycheck.
          </p>
        </div>
      </div>

      {/* Live Social Proof Stats */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '20px',
          textAlign: 'center'
        }}
      >
        <div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-heading)' }}>
            1,480+
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verified CDL Drivers in Network</div>
        </div>

        <div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-heading)' }}>
            94.8%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>90-Day Retention Rate</div>
        </div>

        <div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-heading)' }}>
            $2.1M+
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Driver Retention Bonuses Paid</div>
        </div>

        <div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--primary-light)', fontFamily: 'var(--font-heading)' }}>
            48 Hours
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average Time to Carrier Match</div>
        </div>
      </div>
    </div>
  );
};
