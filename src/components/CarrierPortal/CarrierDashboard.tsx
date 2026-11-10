import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Truck,
  RefreshCw,
  Briefcase,
  Bell,
  Bookmark,
  Plus,
  Check
} from 'lucide-react';
import type { DriverProfile, FleetJobOrder, CarrierSavedSearch } from '../../types';
import { fetchFleetJobOrders } from '../../services/supabase';
import { fetchSavedSearches, saveCarrierSearch, deleteSavedSearch } from '../../services/activityEvents';
import { DriverCard } from './DriverCard';
import { DriverModal } from './DriverModal';
import { PlacementContractModal } from './PlacementContractModal';

interface CarrierDashboardProps {
  drivers: DriverProfile[];
  onContractSigned: (driverId: string, carrierName: string, signerName?: string, signerTitle?: string) => void;
}

export const CarrierDashboard: React.FC<CarrierDashboardProps> = ({ drivers, onContractSigned }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCdlClass, setSelectedCdlClass] = useState<string>('all');
  const [selectedEndorsement, setSelectedEndorsement] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [minExp, setMinExp] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [savedSearches, setSavedSearches] = useState<CarrierSavedSearch[]>(() => fetchSavedSearches());
  const [isSavingSearch, setIsSavingSearch] = useState(false);
  const [searchNameInput, setSearchNameInput] = useState('');
  const [savedSearchNotice, setSavedSearchNotice] = useState<string | null>(null);

  const [activeDriverForDetails, setActiveDriverForDetails] = useState<DriverProfile | null>(null);
  const [activeDriverForUnlock, setActiveDriverForUnlock] = useState<DriverProfile | null>(null);
  const [jobOrders, setJobOrders] = useState<FleetJobOrder[]>([]);
  const [selectedJobOrderId, setSelectedJobOrderId] = useState<string>('none');

  useEffect(() => {
    let active = true;
    fetchFleetJobOrders()
      .then((orders) => {
        if (active) setJobOrders(orders);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const activeJobOrder = useMemo(
    () => jobOrders.find((o) => o.id === selectedJobOrderId) || null,
    [jobOrders, selectedJobOrderId]
  );

  // Filtered drivers list
  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      // Search
      const searchLower = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        driver.id.toLowerCase().includes(searchLower) ||
        driver.anonymizedTitle.toLowerCase().includes(searchLower) ||
        driver.location.city.toLowerCase().includes(searchLower) ||
        driver.location.state.toLowerCase().includes(searchLower) ||
        driver.equipment.some((eq) => eq.toLowerCase().includes(searchLower));

      // CDL Class
      const matchClass = selectedCdlClass === 'all' || driver.cdlClass === selectedCdlClass;

      // Endorsements
      const matchEndorsement =
        selectedEndorsement === 'all' || driver.endorsements.some((e) => e.includes(selectedEndorsement));

      // Equipment
      const matchEquipment =
        selectedEquipment === 'all' || driver.equipment.some((eq) => eq.includes(selectedEquipment));

      // Experience
      const matchExp = driver.yearsExperience >= minExp;

      // Status
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'available' && driver.status === 'available') ||
        (statusFilter === 'unlocked' && (driver.status === 'unlocked' || driver.status === 'placed'));

      // Active Fleet Job Order Matcher
      const matchJobOrder = !activeJobOrder
        ? true
        : driver.yearsExperience >= activeJobOrder.minExperienceYears &&
          driver.violationsLast3Yrs <= activeJobOrder.maxViolations3Years &&
          (activeJobOrder.equipmentType.length === 0 ||
            driver.equipment.some((deq) =>
              activeJobOrder.equipmentType.some(
                (oeq) =>
                  deq.toLowerCase().includes(oeq.toLowerCase().split(' ')[0]) ||
                  oeq.toLowerCase().includes(deq.toLowerCase().split(' ')[0])
              )
            ));

      return (
        matchSearch &&
        matchClass &&
        matchEndorsement &&
        matchEquipment &&
        matchExp &&
        matchStatus &&
        matchJobOrder
      );
    });
  }, [
    drivers,
    searchQuery,
    selectedCdlClass,
    selectedEndorsement,
    selectedEquipment,
    minExp,
    statusFilter,
    activeJobOrder
  ]);

  const handleApplySavedSearch = (ss: CarrierSavedSearch) => {
    if (ss.cdlClass) setSelectedCdlClass(ss.cdlClass);
    if (ss.equipment) setSelectedEquipment(ss.equipment);
    if (typeof ss.minExperience === 'number') setMinExp(ss.minExperience);
    if (ss.zip) setSearchQuery(ss.zip);
    setSavedSearchNotice(`Applied preset: ${ss.label}`);
    setTimeout(() => setSavedSearchNotice(null), 3000);
  };

  const handleSaveCurrentSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchNameInput.trim()) return;
    const newSearch = saveCarrierSearch(searchNameInput.trim(), {
      cdlClass: selectedCdlClass !== 'all' ? selectedCdlClass : undefined,
      equipment: selectedEquipment !== 'all' ? selectedEquipment : undefined,
      minExperience: minExp > 0 ? minExp : undefined,
      zip: searchQuery.trim() || undefined
    });
    setSavedSearches(fetchSavedSearches());
    setIsSavingSearch(false);
    setSearchNameInput('');
    setSavedSearchNotice(`Alert saved: "${newSearch.label}"! Daily SMS & email notifications active.`);
    setTimeout(() => setSavedSearchNotice(null), 4000);
  };

  const handleDeleteSavedSearch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSavedSearch(id);
    setSavedSearches(fetchSavedSearches());
  };

  const activeCount = drivers.filter((d) => d.status === 'available').length;
  const unlockedCount = drivers.filter((d) => d.status === 'unlocked' || d.status === 'placed').length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Top Carrier Stats Banner — bold ink block */}
      <motion.div
        className="hero-block"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          padding: '28px 32px',
          marginBottom: '28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '24px',
          alignItems: 'center'
        }}
      >
        <div>
          <div className="section-eyebrow" style={{ color: 'var(--road-amber)' }}>Carrier Talent Pool</div>
          <h2 className="display-heading" style={{ fontSize: '1.9rem', color: '#ffffff', margin: '6px 0 4px' }}>
            Pre-Screened CDL Marketplace
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Video-interviewed, DOT DQ verified, ready for immediate orientation.
          </p>
        </div>

        <div className="hm-stat-border-col" style={{ borderLeft: '1px solid rgba(255,255,255,0.14)', paddingLeft: '20px' }}>
          <div className="stat-value" style={{ color: '#ffffff' }}>
            {activeCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
            Active Drivers · {unlockedCount} Unlocked under Contract
          </div>
        </div>

        <div className="hm-stat-border-col" style={{ borderLeft: '1px solid rgba(255,255,255,0.14)', paddingLeft: '20px' }}>
          <div className="stat-value" style={{ color: '#34d399' }}>
            90-Day
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
            Guarantee · 100% Free Replacement Warranty
          </div>
        </div>

        <div className="hm-stat-border-col" style={{ borderLeft: '1px solid rgba(255,255,255,0.14)', paddingLeft: '20px' }}>
          <div className="stat-value" style={{ color: 'var(--road-amber)' }}>
            $1,500
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
            Driver Bonus · Ensures 90-day driver retention
          </div>
        </div>
      </motion.div>

      {/* Filter and Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ flex: 2, minWidth: '240px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by ID, State (TX, OH, GA), Reefer, Flatbed, Hazmat..."
              className="form-input"
              style={{ paddingLeft: '40px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* CDL Class */}
          <select
            className="form-select"
            style={{ flex: 1, minWidth: '140px' }}
            value={selectedCdlClass}
            onChange={(e) => setSelectedCdlClass(e.target.value)}
          >
            <option value="all">All CDL Classes</option>
            <option value="Class A">Class A Only</option>
            <option value="Class B">Class B Only</option>
          </select>

          {/* Endorsement */}
          <select
            className="form-select"
            style={{ flex: 1, minWidth: '150px' }}
            value={selectedEndorsement}
            onChange={(e) => setSelectedEndorsement(e.target.value)}
          >
            <option value="all">All Endorsements</option>
            <option value="HazMat">HazMat (H)</option>
            <option value="Tanker">Tanker (N)</option>
            <option value="Doubles">Doubles/Triples (T)</option>
            <option value="TWIC">TWIC Card</option>
          </select>

          {/* Equipment */}
          <select
            className="form-select"
            style={{ flex: 1, minWidth: '150px' }}
            value={selectedEquipment}
            onChange={(e) => setSelectedEquipment(e.target.value)}
          >
            <option value="all">All Equipment</option>
            <option value="Reefer">Refrigerated (Reefer)</option>
            <option value="Dry Van">Dry Van</option>
            <option value="Flatbed">Flatbed / Stepdeck</option>
            <option value="Tanker">Tanker</option>
          </select>

          {/* Experience */}
          <select
            className="form-select"
            style={{ flex: 1, minWidth: '130px' }}
            value={minExp}
            onChange={(e) => setMinExp(Number(e.target.value))}
          >
            <option value={0}>Any Experience</option>
            <option value={2}>2+ Years Exp</option>
            <option value={5}>5+ Years Exp</option>
            <option value={8}>8+ Years Exp</option>
          </select>

          {/* Status */}
          <select
            className="form-select"
            style={{ flex: 1, minWidth: '130px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="available">Available (Blind)</option>
            <option value="unlocked">Unlocked</option>
          </select>
        </div>

        {/* Saved Searches & Instant Alerts Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Bell size={12} color="var(--road-amber)" /> Saved Alerts:
            </span>
            {savedSearches.map((ss) => (
              <button
                key={ss.id}
                type="button"
                onClick={() => handleApplySavedSearch(ss)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 9px',
                  fontSize: '0.76rem',
                  borderRadius: '3px',
                  background: '#fff',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  color: 'var(--text-primary)'
                }}
              >
                <Bookmark size={10} color="var(--road-amber)" />
                <span>{ss.label}</span>
                <span
                  onClick={(e) => handleDeleteSavedSearch(ss.id, e)}
                  title="Remove alert"
                  style={{ color: '#94a3b8', marginLeft: '4px', fontSize: '0.85rem' }}
                >
                  ×
                </span>
              </button>
            ))}
            {!isSavingSearch ? (
              <button
                type="button"
                onClick={() => setIsSavingSearch(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 9px',
                  fontSize: '0.74rem',
                  borderRadius: '3px',
                  background: 'rgba(240, 162, 59, 0.12)',
                  border: '1px solid var(--road-amber)',
                  color: '#b86c0d',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Plus size={11} /> Save Search & Alert
              </button>
            ) : (
              <form onSubmit={handleSaveCurrentSearch} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Dallas Reefer 3+ Yrs"
                  value={searchNameInput}
                  onChange={(e) => setSearchNameInput(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.76rem',
                    border: '1px solid var(--road-amber)',
                    borderRadius: '3px',
                    outline: 'none',
                    minWidth: '160px'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.74rem',
                    background: 'var(--road-amber)',
                    color: '#121315',
                    border: 'none',
                    borderRadius: '3px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsSavingSearch(false)}
                  style={{
                    padding: '4px 6px',
                    fontSize: '0.74rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </form>
            )}
          </div>

          {savedSearchNotice && (
            <span style={{ fontSize: '0.76rem', color: '#047857', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={12} /> {savedSearchNotice}
            </span>
          )}
        </div>

        {/* Active Filter Indicators & Job Order Matcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span>
              Showing <strong>{filteredDrivers.length}</strong> matching candidates
            </span>
            {jobOrders.length > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Briefcase size={12} color="var(--road-amber)" /> Match Fleet Job Order:
                </span>
                <select
                  className="form-select"
                  style={{ width: 'auto', padding: '5px 10px', fontSize: '0.78rem' }}
                  value={selectedJobOrderId}
                  onChange={(e) => setSelectedJobOrderId(e.target.value)}
                >
                  <option value="none">All Candidates (No Job Order Filter)</option>
                  {jobOrders.map((jo) => (
                    <option key={jo.id} value={jo.id}>
                      {jo.id} — {jo.companyName} ({jo.driversNeeded} Seats · {jo.minExperienceYears}+ Yrs Exp)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {(searchQuery ||
            selectedCdlClass !== 'all' ||
            selectedEndorsement !== 'all' ||
            selectedEquipment !== 'all' ||
            minExp > 0 ||
            statusFilter !== 'all' ||
            selectedJobOrderId !== 'none') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCdlClass('all');
                setSelectedEndorsement('all');
                setSelectedEquipment('all');
                setMinExp(0);
                setStatusFilter('all');
                setSelectedJobOrderId('none');
              }}
              style={{ color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 600 }}
            >
              <RefreshCw size={12} /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Driver Cards Grid */}
      {filteredDrivers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <Truck size={42} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>No Drivers Match These Filters</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Try widening your experience requirement or clearing endorsement filters.
          </p>
        </div>
      ) : (
        <motion.div
          layout
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
            gap: '20px'
          }}
        >
          <AnimatePresence mode="popLayout">
            {filteredDrivers.map((driver, index) => (
              <motion.div
                key={driver.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.4), ease: [0.16, 1, 0.3, 1] }}
              >
                <DriverCard
                  driver={driver}
                  onOpenDetails={(d) => setActiveDriverForDetails(d)}
                  onUnlockClick={(d) => setActiveDriverForUnlock(d)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Details & Video Modal */}
      <DriverModal
        driver={activeDriverForDetails}
        onClose={() => setActiveDriverForDetails(null)}
        onUnlockClick={(d) => {
          setActiveDriverForDetails(null);
          setActiveDriverForUnlock(d);
        }}
      />

      {/* Placement Contract Unlock Modal */}
      <PlacementContractModal
        driver={activeDriverForUnlock}
        onClose={() => setActiveDriverForUnlock(null)}
        onContractSigned={(id, carrier, signerName, signerTitle) => {
          onContractSigned(id, carrier, signerName, signerTitle);
          setActiveDriverForUnlock(null);
          // reopen details modal so carrier immediately sees unmasked contact info
          const updated = drivers.find((d) => d.id === id);
          if (updated) {
            setActiveDriverForDetails({
              ...updated,
              status: 'unlocked',
              unlockedByCarrier: carrier
            });
          }
        }}
      />
    </div>
  );
};
