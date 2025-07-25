export const PERFORMANCE_THRESHOLDS = {
  MTTA_HOURS: 0.5,  // Poor if > 30 minutes
  MTTI_HOURS: 10,   // Poor if > 10 hours (Created to Completed)
  MTTR_HOURS: 8,    // Poor if > 8 hours
  FTR_PERCENT: 80,    // Poor if < 80%
  SLA_PERCENT: 90,    // Poor if < 90%
};