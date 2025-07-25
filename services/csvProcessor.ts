import type { DashboardData, KpiMetrics, RowData, MonthlyData, BreakdownData, InvalidRow, PendingJob } from '../types';

// Helper to parse date strings with multiple potential formats, prioritizing DD/MM/YYYY
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') return null;
  // Try to match DD/MM/YYYY HH:mm or DD/MM/YYYY HH:mm:ss
  const parts = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (parts) {
      // YYYY-MM-DDTHH:mm:ss
      const isoStr = `${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}T${parts[4]}:${parts[5]}:${parts[6] || '00'}`;
      const d = new Date(isoStr);
      return isNaN(d.getTime()) ? null : d;
  }
  // Fallback for other formats like ISO 8601 that new Date() handles well
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};


// Helper to parse "X days Y hours Z minutes" into seconds
function parseTimeElapsedToSeconds(timeStr: string): number {
    if (!timeStr) return 0;
    let totalSeconds = 0;
    const parts = timeStr.split(' ').map(s => s.trim());
    for (let i = 0; i < parts.length; i += 2) {
        const value = parseInt(parts[i], 10);
        const unit = parts[i + 1] ? parts[i + 1].toLowerCase() : '';
        if (isNaN(value)) continue;
        if (unit.startsWith('day')) totalSeconds += value * 24 * 3600;
        else if (unit.startsWith('hour')) totalSeconds += value * 3600;
        else if (unit.startsWith('minute')) totalSeconds += value * 60;
        else if (unit.startsWith('second')) totalSeconds += value;
    }
    return totalSeconds;
}

