import type { DashboardData, KpiMetrics, DplusKpiMetrics, RowData, MonthlyData, BreakdownData, InvalidRow, PendingJob, DplusPendingJobs, CancellationReasons, HardwareUsage, BreakdownItem, HardwareUsageItem } from '../types';

const parseDplusDate = (dateStr: string): Date | null => {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') return null;
  const parts = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2}):(\d{2})/);
  if (!parts) {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
  }
  const isoStr = `${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}T${parts[4]}:${parts[5]}:${parts[6]}`;
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? null : d;
};

const getDepartmentName = (rawDepartment: string): 'St. Lucia Installations' | 'St. Lucia Fault Repair External' => {
    const lowerDept = (rawDepartment || '').trim().toLowerCase();
    if (lowerDept.includes('fault')) {
        return 'St. Lucia Fault Repair External';
    }
    return 'St. Lucia Installations';
};

export const processDplusData = (
  allRowsData: RowData[],
  filters?: { technician?: string; category?: string; month?: string }
): DashboardData => {
  let headerRowIndex = -1;
  const KEY_HEADERS_TO_FIND = ["Engineers", "JobNumber", "JobStatusFull", "DepartmentName"];

  for (let i = 0; i < allRowsData.length && i < 15; i++) {
    const rowAsHeaders = allRowsData[i].map(h => (h || '').trim().toLowerCase());
    const foundAllKeys = KEY_HEADERS_TO_FIND.every(key => rowAsHeaders.includes(key.toLowerCase()));
    
    if (foundAllKeys) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error("Could not find the data header row. Please ensure columns like 'Engineers', 'JobNumber', 'DepartmentName', etc., are present.");
  }

  const headers = allRowsData[headerRowIndex].map(h => (h || '').trim());
  const lowerCaseHeaders = headers.map(h => h.toLowerCase());
  const findIndex = (name: string): number => lowerCaseHeaders.indexOf(name.toLowerCase());

  const idx = {
    jobStatus: findIndex("JobStatusFull"),
    department: findIndex("DepartmentName"),
    jobType: findIndex("JobTypes"),
    dateCreated: findIndex("DateCreated"),
    dateFinished: findIndex("DateFinished"),
    engineer: findIndex("Engineers"),
    reqId: findIndex("JobNumber"),
    subCat: findIndex("FailureReason"),
    stockSelected: findIndex("StockSelected"),
  };

  const rawDataRows = allRowsData.slice(headerRowIndex + 1);

  // --- 1. Pre-filter for relevant departments and job types ---
  const initialFilteredData = rawDataRows.filter(row => {
    const department = (row[idx.department] || '').trim().toLowerCase();
    const jobType = (row[idx.jobType] || '').trim().toLowerCase();
    const hasDepartment = department.includes('st. lucia installation') || department.includes('st. lucia fault repair');
    const isNotMigration = jobType !== 'remotemigrationstlucia';
    return hasDepartment && isNotMigration;
  });

  // --- 2. Get all unique technicians, categories, and months for filter controls (from ALL data) ---
  const allTechnicians = [...new Set(initialFilteredData.map(row => (row[idx.engineer] || 'Not Assigned').trim()))].sort();
  const allCategories = ['St. Lucia Installations', 'St. Lucia Fault Repair External'];
  const monthSet = new Set<string>();
  initialFilteredData.forEach(row => {
    if ((row[idx.jobStatus] || '').toLowerCase().trim() === 'completed') {
        const finishedDate = parseDplusDate(row[idx.dateFinished]);
        if (finishedDate) {
            monthSet.add(finishedDate.toLocaleString('default', { month: 'short', year: '2-digit' }));
        }
    }
  });
  const allMonths = Array.from(monthSet).sort((a, b) => new Date(`01 ${a}`).getTime() - new Date(`01 ${b}`).getTime());

  // --- 3. De-duplicate to get the single, most recent status for each job ---
  const jobGroups = new Map<string, RowData[]>();
  const rowsWithJobId = initialFilteredData.filter(row => (row[idx.reqId] || '').trim() !== '');

  rowsWithJobId.forEach(row => {
    const jobId = (row[idx.reqId] || '').trim();
    if (!jobGroups.has(jobId)) {
      jobGroups.set(jobId, []);
    }
    jobGroups.get(jobId)!.push(row);
  });
  
  const finalUniqueRows: RowData[] = [];
  
  const statusPriority: { [key: string]: number } = {
    'completed': 3,
    'cancelled': 2,
    'failed': 1,
    'failed request': 1,
     // all others default to 0
  };

  for (const rows of jobGroups.values()) {
    if (rows.length === 0) continue;
    
    const completedRows = rows.filter(r => (r[idx.jobStatus] || '').toLowerCase().trim() === 'completed');

    if (completedRows.length > 0) {
      // If a 'completed' status exists, it takes absolute priority. Find the most recent among them.
      completedRows.sort((rowA, rowB) => {
        const dateA = parseDplusDate(rowA[idx.dateCreated]);
        const dateB = parseDplusDate(rowB[idx.dateCreated]);
        const valA = dateA ? dateA.getTime() : Infinity;
        const valB = dateB ? dateB.getTime() : Infinity;
        return valB - valA;
      });
      finalUniqueRows.push(completedRows[0]);
    } else {
      // No 'completed' rows, so use the existing logic for other statuses.
      rows.sort((rowA, rowB) => {
          const dateA = parseDplusDate(rowA[idx.dateCreated]);
          const dateB = parseDplusDate(rowB[idx.dateCreated]);
          const valA = dateA ? dateA.getTime() : Infinity;
          const valB = dateB ? dateB.getTime() : Infinity;
          
          if (valB !== valA) return valB - valA;
          
          const statusA = (rowA[idx.jobStatus] || '').toLowerCase().trim();
          const statusB = (rowB[idx.jobStatus] || '').toLowerCase().trim();
          const priorityA = statusPriority[statusA] || 0;
          const priorityB = statusPriority[statusB] || 0;
          return priorityB - priorityA;
      });
      finalUniqueRows.push(rows[0]);
    }
  }

  // --- 4. Process all unique rows for stats that should NOT be filtered by UI (Pending, Failures, etc.) ---
  let installationPendingCount = 0;
  let faultPendingCount = 0;
  let failedInstallationsCount = 0;
  let failedFaultsCount = 0;
  let cancelledInstallationsCount = 0;
  let cancelledFaultsCount = 0;
  let relocationsCount = 0;
  let reassociationsCount = 0;
  let completedInstallationsCount = 0;
  let completedFaultsCount = 0;

  const cancelledInstallationsReasons: { [key: string]: number } = {};
  const cancelledFaultsReasons: { [key: string]: number } = {};
  const dplusPendingJobs: DplusPendingJobs = { installations: [], faults: [] };
  const invalidRows: InvalidRow[] = [];
  const validCompletedRows: RowData[] = [];
  const pendingStatuses = ['created', 'confirmed', 'manager hold'];

  finalUniqueRows.forEach(row => {
      const status = (row[idx.jobStatus] || '').toLowerCase().trim();
      const departmentName = getDepartmentName(row[idx.department]);
      const jobType = (row[idx.jobType] || '').trim().toLowerCase();
      
      if (jobType.includes('relocation')) relocationsCount++;
      if (jobType.includes('reassociation')) reassociationsCount++;

      if (pendingStatuses.includes(status)) {
          if (departmentName === 'St. Lucia Installations') installationPendingCount++;
          else faultPendingCount++;
          
          const created = parseDplusDate(row[idx.dateCreated]);
          if(created) {
            const now = new Date();
            const pendingDurationHours = (now.getTime() - created.getTime()) / (1000 * 3600);
            const pendingJob: PendingJob = {
                reqId: (row[idx.reqId] || 'N/A').trim(),
                technician: (row[idx.engineer] || 'Not Assigned').trim(),
                category: departmentName,
                createdTime: created.toLocaleString(),
                pendingDurationHours: pendingDurationHours,
                rowData: row,
            };
            if (departmentName === 'St. Lucia Installations') dplusPendingJobs.installations.push(pendingJob);
            else dplusPendingJobs.faults.push(pendingJob);
          }
      } else if (status === 'completed') {
          const created = parseDplusDate(row[idx.dateCreated]);
          const finished = parseDplusDate(row[idx.dateFinished]);
          const engineer = (row[idx.engineer] || '').trim();

          if (!created || !finished) {
              invalidRows.push({ rowData: row, reason: "Completed job has missing/invalid dates" });
          } else if (!engineer) {
              invalidRows.push({ rowData: row, reason: "Completed job missing Engineer" });
          } else {
              validCompletedRows.push(row);
              if (departmentName === 'St. Lucia Installations') completedInstallationsCount++;
              else completedFaultsCount++;
          }
      } else if (status === 'failed' || status === 'failed request') {
          if (departmentName === 'St. Lucia Installations') failedInstallationsCount++;
          else failedFaultsCount++;
      } else if (status === 'cancelled') {
          const reason = (row[idx.subCat] || 'No Reason Given').trim();
          if (departmentName === 'St. Lucia Installations') {
              cancelledInstallationsReasons[reason] = (cancelledInstallationsReasons[reason] || 0) + 1;
              cancelledInstallationsCount++;
          } else {
              cancelledFaultsReasons[reason] = (cancelledFaultsReasons[reason] || 0) + 1;
              cancelledFaultsCount++;
          }
      }
  });
  
  // --- 5. Apply UI filters to the set of VALID COMPLETED rows ---
  const getMonthString = (dateStr: string): string | null => {
    const d = parseDplusDate(dateStr);
    return d ? d.toLocaleString('default', { month: 'short', year: '2-digit' }) : null;
  };

  const data = validCompletedRows.filter(row => {
    const department = getDepartmentName(row[idx.department]);
    const techMatch = !filters?.technician || (row[idx.engineer] || 'Not Assigned').trim() === filters.technician;
    const catMatch = !filters?.category || department === filters.category;
    if (!techMatch || !catMatch) return false;

    if (filters?.month) {
        const monthOfYear = getMonthString(row[idx.dateFinished]);
        return monthOfYear === filters.month;
    }
    return true;
  });

  const formatBreakdown = (breakdown: {[key:string]: number}): BreakdownItem[] => Object.entries(breakdown).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);

  // --- 6. Process FILTERED data for dashboard cards and charts ---
  let totalMttiHours = 0, mttiCount = 0;
  let totalMttrHours = 0, mttrCount = 0;
  const monthlyMetrics: { [key: string]: { mtti: number[], mttr: number[], volume: number } } = {};
  const techBreakdown: { [key: string]: number } = {};
  const departmentBreakdown: { [key: string]: number } = {};
  
  const installHardwareStats: { [key: string]: { jobCount: number, totalQuantity: number } } = {};
  const faultHardwareStats: { [key: string]: { jobCount: number, totalQuantity: number } } = {};
  let filteredCompletedStandaloneBBInstalls = 0;
  let filteredCompletedFaults = 0;

  data.forEach(row => {
    const department = getDepartmentName(row[idx.department]);
    const technician = (row[idx.engineer] || 'Not Assigned').trim();
    const jobType = (row[idx.jobType] || '').trim().toLowerCase();

    techBreakdown[technician] = (techBreakdown[technician] || 0) + 1;
    departmentBreakdown[department] = (departmentBreakdown[department] || 0) + 1;

    const created = parseDplusDate(row[idx.dateCreated])!;
    const finished = parseDplusDate(row[idx.dateFinished])!;
    
    const diffHours = (finished.getTime() - created.getTime()) / (1000 * 3600);
    if (diffHours < 0) return;

    if (department === 'St. Lucia Installations') {
        totalMttiHours += diffHours;
        mttiCount++;
        if (jobType === 'standalone bb') {
            filteredCompletedStandaloneBBInstalls++;
        }
    } else {
        totalMttrHours += diffHours;
        mttrCount++;
        filteredCompletedFaults++;
    }
    
    const month = finished.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (!monthlyMetrics[month]) {
      monthlyMetrics[month] = { mtti: [], mttr: [], volume: 0 };
    }
    monthlyMetrics[month].volume++;
    if (department === 'St. Lucia Installations') {
        monthlyMetrics[month].mtti.push(diffHours);
    } else {
        monthlyMetrics[month].mttr.push(diffHours);
    }

    if (idx.stockSelected > -1) {
        const stockData = (row[idx.stockSelected] || '').trim();
        if (stockData) {
            let targetStats: { [key: string]: { jobCount: number, totalQuantity: number } } | null = null;
            if (department === 'St. Lucia Installations') {
                if (jobType === 'standalone bb') {
                    targetStats = installHardwareStats;
                }
            } else {
                targetStats = faultHardwareStats;
            }

            if (targetStats) {
                const itemsInJob = new Map<string, number>();

                const items = stockData.split(',');
                items.forEach(itemStr => {
                    if (!itemStr.trim()) return;
                
                    let itemName = itemStr.trim();
                    let quantity = 1;

                    let match = itemName.match(/^(.*?)\s*\((?:x)?(\d+(?:\.\d+)?)(?:m|ft|meters?)?\s*\)$/i);
                    if (match) {
                        itemName = match[1].trim();
                        quantity = parseFloat(match[2]);
                    } else {
                        match = itemName.match(/^(\d+(?:\.\d+)?)\s*(?:m|ft|meters?)?\s+(.*)$/i);
                        if (match) {
                            itemName = match[2].trim();
                            quantity = parseFloat(match[1]);
                        } else {
                            match = itemName.match(/^(.*?)\s*x\s*(\d+(?:\.\d+)?)$/i);
                            if (match) {
                                itemName = match[1].trim();
                                quantity = parseFloat(match[2]);
                            } else {
                               match = itemName.match(/^(.*?)\s*-\s*(\d+(?:\.\d+)?)$/i);
                               if (match) {
                                   itemName = match[1].trim();
                                   quantity = parseFloat(match[2]);
                               }
                            }
                        }
                    }
                
                    itemName = itemName.replace(/\s*\((s\/n|sn)[^)]+\)/gi, '').trim();
                
                    const words = itemName.split(/\s+/);
                    if (words.length > 1) {
                        const lastWord = words[words.length - 1];
                        const looksLikeSerial = (lastWord.length > 8 && /[a-z]/i.test(lastWord) && /\d/.test(lastWord)) || /^\d{10,}$/.test(lastWord);
                        if (looksLikeSerial) {
                            itemName = words.slice(0, -1).join(' ').trim();
                        }
                    }
                    
                    if (itemName) {
                        itemsInJob.set(itemName, (itemsInJob.get(itemName) || 0) + quantity);
                    }
                });

                for (const [itemName, quantity] of itemsInJob.entries()) {
                    if (!targetStats![itemName]) {
                        targetStats![itemName] = { jobCount: 0, totalQuantity: 0 };
                    }
                    targetStats![itemName].jobCount += 1;
                    targetStats![itemName].totalQuantity += quantity;
                }
            }
        }
    }
  });

  const dplusKpis: DplusKpiMetrics = {
    overallMtti: { value: mttiCount > 0 ? totalMttiHours / mttiCount : 0, count: mttiCount },
    overallMttr: { value: mttrCount > 0 ? totalMttrHours / mttrCount : 0, count: mttrCount },
  };
  
  const calculateHardwareUsage = (stats: { [key: string]: { jobCount: number, totalQuantity: number } }, totalJobs: number): HardwareUsageItem[] => {
    if (totalJobs === 0) return [];
    return Object.entries(stats)
        .map(([name, data]) => ({
            name,
            percentage: (data.jobCount / totalJobs) * 100,
            totalUsed: data.totalQuantity,
        }))
        .sort((a, b) => b.totalUsed - a.totalUsed);
  };

  const hardwareUsage: HardwareUsage = {
    installations: calculateHardwareUsage(installHardwareStats, filteredCompletedStandaloneBBInstalls),
    faults: calculateHardwareUsage(faultHardwareStats, filteredCompletedFaults),
  };

  const kpis: KpiMetrics = { 
    mtta: 0, mtti: 0, mttr: 0, ftr: 0, sla: -1, 
    totalTickets: mttiCount + mttrCount, 
    pending: installationPendingCount + faultPendingCount, 
    installationPending: installationPendingCount,
    faultPending: faultPendingCount,
    failedInstallations: failedInstallationsCount,
    failedFaults: failedFaultsCount,
    cancelledInstallations: cancelledInstallationsCount,
    cancelledFaults: cancelledFaultsCount,
    repeatTruckRolls: 0,
    relocations: relocationsCount,
    reassociations: reassociationsCount,
    completedInstallations: completedInstallationsCount,
    completedFaults: completedFaultsCount,
  };

  const monthlyData: MonthlyData[] = Object.keys(monthlyMetrics)
    .map(month => {
      const { mtti, mttr, volume } = monthlyMetrics[month];
      const avgMtti = mtti.length > 0 ? mtti.reduce((a, b) => a + b, 0) / mtti.length : 0;
      const avgMttr = mttr.length > 0 ? mttr.reduce((a, b) => a + b, 0) / mttr.length : 0;
      return { month, mtti: avgMtti, mttr: avgMttr, volume };
    })
    .sort((a, b) => {
        const dateA = new Date(`01 ${a.month}`);
        const dateB = new Date(`01 ${b.month}`);
        return dateA.getTime() - dateB.getTime();
    });

  const breakdowns: BreakdownData = {
    technician: formatBreakdown(techBreakdown),
    category: formatBreakdown(departmentBreakdown),
    subCategory: [],
  };

  const dplusCancellationReasons: CancellationReasons = {
    installations: formatBreakdown(cancelledInstallationsReasons),
    faults: formatBreakdown(cancelledFaultsReasons),
  };
  
  return {
    kpis,
    dplusKpis,
    monthlyData,
    breakdowns,
    invalidRows,
    headers,
    allRows: data,
    allTechnicians,
    allCategories,
    allMonths,
    pendingJobs: [],
    dplusPendingJobs,
    dplusCancellationReasons,
    hardwareUsage,
  };
};