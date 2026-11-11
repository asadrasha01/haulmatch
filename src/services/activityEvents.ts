import type { ActivityEvent, InterviewProposal, CarrierSavedSearch } from '../types';
import { getSupabaseClient } from './supabase';

const STORAGE_KEY_EVENTS = 'haulmatch_activity_events_v1';
const STORAGE_KEY_INTERVIEWS = 'haulmatch_interview_proposals_v1';
const STORAGE_KEY_SAVED_SEARCHES = 'haulmatch_saved_searches_v1';

const INITIAL_EVENTS: ActivityEvent[] = [
  {
    id: 'evt-101',
    type: 'carrier_unlocked',
    actor: 'Swiftline Global Logistics (Robert Miller)',
    target: 'Marcus Vance (CDL-1001)',
    details: 'Executed 90-Day Contingency Placement Contract. $2,250 upfront fee secured.',
    timestamp: '2026-03-01T14:32:00Z',
    metadata: { fee: 2250, driverId: 'CDL-1001' }
  },
  {
    id: 'evt-102',
    type: 'interview_scheduled',
    actor: 'Swiftline Global Logistics',
    target: 'Marcus Vance (CDL-1001)',
    details: 'Proposed 3 phone interview slots. Driver selected slot: Tomorrow at 10:00 AM CST.',
    timestamp: '2026-03-01T15:10:00Z'
  },
  {
    id: 'evt-103',
    type: 'candidate_placed',
    actor: 'admin@haulmatch.ai',
    target: 'Marcus Vance (CDL-1001)',
    details: 'Confirmed first dispatch with Swiftline Global Logistics. Day-1 retention timer started.',
    timestamp: '2026-03-03T09:00:00Z'
  },
  {
    id: 'evt-104',
    type: 'bonus_disbursed',
    actor: 'HaulMatch Escrow Sentinel',
    target: 'Elena Rostova (CDL-1002)',
    details: '$1,500 retention bonus disbursed via direct deposit upon reaching Day 90 milestone.',
    timestamp: '2026-03-05T11:45:00Z',
    metadata: { amount: 1500 }
  },
  {
    id: 'evt-105',
    type: 'candidate_applied',
    actor: 'Direct Applicant (Mobile)',
    target: 'Sarah Jenkins (CDL-1005)',
    details: 'Passed automatic CDL & DOT MCSA-5876 OCR scan. Speech fluency score: 94/100.',
    timestamp: '2026-03-07T16:20:00Z'
  }
];

const INITIAL_SAVED_SEARCHES: CarrierSavedSearch[] = [
  {
    id: 'ss-01',
    label: 'Dallas Reefer Specialists (3+ Yrs)',
    cdlClass: 'Class A',
    equipment: 'Refrigerated (Reefer)',
    minExperience: 3,
    zip: '75201',
    emailAlerts: true,
    createdAt: '2026-03-02T10:00:00Z'
  },
  {
    id: 'ss-02',
    label: 'Regional Flatbed Drivers (HazMat / TWIC)',
    cdlClass: 'Class A',
    equipment: 'Flatbed',
    minExperience: 2,
    zip: '77001',
    emailAlerts: true,
    createdAt: '2026-03-04T12:30:00Z'
  }
];

// ==============================================================================
// Activity Events
// ==============================================================================

export const fetchActivityEvents = (): ActivityEvent[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EVENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(INITIAL_EVENTS));
  } catch {
    // ignore
  }
  return INITIAL_EVENTS;
};

export const fetchActivityEventsAsync = async (): Promise<ActivityEvent[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('activity_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const events: ActivityEvent[] = data.map((d: any) => ({
          id: d.id,
          type: d.type,
          actor: d.actor,
          target: d.target,
          details: d.details,
          timestamp: d.created_at,
          metadata: d.metadata || undefined
        }));
        try {
          localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
        } catch {
          // ignore
        }
        return events;
      }
    } catch (err) {
      console.warn('fetchActivityEventsAsync error, fallback to local:', err);
    }
  }
  return fetchActivityEvents();
};

export const logActivityEvent = (
  type: ActivityEvent['type'],
  actor: string,
  target: string,
  details: string,
  metadata?: Record<string, any>
): ActivityEvent => {
  const newEvent: ActivityEvent = {
    id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    actor,
    target,
    details,
    timestamp: new Date().toISOString(),
    metadata
  };

  try {
    const existing = fetchActivityEvents();
    const updated = [newEvent, ...existing];
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updated));
  } catch {
    // ignore
  }

  // Cloud sync to Supabase
  const client = getSupabaseClient();
  if (client) {
    void (async () => {
      try {
        const { error } = await client
          .from('activity_events')
          .insert([
            {
              id: newEvent.id,
              type: newEvent.type,
              actor: newEvent.actor,
              target: newEvent.target,
              details: newEvent.details,
              created_at: newEvent.timestamp,
              metadata: newEvent.metadata || {}
            }
          ]);
        if (error) console.warn('Supabase activity event sync warning:', error.message);
      } catch (err) {
        console.warn('Supabase activity event error:', err);
      }
    })();
  }

  return newEvent;
};

