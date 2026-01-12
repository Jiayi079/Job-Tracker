// CSV export functionality for local storage option

class CSVExport {
  /**
   * Convert job data array to CSV format
   * @param {Array} jobs - Array of job data objects
   * @returns {string} CSV string
   */
  static toCSV(jobs) {
    if (!jobs || jobs.length === 0) {
      return '';
    }

    // CSV header
    const headers = ['工作名称', '公司名称', '申请日期', 'JD链接', '申请状态', '记录时间'];
    
    // Convert jobs to CSV rows
    const rows = jobs.map(job => [
      this.escapeCSV(job.jobTitle || ''),
      this.escapeCSV(job.company || ''),
      this.escapeCSV(job.applicationDate || ''),
      this.escapeCSV(job.jdLink || ''),
      this.escapeCSV(job.status || '已申请'),
      this.escapeCSV(job.recordTime || '')
    ]);

    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Escape CSV field (handle commas, quotes, newlines)
   * @param {string} field - Field value
   * @returns {string} Escaped field
   */
  static escapeCSV(field) {
    if (field === null || field === undefined) {
      return '';
    }

    const str = String(field);
    
    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    
    return str;
  }

  /**
   * Download CSV file
   * @param {string} csvContent - CSV content string
   * @param {string} filename - Filename (default: job-tracker-YYYY-MM-DD.csv)
   */
  static downloadCSV(csvContent, filename = null) {
    if (!filename) {
      const date = new Date().toISOString().split('T')[0];
      filename = `job-tracker-${date}.csv`;
    }

    // Create blob
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel compatibility
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  }

  /**
   * Export all jobs from storage to CSV
   * @returns {Promise<void>}
   */
  static async exportAllJobs() {
    try {
      // Get all jobs from storage
      const recentJobs = await StorageManager.getRecentJobs(10000); // Get all
      const offlineQueue = await StorageManager.getOfflineQueue();
      
      // Combine all jobs
      const allJobs = [...recentJobs];
      offlineQueue.forEach(item => {
        if (!allJobs.some(job => job.jdLink === item.data.jdLink && job.jobTitle === item.data.jobTitle)) {
          allJobs.push(item.data);
        }
      });

      // Convert to CSV
      const csvContent = this.toCSV(allJobs);
      
      if (!csvContent) {
        throw new Error('没有数据可导出');
      }

      // Download
      this.downloadCSV(csvContent);
      
      return { success: true, count: allJobs.length };
    } catch (error) {
      throw new Error('导出失败: ' + error.message);
    }
  }
}
