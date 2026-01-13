// Popup script for Job Tracker

let config = null;
let isAuthenticated = false;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await initialize();
  setupEventListeners();
});

/**
 * Initialize popup state
 */
async function initialize() {
  try {
    // Load configuration
    config = await getConfig();
    
    // Check authentication status
    await checkAuthStatus();
    
    // Update UI
    updateUI();
    
    // Load recent jobs
    await loadRecentJobs();
  } catch (error) {
    console.error('Initialization error:', error);
    showMessage('初始化失败: ' + error.message, 'error');
  }
}

/**
 * Get configuration from background
 */
async function getConfig() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'getConfig' }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response.success) {
        resolve(response.config || {});
      } else {
        reject(new Error(response.error || 'Failed to get config'));
      }
    });
  });
}

/**
 * Save configuration
 */
async function saveConfig(newConfig) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'saveConfig', config: newConfig }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response.success) {
        resolve();
      } else {
        reject(new Error(response.error || 'Failed to save config'));
      }
    });
  });
}

/**
 * Check authentication status
 */
async function checkAuthStatus() {
  try {
    // Try to get access token (this will trigger auth if needed, but we check silently)
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(token);
        }
      });
    });
    
    isAuthenticated = !!token;
    updateStatusIndicator(isAuthenticated);
  } catch (error) {
    isAuthenticated = false;
    updateStatusIndicator(false);
  }
}

/**
 * Update status indicator
 */
function updateStatusIndicator(connected) {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  
  if (connected) {
    statusDot.className = 'status-dot connected';
    statusText.textContent = '已连接';
  } else {
    statusDot.className = 'status-dot disconnected';
    statusText.textContent = '未连接';
  }
}

/**
 * Update UI based on state
 */
