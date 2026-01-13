// Job data extractors for different websites

class JobExtractor {
  /**
   * Extract job data from current page
   * @returns {Object|null} Extracted job data or null if not found
   */
  static extract() {
    const url = window.location.href;
    const hostname = window.location.hostname;

    // Try LinkedIn extractor
    if (hostname.includes('linkedin.com')) {
      return this.extractLinkedIn();
    }

    // Try Indeed extractor
    if (hostname.includes('indeed.com')) {
      return this.extractIndeed();
    }

    // Try generic extractor
    return this.extractGeneric();
  }

  /**
   * Extract job data from LinkedIn
   * @returns {Object|null}
   */
  static extractLinkedIn() {
    try {
      // LinkedIn job posting page structure - multiple selectors for different page layouts
      const jobTitleSelectors = [
        'h1.job-details-jobs-unified-top-card__job-title',
        'h1[data-test-id="job-title"]',
        'h1.jobs-details-top-card__job-title',
        'h1.job-details-top-card__job-title',
        'h1.job-details-top-card__job-title-text',
        'h1[class*="job-title"]',
        'h1[class*="JobTitle"]',
        'h1.top-card-layout__title',
        'h1.job-details__job-title',
        // Fallback: look for h1 in the main content area
        'main h1',
        'div[class*="job-details"] h1',
        'section[class*="job-details"] h1'
      ];

      const companySelectors = [
        'a.job-details-jobs-unified-top-card__company-name',
        'a[data-test-id="job-poster"]',
        'a.jobs-details-top-card__company-name',
        'a.job-details-top-card__company-name',
        'a[class*="company-name"]',
        'a[class*="CompanyName"]',
        'span[class*="company-name"]',
        'div[class*="company-name"]',
        'a.top-card-layout__entity-info-subtitle',
        // Fallback: look for company link or text near the title
        'main a[href*="/company/"]',
        'div[class*="job-details"] a[href*="/company/"]'
      ];

      // Try to find job title
      let jobTitleElement = null;
      for (const selector of jobTitleSelectors) {
        jobTitleElement = document.querySelector(selector);
        if (jobTitleElement && jobTitleElement.textContent.trim().length > 0) {
          break;
        }
      }

      if (!jobTitleElement) {
        console.log('LinkedIn: No job title found with any selector');
        return null;
      }

      const jobTitle = jobTitleElement.textContent.trim();
      
      // Try to find company name
      let company = '';
      for (const selector of companySelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim().length > 0) {
          company = element.textContent.trim();
          break;
        }
      }

      // If still no company found, try to find it near the title
      if (!company && jobTitleElement.parentElement) {
        const parent = jobTitleElement.parentElement;
        const companyLink = parent.querySelector('a[href*="/company/"]');
        if (companyLink) {
          company = companyLink.textContent.trim();
        }
      }

      const jdLink = window.location.href;
      const applicationDate = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD

      console.log('LinkedIn extraction successful:', { jobTitle, company, jdLink });

      return {
        jobTitle,
        company: company || '未知公司',
        jdLink,
        applicationDate,
        status: '已申请',
        recordTime: new Date().toLocaleString('zh-CN')
      };
    } catch (error) {
      console.error('LinkedIn extraction error:', error);
      return null;
    }
  }

  /**
   * Extract job data from Indeed
   * @returns {Object|null}
   */
  static extractIndeed() {
    try {
      // Indeed job posting page structure
      const jobTitleElement = document.querySelector('h2.jobTitle, h1[data-testid="job-title"]');
      const companyElement = document.querySelector('span[data-testid="company-name"], a[data-testid="inlineHeader-companyName"]');
      
      if (!jobTitleElement) {
        return null;
      }

      const jobTitle = jobTitleElement.textContent.trim();
      const company = companyElement ? companyElement.textContent.trim() : '';
      const jdLink = window.location.href;
      const applicationDate = new Date().toISOString().split('T')[0];

      return {
        jobTitle,
        company,
        jdLink,
        applicationDate,
        status: '已申请',
        recordTime: new Date().toLocaleString('zh-CN')
      };
    } catch (error) {
      console.error('Indeed extraction error:', error);
      return null;
    }
  }

  /**
   * Generic extractor for company websites
   * Uses common HTML patterns to extract job information
   * @returns {Object|null}
   */
  static extractGeneric() {
    try {
      // Common selectors for job postings
      const titleSelectors = [
        'h1.job-title',
        'h1[class*="title"]',
        'h1[class*="job"]',
        '.job-title',
        '[class*="job-title"]',
        'h1'
      ];

      const companySelectors = [
        '.company-name',
        '[class*="company"]',
        '.employer',
        '[class*="employer"]'
      ];

      let jobTitle = null;
      let company = '';

      // Try to find job title
      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim().length > 0) {
          jobTitle = element.textContent.trim();
          break;
        }
      }

      // If no title found, this might not be a job page
      if (!jobTitle || jobTitle.length < 3) {
        return null;
      }

      // Try to find company name
      for (const selector of companySelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim().length > 0) {
          company = element.textContent.trim();
          break;
        }
      }

      const jdLink = window.location.href;
      const applicationDate = new Date().toISOString().split('T')[0];

      return {
        jobTitle,
        company,
        jdLink,
        applicationDate,
        status: '已申请',
        recordTime: new Date().toLocaleString('zh-CN')
      };
    } catch (error) {
      console.error('Generic extraction error:', error);
      return null;
    }
  }

  /**
   * Check if current page is likely a job posting page
   * @returns {boolean}
   */
  static isJobPage() {
    const url = window.location.href.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    const title = document.title.toLowerCase();

    // Common patterns for job pages
    const jobKeywords = ['job', 'career', 'position', 'opening', 'vacancy', 'opportunity'];
    const urlContainsJob = jobKeywords.some(keyword => url.includes(keyword));
    const pathContainsJob = jobKeywords.some(keyword => pathname.includes(keyword));
    const titleContainsJob = jobKeywords.some(keyword => title.includes(keyword));

    // LinkedIn specific
    if (window.location.hostname.includes('linkedin.com')) {
      return pathname.includes('/jobs/view/') || pathname.includes('/jobs/');
    }

    // Indeed specific
    if (window.location.hostname.includes('indeed.com')) {
      return pathname.includes('/viewjob') || pathname.includes('/job/');
    }

    return urlContainsJob || pathContainsJob || titleContainsJob;
  }
}
