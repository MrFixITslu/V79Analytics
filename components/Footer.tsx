import React, { useState } from 'react';
import type { DashboardData } from '../types';

interface FooterProps {
  dashboardData: DashboardData;
}

export const Footer: React.FC<FooterProps> = ({ dashboardData }) => {
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [emailShareData, setEmailShareData] = useState<{ file: File; text: string; subject: string } | null>(null);

  const handleExportPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    const dashboardElement = document.getElementById('dashboard-container');
    if (!dashboardElement) {
      alert('Could not find dashboard content to export.');
      setIsGeneratingPdf(false);
      return;
    }

    const tempContainer = document.createElement('div');
    // Style for off-screen rendering to ensure layout is calculated correctly
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '1200px'; // A fixed, wide width for consistent rendering

    const clonedDashboard = dashboardElement.cloneNode(true) as HTMLElement;

    // --- Modify the cloned content for the PDF layout ---
    const reportTitle = document.createElement('h1');
    reportTitle.className = 'text-3xl font-bold text-slate-800 text-center mb-2';
    reportTitle.innerText = 'Service Delivery Performance Report';
    const reportDate = document.createElement('p');
    reportDate.className = 'text-sm text-slate-500 text-center mb-6';
    reportDate.innerText = `Generated: ${new Date().toLocaleString()}`;
    clonedDashboard.insertBefore(reportDate, clonedDashboard.firstChild);
    clonedDashboard.insertBefore(reportTitle, clonedDashboard.firstChild);

    const sectionsToRemove = ['#filter-controls', '#pending-jobs-section', '#invalid-rows-section'];
    sectionsToRemove.forEach(selector => {
      const el = clonedDashboard.querySelector(selector);
      if (el) (el as HTMLElement).style.display = 'none';
    });

    const breakdownContainers = clonedDashboard.querySelectorAll('.breakdown-container');
    breakdownContainers.forEach(container => {
      const titleEl = container.querySelector('h3');
      if (titleEl) titleEl.innerText += ' (Top 10)';
      
      const tableBody = container.querySelector('tbody');
      if (tableBody) {
        tableBody.querySelectorAll('tr').forEach((row, index) => {
          if (index >= 10) row.remove();
        });
      }
      
      const scrollableDiv = container.querySelector('.overflow-y-auto');
      if (scrollableDiv) (scrollableDiv as HTMLElement).style.height = 'auto';
    });
    
    tempContainer.appendChild(clonedDashboard);
    document.body.appendChild(tempContainer);

    try {
      const canvas = await (window as any).html2canvas(clonedDashboard, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc',
      });

      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = (window as any).jspdf;
      const pdf = new jsPDF({ orientation: 'l', unit: 'mm', format: 'letter' });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      
      const contentWidth = pdfWidth - margin * 2;
      const contentHeight = pdfHeight - margin * 2;

      const imgProps = pdf.getImageProperties(imgData);
      const imgRatio = imgProps.width / imgProps.height;
      const contentRatio = contentWidth / contentHeight;

      let finalWidth, finalHeight;

      if(imgRatio > contentRatio) {
        finalWidth = contentWidth;
        finalHeight = finalWidth / imgRatio;
      } else {
        finalHeight = contentHeight;
        finalWidth = finalHeight * imgRatio;
      }

      const x = margin + (contentWidth - finalWidth) / 2;
      const y = margin + (contentHeight - finalHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
      pdf.save(`Service_Delivery_Report_${new Date().toISOString().slice(0, 10)}.pdf`);

    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert('An error occurred while generating the PDF. Please try again.');
    } finally {
      document.body.removeChild(tempContainer);
      setIsGeneratingPdf(false);
    }
  };

  const generateEmailContent = async () => {
    if (!dashboardData || isGeneratingEmail) return;
  
    setIsGeneratingEmail(true);
    setEmailShareData(null);
  
    const recipient = "neil.verdant@digicelgroup.com";
    const subject = "Service Delivery Performance Report";
    const pdfFileName = `Service_Delivery_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  
    const createSimpleBody = () => {
        const { kpis, dplusKpis } = dashboardData;
        if (dplusKpis) {
           return `
  Hello,
  
  Here is a summary from the D+ Service Delivery Performance Report:
  
  Key Metrics:
  - Mean Time to Install (MTTI): ${dplusKpis.overallMtti.value.toFixed(2)} hours
  - Mean Time to Repair (MTTR): ${dplusKpis.overallMttr.value.toFixed(2)} hours
  - Installations Pending: ${kpis.installationPending || 0}
  - Faults Pending: ${kpis.faultPending || 0}
  - Failed Installations: ${kpis.failedInstallations || 0}
  - Failed Fault Repairs: ${kpis.failedFaults || 0}
  - Cancelled Installations: ${kpis.cancelledInstallations || 0}
  - Cancelled Faults: ${kpis.cancelledFaults || 0}
  - Number of Relocations: ${kpis.relocations || 0}
  - Number of Reassociations: ${kpis.reassociations || 0}
  - Completed Installations: ${kpis.completedInstallations || 0}
  - Completed Faults: ${kpis.completedFaults || 0}
  - Repeat Truck Rolls: ${kpis.repeatTruckRolls || 0}
  
  This is an automated message.
        `.trim();
        }
        return `
  Hello,
  
  Here is a summary from the ICT Service Delivery Performance Report:
  
  Key Metrics:
  - Mean Time to Assign (MTTA): ${kpis.mtta.toFixed(2)} hours
  - Mean Time to Install (MTTI): ${kpis.mtti.toFixed(2)} hours
  - Mean Time to Resolve (MTTR): ${kpis.mttr.toFixed(2)} hours
  - First-Time Resolution (FTR): ${kpis.ftr >= 0 ? kpis.ftr.toFixed(2) + '%' : 'N/A'}
  - SLA Adherence: ${kpis.sla >= 0 ? kpis.sla.toFixed(2) + '%' : 'N/A'}
  - Total Closed Tickets: ${kpis.totalTickets}
  - Current Pending: ${kpis.pending}
  
  This is an automated message.
        `.trim();
    };
  
    try {
      // --- 1. Generate PDF Blob ---
      let pdfBlob: Blob | null = null;
      let tempContainer: HTMLDivElement | null = null;
      try {
        const dashboardElement = document.getElementById('dashboard-container');
        if (!dashboardElement) throw new Error('Dashboard element not found');
  
        tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '1200px';
  
        const clonedDashboard = dashboardElement.cloneNode(true) as HTMLElement;
  
        const reportTitle = document.createElement('h1');
        reportTitle.className = 'text-3xl font-bold text-slate-800 text-center mb-2';
        reportTitle.innerText = 'Service Delivery Performance Report';
        const reportDate = document.createElement('p');
        reportDate.className = 'text-sm text-slate-500 text-center mb-6';
        reportDate.innerText = `Generated: ${new Date().toLocaleString()}`;
        clonedDashboard.insertBefore(reportDate, clonedDashboard.firstChild);
        clonedDashboard.insertBefore(reportTitle, clonedDashboard.firstChild);
  
        const sectionsToRemove = ['#filter-controls', '#pending-jobs-section', '#invalid-rows-section'];
        sectionsToRemove.forEach(selector => {
            const el = clonedDashboard.querySelector(selector);
            if (el) (el as HTMLElement).style.display = 'none';
        });
        const breakdownContainers = clonedDashboard.querySelectorAll('.breakdown-container');
        breakdownContainers.forEach(container => {
            const titleEl = container.querySelector('h3');
            if (titleEl) titleEl.innerText += ' (Top 10)';
            const tableBody = container.querySelector('tbody');
            if (tableBody) {
                tableBody.querySelectorAll('tr').forEach((row, index) => {
                    if (index >= 10) row.remove();
                });
            }
            const scrollableDiv = container.querySelector('.overflow-y-auto');
            if (scrollableDiv) (scrollableDiv as HTMLElement).style.height = 'auto';
        });
  
        tempContainer.appendChild(clonedDashboard);
        document.body.appendChild(tempContainer);
        
        const canvas = await (window as any).html2canvas(clonedDashboard, { scale: 2, useCORS: true, backgroundColor: '#f8fafc' });
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = (window as any).jspdf;
        const pdf = new jsPDF({ orientation: 'l', unit: 'mm', format: 'letter' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const contentWidth = pdfWidth - margin * 2;
        const contentHeight = pdfHeight - margin * 2;
        const imgProps = pdf.getImageProperties(imgData);
        const imgRatio = imgProps.width / imgProps.height;
        const contentRatio = contentWidth / contentHeight;
        let finalWidth, finalHeight;
        if (imgRatio > contentRatio) {
            finalWidth = contentWidth;
            finalHeight = finalWidth / imgRatio;
        } else {
            finalHeight = contentHeight;
            finalWidth = finalHeight * imgRatio;
        }
        const x = margin + (contentWidth - finalWidth) / 2;
        const y = margin + (contentHeight - finalHeight) / 2;
        pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
        
        pdfBlob = pdf.output('blob');
      } finally {
        if (tempContainer) {
            document.body.removeChild(tempContainer);
        }
      }
      
      if (!pdfBlob) {
        throw new Error("PDF generation failed.");
      }
  
      const emailText = createSimpleBody();
      
      // --- Set data in state for sharing ---
      const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
      setEmailShareData({ file: pdfFile, text: emailText, subject });
  
    } catch (error) {
      console.error("Error generating email report:", error);
      alert("An error occurred while generating the full report. A simple text-based summary will be prepared instead.");
      const fallbackBody = createSimpleBody();
      window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fallbackBody)}`;
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const shareEmailReport = async () => {
    if (!emailShareData) return;

    const { file, text, subject } = emailShareData;
    const recipient = "neil.verdant@digicelgroup.com";
    
    try {
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
            title: subject,
            text: text,
            files: [file],
        });
      } else {
        console.log('Web Share API for files not supported. Falling back to download and mailto link.');
        
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        const bodyWithAttachmentInfo = `Hello,\n\nThe Service Delivery Performance Report PDF has been downloaded to your computer.\n\nPlease attach the file "${file.name}" to this email.\n\n---\n\n${text}`;
        window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyWithAttachmentInfo)}`;
      }
    } catch (error) {
        console.error("Error during share:", error);
        if ((error as DOMException).name !== 'AbortError') {
           alert("Could not share the report. Please try again.");
        }
    } finally {
        setEmailShareData(null); // Reset state after sharing attempt
    }
  };

  const handleEmailButtonClick = () => {
    if (emailShareData) {
      shareEmailReport();
    } else {
      generateEmailContent();
    }
  };
  
  return (
    <footer className="sticky bottom-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-center space-x-4">
        <button
          onClick={handleExportPdf}
          disabled={isGeneratingPdf}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-semibold disabled:bg-green-400 disabled:cursor-wait"
        >
          {isGeneratingPdf ? (
             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
          <span>{isGeneratingPdf ? 'Generating PDF...' : 'Export as PDF'}</span>
        </button>
        <button
          onClick={handleEmailButtonClick}
          disabled={isGeneratingEmail}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold disabled:bg-blue-400 disabled:cursor-wait"
        >
          {isGeneratingEmail ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : emailShareData ? (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
               <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
             </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          )}
          <span>{isGeneratingEmail ? 'Generating...' : emailShareData ? 'Share Report' : 'Email Report'}</span>
        </button>
      </div>
    </footer>
  );
};