function updateUI() {
  const authSection = document.getElementById('authSection');
  const configSection = document.getElementById('configSection');
  const recentSection = document.getElementById('recentSection');
  const syncButton = document.getElementById('syncButton');
  const modeDescription = document.getElementById('modeDescription');
  
  const storageMode = (config && config.storageMode) || 'local';
  document.getElementById('storageMode').value = storageMode;
  
  if (storageMode === 'local') {
    // Local mode - no auth needed
    authSection.style.display = 'none';
    configSection.style.display = 'none';
    recentSection.style.display = 'block';
    syncButton.style.display = 'none';
    modeDescription.textContent = '数据保存在浏览器本地，可随时导出为CSV文件';
    updateStatusIndicator(true); // Show as connected for local mode
  } else {
    // Sheets mode - need auth
    if (!isAuthenticated) {
      authSection.style.display = 'block';
      configSection.style.display = 'none';
      recentSection.style.display = 'none';
      syncButton.style.display = 'none';
    } else {
      authSection.style.display = 'none';
      configSection.style.display = 'block';
      recentSection.style.display = 'block';
      syncButton.style.display = 'block';
      
      // Set sheet ID if available
      if (config && config.sheetId) {
        document.getElementById('sheetId').value = config.sheetId;
      }
    }
    modeDescription.textContent = '数据同步到Google Sheets，需要Google账户认证';
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Storage mode selector
  document.getElementById('storageMode').addEventListener('change', handleStorageModeChange);
  
  // Auth button
  document.getElementById('authButton').addEventListener('click', handleAuthenticate);
  
  // Save config button
  document.getElementById('saveConfigButton').addEventListener('click', handleSaveConfig);
  
  // Sync button
  document.getElementById('syncButton').addEventListener('click', handleSync);
  
  // Extract button
  document.getElementById('extractButton').addEventListener('click', handleExtract);
  
  // Export CSV button
  document.getElementById('exportCSVButton').addEventListener('click', handleExportCSV);
}

/**
 * Handle authentication
 */
async function handleAuthenticate() {
  try {
    const button = document.getElementById('authButton');
    button.disabled = true;
    button.textContent = '连接中...';
    
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'authenticate' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    if (response.success) {
      isAuthenticated = true;
      updateUI();
      showMessage('成功连接到Google账户', 'success');
    } else {
      throw new Error(response.error || '认证失败');
    }
  } catch (error) {
    showMessage('认证失败: ' + error.message, 'error');
  } finally {
    const button = document.getElementById('authButton');
    button.disabled = false;
    button.textContent = '连接Google';
  }
}

/**
 * Handle save config
 */
async function handleSaveConfig() {
  try {
    const sheetId = document.getElementById('sheetId').value.trim();
    
    if (!sheetId) {
      showMessage('请输入Google Sheet ID', 'error');
      return;
    }
    
    const button = document.getElementById('saveConfigButton');
    button.disabled = true;
    button.textContent = '保存中...';
    
    const newConfig = {
      ...config,
      sheetId: sheetId
    };
    
    await saveConfig(newConfig);
    config = newConfig;
    
    showMessage('配置已保存', 'success');
  } catch (error) {
    showMessage('保存失败: ' + error.message, 'error');
  } finally {
    const button = document.getElementById('saveConfigButton');
    button.disabled = false;
    button.textContent = '保存配置';
  }
}

/**
 * Handle sync offline queue
 */
async function handleSync() {
  try {
    const button = document.getElementById('syncButton');
    button.disabled = true;
    button.textContent = '同步中...';
    
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'syncOfflineQueue' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    if (response.success) {
      showMessage('离线队列同步完成', 'success');
      await loadRecentJobs();
    }
  } catch (error) {
    showMessage('同步失败: ' + error.message, 'error');
  } finally {
    const button = document.getElementById('syncButton');
    button.disabled = false;
    button.textContent = '同步离线队列';
  }
}

/**
 * Handle storage mode change
 */
async function handleStorageModeChange() {
  const storageMode = document.getElementById('storageMode').value;
  
  try {
    const newConfig = {
      ...config,
      storageMode: storageMode
    };
    
    await saveConfig(newConfig);
    config = newConfig;
    
    // Update UI
    updateUI();
    
    showMessage(`已切换到${storageMode === 'local' ? '本地存储' : 'Google Sheets'}模式`, 'success');
  } catch (error) {
    showMessage('切换失败: ' + error.message, 'error');
    // Revert selection
    document.getElementById('storageMode').value = (config && config.storageMode) || 'local';
  }
}

/**
 * Handle export CSV
 */
async function handleExportCSV() {
  try {
    const button = document.getElementById('exportCSVButton');
    button.disabled = true;
    button.textContent = '导出中...';
    
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'exportCSV' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    if (response.success && response.csv) {
      // Download CSV file
      const blob = new Blob(['\ufeff' + response.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().split('T')[0];
      const filename = `job-tracker-${date}.csv`;
      
      chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          // Fallback: create download link
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
      
      showMessage(`成功导出 ${response.count || 0} 条记录`, 'success');
    } else {
      throw new Error(response.error || '导出失败');
    }
  } catch (error) {
    showMessage('导出失败: ' + error.message, 'error');
  } finally {
    const button = document.getElementById('exportCSVButton');
    button.disabled = false;
    button.textContent = '导出为CSV';
  }
}

/**
 * Handle extract current page
 */
async function handleExtract() {
  try {
    const button = document.getElementById('extractButton');
    button.disabled = true;
    button.textContent = '提取中...';
    
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Send message to content script
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractNow' });
    
    if (response && response.success && response.data) {
      showMessage('已提取工作信息，请查看页面通知', 'success');
      await loadRecentJobs();
    } else {
      const errorMsg = response?.message || response?.error || '未检测到工作信息';
      showMessage(errorMsg + '。提示：请确保页面已完全加载，或尝试刷新页面后再试', 'info');
    }
  } catch (error) {
    showMessage('提取失败: ' + error.message, 'error');
  } finally {
    const button = document.getElementById('extractButton');
    button.disabled = false;
    button.textContent = '提取当前页面';
  }
}

/**
 * Load recent jobs
 */
async function loadRecentJobs() {
  try {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'getRecentJobs' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    if (response.success) {
      displayRecentJobs(response.jobs || []);
    }
  } catch (error) {
    console.error('Error loading recent jobs:', error);
  }
}

/**
 * Display recent jobs
 */
function displayRecentJobs(jobs) {
  const container = document.getElementById('recentJobs');
  
  if (jobs.length === 0) {
    container.innerHTML = '<p class="empty-state">暂无记录</p>';
    return;
  }
  
  container.innerHTML = jobs.map(job => `
    <div class="job-item">
      <div class="job-title">${escapeHtml(job.jobTitle || '未知')}</div>
      <div class="job-company">${escapeHtml(job.company || '未知公司')}</div>
      <div class="job-date">${escapeHtml(job.recordTime || '')}</div>
    </div>
  `).join('');
}

/**
 * Show message
 */
function showMessage(text, type = 'info') {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.style.display = 'block';
  
  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 3000);
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
