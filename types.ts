export type RowData = string[];

export interface KpiMetrics {
  mtta: number;
  mtti: number;
  mttr: number;
  ftr: number;
  sla: number;
  totalTickets: number;
  pending: number;
  installationPending?: number;
  faultPending?: number;
  failedInstallations?: number;
  failedFaults?: number;
  cancelledInstallations?: number;
  cancelledFaults?: number;
  repeatTruckRolls?: number;
  relocations?: number;
  reassociations?: number;
  completedInstallations?: number;
  completedFaults?: number;
}

export interface DplusKpiMetric {
  value: number;
  count: number;
}

export interface DplusKpiMetrics {
  overallMtti: DplusKpiMetric;
  overallMttr: DplusKpiMetric;
}

export interface DplusPendingJobs {
  installations: PendingJob[];
  faults: PendingJob[];
}

export interface MonthlyData {
  month: string;
  mttr: number;
  mtti: number;
  volume: number;
}

export interface BreakdownItem {
  name: string;
  count: number;
}

export interface CancellationReasons {
  installations: BreakdownItem[];
  faults: BreakdownItem[];
}

export interface BreakdownData {
  technician: BreakdownItem[];
  category: BreakdownItem[];
  subCategory: BreakdownItem[];
}

export interface InvalidRow {
  rowData: RowData;
  reason: string;
}

export interface PendingJob {
  reqId: string;
  technician: string;
  category: string;
  createdTime: string;
  pendingDurationHours: number;
  rowData: RowData;
}

export interface HardwareUsageItem {
  name: string;
  percentage: number;
  totalUsed: number;
}

export interface HardwareUsage {
  installations: HardwareUsageItem[];
  faults: HardwareUsageItem[];
}

export interface DashboardData {
  kpis: KpiMetrics;
  monthlyData: MonthlyData[];
  breakdowns: BreakdownData;
  invalidRows: InvalidRow[];
  headers: string[];
  allRows: RowData[];
  allTechnicians: string[];
  allCategories: string[];
  allMonths: string[];
  pendingJobs: PendingJob[];
  dplusKpis?: DplusKpiMetrics;
  dplusPendingJobs?: DplusPendingJobs;
  dplusCancellationReasons?: CancellationReasons;
  hardwareUsage?: HardwareUsage;
}