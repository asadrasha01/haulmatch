import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchDriverOffers,
  acceptCarrierOffer,
  declineCarrierOffer
} from './driverOffers';

describe('driverOffers service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('initializes and returns default carrier offers', () => {
    const offers = fetchDriverOffers();
    expect(offers.length).toBeGreaterThan(0);
    expect(offers[0].carrierName).toContain('Swiftline');
    expect(offers[0].status).toBe('pending');
  });

  it('accepts an offer with a selected interview slot and logs activity', () => {
    const offers = fetchDriverOffers();
    const offerToAccept = offers[0];

    const result = acceptCarrierOffer(
      offerToAccept.id,
      'Thursday at 2:00 PM CST',
      'Marcus Vance'
    );

    expect(result.success).toBe(true);

    const updatedOffers = fetchDriverOffers();
    const matched = updatedOffers.find((o) => o.id === offerToAccept.id);
    expect(matched?.status).toBe('accepted');
    expect(matched?.selectedSlot).toBe('Thursday at 2:00 PM CST');
  });

  it('declines an offer and updates its status', () => {
    const offers = fetchDriverOffers();
    const offerToDecline = offers[1];

    const result = declineCarrierOffer(offerToDecline.id, 'Marcus Vance');
    expect(result.success).toBe(true);

    const updatedOffers = fetchDriverOffers();
    const matched = updatedOffers.find((o) => o.id === offerToDecline.id);
    expect(matched?.status).toBe('declined');
  });
});