// Main processing function
export const processCsvData = (
  allRowsData: RowData[],
  filters?: { technician?: string; category?: string; month?: string }
): DashboardData => {
  // First pass: find header and get all technicians and categories for filters
  let headerRowIndex = -1;
  const KEY_HEADERS_TO_FIND = ["Technician", "RequestID", "Request Status", "Assigned Time"];

  for (let i = 0; i < allRowsData.length && i < 15; i++) {
    const rowAsHeaders = allRowsData[i].map(h => (h || '').trim().toLowerCase());
    const foundAllKeys = KEY_HEADERS_TO_FIND.every(key => rowAsHeaders.includes(key.toLowerCase()));
    
    if (foundAllKeys) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error("Could not find the data header row. Please ensure columns like 'Technician', 'RequestID', etc., are present.");
  }
  
  if (allRowsData.length < headerRowIndex + 2) {
      throw new Error("CSV file is too short. It must contain a header row and at least one data row.");
  }

  const originalHeaders = allRowsData[headerRowIndex];
  const headers = originalHeaders.map(h => (h || '').trim());
  const lowerCaseHeaders = headers.map(h => h.toLowerCase());

  const findIndex = (name: string): number => lowerCaseHeaders.indexOf(name.toLowerCase());

  const columnMapping = {
    tech: "Technician",
    reqId: "RequestID",
    cat: "Category",
    subCat: "Sub Category",
    status: "Request Status",
    createdTime: "Created Time",
    assignTime: "Assigned Time",
    closeTime: "Completed Time",
    slaMissed: "overdue status",
    ftrStatus: "First Response Overdue status",
    closureCode: "Closure Code",
    timeElapsedSec: "Time Elapsed",
  };
  
  const idx: { [key in keyof typeof columnMapping]: number } = {} as any;
  for (const key in columnMapping) {
    idx[key as keyof typeof columnMapping] = findIndex((columnMapping as any)[key]);
  }

  const slaCalculable = idx.slaMissed > -1;
  const ftrCalculable = idx.ftrStatus > -1;

  // --- 1. Pre-filter and get options for UI filters ---
  const allDataRowsRaw = allRowsData.slice(headerRowIndex + 1);
  const preFilteredRows = allDataRowsRaw.filter(row => (row[idx.cat] || '').trim().toLowerCase() !== 'remotemigrationstlucia');

  const allTechnicians = [...new Set(preFilteredRows.map(row => (row[idx.tech] || 'Not Assigned').trim()).filter(Boolean))].sort();
  const allCategories = [...new Set(preFilteredRows.map(row => row[idx.cat]).filter(Boolean))].sort();

  const monthSet = new Set<string>();
  preFilteredRows.forEach(row => {
    const status = (row[idx.status] || '').toLowerCase().trim();
    if (status === 'closed' || status === 'resolved') {
        const closedDate = parseDate(row[idx.closeTime]);
        if (closedDate) {
            monthSet.add(closedDate.toLocaleString('default', { month: 'short', year: '2-digit' }));
        }
    }
  });
  const allMonths = Array.from(monthSet).sort((a, b) => {
      const dateA = new Date(`01 ${a}`);
      const dateB = new Date(`01 ${b}`);
      return dateA.getTime() - dateB.getTime();
  });

  // --- 2. De-duplicate to get the single, most recent status for each job ---
  const jobGroups = new Map<string, RowData[]>();
  const allDataRowsWithReqId = preFilteredRows.filter(row => (row[idx.reqId] || '').trim() !== '');

  allDataRowsWithReqId.forEach(row => {
    const reqId = (row[idx.reqId] || '').trim();
    if (!jobGroups.has(reqId)) {
      jobGroups.set(reqId, []);
    }
    jobGroups.get(reqId)!.push(row);
  });
  
  const finalUniqueRows: RowData[] = [];
  
  const terminalStatusesForLogic = ['closed', 'resolved'];
  const statusPriority: { [key: string]: number } = {
    'closed': 2,
    'resolved': 2,
    // all others default to 0
  };

  for (const rows of jobGroups.values()) {
    if (rows.length === 0) continue;
    
    const completedRows = rows.filter(r => terminalStatusesForLogic.includes((r[idx.status] || '').toLowerCase().trim()));

    if (completedRows.length > 0) {
      completedRows.sort((rowA, rowB) => {
        const dateA = parseDate(rowA[idx.createdTime]);
        const dateB = parseDate(rowB[idx.createdTime]);
        const valA = dateA ? dateA.getTime() : Infinity;
        const valB = dateB ? dateB.getTime() : Infinity;
        return valB - valA;
      });
      finalUniqueRows.push(completedRows[0]);
    } else {
      rows.sort((rowA, rowB) => {
          const dateA = parseDate(rowA[idx.createdTime]);
          const dateB = parseDate(rowB[idx.createdTime]);
          const valA = dateA ? dateA.getTime() : Infinity;
          const valB = dateB ? dateB.getTime() : Infinity;
          
          if (valB !== valA) return valB - valA;
          
          const statusA = (rowA[idx.status] || '').toLowerCase().trim();
          const statusB = (rowB[idx.status] || '').toLowerCase().trim();
          const priorityA = statusPriority[statusA] || 0;
          const priorityB = statusPriority[statusB] || 0;
          return priorityB - priorityA;
      });
      finalUniqueRows.push(rows[0]);
    }
  }

  // --- 3. Process all unique rows: separate pending from terminal, validate, and calculate non-filterable stats ---
  const pendingJobs: PendingJob[] = [];
  const validNonPendingRows: RowData[] = [];
  const invalidRows: InvalidRow[] = [];
  
  const terminalStatuses = ['closed', 'resolved'];

  finalUniqueRows.forEach(row => {
    if (row.every(cell => (cell || '').trim() === '')) return; // Skip completely blank rows
    
    const status = (row[idx.status] || '').toLowerCase().trim();
    
    // Any status that is not explicitly terminal is considered pending.
    if (!terminalStatuses.includes(status) && status !== '') {
        const created = parseDate(row[idx.createdTime]);
        if (created && idx.createdTime !== -1) {
            const now = new Date();
            const pendingDurationHours = (now.getTime() - created.getTime()) / (1000 * 3600);
            pendingJobs.push({
                reqId: (row[idx.reqId] || 'N/A').trim(),
                technician: (row[idx.tech] || 'Not Assigned').trim(),
                category: (row[idx.cat] || 'N/A').trim(),
                createdTime: created.toLocaleString(),
                pendingDurationHours: pendingDurationHours,
                rowData: row,
            });
        }
    } else if (terminalStatuses.includes(status)) {
        // Perform validation on terminal jobs
        const technician = (row[idx.tech] || '').trim();
        if (!technician) {
            invalidRows.push({ rowData: row, reason: "Missing Technician" });
        } else if (row.length < headers.length) {
            invalidRows.push({ rowData: row, reason: "Mismatched column count" });
        } else {
            validNonPendingRows.push(row);
        }
    }
  });
  
  const pendingCount = pendingJobs.length;
  
  // --- 4. Apply UI filters to the set of VALID NON-PENDING rows ---
  const getMonthString = (dateStr: string): string | null => {
    const d = parseDate(dateStr);
    return d ? d.toLocaleString('default', { month: 'short', year: '2-digit' }) : null;
  };

  const data = validNonPendingRows.filter(row => {
    const techMatch = !filters?.technician || row[idx.tech] === filters.technician;
    const catMatch = !filters?.category || row[idx.cat] === filters.category;

    if (!techMatch || !catMatch) {
        return false;
    }

    if (filters?.month) {
        // We know these are closed/resolved from step 3
        const monthOfYear = getMonthString(row[idx.closeTime]);
        return monthOfYear === filters.month;
    }
    
    return true;
  });

  // --- 5. Process FILTERED data for dashboard cards and charts ---
  let totalMttaHours = 0, mttaCount = 0;
  let totalMttiHours = 0, mttiCount = 0;
  let totalMttrHours = 0, mttrCount = 0;
  let ftrCount = 0;
  let slaMetCount = 0;
  let slaApplicableCount = 0;
  let totalTickets = 0;

  const monthlyMetrics: { [key: string]: { mtti: number[], mttr: number[], volume: number } } = {};
  const techBreakdown: { [key: string]: number } = {};
  const catBreakdown: { [key: string]: number } = {};
  const subCatBreakdown: { [key: string]: number } = {};
  
  data.forEach(row => {
    totalTickets++;

    const technician = (row[idx.tech] || '').trim();
    const category = (row[idx.cat] || 'N/A').trim();
    const subCategory = (row[idx.subCat] || 'N/A').trim();
    techBreakdown[technician] = (techBreakdown[technician] || 0) + 1;
    catBreakdown[category] = (catBreakdown[category] || 0) + 1;
    subCatBreakdown[subCategory] = (subCatBreakdown[subCategory] || 0) + 1;

    const created = parseDate(row[idx.createdTime]);
    const assigned = parseDate(row[idx.assignTime]);
    const closed = parseDate(row[idx.closeTime]);
    
    // MTTA (Mean Time To Assign: Created -> Assigned)
    if (created && assigned) {
        const diff = (assigned.getTime() - created.getTime()) / (1000 * 3600);
        if (diff >= 0) {
            totalMttaHours += diff;
            mttaCount++;
        }
    }

    // MTTI (Mean Time To Install: Created -> Completed)
    if (created && closed) {
        const diff = (closed.getTime() - created.getTime()) / (1000 * 3600);
        if (diff >= 0) {
            totalMttiHours += diff;
            mttiCount++;
        }
    }
    
    // MTTR (Mean Time To Resolve: Assigned -> Completed)
    if (assigned && closed) {
        const diff = (closed.getTime() - assigned.getTime()) / (1000 * 3600); // in hours
        if (diff >= 0) {
            totalMttrHours += diff;
            mttrCount++;
        }
    }
    
    // FTR (First-Time Resolution)
    if (ftrCalculable) {
        const ftrStatusRaw = row[idx.ftrStatus];
        // An FTR is met if 'First Response Overdue status' is 'false'.
        if (ftrStatusRaw && ftrStatusRaw.toLowerCase().trim() === 'false') {
          ftrCount++;
        }
    }
    
    // SLA Adherence
    if (slaCalculable) {
        const overdueStatusRaw = row[idx.slaMissed]; // idx.slaMissed now points to 'overdue status'
        // Only consider rows where SLA status is explicitly mentioned.
        if (overdueStatusRaw && overdueStatusRaw.trim() !== '') {
            slaApplicableCount++;
            const overdueStatus = overdueStatusRaw.toLowerCase().trim();
            // An SLA is met if 'overdue status' is 'false'.
            if (overdueStatus === 'false') {
              slaMetCount++;
            }
        }
    }
    
    // Monthly Aggregation
    if (closed) {
        const month = closed.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (!monthlyMetrics[month]) {
          monthlyMetrics[month] = { mtti: [], mttr: [], volume: 0 };
        }
        monthlyMetrics[month].volume++;
        
        // Monthly MTTI (Created -> Completed)
        if (created) {
            const mtti = (closed.getTime() - created.getTime()) / (1000 * 3600);
            if (mtti >= 0) monthlyMetrics[month].mtti.push(mtti);
        }

        // Monthly MTTR (Assigned -> Completed)
        if (assigned) {
            const mttr = (closed.getTime() - assigned.getTime()) / (1000 * 3600);
            if (mttr >= 0) monthlyMetrics[month].mttr.push(mttr);
        }
    }
  });

  const kpis: KpiMetrics = {
    mtta: mttaCount > 0 ? totalMttaHours / mttaCount : 0,
    mtti: mttiCount > 0 ? totalMttiHours / mttiCount : 0,
    mttr: mttrCount > 0 ? totalMttrHours / mttrCount : 0,
    ftr: ftrCalculable ? (totalTickets > 0 ? (ftrCount / totalTickets) * 100 : 0) : -1,
    sla: slaCalculable && slaApplicableCount > 0 ? (slaMetCount / slaApplicableCount) * 100 : -1,
    totalTickets: totalTickets,
    pending: pendingCount,
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
  
  const formatBreakdown = (breakdown: {[key:string]: number}): {name: string, count: number}[] => {
    return Object.entries(breakdown).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
  }

  const breakdowns: BreakdownData = {
    technician: formatBreakdown(techBreakdown),
    category: formatBreakdown(catBreakdown),
    subCategory: formatBreakdown(subCatBreakdown),
  };
  
  return {
    kpis,
    monthlyData,
    breakdowns,
    invalidRows,
    headers,
    allRows: data,
    allTechnicians,
    allCategories,
    allMonths,
    pendingJobs,
  };
};