// ==============================================================================
// Interview Proposals
// ==============================================================================

export const fetchInterviewProposals = (): InterviewProposal[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INTERVIEWS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
};

export const createInterviewProposal = (
  driverId: string,
  driverName: string,
  carrierName: string,
  contactPerson: string,
  phone: string,
  slots: string[],
  notes?: string
): InterviewProposal => {
  const proposal: InterviewProposal = {
    id: `int-${Date.now()}`,
    driverId,
    driverName,
    carrierName,
    contactPerson,
    phone,
    slots,
    notes,
    status: 'proposed',
    createdAt: new Date().toISOString()
  };

  try {
    const existing = fetchInterviewProposals();
    const updated = [proposal, ...existing];
    localStorage.setItem(STORAGE_KEY_INTERVIEWS, JSON.stringify(updated));
  } catch {
    // ignore
  }

  logActivityEvent(
    'interview_scheduled',
    `${carrierName} (${contactPerson})`,
    `${driverName} (${driverId})`,
    `Proposed ${slots.length} interview windows: ${slots.join(' | ')}`
  );

  return proposal;
};

// ==============================================================================
// Carrier Saved Searches
// ==============================================================================

export const fetchSavedSearches = (): CarrierSavedSearch[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_SEARCHES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_SEARCHES, JSON.stringify(INITIAL_SAVED_SEARCHES));
  } catch {
    // ignore
  }
  return INITIAL_SAVED_SEARCHES;
};

export const fetchSavedSearchesAsync = async (): Promise<CarrierSavedSearch[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('carrier_saved_searches')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const searches: CarrierSavedSearch[] = data.map((d: any) => ({
          id: d.id,
          label: d.label,
          cdlClass: d.cdl_class || undefined,
          equipment: d.equipment || undefined,
          minExperience: d.min_experience ?? 0,
          zip: d.zip || undefined,
          emailAlerts: d.email_alerts ?? true,
          createdAt: d.created_at
        }));
        try {
          localStorage.setItem(STORAGE_KEY_SAVED_SEARCHES, JSON.stringify(searches));
        } catch {
          // ignore
        }
        return searches;
      }
    } catch (err) {
      console.warn('fetchSavedSearchesAsync error, fallback to local:', err);
    }
  }
  return fetchSavedSearches();
};

export const saveCarrierSearch = (
  label: string,
  criteria: {
    cdlClass?: string;
    equipment?: string;
    minExperience?: number;
    zip?: string;
  }
): CarrierSavedSearch => {
  const newSearch: CarrierSavedSearch = {
    id: `ss-${Date.now()}`,
    label,
    cdlClass: criteria.cdlClass,
    equipment: criteria.equipment,
    minExperience: criteria.minExperience,
    zip: criteria.zip,
    emailAlerts: true,
    createdAt: new Date().toISOString()
  };

  try {
    const existing = fetchSavedSearches();
    const updated = [newSearch, ...existing];
    localStorage.setItem(STORAGE_KEY_SAVED_SEARCHES, JSON.stringify(updated));
  } catch {
    // ignore
  }

  // Cloud sync to Supabase
  const client = getSupabaseClient();
  if (client) {
    void (async () => {
      try {
        const { error } = await client
          .from('carrier_saved_searches')
          .insert([
            {
              id: newSearch.id,
              label: newSearch.label,
              cdl_class: newSearch.cdlClass || 'Class A',
              equipment: newSearch.equipment || null,
              min_experience: newSearch.minExperience || 0,
              zip: newSearch.zip || null,
              email_alerts: newSearch.emailAlerts ?? true,
              created_at: newSearch.createdAt
            }
          ]);
        if (error) console.warn('Supabase saved search insert warning:', error.message);
      } catch (err) {
        console.warn('Supabase saved search error:', err);
      }
    })();
  }

  return newSearch;
};

export const deleteSavedSearch = (searchId: string): void => {
  try {
    const existing = fetchSavedSearches();
    const updated = existing.filter((s) => s.id !== searchId);
    localStorage.setItem(STORAGE_KEY_SAVED_SEARCHES, JSON.stringify(updated));
  } catch {
    // ignore
  }

  const client = getSupabaseClient();
  if (client) {
    void (async () => {
      try {
        const { error } = await client
          .from('carrier_saved_searches')
          .delete()
          .eq('id', searchId);
        if (error) console.warn('Supabase saved search delete warning:', error.message);
      } catch (err) {
        console.warn('Supabase saved search delete error:', err);
      }
    })();
  }
};

