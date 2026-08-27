import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({ providedIn: 'root' })
export class ExportService {

  exportToExcel(data: any[], fileName: string): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${fileName}_${new Date().getTime()}.xlsx`);
  }

  exportToPDF(headers: string[], rows: any[][], fileName: string, title: string): void {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] }
    });

    doc.save(`${fileName}_${new Date().getTime()}.pdf`);
  }

  downloadSampleExcelTemplate(activeManagers: any[]): void {
    const sampleData = [
      {
        ProjectName: 'Cloud Migration Suite',
        Description: 'Migrate enterprise servers to AWS',
        StartDate: '2026-08-10',
        EndDate: '2026-12-31',
        Status: 'PLANNED',
        ManagerEmail: activeManagers.length > 0 ? activeManagers[0].email : 'pm1@test.com'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Upload_Template');

    // Add Reference Data Sheet for PMs & Statuses
    const pmReferenceData = activeManagers.map(m => ({ ManagerName: m.name, ManagerEmail: m.email }));
    const refWorksheet = XLSX.utils.json_to_sheet(pmReferenceData.length > 0 ? pmReferenceData : [{ ManagerName: 'Demo Manager', ManagerEmail: 'pm1@test.com' }]);
    XLSX.utils.book_append_sheet(workbook, refWorksheet, 'Valid_Managers_List');

    XLSX.writeFile(workbook, `Project_Bulk_Upload_Template_${new Date().getTime()}.xlsx`);
  }
}