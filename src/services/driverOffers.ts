import type { CarrierOffer } from '../types';
import { logActivityEvent } from './activityEvents';
import { getSupabaseClient } from './supabase';

const STORAGE_KEY_OFFERS = 'haulmatch_driver_offers_v1';

export const INITIAL_OFFERS: CarrierOffer[] = [
  {
    id: 'off-8901',
    driverId: 'CDL-1001',
    carrierName: 'Swiftline Global Logistics LLC',
    dotNumber: '3819204',
    mcNumber: 'MC-149201',
    contactName: 'Robert Miller',
    contactPhone: '(214) 555-0199',
    contactEmail: 'r.miller@swiftlinelogistics.com',
    laneDescription: 'Texas Triangle to Midwest Temperature-Controlled Corridors (I-35 / I-40)',
    equipmentType: '53ft Reefer (2025 Kenworth T680 Automatics)',
    payPerMile: '$0.80 CPM',
    weeklyMinGuarantee: '$1,650/week guaranteed',
    hometimeCadence: 'Weekly 34-48h home reset guaranteed',
    status: 'pending',
    interviewSlots: [
      'Tomorrow at 10:00 AM CST',
      'Thursday at 2:00 PM CST',
      'Friday at 11:30 AM CST'
    ],
    signingBonus: '$2,000 Transition Bonus ($1,000 1st dispatch + $1,000 Day 30)',
    petPolicy: true,
    passengerPolicy: true,
    createdAt: '2026-11-10T14:20:00Z'
  },
  {
    id: 'off-8902',
    driverId: 'CDL-1001',
    carrierName: 'Apex Dedicated Freight Lines',
    dotNumber: '4019283',
    mcNumber: 'MC-294019',
    contactName: 'Sarah Jenkins',
    contactPhone: '(214) 555-0144',
    contactEmail: 'recruiting@apextransit.com',
    laneDescription: 'Regional Gulf Coast & Texas Industrial Flatbed Runs',
    equipmentType: 'Flatbed & Step Deck (Pre-strapped / 90% No-Tarp)',
    payPerMile: '$0.84 CPM',
    weeklyMinGuarantee: '$1,750/week guaranteed',
    hometimeCadence: 'Home every weekend (Friday night to Monday morning)',
    status: 'pending',
    interviewSlots: [
      'Wednesday at 1:00 PM CST',
      'Friday at 9:00 AM CST'
    ],
    signingBonus: '$1,500 Clean MVR Safety Sign-On',
    petPolicy: false,
    passengerPolicy: true,
    createdAt: '2026-11-09T18:10:00Z'
  },
  {
    id: 'off-8903',
    driverId: 'CDL-6319',
    carrierName: 'Lone Star Dedicated Logistics',
    dotNumber: '2991048',
    mcNumber: 'MC-389102',
    contactName: 'Dave Peterson',
    contactPhone: '(512) 555-0182',
    contactEmail: 'dispatch@lonestar-haul.com',
    laneDescription: 'Dedicated Texas to Chicago & Atlanta Dry Van Corridors',
    equipmentType: '53ft Dry Van (85% Drop & Hook / 100% No-Touch Freight)',
    payPerMile: '$0.76 CPM',
    weeklyMinGuarantee: '$1,550/week guaranteed',
    hometimeCadence: 'Bi-weekly reset (3 full days home)',
    status: 'pending',
    interviewSlots: [
      'Thursday at 11:00 AM CST',
      'Friday at 3:00 PM CST'
    ],
    signingBonus: '$1,200 Fuel & Mileage Performance Bonus',
    petPolicy: true,
    passengerPolicy: false,
    createdAt: '2026-11-10T09:45:00Z'
  }
];

export const fetchDriverOffers = (driverId?: string): CarrierOffer[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OFFERS);
    if (raw) {
      const parsed: CarrierOffer[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (!driverId) return parsed;
        const matching = parsed.filter(
          (o) => o.driverId === driverId || o.driverId === 'CDL-1001'
        );
        return matching.length > 0 ? matching : parsed;
      }
    }
  } catch {
    // ignore
  }

  // Seed default offers
  try {
    localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(INITIAL_OFFERS));
  } catch {
    // ignore
  }

  if (!driverId) return INITIAL_OFFERS;
  const filtered = INITIAL_OFFERS.filter(
    (o) => o.driverId === driverId || o.driverId === 'CDL-1001'
  );
  return filtered.length > 0 ? filtered : INITIAL_OFFERS;
};

