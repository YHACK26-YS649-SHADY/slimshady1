/**
 * NE-SENTINEL MULTILINGUAL ALERT & EMERGENCY DISPATCH ENGINE
 * ==========================================================
 * Formats standardized NDMA CAP-compliant alerts across 6 regional languages:
 * English, Hindi (हिन्दी), Assamese (অসমীয়া), Khasi (Ka Ktien Khasi), Mizo, and Bengali (বাংলা).
 */

import { RiskEvaluationResult, ZoneData } from '../models/risk_model.js';

export interface MultilingualAlertContent {
  en: { title: string; body: string; instruction: string };
  hi: { title: string; body: string; instruction: string };
  as: { title: string; body: string; instruction: string };
  kha: { title: string; body: string; instruction: string };
  mz: { title: string; body: string; instruction: string };
  bn: { title: string; body: string; instruction: string };
}

export interface EarlyWarningAlert {
  id: string;
  zoneId: string;
  zoneName: string;
  state: string;
  riskScore: number;
  riskLevel: 'Moderate' | 'High' | 'Critical';
  timestamp: string;
  keyDriverSummary: string;
  affectedHighways: string[];
  vulnerableVillages: string[];
  multilingual: MultilingualAlertContent;
  status: 'active' | 'acknowledged' | 'escalated' | 'resolved';
  responsePriorityScore: number;
  actionsTaken: string[];
}

export class AlertService {
  private alerts: Map<string, EarlyWarningAlert> = new Map();
  private lastKnownRiskLevels: Map<string, string> = new Map();

  /**
   * Evaluates if an alert should be created or updated for a zone.
   * Returns alert object and boolean indicating if it is newly triggered or escalated.
   */
  public processZoneEvaluation(
    zone: ZoneData,
    evalResult: RiskEvaluationResult
  ): { alert: EarlyWarningAlert | null; isNewOrEscalated: boolean } {
    const prevLevel = this.lastKnownRiskLevels.get(zone.id) || 'Low';
    this.lastKnownRiskLevels.set(zone.id, evalResult.riskLevel);

    // Only create alert if Moderate, High, or Critical
    if (evalResult.riskLevel === 'Low') {
      return { alert: null, isNewOrEscalated: false };
    }

    const existingAlert = this.alerts.get(zone.id);
    const isLevelEscalated =
      (prevLevel === 'Low' && (evalResult.riskLevel === 'High' || evalResult.riskLevel === 'Critical')) ||
      (prevLevel === 'Moderate' && (evalResult.riskLevel === 'High' || evalResult.riskLevel === 'Critical')) ||
      (prevLevel === 'High' && evalResult.riskLevel === 'Critical');

    const isNew = !existingAlert;
    const isNewOrEscalated = isNew || isLevelEscalated;

    const alertId = existingAlert ? existingAlert.id : `alert-${zone.id}-${Date.now().toString().slice(-6)}`;
    const driverSummary = evalResult.keyDrivers.slice(0, 2).join('; ');
    const multilingual = this.generateMultilingualContent(zone, evalResult);

    const alert: EarlyWarningAlert = {
      id: alertId,
      zoneId: zone.id,
      zoneName: zone.name,
      state: zone.state,
      riskScore: evalResult.riskScore,
      riskLevel: evalResult.riskLevel as 'Moderate' | 'High' | 'Critical',
      timestamp: existingAlert ? existingAlert.timestamp : new Date().toISOString(),
      keyDriverSummary: driverSummary,
      affectedHighways: zone.critical_infrastructure,
      vulnerableVillages: zone.vulnerable_villages,
      multilingual,
      status: existingAlert ? existingAlert.status : 'active',
      responsePriorityScore: evalResult.responsePriorityScore,
      actionsTaken: existingAlert ? existingAlert.actionsTaken : []
    };

    // Store recent active alerts
    this.alerts.set(zone.id, alert);
    return { alert, isNewOrEscalated };
  }

