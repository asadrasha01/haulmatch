import { describe, expect, it, beforeEach } from 'vitest';
import {
  fetchActivityEvents,
  logActivityEvent,
  fetchInterviewProposals,
  createInterviewProposal,
  fetchSavedSearches,
  saveCarrierSearch,
  deleteSavedSearch
} from './activityEvents';

describe('activityEvents service — Audit Feed, Interviews & Saved Searches', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('logs and retrieves activity events in reverse chronological order', () => {
    const event = logActivityEvent(
      'carrier_unlocked',
      'Swiftline Logistics (Robert Miller)',
      'Marcus Vance (CDL-1001)',
      'Executed 90-Day Contingency Placement Contract.'
    );

    expect(event.id).toBeDefined();
    expect(event.type).toBe('carrier_unlocked');

    const events = fetchActivityEvents();
    expect(events[0].id).toBe(event.id);
    expect(events[0].target).toContain('Marcus Vance');
  });

  it('creates an on-platform interview proposal with 3 slots and logs audit event', () => {
    const proposal = createInterviewProposal(
      'CDL-1001',
      'Marcus Vance',
      'Swiftline Global Logistics',
      'Robert Miller',
      '(214) 555-0187',
      ['Tomorrow at 10:00 AM CST', 'Tomorrow at 2:30 PM CST', 'Friday at 9:00 AM CST'],
      'Texas dedicated route'
    );

    expect(proposal.slots.length).toBe(3);
    expect(proposal.driverId).toBe('CDL-1001');

    const proposals = fetchInterviewProposals();
    expect(proposals.length).toBe(1);
    expect(proposals[0].id).toBe(proposal.id);

    const audit = fetchActivityEvents();
    expect(audit[0].type).toBe('interview_scheduled');
  });

  it('saves and deletes carrier search alert presets', () => {
    const saved = saveCarrierSearch('Dallas Reefer 3+ Yrs', {
      cdlClass: 'Class A',
      equipment: 'Reefer',
      minExperience: 3,
      zip: '75201'
    });

    expect(saved.label).toBe('Dallas Reefer 3+ Yrs');
    expect(saved.emailAlerts).toBe(true);

    let searches = fetchSavedSearches();
    expect(searches.some((s) => s.id === saved.id)).toBe(true);

    deleteSavedSearch(saved.id);
    searches = fetchSavedSearches();
    expect(searches.some((s) => s.id === saved.id)).toBe(false);
  });
});

