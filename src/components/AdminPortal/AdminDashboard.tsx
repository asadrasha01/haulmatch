import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  Briefcase,
  DollarSign,
  CheckCircle2,
  Trash2,
  Activity,
  Database,
  RefreshCw,
  Video,
  Search,
  Send,
  Loader2,
  Clock,
  FileText,
  Download,
  Plus,
  Check,
  Ban
} from 'lucide-react';
import type { DriverProfile, FleetJobOrder, UserProfile, ActivityEvent, CarrierVettingStatus } from '../../types';
import {
  fetchAllDrivers,
  fetchFleetJobOrders,
  fetchAllProfiles,
  updateDriverStatus,
  deleteDriver,
  deleteFleetJobOrder,
  sendRetentionSmsPulse,
  disburseRetentionBonus,
  seedInitialDriversToSupabase,
  saveFleetJobOrder,
  updateCarrierVettingStatus
} from '../../services/supabase';
import { fetchActivityEvents, logActivityEvent } from '../../services/activityEvents';
import { PlacementInvoiceModal } from './PlacementInvoiceModal';
import { DriverDossierModal } from './DriverDossierModal';
import { CreateJobOrderModal } from './CreateJobOrderModal';
import {
  exportDriverPipelineCsv,
  exportFleetJobOrdersCsv,
  exportPlacementsLedgerCsv
} from '../../utils/csvExport';

interface AdminDashboardProps {
  onRefreshData?: () => void;
  onOpenDatabaseModal?: () => void;
}

const INK = '#121315';
const DEEP = '#0c0d0f';
const AMBER = '#f0a23b';
const AMBER_TEXT = '#b86d0e';
const MUTED = '#5d5f63';
const RULE = 'rgba(18, 19, 21, 0.14)';
const DISPLAY = "'Barlow Condensed', sans-serif";
const MONO = "'IBM Plex Mono', 'JetBrains Mono', monospace";
const BODY_FONT = "'Barlow', system-ui, sans-serif";