export const fetchDriverOffersAsync = async (driverId?: string): Promise<CarrierOffer[]> => {
  const client = getSupabaseClient();
  if (client) {
    try {
      let query = client.from('carrier_offers').select('*').order('created_at', { ascending: false });
      if (driverId) {
        query = query.or(`driver_id.eq.${driverId},driver_id.eq.CDL-1001`);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const mapped: CarrierOffer[] = data.map((d: any) => ({
          id: d.id,
          driverId: d.driver_id,
          carrierName: d.carrier_name,
          dotNumber: d.dot_number || undefined,
          mcNumber: d.mc_number || undefined,
          contactName: d.contact_name,
          contactPhone: d.contact_phone || undefined,
          contactEmail: d.contact_email || undefined,
          laneDescription: d.lane_description,
          equipmentType: d.equipment_type,
          payPerMile: d.pay_per_mile,
          weeklyMinGuarantee: d.weekly_min_guarantee,
          hometimeCadence: d.hometime_cadence,
          status: d.status,
          interviewSlots: d.interview_slots || [],
          acceptedSlot: d.accepted_slot || undefined,
          signingBonus: d.signing_bonus || undefined,
          petPolicy: d.pet_policy ?? true,
          passengerPolicy: d.passenger_policy ?? true,
          createdAt: d.created_at
        }));
        try {
          localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(mapped));
        } catch {
          // ignore
        }
        return mapped;
      }
    } catch (err) {
      console.warn('fetchDriverOffersAsync error, using local fallback:', err);
    }
  }
  return fetchDriverOffers(driverId);
};

export const acceptCarrierOffer = (
  offerId: string,
  selectedSlot?: string,
  driverName: string = 'Candidate Driver'
): { success: boolean; error?: string } => {
  try {
    const allOffers = fetchDriverOffers();
    const targetOffer = allOffers.find((o) => o.id === offerId);
    if (!targetOffer) return { success: false, error: 'Offer not found' };

    const slot = selectedSlot || targetOffer.interviewSlots?.[0] || 'Phone Interview Window Confirmed';
    const updated = allOffers.map((o) =>
      o.id === offerId
        ? {
            ...o,
            status: 'accepted' as const,
            selectedSlot: slot
          }
        : o
    );

    localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(updated));

    // Async sync to Supabase
    const client = getSupabaseClient();
    if (client) {
      void (async () => {
        try {
          const { error } = await client
            .from('carrier_offers')
            .update({
              status: 'accepted',
              accepted_slot: slot,
              updated_at: new Date().toISOString()
            })
            .eq('id', offerId);
          if (error) console.warn('Supabase offer update warning:', error.message);
        } catch (err) {
          console.warn('Supabase offer update error:', err);
        }
      })();
    }

    logActivityEvent(
      'interview_scheduled',
      driverName,
      targetOffer.carrierName,
      `Candidate accepted offer / interview window: "${slot}". Carrier safety recruiter notified.`,
      { offerId, selectedSlot: slot }
    );

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to accept offer' };
  }
};

export const declineCarrierOffer = (
  offerId: string,
  driverName: string = 'Candidate Driver'
): { success: boolean; error?: string } => {
  try {
    const allOffers = fetchDriverOffers();
    const targetOffer = allOffers.find((o) => o.id === offerId);
    if (!targetOffer) return { success: false, error: 'Offer not found' };

    const updated = allOffers.map((o) =>
      o.id === offerId
        ? {
            ...o,
            status: 'declined' as const
          }
        : o
    );

    localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(updated));

    // Async sync to Supabase
    const client = getSupabaseClient();
    if (client) {
      void (async () => {
        try {
          const { error } = await client
            .from('carrier_offers')
            .update({
              status: 'declined',
              updated_at: new Date().toISOString()
            })
            .eq('id', offerId);
          if (error) console.warn('Supabase offer decline warning:', error.message);
        } catch (err) {
          console.warn('Supabase offer decline error:', err);
        }
      })();
    }

    logActivityEvent(
      'candidate_placed',
      driverName,
      targetOffer.carrierName,
      `Candidate politely declined placement offer for ${targetOffer.laneDescription}.`,
      { offerId }
    );

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to decline offer' };
  }
};

