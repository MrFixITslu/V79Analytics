import React, { useState, useRef } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line } from 'recharts';
import type { DashboardData, RowData, BreakdownItem, InvalidRow, PendingJob, DplusKpiMetrics, CancellationReasons, HardwareUsage, HardwareUsageItem } from '../types';
import { KpiCard } from './KpiCard';
import { PERFORMANCE_THRESHOLDS } from '../constants';
import { AdvancedFaultAnalysis } from './AdvancedFaultAnalysis';

interface DashboardProps {
    data: DashboardData;
    filters: { technician: string; category: string; month: string };
    onFilterChange: (type: 'technician' | 'category' | 'month', value: string) => void;
    technicianLabel: string;
    categoryLabel: string;
}

interface FilterControlsProps {
  technicians: string[];
  categories: string[];
  months: string[];
  currentFilters: { technician: string; category: string; month: string };
  onFilterChange: (type: 'technician' | 'category' | 'month', value: string) => void;
  technicianLabel: string;
  categoryLabel: string;
}

const FilterControls: React.FC<FilterControlsProps> = ({ technicians, categories, months, currentFilters, onFilterChange, technicianLabel, categoryLabel }) => (
  <div id="filter-controls" className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4">
    <div className="flex-1">
      <label htmlFor="technician-filter" className="block text-sm font-medium text-slate-700 mb-1">
        Filter by {technicianLabel}
      </label>
      <select
        id="technician-filter"
        value={currentFilters.technician}
        onChange={(e) => onFilterChange('technician', e.target.value)}
        className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="All">All {technicianLabel}s</option>
        {technicians.map(tech => <option key={tech} value={tech}>{tech}</option>)}
      </select>
    </div>
    <div className="flex-1">
      <label htmlFor="category-filter" className="block text-sm font-medium text-slate-700 mb-1">
        Filter by {categoryLabel}
      </label>
      <select
        id="category-filter"
        value={currentFilters.category}
        onChange={(e) => onFilterChange('category', e.target.value)}
        className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="All">All {categoryLabel}s</option>
        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
      </select>
    </div>
    <div className="flex-1">
      <label htmlFor="month-filter" className="block text-sm font-medium text-slate-700 mb-1">
        Filter by Month
      </label>
      <select
        id="month-filter"
        value={currentFilters.month}
        onChange={(e) => onFilterChange('month', e.target.value)}
        className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="All">All Months</option>
        {months.map(month => <option key={month} value={month}>{month}</option>)}
      </select>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white border border-slate-300 rounded-lg shadow-lg">
        <p className="font-bold text-slate-700">{label}</p>
        {payload.map((pld: any) => (
          <p key={pld.dataKey} style={{ color: pld.stroke || pld.fill }}>
            {`${pld.name}: ${pld.dataKey === 'volume' || pld.dataKey === 'count' ? pld.value : Math.ceil(pld.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface BreakdownListProps {
    title: string;
    data: BreakdownItem[];
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    isOpen?: boolean;
    onToggle?: () => void;
    valueFormatter?: (value: number) => string;
}

const BreakdownList: React.FC<BreakdownListProps> = ({ title, data, collapsible = false, defaultCollapsed = false, isOpen: controlledIsOpen, onToggle, valueFormatter }) => {
    const [internalIsOpen, setInternalIsOpen] = useState(!defaultCollapsed);

    const isControlled = controlledIsOpen !== undefined;
    const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

    const handleToggle = () => {
        if (isControlled) {
            onToggle?.();
        } else {
            setInternalIsOpen(prev => !prev);
        }
    };

    if (!data || data.length === 0) {
        return null;
    }

    const formattedValue = (item: BreakdownItem) => {
        if (valueFormatter) {
            return valueFormatter(item.count);
        }
        return Math.ceil(item.count).toString();
    };

    const content = (
        <div className="max-h-96 overflow-y-auto">
            <ul className="space-y-2">
                {data.map((item, index) => (
                    <li key={index} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-slate-50 transition-colors">
                        <span className="text-slate-700 truncate mr-4" title={item.name}>
                            {item.name}
                        </span>
                        <span className="font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full text-xs flex-shrink-0">
                            {formattedValue(item)}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );

    if (!collapsible) {
        return (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
                {content}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <button
                onClick={handleToggle}
                className="w-full flex justify-between items-center p-4 text-left"
                aria-expanded={isOpen}
            >
                <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transform transition-transform text-slate-500 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && <div className="p-4 pt-0">{content}</div>}
        </div>
    );
};

const HardwareList: React.FC<{
    title: string;
    data: HardwareUsageItem[];
    isOpen: boolean;
    onToggle: () => void;
}> = ({ title, data, isOpen, onToggle }) => {
    if (!data || data.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-4 text-left"
                aria-expanded={isOpen}
            >
                <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transform transition-transform text-slate-500 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="p-4 pt-0">
                    <div className="max-h-96 overflow-y-auto">
                        <ul className="space-y-2">
                            {data.map((item, index) => (
                                <li key={index} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-slate-50 transition-colors">
                                    <span className="text-slate-700 truncate mr-4" title={item.name}>
                                        {item.name}
                                    </span>
                                    <div className="flex items-center space-x-3 flex-shrink-0">
                                        <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-full text-xs min-w-[80px] text-center">
                                            Total Used: {Math.ceil(item.totalUsed)}
                                        </span>
                                        <span className="font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full text-xs min-w-[60px] text-center">
                                            {Math.ceil(item.percentage)}%
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

const InvalidRowsTable: React.FC<{rows: InvalidRow[], headers: string[]}> = ({ rows, headers }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-red-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left"
                aria-expanded={isOpen}
            >
                <h3 className="text-lg font-semibold text-red-700">Skipped Rows ({rows.length})</h3>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transform transition-transform text-slate-500 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="px-4 pb-4">
                    <p className="text-sm text-slate-600 mb-3">These rows were skipped during processing due to missing or invalid data.</p>
                    <div className="h-72 overflow-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr>{headers.map((h, i) => <th key={i} className="p-2 font-semibold">{h}</th>)}<th className="p-2 font-semibold text-red-600">Reason</th></tr>
                            </thead>
                            <tbody>
                                {rows.map((row, index) => (
                                    <tr key={index} className="bad-row">
                                        {row.rowData.map((cell, i) => <td key={i} className="p-2 border-t border-red-200">{cell}</td>)}
                                        <td className="p-2 border-t border-red-200 font-medium">{row.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

interface PendingJobsTableProps {
    jobs: PendingJob[];
    technicianLabel: string;
    title: string;
    defaultOpen?: boolean;
    isOpen?: boolean;
    onToggle?: () => void;
}

const PendingJobsTable: React.FC<PendingJobsTableProps> = ({ jobs, technicianLabel, title, defaultOpen = true, isOpen: controlledIsOpen, onToggle }) => {
    const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);

    const isControlled = controlledIsOpen !== undefined;
    const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

    const handleToggle = () => {
        if (isControlled) {
            onToggle?.();
        } else {
            setInternalIsOpen(prev => !prev);
        }
    };
    
    const sortedJobs = [...jobs].sort((a, b) => b.pendingDurationHours - a.pendingDurationHours);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <button
                onClick={handleToggle}
                className="w-full flex justify-between items-center p-4 text-left"
                aria-expanded={isOpen}
            >
                <h3 className="text-lg font-semibold text-slate-800">{title} ({jobs.length})</h3>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transform transition-transform text-slate-500 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="px-4 pb-4">
                    <p className="text-sm text-slate-600 mb-3">Showing jobs not yet completed, sorted by the longest pending time. Duration is calculated from 'Created Time' to now.</p>
                    <div className="h-96 overflow-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="p-2 font-semibold">Job Number</th>
                                    <th className="p-2 font-semibold">{technicianLabel}</th>
                                    <th className="p-2 font-semibold">Job Type</th>
                                    <th className="p-2 font-semibold">Created Time</th>
                                    <th className="p-2 font-semibold">Pending Duration (Hours)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedJobs.map((job, index) => (
                                    <tr key={index} className="border-t border-slate-200">
                                        <td className="p-2">{job.reqId}</td>
                                        <td className="p-2">{job.technician}</td>
                                        <td className="p-2">{job.category}</td>
                                        <td className="p-2">{job.createdTime}</td>
                                        <td className="p-2 font-medium">{Math.ceil(job.pendingDurationHours)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ data, filters, onFilterChange, technicianLabel, categoryLabel }) => {
    const { kpis, dplusKpis, monthlyData, breakdowns, invalidRows, headers, allRows, pendingJobs, dplusPendingJobs, dplusCancellationReasons, allTechnicians, allCategories, allMonths, hardwareUsage } = data;
    const { sla: slaValue } = kpis;
    const hasAppliedFilters = filters.technician !== 'All' || filters.category !== 'All' || filters.month !== 'All';
    const totalTicketCount = dplusKpis ? (dplusKpis.overallMtti.count + dplusKpis.overallMttr.count) : kpis.totalTickets;
    const [hardwareListsOpen, setHardwareListsOpen] = useState(false);
    const [pendingJobsOpen, setPendingJobsOpen] = useState(false);

    const handleChartClick = (chartData: any) => {
        if (chartData?.activePayload?.length) {
            const month = chartData.activePayload[0].payload.month;
            if (month && month !== filters.month) {
                onFilterChange('month', month);
            }
        }
    };

    return (
        <div id="dashboard-container" className="space-y-6 mt-6 bg-slate-50 p-4 rounded-lg">
            <FilterControls 
                technicians={allTechnicians}
                categories={allCategories}
                months={allMonths}
                currentFilters={filters}
                onFilterChange={onFilterChange}
                technicianLabel={technicianLabel}
                categoryLabel={categoryLabel}
            />

            {hasAppliedFilters && totalTicketCount === 0 && pendingJobs.length === 0 && (!dplusPendingJobs || (dplusPendingJobs.installations.length === 0 && dplusPendingJobs.faults.length === 0)) ? (
                <div className="text-center p-8 mt-6 bg-white rounded-lg shadow-sm border border-slate-200">
                    <h3 className="text-xl font-semibold text-slate-700">No Data Matches Filters</h3>
                    <p className="text-slate-500 mt-2">No tickets were found for the selected {technicianLabel}, {categoryLabel}, and/or Month.</p>
                </div>
            ) : (
                <>
                    {dplusKpis ? (
                        <div id="kpi-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Installations Section */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold text-slate-800 text-center py-2 bg-slate-100 rounded-lg">Installations Analysis</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <KpiCard 
                                        title="MTTI (Mean Time To Install)" 
                                        value={Math.ceil(dplusKpis.overallMtti.value).toString()}
                                        unit="hours"
                                        isPoor={false}
                                        helpText={`Avg. time for Installations. Based on ${dplusKpis.overallMtti.count} jobs.`}
                                    />
                                    <KpiCard 
                                        title="Pending Installations" 
                                        value={(kpis.installationPending || 0).toString()} 
                                        unit="tickets" 
                                        isPoor={(kpis.installationPending || 0) > 50} 
                                        helpText="Jobs with 'Created', 'Confirmed', or 'Manager Hold' status." 
                                    />
                                    <KpiCard
                                        title="Completed Installations"
                                        value={(kpis.completedInstallations || 0).toString()}
                                        unit="jobs"
                                        isPoor={false}
                                        helpText="Successfully completed installation jobs."
                                    />
                                    <KpiCard
                                        title="Cancelled Installations"
                                        value={(kpis.cancelledInstallations || 0).toString()}
                                        unit="jobs"
                                        isPoor={(kpis.cancelledInstallations || 0) > 0}
                                        helpText="Installation jobs with 'Cancelled' status."
                                    />
                                    <KpiCard 
                                        title="Failed Installations" 
                                        value={(kpis.failedInstallations || 0).toString()} 
                                        unit="tickets" 
                                        isPoor={(kpis.failedInstallations || 0) > 0} 
                                        helpText="Installations with 'Failed' or 'Failed Request' status." 
                                    />
                                    <KpiCard 
                                        title="Number of Relocations" 
                                        value={(kpis.relocations || 0).toString()} 
                                        unit="jobs" 
                                        isPoor={false} 
                                        helpText="Total jobs with 'Relocation' job type." 
                                    />
                                    <KpiCard 
                                        title="Number of Reassociations" 
                                        value={(kpis.reassociations || 0).toString()} 
                                        unit="jobs" 
                                        isPoor={false} 
                                        helpText="Total jobs with 'Reassociation' job type." 
                                    />
                                </div>
                            </div>
                            
                            {/* Faults Section */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold text-slate-800 text-center py-2 bg-slate-100 rounded-lg">Faults Analysis</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                     <KpiCard 
                                        title="MTTR (MeanTime To Repair)" 
                                        value={Math.ceil(dplusKpis.overallMttr.value).toString()}
                                        unit="hours"
                                        isPoor={false}
                                        helpText={`Avg. time for Fault Repairs. Based on ${dplusKpis.overallMttr.count} jobs.`}
                                    />
                                     <KpiCard 
                                        title="Pending Faults" 
                                        value={(kpis.faultPending || 0).toString()} 
                                        unit="tickets" 
                                        isPoor={(kpis.faultPending || 0) > 50} 
                                        helpText="Jobs with 'Created', 'Confirmed', or 'Manager Hold' status." 
                                    />
                                    <KpiCard
                                        title="Completed Faults"
                                        value={(kpis.completedFaults || 0).toString()}
                                        unit="jobs"
                                        isPoor={false}
                                        helpText="Successfully completed fault repair jobs."
                                    />
                                    <KpiCard
                                        title="Cancelled Faults"
                                        value={(kpis.cancelledFaults || 0).toString()}
                                        unit="jobs"
                                        isPoor={(kpis.cancelledFaults || 0) > 0}
                                        helpText="Fault repair jobs with 'Cancelled' status."
                                    />
                                     <KpiCard 
                                        title="Failed Fault Repairs" 
                                        value={(kpis.failedFaults || 0).toString()} 
                                        unit="tickets" 
                                        isPoor={(kpis.failedFaults || 0) > 0} 
                                        helpText="Fault Repairs with 'Failed' or 'Failed Request' status." 
                                    />
                                     <KpiCard 
                                        title="Repeat Truck Rolls" 
                                        value={(kpis.repeatTruckRolls || 0).toString()} 
                                        unit="tickets" 
                                        isPoor={false} 
                                        helpText="Customers with >1 ticket in 30 days. Requires Customer ID in data to calculate." 
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div id="kpi-section" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <KpiCard title="Time to Assign" value={Math.ceil(kpis.mtta).toString()} unit="hours" isPoor={kpis.mtta > PERFORMANCE_THRESHOLDS.MTTA_HOURS} helpText={`Created → Assigned. > ${PERFORMANCE_THRESHOLDS.MTTA_HOURS} hrs is poor`}/>
                            <KpiCard title="Mean Time to Install" value={Math.ceil(kpis.mtti).toString()} unit="hours" isPoor={kpis.mtti > PERFORMANCE_THRESHOLDS.MTTI_HOURS} helpText={`Created → Completed. > ${PERFORMANCE_THRESHOLDS.MTTI_HOURS} hrs is poor`}/>
                            <KpiCard title="Time to Resolve" value={Math.ceil(kpis.mttr).toString()} unit="hours" isPoor={kpis.mttr > PERFORMANCE_THRESHOLDS.MTTR_HOURS} helpText={`Assigned → Completed. > ${PERFORMANCE_THRESHOLDS.MTTR_HOURS} hrs is poor`}/>
                            <KpiCard
                                title="First Response Resolution"
                                value={kpis.ftr >= 0 ? Math.ceil(kpis.ftr).toString() : 'N/A'}
                                unit={kpis.ftr >= 0 ? '%' : ''}
                                isPoor={kpis.ftr >= 0 && kpis.ftr < PERFORMANCE_THRESHOLDS.FTR_PERCENT}
                                helpText={kpis.ftr >= 0 ? `< ${PERFORMANCE_THRESHOLDS.FTR_PERCENT}% is poor` : '"First Response Overdue status" column not found.'}
                            />
                            <KpiCard
                            title="SLA Adherence"
                            value={slaValue >= 0 ? Math.ceil(slaValue).toString() : 'N/A'}
                            unit={slaValue >= 0 ? '%' : ''}
                            isPoor={slaValue >= 0 && slaValue < PERFORMANCE_THRESHOLDS.SLA_PERCENT}
                            helpText={slaValue >= 0 ? `< ${PERFORMANCE_THRESHOLDS.SLA_PERCENT}% is poor` : '"overdue status" column not found or contains no applicable data.'}
                            />
                            <KpiCard title="Pending" value={kpis.pending.toString()} unit="tickets" isPoor={kpis.pending > 50} helpText="Tickets not in a terminal state. See table for details." />
                        </div>
                    )}


                    {/* Charts */}
                    <div id="charts-section">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">Monthly Trends: Volume & Performance</h3>
                            <p className="text-sm text-slate-500 mb-4">Click on a month in the chart to filter the entire dashboard.</p>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart 
                                    data={monthlyData} 
                                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                                    onClick={handleChartClick}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis yAxisId="left" orientation="left" stroke="#10b981" label={{ value: 'Ticket Volume', angle: -90, position: 'insideLeft', fill: '#10b981', offset: -5 }} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" label={{ value: 'Hours', angle: 90, position: 'insideRight', fill: '#3b82f6', offset: -5 }}/>
                                    <Tooltip content={<CustomTooltip />}/>
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="volume" name="Ticket Volume" fill="#10b981" />
                                    <Line yAxisId="right" type="monotone" dataKey="mttr" name="MTTR (hours)" stroke="#3b82f6" activeDot={{ r: 8 }} strokeWidth={2} />
                                    <Line yAxisId="right" type="monotone" dataKey="mtti" name="MTTI (hours)" stroke="#8b5cf6" strokeWidth={2} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Breakdowns Section */}
                    {!dplusKpis && breakdowns.subCategory.length > 0 && (
                        <div id="breakdowns-section">
                           <BreakdownList title="Tickets by Sub-Category" data={breakdowns.subCategory} />
                        </div>
                    )}
                    
                    {dplusKpis && dplusCancellationReasons && (dplusCancellationReasons.installations.length > 0 || dplusCancellationReasons.faults.length > 0) && (
                        <div id="cancellation-reasons-section" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {dplusCancellationReasons.installations.length > 0 && (
                                <BreakdownList title="Installation Cancellation Reasons" data={dplusCancellationReasons.installations} />
                            )}
                            {dplusCancellationReasons.faults.length > 0 && (
                                <BreakdownList title="Fault Cancellation Reasons" data={dplusCancellationReasons.faults} />
                            )}
                        </div>
                    )}

                    {dplusKpis && hardwareUsage && (hardwareUsage.installations.length > 0 || hardwareUsage.faults.length > 0) && (
                        <div id="hardware-usage-section" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {hardwareUsage.installations.length > 0 && (
                                <HardwareList
                                    title={`Hardware Used in Installations (${hardwareUsage.installations.length} items)`}
                                    data={hardwareUsage.installations}
                                    isOpen={hardwareListsOpen}
                                    onToggle={() => setHardwareListsOpen(!hardwareListsOpen)}
                                />
                            )}
                            {hardwareUsage.faults.length > 0 && (
                                <HardwareList
                                    title={`Hardware Used in Fault Repairs (${hardwareUsage.faults.length} items)`}
                                    data={hardwareUsage.faults}
                                    isOpen={hardwareListsOpen}
                                    onToggle={() => setHardwareListsOpen(!hardwareListsOpen)}
                                />
                            )}
                        </div>
                    )}

                    <div id="pending-jobs-section" className="space-y-6">
                       {!dplusKpis && pendingJobs.length > 0 && <PendingJobsTable title="Pending Jobs" jobs={pendingJobs} technicianLabel={technicianLabel} />}
                       {dplusKpis && dplusPendingJobs && (dplusPendingJobs.installations.length > 0 || dplusPendingJobs.faults.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {dplusPendingJobs.installations.length > 0 && (
                                    <PendingJobsTable 
                                        title="Pending Installations" 
                                        jobs={dplusPendingJobs.installations} 
                                        technicianLabel={technicianLabel} 
                                        isOpen={pendingJobsOpen}
                                        onToggle={() => setPendingJobsOpen(!pendingJobsOpen)}
                                        defaultOpen={false}
                                    />
                                )}
                                {dplusPendingJobs.faults.length > 0 && (
                                    <PendingJobsTable 
                                        title="Pending Fault Repairs" 
                                        jobs={dplusPendingJobs.faults} 
                                        technicianLabel={technicianLabel} 
                                        isOpen={pendingJobsOpen}
                                        onToggle={() => setPendingJobsOpen(!pendingJobsOpen)}
                                        defaultOpen={false}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {invalidRows.length > 0 && <InvalidRowsTable rows={invalidRows} headers={headers} />}
                    
                    {dplusKpis && <AdvancedFaultAnalysis />}
                </>
            )}
        </div>
    );
};