import React, { useState, useEffect } from 'react';
import { Activity, MapPin, Users, Clock, AlertTriangle, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { JobRecord, parseCSVData, calculateJobMetrics } from '../utils/csvParser';

// Sample CSV data embedded for demonstration
const sampleCSVData = `"id","JobStatusFull","JobSourceFull","GEOAreaName","JobNumber","DepartmentName","JobDate","JobTasks","JobTime","AccountNumber","Description","Engineers","CustomerName","CustomerAddress","CustomerAddress2","CustomerAddress3","City","County","CustomerTelephoneNumber","CustomerTelephoneNumber2","CustomerTelephoneNumber3","CustomerEmailAddress","JobDescription","JobDataJson","Note","ContractorName","Supervisor","Dispatcher","CaseNumber","JobTypes","PhoneCalls","StockSelected","StockInstalled","CallaheadPerson","CustomerAddressLat","CustomerAddressLng","JobGeolocationStatus","FailureReason","FailureType","PhotosWhithFormsNumber","JobFormsPhotosNumber","PhotosNumber","MesageSentOn","CostCode","DateCreated","DateStarted","DateFinished","ETAFrom","ETATo","FatNumber","STBCount","SmartWiFiCount","OLTReference","IsRepeat7Days","IsRepeat","IsRepeat45Days","IsRepeatCall7Days","IsRepeatCall30Days","IsRepeatCall45Days","RescheduleReason","CustomerTypeName","EngineerCustomerGPS"
"1884155","Cancelled","Manually Created","St Lucia","SWF1884155","St. Lucia Fault Repair External","01/07/2025","CU20 - Raised in Error","","112010022053","Reactivation","","Byron King","366054675, ROCKERS BLDG:SDU::366054675"," Castries ","","Castries","","17583841453","17587147187","","kingbron616@gmail.com","Suspected Fibre Break","","Job created by Browne Shaqwayne, Reactivation","",""," ","4974742048","Suspected Fibre Break","","","","Browne Shaqwayne","14.0072810200","-60.9682947500","FOUND","","","0","0","0","","","01/07/2025 08:14:00","","","","","SLU01501B/D12a/P022/01","0.0","0.0","SLU01501OLT01","0","0","0","0","0","0","","Consumer",""
"1883246","Completed","Manually Created","St Lucia","SWF1883246","St. Lucia Fault Repair External","01/07/2025","","","112010013697","","Rori Saddler","Hugh Pierre","366042633, 366042633 BLDG:SDU::366042633"," Babonneau ","","Babonneau","","","17585190610","","donfauc@outlook.com","Paix Bouche, Babonneau.... Customer is able to assist the technicians on Wednesday 07/27/2022 about 4:30 p.m. because that's the time he leaves work.   14.0199179200 , -60.9407615900","","Job created by Browne Shaqwayne, damaged drop fibre...bent/kinked....1 150m drop fibre replaced ","Konnexx","Senior Romaine"," ","4119167141","Suspected Fibre Break","","WEDGE CLAMPS - 12, Outdoor Fiber - 150M - 1","Outdoor Fiber - 150M - 1.0, WEDGE CLAMPS - 12.0","Henry Aaliah","14.0199179200","-60.9407615900","FOUND","","","3","2","1","","","30/06/2025 10:07:27","01/07/2025 10:21:02","01/07/2025 16:37:56","","","SLU00601C/D23c/P015/01","0.0","0.0","SLU00601OLT01","0","0","0","0","0","0","","Consumer",""
"1883339","Completed","Manually Created","St Lucia","SWF1883339","St. Lucia Fault Repair External","01/07/2025","","","112010024462","","Jeanmarc Johnny","Gordon E Rae","367037473, 367037473 BLDG:SDU::367037473"," Gros Islet ","","Gros Islet","","17584847326","17584843714","","hopierae@yahoo.com","Suspected fibre break observed","","Job created by Browne Shaqwayne, Customer reschedule for Wednesday morning , Both 150 +30m changed servers back up , Drop was damaged by truck ","Konnexx","Senior Romaine"," ","5480239141","Suspected Fibre Break","","Outdoor Fiber - 150M - 1, Outdoor Fiber - 30M - 1, WEDGE CLAMPS - 8","Outdoor Fiber - 150M - 1.0, Outdoor Fiber - 30M - 1.0, WEDGE CLAMPS - 8.0","Henry Aaliah","14.0703028200","-60.9399370800","FOUND","","","6","6","0","","","30/06/2025 11:14:38","01/07/2025 13:11:08","01/07/2025 20:21:40","","","SLU00401D/D07a/P001/01","0.0","0.0","SLU00401OLT01","0","0","0","0","0","0","","Consumer",""`;

export const DPlusInsight: React.FC = () => {
  const [jobData, setJobData] = useState<JobRecord[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Parse the sample CSV data
    try {
      const parsedData = parseCSVData(sampleCSVData);
      const calculatedMetrics = calculateJobMetrics(parsedData);
      
      setJobData(parsedData);
      setMetrics(calculatedMetrics);
      setLoading(false);
    } catch (error) {
      console.error('Error parsing CSV data:', error);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Unable to load D+ Insight data</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'cancelled': return 'text-gray-600 bg-gray-50';
      case 'confirmed': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const topAreas = Object.entries(metrics.areaDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const topEngineers = Object.entries(metrics.engineerStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Activity className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">D+ Insight Analytics</h2>
          </div>
          <div className="text-sm text-gray-500">
            Data from: {jobData.length} service records • Last updated: {new Date().toLocaleString()}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Jobs</p>
                <p className="text-2xl font-bold text-blue-900">{metrics.totalJobs}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Completion Rate</p>
                <p className="text-2xl font-bold text-green-900">{metrics.completionRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Failure Rate</p>
                <p className="text-2xl font-bold text-red-900">{metrics.failureRate.toFixed(1)}%</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-purple-900">{metrics.avgResponseTime.toFixed(0)}m</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Job Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Status Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Completed</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(metrics.completedJobs / metrics.totalJobs) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{metrics.completedJobs}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Confirmed</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(metrics.confirmedJobs / metrics.totalJobs) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{metrics.confirmedJobs}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Failed</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ width: `${(metrics.failedJobs / metrics.totalJobs) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{metrics.failedJobs}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Cancelled</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-600 h-2 rounded-full" 
                    style={{ width: `${(metrics.cancelledJobs / metrics.totalJobs) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{metrics.cancelledJobs}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Top Service Areas</h3>
          </div>
          <div className="space-y-3">
            {topAreas.map(([area, count], index) => (
              <div key={area} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                  <span className="text-sm font-medium text-gray-700">{area}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(count / metrics.totalJobs) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engineer Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Top Performing Engineers</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {topEngineers.map(([engineer, count], index) => (
            <div key={engineer} className="bg-gray-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 mt-1">{engineer || 'Unassigned'}</div>
                <div className="text-xs text-gray-500 mt-1">Jobs Completed</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Jobs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Service Jobs</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engineer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobData.slice(0, 10).map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {job.JobNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.JobStatusFull)}`}>
                      {job.JobStatusFull}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {job.CustomerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.GEOAreaName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.Engineers || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.JobDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};