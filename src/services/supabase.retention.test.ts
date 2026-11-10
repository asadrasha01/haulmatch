import { beforeEach, describe, expect, it } from 'vitest';
import {
  disburseRetentionBonus,
  fetchAllDrivers,
  fetchFleetJobOrders,
  fetchProfile,
  getCurrentSession,
  isSupabaseConfigured,
  saveFleetJobOrder,
  sendRetentionSmsPulse,
  signInWithEmail,
  signOutUser,
  signUpWithEmail
} from './supabase';

describe('retention, job orders & auth persistence (local fallback)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('confirms no live Supabase client is configured in test environment', () => {
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

  it('saveFleetJobOrder and fetchFleetJobOrders persist and retrieve fleet intake orders locally', async () => {
    const initial = await fetchFleetJobOrders();
    expect(initial.length).toBeGreaterThanOrEqual(1);

    const newOrder = {
      ...initial[0],
      id: 'JO-9999',
      companyName: 'Apex Freight Lines LLC',
      driversNeeded: 14
    };
    const saveRes = await saveFleetJobOrder(newOrder);
    expect(saveRes.success).toBe(true);

    const after = await fetchFleetJobOrders();
    const found = after.find((o) => o.id === 'JO-9999');
    expect(found?.companyName).toBe('Apex Freight Lines LLC');
    expect(found?.driversNeeded).toBe(14);
  });

  it('registers a user, persists session & profile, signs out, and signs back in', async () => {
    const signUpRes = await signUpWithEmail(
      'dispatch@swiftline.com',
      'Secret123!',
      'carrier',
      'Swiftline Logistics'
    );
    expect(signUpRes.success).toBe(true);
    expect(signUpRes.autoSignedIn).toBe(true);

    const sessionAfterSignUp = await getCurrentSession();
    expect(sessionAfterSignUp?.user.email).toBe('dispatch@swiftline.com');

    const profile = await fetchProfile(sessionAfterSignUp!.user.id);
    expect(profile?.role).toBe('carrier');
    expect(profile?.companyName).toBe('Swiftline Logistics');

    // Duplicate registration should be rejected
    const dupRes = await signUpWithEmail('dispatch@swiftline.com', 'Secret123!', 'carrier');
    expect(dupRes.success).toBe(false);

    // Sign out
    await signOutUser();
    expect(await getCurrentSession()).toBeNull();

    // Wrong password should be rejected
    const badLogin = await signInWithEmail('dispatch@swiftline.com', 'WrongPass');
    expect(badLogin.success).toBe(false);

    // Valid sign in restores session
    const goodLogin = await signInWithEmail('dispatch@swiftline.com', 'Secret123!');
    expect(goodLogin.success).toBe(true);
    const restoredSession = await getCurrentSession();
    expect(restoredSession?.user.email).toBe('dispatch@swiftline.com');
  });
});
