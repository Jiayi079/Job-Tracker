// Content script for detecting and extracting job information

(function() {
  'use strict';

  let extractedData = null;
  let isProcessing = false;

  /**
   * Check if page is a job posting and extract data
   */
  async function checkAndExtract() {
    if (isProcessing) return;
    
    isProcessing = true;

    try {
      // Wait for page to be fully loaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(extractJobData, 1000);
        });
      } else {
        // Wait a bit for dynamic content to load
        setTimeout(extractJobData, 1000);
      }
    } catch (error) {
      console.error('Error in checkAndExtract:', error);
      isProcessing = false;
    }
  }

  /**
   * Extract job data from current page
   */
  async function extractJobData() {
    try {
      // Check if this is likely a job page
      const isJobPage = JobExtractor.isJobPage();
      console.log('Job Tracker: Checking page:', {
        url: window.location.href,
        isJobPage: isJobPage
      });

      if (!isJobPage) {
        console.log('Job Tracker: Page does not appear to be a job posting page');
        isProcessing = false;
        return;
      }

      // Extract job data
      extractedData = JobExtractor.extract();

      console.log('Job Tracker: Extraction result:', extractedData);

      if (extractedData) {
        // Check if we've already processed this job
        const jobKey = `${extractedData.jdLink}_${extractedData.jobTitle}`;
        const result = await chrome.runtime.sendMessage({
          action: 'checkDuplicate',
          jobKey: jobKey
        });

        if (!result.isDuplicate) {
          // Show notification to user
          showExtractionNotification(extractedData);
        }
      } else {
        console.log('Job Tracker: No data extracted. This might be because:');
        console.log('1. The page structure has changed');
        console.log('2. The selectors need to be updated');
        console.log('3. The page is still loading');
      }
    } catch (error) {
      console.error('Error extracting job data:', error);
    } finally {
      isProcessing = false;
    }
  }

  /**
   * Show notification when job data is extracted
   */
  function showExtractionNotification(data) {
    // Create a notification banner
    const notification = document.createElement('div');
    notification.id = 'job-tracker-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 350px;
      animation: slideIn 0.3s ease-out;
    `;

    notification.innerHTML = `
      <div style="margin-bottom: 12px; font-weight: 600;">检测到工作信息</div>
      <div style="margin-bottom: 8px; font-size: 13px;"><strong>${data.jobTitle}</strong></div>
      ${data.company ? `<div style="margin-bottom: 12px; font-size: 12px; opacity: 0.9;">${data.company}</div>` : ''}
      <div style="display: flex; gap: 8px;">
        <button id="job-tracker-save" style="
          background: white;
          color: #4CAF50;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          flex: 1;
        ">保存到Sheet</button>
        <button id="job-tracker-dismiss" style="
          background: transparent;
          color: white;
          border: 1px solid white;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          flex: 1;
        ">忽略</button>
      </div>
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);

    // Add event listeners
    document.getElementById('job-tracker-save').addEventListener('click', async () => {
      await saveJobData(data);
      notification.remove();
    });

    document.getElementById('job-tracker-dismiss').addEventListener('click', () => {
      notification.remove();
    });

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }

  /**
   * Save job data to Google Sheets
   */
  async function saveJobData(data) {
    try {
      // Send message to background script
      const response = await chrome.runtime.sendMessage({
        action: 'saveJob',
        jobData: data
      });

      if (response.success) {
        showSuccessMessage();
      } else {
        showErrorMessage(response.error || '保存失败');
      }
    } catch (error) {
      console.error('Error saving job data:', error);
      showErrorMessage('保存失败: ' + error.message);
    }
  }

  /**
   * Show success message
   */
  function showSuccessMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
    `;
    message.textContent = '✓ 已保存到Google Sheets';
    document.body.appendChild(message);

    setTimeout(() => {
      message.remove();
    }, 3000);
  }

  /**
   * Show error message
   */
  function showErrorMessage(errorText) {
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
    `;
    message.textContent = '✗ ' + errorText;
    document.body.appendChild(message);

    setTimeout(() => {
      message.remove();
    }, 5000);
  }

  // Listen for messages from popup or background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractNow') {
      // Reset processing flag to allow manual extraction
      isProcessing = false;
      extractJobData().then(() => {
        sendResponse({ 
          success: !!extractedData, 
          data: extractedData,
          message: extractedData ? '提取成功' : '未检测到工作信息，请检查页面是否已完全加载'
        });
      }).catch(error => {
        console.error('Extraction error:', error);
        sendResponse({ 
          success: false, 
          data: null,
          error: error.message 
        });
      });
      return true; // Keep channel open for async response
    }
  });

  // Initial check when script loads
  checkAndExtract();

  // Also check when URL changes (for SPA navigation)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(checkAndExtract, 1000);
    }
  }).observe(document, { subtree: true, childList: true });

})();
