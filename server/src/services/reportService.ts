/**
 * NE-SENTINEL CROWDSOURCED FIELD REPORT SERVICE
 * =============================================
 * Handles citizen & field-worker geological hazard reporting.
 * Feeds directly into real-time risk calibration as ground-truth evidence.
 */

export interface FieldReport {
  id: string;
  zoneId?: string;
  latitude: number;
  longitude: number;
  reporterName: string;
  reporterRole: 'Citizen' | 'Aapda Mitra Volunteer' | 'Forest Guard' | 'Highway Patrol' | 'SDRF Officer';
  severity: 'Minor Slump' | 'Moderate Cracking' | 'Severe Fissure' | 'Active Debris Flow / Mudslide';
  crackWidthCm?: number;
  hasWaterSeepage: boolean;
  hasRetainingWallDamage: boolean;
  affectedRoadName?: string;
  description: string;
  photoUrl?: string;
  timestamp: string;
  isVerified: boolean;
  syncedFromOffline: boolean;
}

export class ReportService {
  private reports: FieldReport[] = [];

  constructor() {
    // Seed initial realistic ground reports from field volunteers
    this.reports = [
      {
        id: "rep-001",
        zoneId: "ner-sk-01",
        latitude: 27.3450,
        longitude: 88.6120,
        reporterName: "Tenzing Lepcha",
        reporterRole: "Aapda Mitra Volunteer",
        severity: "Severe Fissure",
        crackWidthCm: 15,
        hasWaterSeepage: true,
        hasRetainingWallDamage: true,
        affectedRoadName: "NH-10 Ranipool Bypass",
        description: "Noticed fresh 15cm tensile ground fissure expanding near road embankment with muddy water weeping through toe wall.",
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        isVerified: true,
        syncedFromOffline: false
      },
      {
        id: "rep-002",
        zoneId: "ner-as-01",
        latitude: 25.1680,
        longitude: 93.0210,
        reporterName: "Bishwajit Barman",
        reporterRole: "Highway Patrol",
        severity: "Active Debris Flow / Mudslide",
        crackWidthCm: 30,
        hasWaterSeepage: true,
        hasRetainingWallDamage: true,
        affectedRoadName: "NH-54E Mahur Hill Cut",
        description: "Small mud slide of roughly 40 cubic meters already slid onto the left lane. Continuous slurry descending from upper terrace.",
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        isVerified: true,
        syncedFromOffline: true
      },
      {
        id: "rep-003",
        zoneId: "ner-mz-01",
        latitude: 23.7310,
        longitude: 92.7190,
        reporterName: "Lalrinsanga",
        reporterRole: "Citizen",
        severity: "Moderate Cracking",
        crackWidthCm: 8,
        hasWaterSeepage: false,
        hasRetainingWallDamage: true,
        affectedRoadName: "Durtlang Ridge residential path",
        description: "Retaining wall bulged outward by ~10cm after continuous morning rain. Cracks visible on adjacent concrete footpath.",
        timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        isVerified: true,
        syncedFromOffline: false
      }
    ];
  }

  public getAllReports(): FieldReport[] {
    return [...this.reports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getReportsForZone(zoneId: string): FieldReport[] {
    return this.reports.filter(r => r.zoneId === zoneId);
  }

  public addReport(reportData: Omit<FieldReport, 'id' | 'timestamp' | 'isVerified'>): FieldReport {
    const newReport: FieldReport = {
      ...reportData,
      id: `rep-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      isVerified: reportData.reporterRole !== 'Citizen' // Auto-verify official volunteers
    };

    this.reports.unshift(newReport);
    return newReport;
  }

  public toggleVerification(reportId: string): FieldReport | null {
    const report = this.reports.find(r => r.id === reportId);
    if (!report) return null;
    report.isVerified = !report.isVerified;
    return report;
  }

  public getZoneGroundEvidence(zoneId: string): { reportCount: number; hasSevere: boolean } {
    const zoneReports = this.reports.filter(r => r.zoneId === zoneId && r.isVerified);
    const hasSevere = zoneReports.some(r => r.severity === 'Severe Fissure' || r.severity === 'Active Debris Flow / Mudslide');
    return {
      reportCount: zoneReports.length,
      hasSevere
    };
  }
}

export const reportServiceInstance = new ReportService();