const monoStyle = (size = 11, color = MUTED, spacing = '0.08em'): React.CSSProperties => ({
  fontFamily: MONO,
  fontSize: size,
  letterSpacing: spacing,
  textTransform: 'uppercase',
  color
});

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onRefreshData,
  onOpenDatabaseModal
}) => {
  const [activeTab, setActiveTab] = useState<'candidates' | 'orders' | 'placements' | 'users' | 'system' | 'audit'>('candidates');
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [jobOrders, setJobOrders] = useState<FleetJobOrder[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>(() => fetchActivityEvents());
  const [selectedDriverForInvoice, setSelectedDriverForInvoice] = useState<DriverProfile | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filter States
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState<string>('all');
  const [selectedJobForMatch, setSelectedJobForMatch] = useState<FleetJobOrder | null>(null);
  const [selectedDriverForDossier, setSelectedDriverForDossier] = useState<DriverProfile | null>(null);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [userVettingFilter, setUserVettingFilter] = useState<'all' | 'pending' | 'verified' | 'staff'>('all');
  const [isSeeding, setIsSeeding] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [driversData, ordersData, profilesData] = await Promise.all([
        fetchAllDrivers(),
        fetchFleetJobOrders(),
        fetchAllProfiles()
      ]);
      setDrivers(driversData);
      setJobOrders(ordersData);
      setProfiles(profilesData);
      setActivityEvents(fetchActivityEvents());
    } catch (err: any) {
      console.warn('Admin load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [driversData, ordersData, profilesData] = await Promise.all([
          fetchAllDrivers(),
          fetchFleetJobOrders(),
          fetchAllProfiles()
        ]);
        if (isMounted) {
          setDrivers(driversData);
          setJobOrders(ordersData);
          setProfiles(profilesData);
        }
      } catch (err: any) {
        console.warn('Admin load error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Financial & Operational Metrics
  const metrics = useMemo(() => {
    const placed = drivers.filter((d) => d.status === 'placed' || d.status === 'milestone_90' || d.placementDetails);
    const available = drivers.filter((d) => d.status === 'available');
    const unlocked = drivers.filter((d) => d.status === 'unlocked');
    const milestone90 = drivers.filter((d) => d.status === 'milestone_90' || (d.placementDetails?.daysCompleted ?? 0) >= 90);

    const totalUpfrontFees = placed.length * 2250;
    const totalRetentionFees = milestone90.length * 2250;
    const totalDisbursedBonuses = placed.filter((d) => d.placementDetails?.driverBonusPaid).length * 1500;
    const totalGrossRevenue = totalUpfrontFees + totalRetentionFees;
    const netGrossProfit = totalGrossRevenue - totalDisbursedBonuses;
    const totalOpenSeats = jobOrders.reduce((sum, jo) => sum + (jo.driversNeeded || 1), 0);

    return {
      totalCandidates: drivers.length,
      availableCount: available.length,
      unlockedCount: unlocked.length,
      placedCount: placed.length,
      milestone90Count: milestone90.length,
      totalOrders: jobOrders.length,
      totalOpenSeats,
      totalProfiles: profiles.length,
      staffCount: profiles.filter((p) => p.role === 'staff').length,
      carrierCount: profiles.filter((p) => p.role === 'carrier').length,
      totalGrossRevenue,
      totalDisbursedBonuses,
      netGrossProfit
    };
  }, [drivers, jobOrders, profiles]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return drivers.filter((driver) => {
      const matchSearch =
        !candidateSearch ||
        driver.id.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        driver.fullName.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        driver.location.city.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        driver.location.state.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        driver.equipment.some((eq) => eq.toLowerCase().includes(candidateSearch.toLowerCase()));

      const matchStatus =
        candidateStatusFilter === 'all' || driver.status === candidateStatusFilter;

      const matchJobOrder = !selectedJobForMatch
        ? true
        : driver.yearsExperience >= selectedJobForMatch.minExperienceYears &&
          driver.violationsLast3Yrs <= selectedJobForMatch.maxViolations3Years &&
          (selectedJobForMatch.equipmentType.length === 0 ||
            driver.equipment.some((deq) =>
              selectedJobForMatch.equipmentType.some(
                (oeq) =>
                  deq.toLowerCase().includes(oeq.toLowerCase().split(' ')[0]) ||
                  oeq.toLowerCase().includes(deq.toLowerCase().split(' ')[0])
              )
            ));

      return matchSearch && matchStatus && matchJobOrder;
    });
  }, [drivers, candidateSearch, candidateStatusFilter, selectedJobForMatch]);

  // Filtered Auth Profiles & Carrier Vetting
  const userStats = useMemo(() => {
    const staff = profiles.filter((p) => p.role === 'staff').length;
    const verified = profiles.filter((p) => p.role === 'carrier' && p.vettingStatus === 'verified_mc').length;
    const pending = profiles.filter(
      (p) => p.role === 'carrier' && (p.vettingStatus === 'pending_review' || !p.vettingStatus)
    ).length;
    return { staff, verified, pending };
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (userVettingFilter === 'pending') {
        return p.role === 'carrier' && (p.vettingStatus === 'pending_review' || !p.vettingStatus);
      }
      if (userVettingFilter === 'verified') {
        return p.role === 'carrier' && p.vettingStatus === 'verified_mc';
      }
      if (userVettingFilter === 'staff') {
        return p.role === 'staff';
      }
      return true;
    });
  }, [profiles, userVettingFilter]);

  // Handlers
  const handleUpdateStatus = async (driverId: string, status: DriverProfile['status']) => {
    setActionInProgress(driverId);
    const res = await updateDriverStatus(driverId, status);
    setActionInProgress(null);
    if (res.success) {
      setDrivers((prev) => prev.map((d) => (d.id === driverId ? { ...d, status } : d)));
      showNotification(`Driver ${driverId} status updated to ${status.toUpperCase()}`);
      if (onRefreshData) onRefreshData();
    } else {
      showNotification(res.error || 'Update failed', 'error');
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete candidate ${driverId}?`)) return;
    setActionInProgress(driverId);
    const res = await deleteDriver(driverId);
    setActionInProgress(null);
    if (res.success) {
      setDrivers((prev) => prev.filter((d) => d.id !== driverId));
      showNotification(`Candidate ${driverId} deleted`);
      if (onRefreshData) onRefreshData();
    } else {
      showNotification(res.error || 'Delete failed', 'error');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm(`Delete fleet intake job order ${orderId}?`)) return;
    setActionInProgress(orderId);
    const res = await deleteFleetJobOrder(orderId);
    setActionInProgress(null);
    if (res.success) {
      setJobOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (selectedJobForMatch?.id === orderId) setSelectedJobForMatch(null);
      showNotification(`Job order ${orderId} removed`);
      if (onRefreshData) onRefreshData();
    } else {
      showNotification(res.error || 'Delete failed', 'error');
    }
  };

  const handlePulse = async (driverId: string) => {
    setActionInProgress(`pulse-${driverId}`);
    const res = await sendRetentionSmsPulse(driverId);
    setActionInProgress(null);
    if (res.success) {
      showNotification(`Retention SMS pulse recorded for ${driverId}`);
      loadAllAdminData();
    } else {
      showNotification(res.error || 'Pulse failed', 'error');
    }
  };

  const handleDisburse = async (driverId: string) => {
    setActionInProgress(`disburse-${driverId}`);
    const res = await disburseRetentionBonus(driverId);
    setActionInProgress(null);
    if (res.success) {
      showNotification(`$1,500 retention bonus disbursed for ${driverId}`);
      loadAllAdminData();
      if (onRefreshData) onRefreshData();
    } else {
      showNotification(res.error || 'Disbursement failed', 'error');
    }
  };

  const handleSeedDatabase = async () => {
    if (!window.confirm('Reset/re-seed live database with official CDL-A candidate profiles and fleet orders?')) return;
    setIsSeeding(true);
    const res = await seedInitialDriversToSupabase();
    setIsSeeding(false);
    if (res.success) {
      showNotification(`Seeded ${res.count} profiles to Supabase successfully`);
      loadAllAdminData();
      if (onRefreshData) onRefreshData();
    } else {
      showNotification(res.error || 'Seeding failed', 'error');
    }
  };

  const handleCreateJobOrder = async (newOrder: FleetJobOrder) => {
    const res = await saveFleetJobOrder(newOrder);
    if (res.success) {
      setJobOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
      logActivityEvent(
        'candidate_applied',
        'Staff Admin',
        newOrder.companyName,
        `Dispatched new fleet requisition ${newOrder.id} (${newOrder.driversNeeded} seats, ${newOrder.equipmentType.join(', ')})`,
        { orderId: newOrder.id, driversNeeded: newOrder.driversNeeded }
      );
      setActivityEvents(fetchActivityEvents());
      showNotification(`Fleet job order ${newOrder.id} dispatched for ${newOrder.companyName}`);
      if (onRefreshData) onRefreshData();
    } else {
      showNotification('Failed to create fleet job order', 'error');
    }
  };

  const handleVerifyCarrier = async (userId: string, status: CarrierVettingStatus) => {
    setActionInProgress(`vetting-${userId}`);
    const res = await updateCarrierVettingStatus(userId, status);
    setActionInProgress(null);
    if (res.success) {
      const user = profiles.find((p) => p.id === userId);
      const targetName = user?.companyName || user?.email || userId;
      const statusLabel =
        status === 'verified_mc'
          ? 'VERIFIED & CREDIT APPROVED'
          : status === 'rejected'
          ? 'SUSPENDED'
          : 'PENDING REVIEW';

      logActivityEvent(
        'candidate_placed',
        'Staff Admin',
        targetName,
        `Carrier account vetting status set to ${statusLabel}`,
        { userId, status }
      );
      setActivityEvents(fetchActivityEvents());
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === userId
            ? {
                ...p,
                vettingStatus: status,
                creditLineApproved: status === 'verified_mc',
                vettedAt: status === 'verified_mc' ? new Date().toISOString() : p.vettedAt
              }
            : p
        )
      );
      showNotification(`Carrier ${targetName} marked ${statusLabel}`);
      if (onRefreshData) onRefreshData();
    } else {
      showNotification(res.error || 'Failed to update carrier vetting status', 'error');
    }
  };

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', fontFamily: BODY_FONT, color: INK }}>
      {/* Editorial Eyebrow & Live Status Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          paddingBottom: 14,
          marginBottom: 20,
          borderBottom: `1px solid ${RULE}`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 8, height: 8, background: '#10b981', display: 'inline-block' }} />
          <span style={monoStyle(11, INK, '0.1em')}>OPS-01 // HAULMATCH ADMIN COMMAND CENTER</span>
          <span
            style={{
              ...monoStyle(9, '#047857', '0.08em'),
              padding: '2px 6px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0'
            }}
          >
            STAFF ONLY
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={loadAllAdminData}
            disabled={isLoading}
            style={{
              ...monoStyle(11, INK, '0.08em'),
              padding: '6px 12px',
              border: `1px solid ${RULE}`,
              background: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Syncing...' : 'Sync Live DB'}</span>
          </button>

          {onOpenDatabaseModal && (
            <button
              type="button"
              onClick={onOpenDatabaseModal}
              style={{
                ...monoStyle(11, AMBER_TEXT, '0.08em'),
                padding: '6px 12px',
                border: '1px solid rgba(240, 162, 59, 0.45)',
                background: 'rgba(240, 162, 59, 0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <Database size={12} />
              <span>Supabase Cloud</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {actionMessage && (
        <div
          style={{
            padding: '10px 16px',
            marginBottom: 16,
            background: actionMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${actionMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            borderLeft: `4px solid ${actionMessage.type === 'success' ? '#059669' : '#dc2626'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: MONO,
            fontSize: 12
          }}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: 11 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Key Metrics Strip (Executive SaaS Telemetry) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 1,
          background: RULE,
          border: `1px solid ${RULE}`,
          borderTop: `3px solid ${INK}`,
          marginBottom: 24
        }}
      >
        <div style={{ background: '#fff', padding: '18px 20px' }}>
          <div style={monoStyle(10, MUTED)}>Net Agency Profit</div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 32, color: '#059669', lineHeight: 1.1, marginTop: 4 }}>
            ${metrics.netGrossProfit.toLocaleString()}
          </div>
          <div style={monoStyle(10, MUTED, '0.04em')}>
            ${metrics.totalGrossRevenue.toLocaleString()} Invoiced · ${metrics.totalDisbursedBonuses.toLocaleString()} Bonuses
          </div>
        </div>

        <div style={{ background: '#fff', padding: '18px 20px' }}>
          <div style={monoStyle(10, MUTED)}>Driver Placements</div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 32, color: INK, lineHeight: 1.1, marginTop: 4 }}>
            {metrics.placedCount} <span style={{ fontSize: 16, fontWeight: 600, color: MUTED }}>Drivers</span>
          </div>
          <div style={monoStyle(10, MUTED, '0.04em')}>
            {metrics.milestone90Count} at Day-90 Milestone ({metrics.totalCandidates} total in pool)
          </div>
        </div>

        <div style={{ background: '#fff', padding: '18px 20px' }}>
          <div style={monoStyle(10, MUTED)}>Marketplace Demand</div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 32, color: AMBER_TEXT, lineHeight: 1.1, marginTop: 4 }}>
            {metrics.totalOpenSeats} <span style={{ fontSize: 16, fontWeight: 600, color: MUTED }}>Trucks</span>
          </div>
          <div style={monoStyle(10, MUTED, '0.04em')}>
            Across {metrics.totalOrders} Active Fleet Intake Orders
          </div>
        </div>

        <div style={{ background: '#fff', padding: '18px 20px' }}>
          <div style={monoStyle(10, MUTED)}>Platform Users</div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 32, color: INK, lineHeight: 1.1, marginTop: 4 }}>
            {metrics.totalProfiles} <span style={{ fontSize: 16, fontWeight: 600, color: MUTED }}>Accounts</span>
          </div>
          <div style={monoStyle(10, MUTED, '0.04em')}>
            {metrics.carrierCount} Carriers · {metrics.staffCount} Staff Members
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          background: RULE,
          border: `1px solid ${RULE}`,
          marginBottom: 20,
          overflowX: 'auto'
        }}
      >
        {[
          { key: 'candidates', label: `Driver Pipeline (${drivers.length})`, icon: Users },
          { key: 'orders', label: `Fleet Intake Orders (${jobOrders.length})`, icon: Briefcase },
          { key: 'placements', label: `Placements & Escrow (${metrics.placedCount})`, icon: DollarSign },
          { key: 'audit', label: `Activity Audit Feed (${activityEvents.length})`, icon: Clock },
          { key: 'users', label: `Auth Users (${profiles.length})`, icon: ShieldCheck },
          { key: 'system', label: 'Cloud Infrastructure', icon: Activity }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 18px',
                background: isActive ? '#121315' : '#fff',
                color: isActive ? AMBER : INK,
                fontFamily: BODY_FONT,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: DRIVER PIPELINE & VERIFICATION QUEUE
          ========================================================================= */}
      {activeTab === 'candidates' && (
        <div style={{ background: '#fff', border: `1px solid ${RULE}`, padding: '24px' }}>
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: `1px solid ${RULE}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: MUTED }} />
                <input
                  type="text"
                  placeholder="Search name, CDL #, city, equipment..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 30px',
                    fontFamily: BODY_FONT,
                    fontSize: 13,
                    border: `1px solid ${RULE}`,
                    outline: 'none',
                    borderRadius: 0
                  }}
                />
              </div>

              <select
                value={candidateStatusFilter}
                onChange={(e) => setCandidateStatusFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  border: `1px solid ${RULE}`,
                  borderRadius: 0,
                  outline: 'none',
                  background: '#fff'
                }}
              >
                <option value="all">All Statuses ({drivers.length})</option>
                <option value="available">Available (Blind Marketplace)</option>
                <option value="unlocked">Unlocked by Carrier</option>
                <option value="placed">Active Placement</option>
                <option value="milestone_90">Day-90 Cleared</option>
              </select>
            </div>

            {selectedJobForMatch && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  background: 'rgba(240, 162, 59, 0.15)',
                  border: '1px solid rgba(240, 162, 59, 0.45)',
                  fontSize: 12
                }}
              >
                <span>
                  Filtering for Order: <strong>{selectedJobForMatch.companyName}</strong> ({selectedJobForMatch.equipmentType.join(', ')})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedJobForMatch(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, marginLeft: 4 }}
                >
                  ✕
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => exportDriverPipelineCsv(filteredCandidates)}
              style={{
                ...monoStyle(11, INK),
                padding: '8px 14px',
                background: '#fff',
                border: `1px solid ${RULE}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <Download size={12} />
              <span>Export Pipeline (CSV)</span>
            </button>
          </div>

          {/* Candidates Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: `2px solid ${INK}` }}>
                  <th style={{ padding: '10px 14px', ...monoStyle(10, INK) }}>Candidate / ID</th>
                  <th style={{ padding: '10px 14px', ...monoStyle(10, INK) }}>Class & Exp</th>
                  <th style={{ padding: '10px 14px', ...monoStyle(10, INK) }}>Endorsements & Equip</th>
                  <th style={{ padding: '10px 14px', ...monoStyle(10, INK) }}>DOT Compliance</th>
                  <th style={{ padding: '10px 14px', ...monoStyle(10, INK) }}>AI Fluency</th>
                  <th style={{ padding: '10px 14px', ...monoStyle(10, INK) }}>Status</th>
                  <th style={{ padding: '10px 14px', ...monoStyle(10, INK), textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: MUTED }}>
                      No candidate profiles found matching these filters.
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((driver) => {
                    const isBusy = actionInProgress === driver.id;
                    return (
                      <tr key={driver.id} style={{ borderBottom: `1px solid ${RULE}` }}>
                        {/* Candidate / ID */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontFamily: MONO, fontSize: 10, padding: '2px 5px', background: DEEP, color: '#fff' }}>
                              {driver.id}
                            </span>
                            <strong style={{ fontSize: 14 }}>{driver.fullName}</strong>
                          </div>
                          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                            {driver.phone} · {driver.email}
                          </div>
                          <div style={{ fontSize: 11, color: MUTED }}>
                            {driver.location.city}, {driver.location.state} {driver.location.zip}
                          </div>
                        </td>

                        {/* Class & Exp */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600 }}>{driver.cdlClass}</div>
                          <div style={{ fontSize: 11, color: MUTED }}>
                            {driver.yearsExperience} Years Exp
                          </div>
                          <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>
                            {driver.licenseNumber} ({driver.issuingState})
                          </div>
                        </td>

                        {/* Endorsements & Equip */}
                        <td style={{ padding: '12px 14px', maxWidth: 220 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                            {driver.endorsements.slice(0, 3).map((e) => (
                              <span key={e} style={{ fontFamily: MONO, fontSize: 9, padding: '1px 5px', background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                                {e.split(' ')[0]}
                              </span>
                            ))}
                          </div>
                          <div style={{ fontSize: 11, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {driver.equipment.join(', ')}
                          </div>
                        </td>

                        {/* DOT Compliance */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#047857' }}>
                            <CheckCircle2 size={12} /> Med Card: {driver.dotMedCardStatus}
                          </div>
                          <div style={{ fontSize: 10, color: MUTED }}>
                            MVR: {driver.cleanMvr ? 'Clean (0 viol.)' : `${driver.violationsLast3Yrs} violations`}
                          </div>
                          <div style={{ fontSize: 10, color: MUTED }}>
                            Clearinghouse: {driver.dqDocuments?.clearinghouseStatus || 'Passed'}
                          </div>
                        </td>

                        {/* AI Fluency */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: driver.aiFluencyScore >= 95 ? '#047857' : AMBER_TEXT }}>
                              {driver.aiFluencyScore}/100
                            </span>
                            {driver.videoInterview?.recorded && (
                              <span title="Video recorded" style={{ display: 'inline-flex' }}>
                                <Video size={12} color="#0e7490" />
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: MUTED }}>
                            {driver.videoInterview?.duration || '02:40'} duration
                          </div>
                        </td>

                        {/* Status Switcher */}
                        <td style={{ padding: '12px 14px' }}>
                          <select
                            disabled={isBusy}
                            value={driver.status}
                            onChange={(e) => handleUpdateStatus(driver.id, e.target.value as any)}
                            style={{
                              padding: '4px 8px',
                              fontFamily: MONO,
                              fontSize: 10,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              border: `1px solid ${RULE}`,
                              borderRadius: 0,
                              background:
                                driver.status === 'milestone_90'
                                  ? '#ecfdf5'
                                  : driver.status === 'placed'
                                  ? '#eff6ff'
                                  : driver.status === 'unlocked'
                                  ? '#fffbeb'
                                  : '#f8fafc',
                              color:
                                driver.status === 'milestone_90'
                                  ? '#047857'
                                  : driver.status === 'placed'
                                  ? '#1d4ed8'
                                  : driver.status === 'unlocked'
                                  ? '#b45309'
                                  : INK,
                              cursor: 'pointer'
                            }}
                          >
                            <option value="available">Available</option>
                            <option value="unlocked">Unlocked</option>
                            <option value="placed">Placed</option>
                            <option value="milestone_90">Day 90 Clear</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              title="Inspect candidate video screening & DQ compliance"
                              onClick={() => {
                                setSelectedDriverForDossier(driver);
                                setIsDossierModalOpen(true);
                              }}
                              style={{
                                padding: '5px 10px',
                                background: '#fff',
                                border: `1px solid ${RULE}`,
                                fontFamily: MONO,
                                fontSize: 10,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                color: INK
                              }}
                            >
                              <Video size={11} color={AMBER_TEXT} />
                              <span>Dossier & Video</span>
                            </button>
                            <button
                              type="button"
                              title="Delete candidate"
                              disabled={isBusy}
                              onClick={() => handleDeleteDriver(driver.id)}
                              style={{
                                padding: '5px 8px',
                                background: 'transparent',
                                border: '1px solid #fee2e2',
                                color: '#dc2626',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: FLEET INTAKE ORDERS & MATCHMAKING
          ========================================================================= */}
      {activeTab === 'orders' && (
        <div style={{ background: '#fff', border: `1px solid ${RULE}`, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h3 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 24, margin: 0, textTransform: 'uppercase' }}>
                Carrier Fleet Intake Orders
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: MUTED }}>
                Live hiring requests submitted by fleet safety and recruiting directors.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: MONO, fontSize: 11, marginRight: 4 }}>
                Total Demand: <strong style={{ color: AMBER_TEXT }}>{metrics.totalOpenSeats} drivers needed</strong>
              </div>
              <button
                type="button"
                onClick={() => exportFleetJobOrdersCsv(jobOrders)}
                style={{
                  ...monoStyle(11, INK),
                  padding: '7px 12px',
                  background: '#fff',
                  border: `1px solid ${RULE}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <Download size={12} />
                <span>Export Orders (CSV)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCreateOrderModalOpen(true)}
                style={{
                  ...monoStyle(11, INK),
                  fontWeight: 700,
                  padding: '7px 14px',
                  background: AMBER,
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <Plus size={13} />
                <span>+ New Fleet Requisition</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
            {jobOrders.map((order) => {
              const isSelected = selectedJobForMatch?.id === order.id;
              return (
                <div
                  key={order.id}
                  style={{
                    border: `1px solid ${isSelected ? AMBER : RULE}`,
                    borderTop: `3px solid ${isSelected ? AMBER : INK}`,
                    padding: 20,
                    background: isSelected ? 'rgba(240, 162, 59, 0.04)' : '#fff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                    <div>
                      <span style={{ fontFamily: MONO, fontSize: 10, padding: '2px 5px', background: DEEP, color: '#fff', marginRight: 6 }}>
                        {order.id}
                      </span>
                      <strong style={{ fontSize: 16 }}>{order.companyName}</strong>
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: AMBER_TEXT }}>
                      {order.driversNeeded} SEATS NEEDED
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, marginBottom: 14 }}>
                    <div>
                      <span style={monoStyle(9, MUTED)}>Equipment:</span>
                      <div>{order.equipmentType.join(', ') || 'Any Equipment'}</div>
                    </div>
                    <div>
                      <span style={monoStyle(9, MUTED)}>Pay Package:</span>
                      <div style={{ fontWeight: 600 }}>{order.payPerMile}</div>
                    </div>
                    <div>
                      <span style={monoStyle(9, MUTED)}>Required Exp:</span>
                      <div>{order.minExperienceYears}+ Yrs Verifiable</div>
                    </div>
                    <div>
                      <span style={monoStyle(9, MUTED)}>Home-time:</span>
                      <div>{order.hometimeCadence}</div>
                    </div>
                  </div>

                  <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: MUTED }}>
                      Contact: {order.contactName} ({order.contactPhone})
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedJobForMatch(isSelected ? null : order);
                          setActiveTab('candidates');
                        }}
                        style={{
                          padding: '6px 12px',
                          background: isSelected ? INK : AMBER,
                          color: isSelected ? '#fff' : INK,
                          fontFamily: MONO,
                          fontSize: 11,
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {isSelected ? 'Reset Filter' : 'Find Matching Drivers →'}
                      </button>
                      <button
                        type="button"
                        title="Delete order"
                        onClick={() => handleDeleteOrder(order.id)}
                        style={{
                          padding: '6px 8px',
                          background: '#fff',
                          border: '1px solid #fee2e2',
                          color: '#dc2626',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: PLACEMENTS, CONTRACTS & ESCROW LEDGER
          ========================================================================= */}
      {activeTab === 'placements' && (
        <div id="admin-placements-section" style={{ background: '#fff', border: `1px solid ${RULE}`, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 24, margin: 0, textTransform: 'uppercase' }}>
                Placements & Escrow Ledger
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: MUTED }}>
                All placed candidates progressing through the 90-day retention warranty and cash bonus schedule.
              </p>
            </div>
            <button
              type="button"
              onClick={() => exportPlacementsLedgerCsv(drivers)}
              style={{
                ...monoStyle(11, INK),
                padding: '7px 12px',
                background: '#fff',
                border: `1px solid ${RULE}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <Download size={12} />
              <span>Export Ledger (CSV)</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: `2px solid ${INK}` }}>
                  <th style={{ padding: '10px 14px', ...monoStyle(10, INK) }}>Driver ID</th>
                  <th style={{ padding: '10px 14px', ...monoStyle(10, INK) }}>Carrier / Signer</th>
                  <th style={{ padding: '10px 14px', ...monoStyle(10, INK) }}>Start Date</th>
                  <th style={{ padding: '10px 14px', ...monoStyle(10, INK) }}>Progress (Days)</th>
                  <th style={{ padding: '10px 14px', ...monoStyle(10, INK) }}>Invoiced Fee</th>
                  <th style={{ padding: '10px 14px', ...monoStyle(10, INK) }}>$1,500 Bonus Status</th>
                  <th style={{ padding: '10px 14px', ...monoStyle(10, INK), textAlign: 'right' }}>Ops Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers
                  .filter((d) => d.status === 'placed' || d.status === 'milestone_90' || d.placementDetails)
                  .map((driver) => {
                    const details = driver.placementDetails || {
                      carrierName: driver.unlockedByCarrier || 'Partner Fleet LLC',
                      carrierContact: 'Safety Director',
                      startDate: '2026-09-15',
                      daysCompleted: 45,
                      targetDays: 90,
                      totalFee: 5000,
                      feePaid: 2500,
                      driverBonusPaid: false
                    };
                    const is90Done = details.daysCompleted >= 90;
                    return (
                      <tr key={driver.id} style={{ borderBottom: `1px solid ${RULE}` }}>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, padding: '2px 5px', background: DEEP, color: '#fff' }}>
                            {driver.id}
                          </span>
                          <div style={{ fontWeight: 600, marginTop: 4 }}>{driver.fullName}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600 }}>{details.carrierName}</div>
                          <div style={{ fontSize: 11, color: MUTED }}>{details.carrierContact}</div>
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: MONO, fontSize: 12 }}>
                          {details.startDate}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 700, color: is90Done ? '#047857' : AMBER_TEXT }}>
                            Day {details.daysCompleted} / {details.targetDays}
                          </div>
                          <div style={{ width: 120, height: 5, background: '#e2e8f0', marginTop: 4 }}>
                            <div
                              style={{
                                width: `${Math.min(100, (details.daysCompleted / details.targetDays) * 100)}%`,
                                height: '100%',
                                background: is90Done ? '#059669' : AMBER
                              }}
                            />
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: MONO }}>
                          <div style={{ fontWeight: 600 }}>${details.feePaid.toLocaleString()}</div>
                          <div style={{ fontSize: 10, color: MUTED }}>Total: ${details.totalFee.toLocaleString()}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {details.driverBonusPaid ? (
                            <span style={{ ...monoStyle(10, '#047857'), padding: '2px 6px', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                              ✓ Disbursed
                            </span>
                          ) : (
                            <span style={{ ...monoStyle(10, '#b45309'), padding: '2px 6px', background: '#fffbeb', border: '1px solid #fde68a' }}>
                              Escrow Locked
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDriverForInvoice(driver);
                                setIsInvoiceModalOpen(true);
                              }}
                              style={{
                                padding: '4px 8px',
                                background: '#fff',
                                border: `1px solid ${RULE}`,
                                fontFamily: MONO,
                                fontSize: 10,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <FileText size={10} /> PDF Invoice
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePulse(driver.id)}
                              disabled={actionInProgress === `pulse-${driver.id}`}
                              style={{
                                padding: '4px 8px',
                                background: '#fff',
                                border: `1px solid ${RULE}`,
                                fontFamily: MONO,
                                fontSize: 10,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <Send size={10} /> SMS Pulse
                            </button>
                            {is90Done && !details.driverBonusPaid && (
                              <button
                                type="button"
                                onClick={() => handleDisburse(driver.id)}
                                disabled={actionInProgress === `disburse-${driver.id}`}
                                style={{
                                  padding: '4px 8px',
                                  background: AMBER,
                                  color: INK,
                                  border: 'none',
                                  fontFamily: MONO,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Disburse $1.5k
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: ACTIVITY & ESCROW AUDIT FEED
          ========================================================================= */}
      {activeTab === 'audit' && (
        <div style={{ background: '#fff', border: `1px solid ${RULE}`, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h3 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 24, margin: 0, textTransform: 'uppercase' }}>
                Activity & Escrow Audit Feed
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: MUTED }}>
                Real-time chronological log of candidate unlocks, interview proposals, placement contracts, and escrow bonus disbursements.
              </p>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={14} color={MUTED} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Filter events by actor or candidate..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                style={{
                  padding: '8px 12px 8px 32px',
                  fontFamily: MONO,
                  fontSize: 12,
                  border: `1px solid ${RULE}`,
                  background: '#fff',
                  outline: 'none',
                  minWidth: 260
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activityEvents
              .filter(
                (evt) =>
                  !auditSearch.trim() ||
                  evt.actor.toLowerCase().includes(auditSearch.toLowerCase()) ||
                  evt.target.toLowerCase().includes(auditSearch.toLowerCase()) ||
                  evt.details.toLowerCase().includes(auditSearch.toLowerCase())
              )
              .map((evt) => {
                const badgeColor =
                  evt.type === 'bonus_disbursed'
                    ? { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' }
                    : evt.type === 'carrier_unlocked'
                    ? { bg: '#fffbeb', text: '#b45309', border: '#fde68a' }
                    : evt.type === 'candidate_placed'
                    ? { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }
                    : evt.type === 'interview_scheduled'
                    ? { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' }
                    : { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };

                return (
                  <div
                    key={evt.id}
                    style={{
                      padding: '16px 20px',
                      border: `1px solid ${RULE}`,
                      borderLeft: `4px solid ${badgeColor.text}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: 12
                    }}
                  >
                    <div style={{ flex: '1 1 400px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span
                          style={{
                            fontFamily: MONO,
                            fontSize: 10,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            padding: '2px 6px',
                            background: badgeColor.bg,
                            color: badgeColor.text,
                            border: `1px solid ${badgeColor.border}`,
                            fontWeight: 600
                          }}
                        >
                          {evt.type.replace('_', ' ')}
                        </span>
                        <strong style={{ fontSize: 14.5, color: INK }}>{evt.target}</strong>
                      </div>
                      <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.45 }}>{evt.details}</div>
                      <div style={{ fontSize: 11.5, color: MUTED, marginTop: 4 }}>
                        Initiated by: <strong>{evt.actor}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', fontFamily: MONO, fontSize: 11, color: MUTED }}>
                      {new Date(evt.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: AUTH USERS & CARRIER VETTING QUEUE
          ========================================================================= */}
      {activeTab === 'users' && (
        <div style={{ background: '#fff', border: `1px solid ${RULE}`, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h3 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 24, margin: 0, textTransform: 'uppercase' }}>
                Platform Accounts & Carrier Vetting Queue
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: MUTED }}>
                FMCSA motor carrier authority verification, credit line underwriting, and staff access controls.
              </p>
            </div>
            <div style={monoStyle(11)}>
              Total Users: <strong>{profiles.length}</strong> · <span style={{ color: '#047857' }}>{userStats.verified} Verified</span> · <span style={{ color: AMBER_TEXT }}>{userStats.pending} Pending</span>
            </div>
          </div>

          {/* Vetting Filter Pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: `All Accounts (${profiles.length})` },
              { key: 'pending', label: `Pending Review (${userStats.pending})` },
              { key: 'verified', label: `Verified MC Carriers (${userStats.verified})` },
              { key: 'staff', label: `Staff Only (${userStats.staff})` }
            ].map((f) => {
              const isSelected = userVettingFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setUserVettingFilter(f.key as any)}
                  style={{
                    padding: '6px 12px',
                    fontFamily: MONO,
                    fontSize: 11,
                    fontWeight: isSelected ? 700 : 500,
                    background: isSelected ? INK : '#f8fafc',
                    color: isSelected ? '#fff' : INK,
                    border: `1px solid ${isSelected ? INK : RULE}`,
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: `2px solid ${INK}` }}>
                  <th style={{ padding: '10px 14px', ...monoStyle(10, INK) }}>User Account & ID</th>
                  <th style={{ padding: '10px 14px', ...monoStyle(10, INK) }}>Role</th>
                  <th style={{ padding: '10px 14px', ...monoStyle(10, INK) }}>Fleet Organization & FMCSA</th>
                  <th style={{ padding: '10px 14px', ...monoStyle(10, INK) }}>Authority & Credit Status</th>
                  <th style={{ padding: '10px 14px', ...monoStyle(10, INK), textAlign: 'right' }}>Vetting Operations</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: MUTED }}>
                      No accounts found matching this vetting filter.
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((profile) => {
                    const isBusy = actionInProgress === `vetting-${profile.id}`;
                    const isStaff = profile.role === 'staff';
                    const isVerified = profile.vettingStatus === 'verified_mc';
                    const isRejected = profile.vettingStatus === 'rejected';

                    return (
                      <tr key={profile.id} style={{ borderBottom: `1px solid ${RULE}` }}>
                        {/* Account & ID */}
                        <td style={{ padding: '12px 14px' }}>
                          <strong style={{ fontSize: 14 }}>{profile.email}</strong>
                          <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED, marginTop: 2 }}>
                            {profile.id}
                          </div>
                        </td>

                        {/* Role */}
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              ...monoStyle(10, isStaff ? '#047857' : '#1d4ed8'),
                              padding: '3px 8px',
                              background: isStaff ? '#ecfdf5' : '#eff6ff',
                              border: `1px solid ${isStaff ? '#a7f3d0' : '#bfdbfe'}`
                            }}
                          >
                            {profile.role.toUpperCase()}
                          </span>
                        </td>

                        {/* Fleet Org & FMCSA */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600 }}>{profile.companyName || '—'}</div>
                          {profile.dotNumber || profile.mcNumber ? (
                            <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED, marginTop: 2 }}>
                              DOT: {profile.dotNumber || '—'} · MC: {profile.mcNumber || '—'}
                            </div>
                          ) : isStaff ? (
                            <div style={{ fontSize: 11, color: MUTED }}>Internal Recruiting Team</div>
                          ) : (
                            <div style={{ fontSize: 11, color: MUTED }}>Pending Authority Submission</div>
                          )}
                        </td>

                        {/* Authority & Credit Status */}
                        <td style={{ padding: '12px 14px' }}>
                          {isStaff ? (
                            <span
                              style={{
                                ...monoStyle(9, '#047857'),
                                padding: '3px 8px',
                                background: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <ShieldCheck size={11} /> FULL OPS ACCESS
                            </span>
                          ) : isVerified ? (
                            <div>
                              <span
                                style={{
                                  ...monoStyle(9, '#047857'),
                                  padding: '3px 8px',
                                  background: '#ecfdf5',
                                  border: '1px solid #a7f3d0',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                <Check size={11} /> VERIFIED MC
                              </span>
                              <div style={{ fontSize: 11, color: '#047857', marginTop: 3 }}>
                                $20,000 Credit Line Approved
                              </div>
                            </div>
                          ) : isRejected ? (
                            <div>
                              <span
                                style={{
                                  ...monoStyle(9, '#dc2626'),
                                  padding: '3px 8px',
                                  background: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                <Ban size={11} /> SUSPENDED
                              </span>
                              <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>
                                Access Restricted
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span
                                style={{
                                  ...monoStyle(9, '#b45309'),
                                  padding: '3px 8px',
                                  background: '#fffbeb',
                                  border: '1px solid #fde68a',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                <Clock size={11} /> PENDING REVIEW
                              </span>
                              <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>
                                W-9 & Insurance Check
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Vetting Operations */}
                        <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {isStaff ? (
                            <span style={{ fontSize: 11, color: MUTED }}>Protected Account</span>
                          ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              {!isVerified && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleVerifyCarrier(profile.id, 'verified_mc')}
                                  style={{
                                    padding: '5px 10px',
                                    background: '#ecfdf5',
                                    border: '1px solid #a7f3d0',
                                    color: '#047857',
                                    fontFamily: MONO,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                >
                                  <Check size={11} /> Approve MC & Credit
                                </button>
                              )}

                              {isVerified && (
                                <>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleVerifyCarrier(profile.id, 'rejected')}
                                    style={{
                                      padding: '5px 8px',
                                      background: '#fef2f2',
                                      border: '1px solid #fecaca',
                                      color: '#dc2626',
                                      fontFamily: MONO,
                                      fontSize: 10,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Suspend
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => handleVerifyCarrier(profile.id, 'pending_review')}
                                    style={{
                                      padding: '5px 8px',
                                      background: '#fff',
                                      border: `1px solid ${RULE}`,
                                      fontFamily: MONO,
                                      fontSize: 10,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Reset
                                  </button>
                                </>
                              )}

                              {isRejected && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleVerifyCarrier(profile.id, 'pending_review')}
                                  style={{
                                    padding: '5px 8px',
                                    background: '#fff',
                                    border: `1px solid ${RULE}`,
                                    fontFamily: MONO,
                                    fontSize: 10,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Re-evaluate
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: CLOUD INFRASTRUCTURE & MAINTENANCE
          ========================================================================= */}
      {activeTab === 'system' && (
        <div style={{ background: '#fff', border: `1px solid ${RULE}`, padding: '24px' }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 24, margin: 0, textTransform: 'uppercase' }}>
              Cloud Infrastructure & Health
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: MUTED }}>
              Direct operational health monitoring for Supabase PostgreSQL, Edge Functions, and Storage buckets.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 28 }}>
            <div style={{ border: `1px solid ${RULE}`, padding: 18 }}>
              <div style={monoStyle(10, MUTED)}>PostgreSQL Database</div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 20, marginTop: 4 }}>
                Supabase Free Tier
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
                Project Ref: <code>qhjjvmarwhsqvpwuywhs</code>
              </div>
              <div style={{ fontSize: 12, color: '#047857', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} /> 8 Tables + Blind Profile Masking View Active
              </div>
            </div>

            <div style={{ border: `1px solid ${RULE}`, padding: 18 }}>
              <div style={monoStyle(10, MUTED)}>Serverless Edge Functions</div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 20, marginTop: 4 }}>
                retention-pulse (v1)
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
                Endpoint: <code>/functions/v1/retention-pulse</code>
              </div>
              <div style={{ fontSize: 12, color: '#047857', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} /> Live & Dispatched (Edge-logged mode)
              </div>
            </div>

            <div style={{ border: `1px solid ${RULE}`, padding: 18 }}>
              <div style={monoStyle(10, MUTED)}>Private Document Storage</div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 20, marginTop: 4 }}>
                driver-documents & interviews
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
                Buckets: <code>driver-documents</code> (Private), <code>driver-interviews</code>
              </div>
              <div style={{ fontSize: 12, color: '#047857', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} /> FMCSA Part 391 RLS Enforced
              </div>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600 }}>Emergency Cloud Reseed</div>
              <div style={{ fontSize: 12, color: MUTED }}>
                Repopulates default vetted drivers and job orders if tables were emptied.
              </div>
            </div>

            <button
              type="button"
              disabled={isSeeding}
              onClick={handleSeedDatabase}
              style={{
                padding: '10px 18px',
                background: '#fff',
                border: `1px solid ${RULE}`,
                color: INK,
                fontFamily: MONO,
                fontSize: 11,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {isSeeding ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
              <span>{isSeeding ? 'Seeding...' : 'Reseed Supabase Cloud Tables'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 1-Click Placement Fee Invoice Generator Modal */}
      <PlacementInvoiceModal
        driver={selectedDriverForInvoice}
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />

      {/* Candidate Video Screening & DQ Dossier Inspector Modal */}
      <DriverDossierModal
        driver={selectedDriverForDossier}
        isOpen={isDossierModalOpen}
        onClose={() => setIsDossierModalOpen(false)}
      />

      {/* Direct Fleet Job Order Phone Intake Modal */}
      <CreateJobOrderModal
        isOpen={isCreateOrderModalOpen}
        onClose={() => setIsCreateOrderModalOpen(false)}
        onSubmit={handleCreateJobOrder}
      />
    </div>
  );
};
