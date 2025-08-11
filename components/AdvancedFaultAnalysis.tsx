import React, { useState, useRef, useCallback } from 'react';

export const AdvancedFaultAnalysis: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<Array<{ fault: string; cause: string; solution: string; count: number; percentage: number; }> | null>(null);
    const [fileNames, setFileNames] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback((files: File[]) => {
        const csvFiles = files.filter(file => file.name.toLowerCase().endsWith('.csv'));
        if (csvFiles.length === 0) {
            setError('Please select only CSV files.');
            return;
        }

        setSelectedFiles(csvFiles);
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        setFileNames(csvFiles.map(f => f.name).join(', '));

        const parsePromises = csvFiles.map(file => {
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
                    results.data.forEach((row: any) => {
                        if (
                            row.DepartmentName?.trim() === 'St. Lucia Fault Repair External' &&
                            row.FaultDescription2?.trim() &&
                            row.CauseDescription2?.trim() &&
                            row.SolutionDescription2?.trim()
                        ) {
                            const key = `${row.FaultDescription2.trim()}_${row.CauseDescription2.trim()}_${row.SolutionDescription2.trim()}`;
                            if (!faultCounts[key]) {
                                faultCounts[key] = {
                                    fault: row.FaultDescription2.trim(),
                                    cause: row.CauseDescription2.trim(),
                                    solution: row.SolutionDescription2.trim(),
                                    count: 0,
                                };
                            }
                            faultCounts[key].count++;
                        }
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
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        handleFiles(Array.from(files));
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!isLoading) {
            setDragOver(true);
        }
    }, [isLoading]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        
        if (isLoading) return;
        
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFiles(files);
        }
    }, [isLoading, handleFiles]);
    
    const handleReset = () => {
        setAnalysisResult(null);
        setError(null);
        setFileNames(null);
        setSelectedFiles([]);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const removeFile = (indexToRemove: number) => {
        const newFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
        setSelectedFiles(newFiles);
        if (newFiles.length === 0) {
            setFileNames(null);
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
                    <div
                        className={`relative border-2 border-dashed rounded-lg p-4 transition-all duration-200 text-center ${
                            dragOver 
                                ? 'border-slate-400 bg-slate-50' 
                                : 'border-slate-300 hover:border-slate-400'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={!isLoading ? () => inputRef.current?.click() : undefined}
                    >
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
                        
                        <div className="flex flex-col items-center space-y-3">
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-8 w-8 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="text-slate-600 font-medium">Analyzing...</span>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2-2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2H10zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2H10z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <button
                                            type="button"
                                            className="px-4 py-2 text-base font-semibold text-white bg-slate-600 rounded-md hover:bg-slate-700 transition-all duration-200 ease-in-out"
                                        >
                                            {selectedFiles.length > 0 ? 'Change Files' : 'Upload for Analysis'}
                                        </button>
                                        <p className="mt-2 text-sm text-slate-500">
                                            {dragOver ? 'Drop your CSV files here' : 'Click to browse or drag and drop CSV files'}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {selectedFiles.length > 0 && !analysisResult && (
                    <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium text-slate-700">Selected Files ({selectedFiles.length}):</h4>
                        <div className="max-h-24 overflow-y-auto space-y-1">
                            {selectedFiles.map((file, index) => (
                                <div key={`${file.name}-${index}`} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded text-sm">
                                    <span className="flex items-center space-x-2">
                                        <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="truncate" title={file.name}>{file.name}</span>
                                        <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                                    </span>
                                    {!isLoading && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile(index);
                                            }}
                                            className="text-red-500 hover:text-red-700 p-1"
                                            title="Remove file"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
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
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-slate-800">Top 10 Fault Scenarios</h4>
                        <button
                            onClick={handleReset}
                            className="px-3 py-1 text-sm bg-slate-500 text-white rounded hover:bg-slate-600 transition-colors"
                        >
                            Upload New Files
                        </button>
                    </div>
                    {fileNames && (
                        <p className="text-xs text-slate-500 mb-4 text-center truncate" title={fileNames}>
                            Analyzed from: {fileNames}
                        </p>
                    )}
                    <div className="overflow-x-auto">
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
