import React, { useState, useRef } from 'react';

export const AdvancedFaultAnalysis: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<Array<{ fault: string; cause: string; solution: string; count: number; percentage: number; }> | null>(null);
    const [fileNames, setFileNames] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        setFileNames(Array.from(files).map(f => f.name).join(', '));

        const parsePromises = Array.from(files).map(file => {
            return new Promise<any>((resolve, reject) => {
                (window as any).Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results: any) => resolve(results),
                    error: (err: Error) => reject(new Error(`Failed to parse ${file.name}: ${err.message}`)),
                });
            });
        });

        Promise.all(parsePromises)
            .then(resultsArray => {
                if (resultsArray.length === 0 || resultsArray.every(r => r.data.length === 0)) {
                    throw new Error("No data found in the selected files.");
                }

                const faultCounts: { [key: string]: { fault: string; cause: string; solution: string; count: number } } = {};
                const requiredHeaders = ['DepartmentName', 'FaultDescription2', 'CauseDescription2', 'SolutionDescription2'];

                const firstResultWithData = resultsArray.find(r => r.data.length > 0);
                if (!firstResultWithData) {
                    throw new Error("No data found in any of the selected files.");
                }

                const fileHeaders = firstResultWithData.meta.fields;
                for (const header of requiredHeaders) {
                    if (!fileHeaders || !fileHeaders.includes(header)) {
                        throw new Error(`Required column "${header}" not found in the uploaded file(s). Please ensure all files have the correct headers.`);
                    }
                }

                for (const results of resultsArray) {
                    const data = results.data;
                    if (!data || data.length === 0) continue;

                    const faultData = data.filter((row: any) =>
                        row.DepartmentName && row.DepartmentName.toLowerCase().includes('st. lucia fault repair external')
                    );

                    faultData.forEach((row: any) => {
                        const fault = (row.FaultDescription2 || 'N/A').trim();
                        const cause = (row.CauseDescription2 || 'N/A').trim();
                        const solution = (row.SolutionDescription2 || 'N/A').trim();
                        
                        if (fault === 'N/A' || fault === '') return;

                        const key = `${fault}|${cause}|${solution}`;

                        if (!faultCounts[key]) {
                            faultCounts[key] = { fault, cause, solution, count: 0 };
                        }
                        faultCounts[key].count++;
                    });
                }
                
                if (Object.keys(faultCounts).length === 0) {
                    throw new Error("No 'St. Lucia Fault Repair External' data or valid fault descriptions were found to analyze across all files.");
                }
                
                const allFaults = Object.values(faultCounts);
                const totalFaultsCount = allFaults.reduce((sum, item) => sum + item.count, 0);

                const sortedResults = allFaults
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10)
                    .map(item => ({
                        ...item,
                        percentage: totalFaultsCount > 0 ? (item.count / totalFaultsCount) * 100 : 0,
                    }));
                
                setAnalysisResult(sortedResults);
            })
            .catch((e: any) => {
                setError(e.message);
            })
            .finally(() => {
                setIsLoading(false);
                if (inputRef.current) {
                    inputRef.current.value = '';
                }
            });
    };
    
    const handleReset = () => {
        setAnalysisResult(null);
        setError(null);
        setFileNames(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };


    return (
        <div id="fault-analysis-section" className="mt-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-xl font-semibold text-slate-800 text-center">Advanced Fault Analysis</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-lg mx-auto text-center">
                Upload one or more detailed fault report CSVs to see the top 10 most common fault scenarios.
            </p>
            <div className="mt-4 max-w-md mx-auto">
                {!analysisResult && (
                    <label
                        htmlFor="fault-report-input"
                        className={`w-full px-6 py-3 text-base font-semibold text-white bg-slate-600 rounded-md hover:bg-slate-700 transition-all duration-200 ease-in-out flex items-center justify-center space-x-2 ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Analyzing...</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2-2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2H10zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2H10z" clipRule="evenodd" />
                                </svg>
                                <span>Upload for Analysis</span>
                            </>
                        )}
                    </label>
                )}
                <input
                    type="file"
                    id="fault-report-input"
                    ref={inputRef}
                    onChange={handleFileChange}
                    accept=".csv"
                    className="hidden"
                    disabled={isLoading}
                    multiple
                />
                {fileNames && !analysisResult && (
                    <p className="mt-2 text-xs text-slate-500 text-center truncate" title={fileNames}>
                        Files: {fileNames}
                    </p>
                )}
            </div>

            {error && (
                <div className="mt-4 text-center p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-lg mx-auto">
                    <p className="font-bold">An Error Occurred</p>
                    <p>{error}</p>
                </div>
            )}
            
            {analysisResult && (
                <div className="mt-6">
                    <div className="overflow-x-auto">
                        <h4 className="text-lg font-semibold text-slate-800 mb-3">Top 10 Fault Repair Scenarios</h4>
                        <table className="w-full min-w-[600px] text-sm text-left">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="p-3 font-semibold text-slate-600">Fault Description</th>
                                    <th className="p-3 font-semibold text-slate-600">Cause Description</th>
                                    <th className="p-3 font-semibold text-slate-600">Solution Description</th>
                                    <th className="p-3 font-semibold text-slate-600 text-center">Count</th>
                                    <th className="p-3 font-semibold text-slate-600 text-center">% of Total Faults</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {analysisResult.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50">
                                        <td className="p-3 text-slate-700">{item.fault}</td>
                                        <td className="p-3 text-slate-700">{item.cause}</td>
                                        <td className="p-3 text-slate-700">{item.solution}</td>
                                        <td className="p-3 text-center font-bold text-blue-600">{item.count}</td>
                                        <td className="p-3 text-center text-slate-600 font-medium">{Math.ceil(item.percentage)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     <div className="text-center mt-6">
                         <button 
                             onClick={handleReset}
                             className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors text-sm font-semibold"
                         >
                             Clear Analysis & Upload New File
                         </button>
                    </div>
                </div>
            )}
        </div>
    );
};
