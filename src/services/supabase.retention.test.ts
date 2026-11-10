import { beforeEach, describe, expect, it } from 'vitest';
import {
  disburseRetentionBonus,
  fetchAllDrivers,
  isSupabaseConfigured,
  sendRetentionSmsPulse
} from './supabase';

// These tests exercise the "no live Supabase project connected" path, which
// is the default/deterministic state in CI and in this test environment
// (no VITE_SUPABASE_URL is set, and localStorage starts empty in every
// jsdom test run). That path is the one that replaced the old `alert()`
// no-ops: it durably writes the pulse-check/bonus-disbursed state into the
// localStorage-backed driver store rather than just popping a dialog.
describe('retention persistence (no Supabase project configured)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('confirms no live Supabase client is configured in this test environment', () => {
    // Sanity check on the assumption the rest of this file relies on. If this
    // ever fails, it means a real project URL leaked into the test env and
    // the tests below would be hitting a real backend instead of the local
    // fallback path.
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('sendRetentionSmsPulse resolves successfully with a real timestamp', async () => {
    const before = Date.now();
    const result = await sendRetentionSmsPulse('CDL-9943');
    const after = Date.now();

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    const sentAtMs = new Date(result.sentAt).getTime();
    expect(sentAtMs).toBeGreaterThanOrEqual(before);
    expect(sentAtMs).toBeLessThanOrEqual(after);
  });

  it('disburseRetentionBonus marks the matching driver as bonus-paid in the local store', async () => {
    // Seed the local driver store the same way fetchAllDrivers would on
    // first run, so we know exactly what's there before disbursing.
    const driversBefore = await fetchAllDrivers();
    const target = driversBefore.find((d) => d.id === 'CDL-9943');
    expect(target?.placementDetails?.driverBonusPaid).toBe(false);

    const result = await disburseRetentionBonus('CDL-9943');
    expect(result.success).toBe(true);

    const driversAfter = await fetchAllDrivers();
    const updated = driversAfter.find((d) => d.id === 'CDL-9943');
    expect(updated?.placementDetails?.driverBonusPaid).toBe(true);
  });

  it('disburseRetentionBonus does not affect drivers other than the one targeted', async () => {
    await fetchAllDrivers();
    await disburseRetentionBonus('CDL-9943');

    const drivers = await fetchAllDrivers();
    const other = drivers.find((d) => d.id === 'CDL-4012');
    // CDL-4012 is seeded with driverBonusPaid: true already in the mock
    // data; it should remain true (unchanged by CDL-9943's disbursement),
    // not be reset or corrupted by the update.
    expect(other?.placementDetails?.driverBonusPaid).toBe(true);
  });
});
