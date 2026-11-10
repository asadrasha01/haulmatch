import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  escapeCsvCell,
  downloadCsv,
  exportDriverPipelineCsv,
  exportFleetJobOrdersCsv,
  exportPlacementsLedgerCsv
} from './csvExport';
import { INITIAL_DRIVERS } from '../data/mockDrivers';
import type { FleetJobOrder } from '../types';

describe('CSV Export Utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly escapes values with commas, quotes, and newlines', () => {
    expect(escapeCsvCell('Simple Text')).toBe('"Simple Text"');
    expect(escapeCsvCell('Text, with comma')).toBe('"Text, with comma"');
    expect(escapeCsvCell('Quote "Inside"')).toBe('"Quote ""Inside"""');
    expect(escapeCsvCell('Line1\nLine2')).toBe('"Line1\nLine2"');
    expect(escapeCsvCell(null)).toBe('""');
    expect(escapeCsvCell(undefined)).toBe('""');
    expect(escapeCsvCell(1234)).toBe('"1234"');
  });

  it('triggers download with proper blob and filename', () => {
    const mockClick = vi.fn();
    const mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    const mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
    const mockCreateObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const mockRevokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return {
          href: '',
          setAttribute: vi.fn(),
          click: mockClick
        } as any;
      }
      return document.createElement(tagName);
    });

    downloadCsv('test.csv', 'col1,col2\r\nval1,val2');

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('exports driver pipeline CSV with all rows', () => {
    const mockClick = vi.fn();
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return {
          href: '',
          setAttribute: vi.fn(),
          click: mockClick
        } as any;
      }
      return document.createElement(tagName);
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

    expect(() => exportDriverPipelineCsv(INITIAL_DRIVERS)).not.toThrow();
    expect(mockClick).toHaveBeenCalled();
  });

  it('exports fleet job orders CSV without error', () => {
    const mockClick = vi.fn();
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return {
          href: '',
          setAttribute: vi.fn(),
          click: mockClick
        } as any;
      }
      return document.createElement(tagName);
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

    const mockOrders: FleetJobOrder[] = [
      {
        id: 'JO-1234',
        companyName: 'Apex Transport',
        dotNumber: '1234567',
        mcNumber: 'MC-765432',
        contactName: 'Jane Smith',
        contactTitle: 'Safety Director',
        contactPhone: '(555) 123-4567',
        contactEmail: 'jane@apex.com',
        driversNeeded: 3,
        equipmentType: ['Dry Van', 'Reefer'],
        transmission: 'Automatic',
        minExperienceYears: 2,
        maxViolations3Years: 1,
        hometimeCadence: 'Weekly',
        payPerMile: '$0.75 CPM',
        avgWeeklyMiles: '2800',
        guaranteedWeeklyMin: '$1500',
        petPolicy: true,
        passengerPolicy: false,
        operatingLanes: 'Regional Midwest',
        createdAt: '2026-11-10T00:00:00Z'
      }
    ];

    expect(() => exportFleetJobOrdersCsv(mockOrders)).not.toThrow();
    expect(mockClick).toHaveBeenCalled();
  });

  it('exports placements and escrow ledger CSV without error', () => {
    const mockClick = vi.fn();
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return {
          href: '',
          setAttribute: vi.fn(),
          click: mockClick
        } as any;
      }
      return document.createElement(tagName);
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

    expect(() => exportPlacementsLedgerCsv(INITIAL_DRIVERS)).not.toThrow();
    expect(mockClick).toHaveBeenCalled();
  });
});