  public getActiveAlerts(): EarlyWarningAlert[] {
    return Array.from(this.alerts.values())
      .filter(a => a.status !== 'resolved')
      .sort((a, b) => b.responsePriorityScore - a.responsePriorityScore);
  }

  public getAlertById(id: string): EarlyWarningAlert | undefined {
    return Array.from(this.alerts.values()).find(a => a.id === id);
  }

  public updateAlertAction(zoneId: string, actionName: string, newStatus?: 'active' | 'acknowledged' | 'escalated' | 'resolved'): EarlyWarningAlert | null {
    const alert = this.alerts.get(zoneId);
    if (!alert) return null;

    alert.actionsTaken.push(`[${new Date().toLocaleTimeString()}] ${actionName}`);
    if (newStatus) {
      alert.status = newStatus;
    }
    this.alerts.set(zoneId, alert);
    return alert;
  }

  /**
   * Generates localized warning templates in 6 regional languages
   */
  private generateMultilingualContent(
    zone: ZoneData,
    evalResult: RiskEvaluationResult
  ): MultilingualAlertContent {
    const isCritical = evalResult.riskLevel === 'Critical';
    const urgencyWordEn = isCritical ? 'RED ALERT: IMMINENT LANDSLIDE HAZARD' : 'HIGH LANDSLIDE WARNING';
    const urgencyWordHi = isCritical ? 'रेड अलर्ट: भूस्खलन का गंभीर खतरा' : 'हाई अलर्ट: भूस्खलन चेतावनी';
    const urgencyWordAs = isCritical ? 'ৰেড এলাৰ্ট: ভয়ংকৰ ভূমিস্খলনৰ আশংকা' : 'সাৱধানবাণী: ভূমিস্খলনৰ সতৰ্কতা';
    const urgencyWordKha = isCritical ? 'JINGMAHAM BASA: KA JINGKHYLLEM KA KHNDEW BA KHLAAIN' : 'JINGMAHAM: KA JINGKHYLLEM KHNDEW';
    const urgencyWordMz = isCritical ? 'RED ALERT: LEITLHAH THEIHNA HLAUHZAWNNA SANG' : 'INRALRINNA SANG: LEITLHAH THEIHNA';
    const urgencyWordBn = isCritical ? 'রেড অ্যালার্ট: মারাত্মক ভূমিধসের আশঙ্কা' : 'সতর্কবার্তা: তীব্র ভূমিধস সতর্কতা';

    const roadStr = zone.critical_infrastructure[0] || 'State Highway';
    const villagesStr = zone.vulnerable_villages.slice(0, 2).join(', ');

    return {
      en: {
        title: `${urgencyWordEn} — ${zone.name} (${zone.state})`,
        body: `Disaster Management Authority reports critical risk (${evalResult.riskScore}/100) due to ${evalResult.keyDrivers[0] || 'heavy precipitation'}. Roads at risk: ${roadStr}. Affected settlements: ${villagesStr}.`,
        instruction: isCritical
          ? 'EVACUATE downhill and valley settlements immediately. Avoid travelling on mountain passes. Keep emergency battery and documents ready.'
          : 'Stay on high alert. Move away from steep unstable slopes. Contact local DDMA control room for transit advisories.'
      },
      hi: {
        title: `${urgencyWordHi} — ${zone.name} (${zone.state})`,
        body: `आपदा प्रबंधन प्राधिकरण ने ${evalResult.keyDrivers[0] || 'भारी बारिश'} के कारण गंभीर जोखिम (${evalResult.riskScore}/100) दर्ज किया है। प्रभावित राजमार्ग: ${roadStr}। संवेदनशील गांव: ${villagesStr}।`,
        instruction: isCritical
          ? 'ढलान और घाटी वाले क्षेत्रों से तुरंत सुरक्षित स्थानों पर जाएं। पहाड़ी मार्गों पर यात्रा न करें। आपातकालीन नंबर 112 / 1070 पर संपर्क करें।'
          : 'सतर्क रहें। अस्थिर ढलानों से दूर रहें और स्थानीय प्रशासन के निर्देशों का पालन करें।'
      },
      as: {
        title: `${urgencyWordAs} — ${zone.name} (${zone.state})`,
        body: `দুর্যোগ ব্যৱস্থাপনা প্ৰাধিকৰণে প্ৰকাশ কৰিছে যে ${evalResult.keyDrivers[0] || 'প্ৰৱল বৃষ্টিপাতৰ'} বাবে সংকটজনক বিপদ (${evalResult.riskScore}/100) দেখা দিছে। ক্ষতিগ্ৰস্ত পথ: ${roadStr}। স্পৰ্শকাতৰ অঞ্চল: ${villagesStr}।`,
        instruction: isCritical
          ? 'তৎক্ষণাত পাহাৰৰ নামনি আৰু উপত্যকাৰ বাসস্থান এৰি সুৰক্ষিত আশ্ৰয়স্থললৈ যাওক। পাহাৰীয়া পথত যাতায়ত বন্ধ কৰক। জৰুৰীকালীন ১০৭০ নম্বৰত যোগাযোগ কৰক।'
          : 'সতৰ্ক হৈ থাকক। দুৰ্বল পাহাৰৰ কাষৰ পৰা আতঁৰি থাকক আৰু জিলা প্ৰশাসনৰ নিৰ্দেশনা মানি চলক।'
      },
      kha: {
        title: `${urgencyWordKha} — ${zone.name} (${zone.state})`,
        body: `Ka tnat Disaster Management ka pyntip ba don ka jingma kaba khraw (${evalResult.riskScore}/100) namar ba slap jur. Ki surok ba don ha ka jingma: ${roadStr}. Ki shnong ba don jingma: ${villagesStr}.`,
        instruction: isCritical
          ? 'Kynriah noh mardor sha ki jaka ba shngain. Ym bit ban leit jingleit ha ki surok lum. Phone sha 112 lane 1070.'
          : 'Shong ha ka jingpahara. Kieng kynti na ki jaka them bad ki kynroh ba lah ban khyllem.'
      },
      mz: {
        title: `${urgencyWordMz} — ${zone.name} (${zone.state})`,
        body: `Disaster Management Authority chuan ruah sur nasa lutuk avangin hlauhawm (${evalResult.riskScore}/100) a thleng thei tih an puang. Kawngpui hlauhawm: ${roadStr}. Khua tarlante: ${villagesStr}.`,
        instruction: isCritical
          ? 'Khua leh in hmun hniam/tlangkam atangin himna hmunah chhuak nghal rawh u. Tlang kawngah zin chhuak suh u. Helpline 112 / 1070 bia rawh u.'
          : 'Fimkhur takin awm ula, lei tawlh theihna hmun atangin inthiarfihlim rawh u.'
      },
      bn: {
        title: `${urgencyWordBn} — ${zone.name} (${zone.state})`,
        body: `দুর্যোগ ব্যবস্থাপনা কর্তৃপক্ষ জানিয়েছে যে অতিভারী বর্ষণের কারণে চরম ঝুঁকি (${evalResult.riskScore}/100) সৃষ্টি হয়েছে। ঝুঁকিপূর্ণ সড়ক: ${roadStr}। ক্ষতিগ্রস্ত গ্রামসমূহ: ${villagesStr}।`,
        instruction: isCritical
          ? 'অবিলম্বে উপত্যকা ও ঢালু অঞ্চল ত্যাগ করে নিরাপদ আশ্রয়ে যান। পাহাড়ি রাস্তায় ভ্রমণ সম্পূর্ণ বন্ধ রাখুন। কন্ট্রোল রুমে যোগাযোগ করুন।'
          : 'সতর্ক থাকুন। ঢালু ও ফাটলযুক্ত পাহাড়ের পাশ থেকে দূরে থাকুন এবং সরকারি নির্দেশাবলি মেনে চলুন।'
      }
    };
  }
}

export const alertServiceInstance = new AlertService();
