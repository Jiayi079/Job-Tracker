// Local storage management for Job Tracker

class StorageManager {
  /**
   * Save configuration to Chrome storage
   * @param {Object} config - Configuration object
   */
  static async saveConfig(config) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ config }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Get configuration from Chrome storage
   * @returns {Promise<Object>} Configuration object
   */
  static async getConfig() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(['config'], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result.config || {
            storageMode: 'local', // 'local' or 'sheets'
            sheetId: '',
            columnMapping: {
              jobTitle: '工作名称',
              company: '公司名称',
              applicationDate: '申请日期',
              jdLink: 'JD链接',
              status: '申请状态',
              recordTime: '记录时间'
            }
          });
        }
      });
    });
  }

  /**
   * Save recently extracted job data (to prevent duplicates)
   * @param {Object} jobData - Job data object
   */
  static async saveRecentJob(jobData) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['recentJobs'], (result) => {
        const recentJobs = result.recentJobs || [];
        const jobKey = `${jobData.jdLink}_${jobData.jobTitle}`;
        
        // Check if already exists
        if (recentJobs.some(job => job.key === jobKey)) {
          resolve(false); // Already exists
          return;
        }

        // Add new job with timestamp
        recentJobs.push({
          key: jobKey,
          data: jobData,
          timestamp: Date.now()
        });

        // Keep only last 100 jobs
        if (recentJobs.length > 100) {
          recentJobs.shift();
        }

        chrome.storage.local.set({ recentJobs }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(true);
          }
        });
      });
    });
  }

  /**
   * Get recent jobs
   * @param {number} limit - Maximum number of jobs to return
   * @returns {Promise<Array>} Array of recent jobs
   */
  static async getRecentJobs(limit = 10) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['recentJobs'], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          const recentJobs = (result.recentJobs || [])
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit)
            .map(item => item.data);
          resolve(recentJobs);
        }
      });
    });
  }

  /**
   * Save job to offline queue
   * @param {Object} jobData - Job data object
   */
  static async addToOfflineQueue(jobData) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['offlineQueue'], (result) => {
        const queue = result.offlineQueue || [];
        queue.push({
          data: jobData,
          timestamp: Date.now()
        });

        chrome.storage.local.set({ offlineQueue: queue }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    });
  }

  /**
   * Get offline queue
   * @returns {Promise<Array>} Array of queued jobs
   */
  static async getOfflineQueue() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['offlineQueue'], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result.offlineQueue || []);
        }
      });
    });
  }

  /**
   * Clear offline queue
   */
  static async clearOfflineQueue() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ offlineQueue: [] }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }
}
