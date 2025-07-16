export interface JobRecord {
  id: string;
  JobStatusFull: string;
  JobSourceFull: string;
  GEOAreaName: string;
  JobNumber: string;
  DepartmentName: string;
  JobDate: string;
  JobTime: string;
  AccountNumber: string;
  Description: string;
  Engineers: string;
  CustomerName: string;
  CustomerAddress: string;
  City: string;
  County: string;
  CustomerTelephoneNumber: string;
  CustomerEmailAddress: string;
  JobDescription: string;
  Note: string;
  ContractorName: string;
  Supervisor: string;
  Dispatcher: string;
  CaseNumber: string;
  JobTypes: string;
  StockSelected: string;
  StockInstalled: string;
  CustomerAddressLat: string;
  CustomerAddressLng: string;
  JobGeolocationStatus: string;
  FailureReason: string;
  FailureType: string;
  DateCreated: string;
  DateStarted: string;
  DateFinished: string;
  ETAFrom: string;
  ETATo: string;
  FatNumber: string;
  STBCount: string;
  SmartWiFiCount: string;
  OLTReference: string;
  IsRepeat7Days: string;
  IsRepeat: string;
  IsRepeat45Days: string;
  RescheduleReason: string;
  CustomerTypeName: string;
  EngineerCustomerGPS: string;
}

export function parseCSVData(csvText: string): JobRecord[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
  
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const record: any = {};
    
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    
    return record as JobRecord;
  });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export function calculateJobMetrics(jobs: JobRecord[]) {
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(job => job.JobStatusFull === 'Completed').length;
  const failedJobs = jobs.filter(job => job.JobStatusFull === 'Failed').length;
  const cancelledJobs = jobs.filter(job => job.JobStatusFull === 'Cancelled').length;
  const confirmedJobs = jobs.filter(job => job.JobStatusFull === 'Confirmed').length;
  
  const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
  const failureRate = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0;
  
  // Calculate average response time for completed jobs
  const completedJobsWithTimes = jobs.filter(job => 
    job.JobStatusFull === 'Completed' && 
    job.DateStarted && 
    job.DateFinished
  );
  
  let avgResponseTime = 0;
  if (completedJobsWithTimes.length > 0) {
    const totalMinutes = completedJobsWithTimes.reduce((sum, job) => {
      const start = new Date(job.DateStarted);
      const end = new Date(job.DateFinished);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60);
    }, 0);
    avgResponseTime = totalMinutes / completedJobsWithTimes.length;
  }
  
  // Geographic distribution
  const areaDistribution = jobs.reduce((acc, job) => {
    const area = job.GEOAreaName || 'Unknown';
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Engineer performance
  const engineerStats = jobs.reduce((acc, job) => {
    if (job.Engineers) {
      acc[job.Engineers] = (acc[job.Engineers] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalJobs,
    completedJobs,
    failedJobs,
    cancelledJobs,
    confirmedJobs,
    completionRate,
    failureRate,
    avgResponseTime,
    areaDistribution,
    engineerStats
  };
}