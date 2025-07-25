import React, { useState, useCallback } from 'react';
import type { ParseResult } from 'papaparse';
import { processCsvData } from './services/csvProcessor';
import { processDplusData } from './services/dplusCsvProcessor';
import type { DashboardData, RowData } from './types';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Dashboard } from './components/Dashboard';
import { FileUpload } from './components/FileUpload';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

interface AppState {
  dashboardData: DashboardData | null;
  rawCsvData: RowData[] | null;
  filters: { technician: string; category: string; month: string };
  isLoading: boolean;
  error: string | null;
  fileName: string;
  reportType: 'ICT' | 'D+' | null;
  technicianLabel: string;
  categoryLabel: string;
}

const initialState: AppState = {
  dashboardData: null,
  rawCsvData: null,
  filters: { technician: 'All', category: 'All', month: 'All' },
  isLoading: false,
  error: null,
  fileName: '',
  reportType: null,
  technicianLabel: 'Technician',
  categoryLabel: 'Category',
};


const App: React.FC = () => {
  const [state, setState] = useState<AppState>(initialState);

  const handleFilesSelected = useCallback((files: File[]) => {
    if (!files || files.length === 0) return;

    setState({
      ...initialState,
      isLoading: true,
      fileName: files.map(f => f.name).join(', '),
    });

    const parsePromises = files.map(file => {
      return new Promise<ParseResult<RowData>>((resolve, reject) => {
        (window as any).Papa.parse(file, {
          complete: (results: ParseResult<RowData>) => resolve(results),
          error: (err: Error) => reject(new Error(`Failed to parse ${file.name}: ${err.message}`)),
        });
      });
    });

    Promise.all(parsePromises)
      .then(resultsArray => {
        if (resultsArray.length === 0 || resultsArray.every(r => r.data.length === 0)) {
          throw new Error("No data found in the selected files.");
        }

        const firstResultWithData = resultsArray.find(r => r.data.length > 0);
        if (!firstResultWithData) {
          throw new Error("No data found in any of the selected files.");
        }

        const firstFileData = firstResultWithData.data as RowData[];

        // --- Report Type Detection ---
        const ICT_KEY_HEADERS = ["Technician", "RequestID", "Request Status", "Assigned Time"];
        const DPLUS_KEY_HEADERS = ["Engineers", "JobNumber", "JobStatusFull", "DepartmentName"];
        
        let detectedReportType: 'ICT' | 'D+' | null = null;
        let headerRowIndex = -1;

        for (let i = 0; i < firstFileData.length && i < 15; i++) {
          const rowAsHeaders = firstFileData[i].map(h => (h || '').trim().toLowerCase());
          
          const foundIctKeys = ICT_KEY_HEADERS.every(key => rowAsHeaders.includes(key.toLowerCase()));
          if (foundIctKeys) {
            detectedReportType = 'ICT';
            headerRowIndex = i;
            break;
          }

          const foundDplusKeys = DPLUS_KEY_HEADERS.every(key => rowAsHeaders.includes(key.toLowerCase()));
          if (foundDplusKeys) {
            detectedReportType = 'D+';
            headerRowIndex = i;
            break;
          }
        }

        if (!detectedReportType || headerRowIndex === -1) {
          throw new Error("Could not find a valid data header row. Please ensure files have consistent columns for either ICT or D+ reports.");
        }

        const combinedHeaders = firstFileData[headerRowIndex];
        
        const allDataRows = resultsArray.flatMap(result =>
          result.data.length > headerRowIndex ? (result.data as RowData[]).slice(headerRowIndex + 1) : []
        );
        
        const combinedRawCsvData = [combinedHeaders, ...allDataRows];

        const processFunction = detectedReportType === 'D+' ? processDplusData : processCsvData;
        const data = processFunction(combinedRawCsvData);
        
        const noTicketsFound = data.kpis.totalTickets === 0 &&
                               data.pendingJobs.length === 0 &&
                               (!data.dplusPendingJobs || (data.dplusPendingJobs.installations.length === 0 && data.dplusPendingJobs.faults.length === 0)) &&
                               (data.kpis.failedInstallations || 0) === 0 &&
                               (data.kpis.failedFaults || 0) === 0 &&
                               (data.kpis.cancelledInstallations || 0) === 0 &&
                               (data.kpis.cancelledFaults || 0) === 0 &&
                               (data.kpis.relocations || 0) === 0 &&
                               (data.kpis.reassociations || 0) === 0 &&
                               (data.kpis.completedInstallations || 0) === 0 &&
                               (data.kpis.completedFaults || 0) === 0;


        if (noTicketsFound) {
          setState(prevState => ({
            ...prevState,
            error: "No valid tickets found in the files to process. Please check the data.",
            isLoading: false,
          }));
        } else {
          setState(prevState => ({
            ...prevState,
            rawCsvData: combinedRawCsvData,
            dashboardData: data,
            isLoading: false,
            reportType: detectedReportType,
            technicianLabel: detectedReportType === 'D+' ? 'Engineer' : 'Technician',
            categoryLabel: detectedReportType === 'D+' ? 'Department' : 'Category',
          }));
        }
      })
      .catch(err => {
        setState(prevState => ({
          ...prevState,
          error: `Error processing files: ${err.message}`,
          isLoading: false,
        }));
        console.error(err);
      });
  }, []);
  
  const handleFilterChange = (type: 'technician' | 'category' | 'month', value: string) => {
    if (!state.rawCsvData || !state.reportType) return;

    const newFilters = { ...state.filters, [type]: value };
    
    const effectiveFilters: { technician?: string; category?: string; month?: string } = {};
    if (newFilters.technician !== 'All') effectiveFilters.technician = newFilters.technician;
    if (newFilters.category !== 'All') effectiveFilters.category = newFilters.category;
    if (newFilters.month !== 'All') effectiveFilters.month = newFilters.month;
    
    const processFunction = state.reportType === 'D+' ? processDplusData : processCsvData;
    const data = processFunction(state.rawCsvData, Object.keys(effectiveFilters).length > 0 ? effectiveFilters : undefined);

    setState(prevState => ({
      ...prevState,
      filters: newFilters,
      dashboardData: data,
    }));
  };

  const handleReset = () => {
    setState(initialState);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Header 
        onReset={handleReset} 
        hasData={!!state.dashboardData}
      />
      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <FileUpload onFilesSelected={handleFilesSelected} disabled={state.isLoading} />
          {state.fileName && <p className="text-center text-slate-500 mt-2 text-sm max-w-2xl mx-auto truncate" title={state.fileName}>Files: {state.fileName}</p>}
          
          {state.isLoading && (
            <div className="text-center my-10">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-lg font-semibold text-slate-700">Processing data...</p>
            </div>
          )}

          {state.error && (
            <div className="text-center my-10 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p className="font-bold">An Error Occurred</p>
              <p>{state.error}</p>
            </div>
          )}
          
          {!state.isLoading && !state.error && state.dashboardData ? (
             <Dashboard 
                data={state.dashboardData} 
                filters={state.filters}
                onFilterChange={handleFilterChange}
                technicianLabel={state.technicianLabel}
                categoryLabel={state.categoryLabel}
             />
          ) : (
            !state.isLoading && !state.error && <WelcomeScreen />
          )}
        </div>
      </main>
      {state.dashboardData && <Footer dashboardData={state.dashboardData} />}
    </div>
  );
};

export default App;