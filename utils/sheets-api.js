// Google Sheets API integration

class SheetsAPI {
  /**
   * Get OAuth token using Chrome Identity API
   * @returns {Promise<string>} Access token
   */
  static async getAccessToken() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken(
        { interactive: true },
        (token) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(token);
          }
        }
      );
    });
  }

  /**
   * Refresh access token
   * @param {string} token - Current access token
   * @returns {Promise<string>} New access token
   */
  static async refreshAccessToken(token) {
    return new Promise((resolve, reject) => {
      chrome.identity.removeCachedAuthToken({ token }, () => {
        this.getAccessToken()
          .then(resolve)
          .catch(reject);
      });
    });
  }

  /**
   * Make authenticated request to Google Sheets API
   * @param {string} url - API endpoint URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>}
   */
  static async makeRequest(url, options = {}) {
    try {
      const token = await this.getAccessToken();
      
      const defaultOptions = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      };

      let response;
      try {
        response = await fetch(url, { ...defaultOptions, ...options });
      } catch (fetchError) {
        // Network error
        if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
          throw new Error('网络连接失败，请检查网络设置');
        }
        throw fetchError;
      }

      // If unauthorized, try refreshing token
      if (response.status === 401) {
        try {
          const newToken = await this.refreshAccessToken(token);
          defaultOptions.headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, { ...defaultOptions, ...options });
        } catch (refreshError) {
          throw new Error('认证失败，请重新连接Google账户');
        }
      }

      return response;
    } catch (error) {
      // Re-throw with better error message if it's already our custom error
      if (error.message.includes('网络') || error.message.includes('认证')) {
        throw error;
      }
      throw new Error(`API请求失败: ${error.message}`);
    }
  }

  /**
   * Append row to Google Sheet
   * @param {string} sheetId - Google Sheet ID
   * @param {string} range - Range (e.g., "Sheet1!A:F")
   * @param {Array} values - Array of values to append
   * @returns {Promise<Object>} API response
   */
  static async appendRow(sheetId, range, values) {
    if (!sheetId || !sheetId.trim()) {
      throw new Error('Sheet ID不能为空');
    }

    // URL encode the range to handle special characters like ! and :
    const encodedRange = encodeURIComponent(range);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED`;

    const response = await this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        values: [values]
      })
    });

    if (!response.ok) {
      let errorMessage = '未知错误';
      try {
        const error = await response.json();
        errorMessage = error.error?.message || `HTTP ${response.status}`;
        
        // Provide user-friendly error messages
        if (response.status === 403) {
          errorMessage = '没有权限访问此Sheet，请检查Sheet是否已共享给当前账户';
        } else if (response.status === 404) {
          errorMessage = '找不到指定的Sheet，请检查Sheet ID是否正确';
        } else if (response.status === 400) {
          // Check for specific range parsing errors
          if (errorMessage.includes('Unable to parse range') || errorMessage.includes('parse range')) {
            errorMessage = '无法解析工作表范围。请确保Sheet中存在工作表，且工作表名称正确';
          } else {
            errorMessage = '请求格式错误: ' + errorMessage;
          }
        }
      } catch (parseError) {
        errorMessage = `HTTP错误 ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Get sheet values
   * @param {string} sheetId - Google Sheet ID
   * @param {string} range - Range (e.g., "Sheet1!A1:F10")
   * @returns {Promise<Array>} Array of rows
   */
  static async getValues(sheetId, range) {
    // URL encode the range
    const encodedRange = encodeURIComponent(range);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodedRange}`;

    const response = await this.makeRequest(url);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.values || [];
  }

  /**
   * Get the first sheet name from a spreadsheet
   * @param {string} sheetId - Google Sheet ID
   * @returns {Promise<string>} First sheet name
   */
  static async getFirstSheetName(sheetId) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`;
      const response = await this.makeRequest(url);
      
      if (!response.ok) {
        throw new Error('无法获取Sheet信息');
      }
      
      const data = await response.json();
      const sheets = data.sheets || [];
      
      if (sheets.length === 0) {
        throw new Error('Sheet中没有工作表');
      }
      
      // Return the first sheet's title
      return sheets[0].properties.title;
    } catch (error) {
      console.error('Error getting sheet name:', error);
      // Fallback to Sheet1 if we can't get the name
      return 'Sheet1';
    }
  }

  /**
   * Save job data to sheet
   * @param {string} sheetId - Google Sheet ID
   * @param {Object} jobData - Job data object
   * @param {Object} columnMapping - Column mapping configuration
   * @returns {Promise<Object>} API response
   */
  static async saveJobData(sheetId, jobData, columnMapping) {
    // Map job data to sheet columns
    const values = [
      jobData.jobTitle || '',
      jobData.company || '',
      jobData.applicationDate || '',
      jobData.jdLink || '',
      jobData.status || '已申请',
      jobData.recordTime || new Date().toLocaleString('zh-CN')
    ];

    // Get the actual first sheet name instead of hardcoding "Sheet1"
    const sheetName = await this.getFirstSheetName(sheetId);
    const range = `${sheetName}!A:F`;
    
    return this.appendRow(sheetId, range, values);
  }

  /**
   * Check if sheet exists and is accessible
   * @param {string} sheetId - Google Sheet ID
   * @returns {Promise<boolean>}
   */
  static async validateSheet(sheetId) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`;
      const response = await this.makeRequest(url);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
