import React, { useState, useMemo } from 'react';
import {
  Search,
  Truck,
  RefreshCw
} from 'lucide-react';
import type { DriverProfile } from '../../types';
import { DriverCard } from './DriverCard';
import { DriverModal } from './DriverModal';
import { PlacementContractModal } from './PlacementContractModal';

interface CarrierDashboardProps {
  drivers: DriverProfile[];
  onContractSigned: (driverId: string, carrierName: string) => void;
}

export const CarrierDashboard: React.FC<CarrierDashboardProps> = ({ drivers, onContractSigned }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCdlClass, setSelectedCdlClass] = useState<string>('all');
  const [selectedEndorsement, setSelectedEndorsement] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [minExp, setMinExp] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [activeDriverForDetails, setActiveDriverForDetails] = useState<DriverProfile | null>(null);
  const [activeDriverForUnlock, setActiveDriverForUnlock] = useState<DriverProfile | null>(null);

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

      return matchSearch && matchClass && matchEndorsement && matchEquipment && matchExp && matchStatus;
    });
  }, [drivers, searchQuery, selectedCdlClass, selectedEndorsement, selectedEquipment, minExp, statusFilter]);

  const activeCount = drivers.filter((d) => d.status === 'available').length;
  const unlockedCount = drivers.filter((d) => d.status === 'unlocked' || d.status === 'placed').length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Top Carrier Stats Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 32px',
          marginBottom: '28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px',
          alignItems: 'center'
        }}
      >
        <div>
          <span className="badge badge-blue" style={{ marginBottom: '6px' }}>Carrier Talent Pool</span>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>Pre-Screened CDL Marketplace</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Video-interviewed, DOT DQ verified, ready for immediate orientation.
          </p>
        </div>

        <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '20px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>
            {activeCount} Active Drivers
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {unlockedCount} Unlocked under Contract
          </div>
        </div>

        <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '20px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
            90-Day Guarantee
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            100% Free Replacement Warranty
          </div>
        </div>

        <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '20px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>
            $1,500 Driver Bonus
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Ensures 90-day driver retention
          </div>
        </div>
      </div>

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

        {/* Active Filter Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>
            Showing <strong>{filteredDrivers.length}</strong> matching candidates
          </span>
          {(searchQuery || selectedCdlClass !== 'all' || selectedEndorsement !== 'all' || selectedEquipment !== 'all' || minExp > 0 || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCdlClass('all');
                setSelectedEndorsement('all');
                setSelectedEquipment('all');
                setMinExp(0);
                setStatusFilter('all');
              }}
              style={{ color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '20px'
          }}
        >
          {filteredDrivers.map((driver) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              onOpenDetails={(d) => setActiveDriverForDetails(d)}
              onUnlockClick={(d) => setActiveDriverForUnlock(d)}
            />
          ))}
        </div>
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
        onContractSigned={(id, carrier) => {
          onContractSigned(id, carrier);
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
