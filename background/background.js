// Background service worker for Job Tracker

// Import utility scripts
importScripts('../utils/storage.js');
importScripts('../utils/sheets-api.js');

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true; // Keep channel open for async response
});

/**
 * Handle incoming messages
 */
async function handleMessage(request, sender, sendResponse) {
  try {
    switch (request.action) {
      case 'saveJob':
        const saveResult = await handleSaveJob(request.jobData);
        sendResponse(saveResult);
        break;

      case 'checkDuplicate':
        const isDuplicate = await handleCheckDuplicate(request.jobKey);
        sendResponse({ isDuplicate });
        break;

      case 'getConfig':
        const config = await getConfig();
        sendResponse({ success: true, config });
        break;

      case 'saveConfig':
        await saveConfig(request.config);
        sendResponse({ success: true });
        break;

      case 'authenticate':
        await handleAuthenticate();
        sendResponse({ success: true });
        break;

      case 'getRecentJobs':
        const jobs = await getRecentJobs();
        sendResponse({ success: true, jobs });
        break;

      case 'syncOfflineQueue':
        await syncOfflineQueue();
        sendResponse({ success: true });
        break;

      case 'exportCSV':
        const exportResult = await handleExportCSV();
        sendResponse(exportResult);
        break;

      case 'getAllJobs':
        const allJobs = await getAllJobs();
        sendResponse({ success: true, jobs: allJobs });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Save job data to Google Sheets or local storage
 */
async function handleSaveJob(jobData) {
  try {
    // Get configuration
    const config = await getConfig();
    const storageMode = config.storageMode || 'local';
    
    // Save to recent jobs (prevent duplicates) - always save locally
    const saved = await StorageManager.saveRecentJob(jobData);
    if (!saved) {
      return { success: false, error: '该工作已存在，跳过重复记录' };
    }

    // If local mode, just save locally
    if (storageMode === 'local') {
      // Show notification
      try {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Job Tracker',
          message: `已保存到本地: ${jobData.jobTitle || '工作信息'}`
        });
      } catch (notifError) {
        console.warn('Failed to show notification:', notifError);
      }
      return { success: true, mode: 'local' };
    }

    // Google Sheets mode
    if (!config.sheetId) {
      throw new Error('请先在设置中配置Google Sheet ID，或切换到本地存储模式');
    }

    // Validate sheet access
    const isValid = await SheetsAPI.validateSheet(config.sheetId);
    if (!isValid) {
      throw new Error('无法访问Google Sheet，请检查Sheet ID和权限');
    }

    // Save to sheet
    await SheetsAPI.saveJobData(
      config.sheetId,
      jobData,
      config.columnMapping
    );

    // Show notification
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Job Tracker',
        message: `已成功保存到Sheet: ${jobData.jobTitle || '工作信息'}`
      });
    } catch (notifError) {
      console.warn('Failed to show notification:', notifError);
    }

    return { success: true, mode: 'sheets' };
  } catch (error) {
    console.error('Error saving job:', error);
    
    // Save to offline queue if network error or API error
    const isNetworkError = error.message.includes('网络') || 
                          error.message.includes('fetch') ||
                          error.message.includes('Failed to fetch') ||
                          error.message.includes('NetworkError');
    
    if (isNetworkError) {
      try {
        await StorageManager.addToOfflineQueue(jobData);
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Job Tracker',
          message: '网络错误，已保存到离线队列'
        });
      } catch (queueError) {
        console.error('Failed to save to offline queue:', queueError);
      }
      // Don't throw - we've queued it
      return { success: false, error: '已保存到离线队列，将在网络恢复后自动同步' };
    } else {
      // Re-throw other errors
      throw error;
    }
  }
}

/**
 * Check if job is duplicate
 */
async function handleCheckDuplicate(jobKey) {
  const recentJobs = await StorageManager.getRecentJobs(100);
  return recentJobs.some(job => {
    const key = `${job.jdLink}_${job.jobTitle}`;
    return key === jobKey;
  });
}

/**
 * Get configuration
 */
async function getConfig() {
  return StorageManager.getConfig();
}

/**
 * Save configuration
 */
async function saveConfig(config) {
  return StorageManager.saveConfig(config);
}

/**
 * Get recent jobs
 */
async function getRecentJobs() {
  return StorageManager.getRecentJobs(10);
}

/**
 * Handle authentication
 */
async function handleAuthenticate() {
  try {
    await SheetsAPI.getAccessToken();
    return { success: true };
  } catch (error) {
    throw new Error('认证失败: ' + error.message);
  }
}

/**
 * Get all jobs (for CSV export)
 */
async function getAllJobs() {
  const recentJobs = await StorageManager.getRecentJobs(10000);
  const offlineQueue = await StorageManager.getOfflineQueue();
  
  // Combine and deduplicate
  const allJobs = [...recentJobs];
  offlineQueue.forEach(item => {
    const exists = allJobs.some(job => 
      job.jdLink === item.data.jdLink && job.jobTitle === item.data.jobTitle
    );
    if (!exists) {
      allJobs.push(item.data);
    }
  });
  
  // Sort by timestamp (newest first)
  return allJobs.sort((a, b) => {
    const timeA = new Date(a.recordTime || 0).getTime();
    const timeB = new Date(b.recordTime || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Handle CSV export
 */
async function handleExportCSV() {
  try {
    const allJobs = await getAllJobs();
    
    // Convert to CSV format
    const headers = ['工作名称', '公司名称', '申请日期', 'JD链接', '申请状态', '记录时间'];
    const rows = allJobs.map(job => [
      job.jobTitle || '',
      job.company || '',
      job.applicationDate || '',
      job.jdLink || '',
      job.status || '已申请',
      job.recordTime || ''
    ]);

    // Escape CSV fields
    const escapeCSV = (field) => {
      if (field === null || field === undefined) return '';
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    return { success: true, csv: csvContent, count: allJobs.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Sync offline queue
 */
async function syncOfflineQueue() {
  try {
    const queue = await StorageManager.getOfflineQueue();
    
    if (queue.length === 0) {
      return;
    }

    const config = await getConfig();
    if (!config || !config.sheetId) {
      // Can't sync without config
      return;
    }

    const failedItems = [];
    
    for (const item of queue) {
      try {
        const result = await handleSaveJob(item.data);
        if (!result || !result.success) {
          // Keep failed items
          failedItems.push(item);
        }
      } catch (error) {
        console.error('Error syncing queued job:', error);
        // Keep in queue if still failing (but not network errors - those will retry)
        const isNetworkError = error.message.includes('网络') || 
                              error.message.includes('fetch');
        if (!isNetworkError) {
          failedItems.push(item);
        }
      }
    }

    // Update queue with failed items only
    if (failedItems.length < queue.length) {
      await StorageManager.clearOfflineQueue();
      // Re-add failed items
      for (const item of failedItems) {
        await StorageManager.addToOfflineQueue(item.data);
      }
    }
  } catch (error) {
    console.error('Error in syncOfflineQueue:', error);
  }
}

// Sync offline queue when extension starts
chrome.runtime.onStartup.addListener(() => {
  syncOfflineQueue();
});

chrome.runtime.onInstalled.addListener(() => {
  syncOfflineQueue();
});

// Periodically sync offline queue (every 5 minutes)
setInterval(() => {
  syncOfflineQueue();
}, 5 * 60 * 1000);
