// Centralized logging utility for API monitoring and debugging
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  url?: string;
  status?: number;
  duration?: number;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs
  private currentLevel = LogLevel.INFO;
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  constructor() {
    // Load log level from localStorage or default to INFO (only in browser)
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        const savedLevel = localStorage.getItem('logLevel');
        if (savedLevel) {
          this.currentLevel = parseInt(savedLevel) as LogLevel;
        }
      } catch (error) {
        // localStorage might not be available in some environments
        console.warn('Failed to access localStorage:', error);
      }
    }
  }

  private addLog(level: LogLevel, category: string, message: string, data?: any, url?: string, status?: number, duration?: number) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      url,
      status,
      duration,
    };

    this.logs.unshift(logEntry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener([...this.logs]));

    // Console output with colors and better formatting
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const colors = ['#888', '#2196F3', '#FF9800', '#F44336'];
    const levelName = levelNames[level];
    const color = colors[level];
    
    // Enhanced console output with timestamp and better formatting
    const timestamp = new Date().toLocaleTimeString();
    const urlInfo = url ? ` → ${url}` : '';
    const statusInfo = status ? ` (${status})` : '';
    const durationInfo = duration ? ` [${duration}ms]` : '';
    
    console.log(
      `%c[${timestamp}] %c[${levelName}] %c[${category}] %c${message}${urlInfo}${statusInfo}${durationInfo}`,
      `color: #666; font-size: 11px;`,
      `color: ${color}; font-weight: bold; font-size: 12px;`,
      `color: #666; font-size: 11px;`,
      `color: #000; font-size: 12px;`,
      data ? data : ''
    );
  }

  debug(category: string, message: string, data?: any) {
    if (this.currentLevel <= LogLevel.DEBUG) {
      this.addLog(LogLevel.DEBUG, category, message, data);
    }
  }

  info(category: string, message: string, data?: any) {
    if (this.currentLevel <= LogLevel.INFO) {
      this.addLog(LogLevel.INFO, category, message, data);
    }
  }

  warn(category: string, message: string, data?: any) {
    if (this.currentLevel <= LogLevel.WARN) {
      this.addLog(LogLevel.WARN, category, message, data);
    }
  }

  error(category: string, message: string, data?: any) {
    if (this.currentLevel <= LogLevel.ERROR) {
      this.addLog(LogLevel.ERROR, category, message, data);
    }
  }

  // API-specific logging methods
  apiCall(url: string, method: string, data?: any) {
    this.info('API', `Making ${method} request to ${url}`, data);
  }

  apiSuccess(url: string, method: string, status: number, duration: number, response?: any) {
    this.info('API', `${method} ${url} - Success (${status})`, { duration: `${duration}ms`, response });
  }

  apiError(url: string, method: string, error: any, duration?: number) {
    this.error('API', `${method} ${url} - Failed`, { error: error.message || error, duration: duration ? `${duration}ms` : 'N/A' });
  }

  apiTimeout(url: string, method: string, duration: number) {
    this.warn('API', `${method} ${url} - Timeout after ${duration}ms`);
  }

  connectionTest(url: string, success: boolean, duration?: number) {
    if (success) {
      this.info('CONNECTION', `✅ Backend connection successful: ${url}`, { duration: duration ? `${duration}ms` : 'N/A' });
    } else {
      this.warn('CONNECTION', `❌ Backend connection failed: ${url}`, { duration: duration ? `${duration}ms` : 'N/A' });
    }
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Get logs by category
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  // Get logs by level
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    this.listeners.forEach(listener => listener([]));
  }

  // Set log level
  setLogLevel(level: LogLevel) {
    this.currentLevel = level;
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        localStorage.setItem('logLevel', level.toString());
      } catch (error) {
        // localStorage might not be available in some environments
        console.warn('Failed to save to localStorage:', error);
      }
    }
  }

  // Subscribe to log updates
  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Get API health summary
  getApiHealthSummary(): {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageResponseTime: number;
    lastSuccessfulCall?: string;
    lastFailedCall?: string;
  } {
    const apiLogs = this.getLogsByCategory('API');
    const totalCalls = apiLogs.length;
    const successfulCalls = apiLogs.filter(log => log.status && log.status >= 200 && log.status < 300).length;
    const failedCalls = apiLogs.filter(log => log.status && (log.status < 200 || log.status >= 300)).length;
    
    const responseTimes = apiLogs
      .filter(log => log.duration)
      .map(log => log.duration!);
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    const lastSuccessfulCall = apiLogs
      .filter(log => log.status && log.status >= 200 && log.status < 300)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.timestamp;

    const lastFailedCall = apiLogs
      .filter(log => log.status && (log.status < 200 || log.status >= 300))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.timestamp;

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      averageResponseTime: Math.round(averageResponseTime),
      lastSuccessfulCall,
      lastFailedCall,
    };
  }
}

// Export singleton instance
export const logger = new Logger();

// Make logger available globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).apiLogger = logger;
  (window as any).apiLogs = {
    // Get all logs
    all: () => logger.getLogs(),
    // Get logs by category
    byCategory: (category: string) => logger.getLogsByCategory(category),
    // Get logs by level
    byLevel: (level: LogLevel) => logger.getLogsByLevel(level),
    // Get API health summary
    health: () => logger.getApiHealthSummary(),
    // Clear logs
    clear: () => logger.clearLogs(),
    // Set log level
    setLevel: (level: LogLevel) => logger.setLogLevel(level),
    // Test connection
    testConnection: async () => {
      const startTime = Date.now();
      try {
        const response = await fetch('http://localhost:8888/health');
        const duration = Date.now() - startTime;
        logger.connectionTest('http://localhost:8888', response.ok, duration);
        return { success: response.ok, duration, status: response.status };
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.connectionTest('http://localhost:8888', false, duration);
        return { success: false, duration, error: error instanceof Error ? error.message : String(error) };
      }
    }
  };
  
  // Log level constants for easy access
  (window as any).LogLevel = LogLevel;
  
  console.log(`
🔧 API Logger Console Helper Available!

Usage:
• apiLogs.all() - Get all logs
• apiLogs.byCategory('API') - Get API logs
• apiLogs.byLevel(LogLevel.ERROR) - Get error logs
• apiLogs.health() - Get API health summary
• apiLogs.clear() - Clear all logs
• apiLogs.setLevel(LogLevel.DEBUG) - Set log level
• apiLogs.testConnection() - Test backend connection

Log Levels: DEBUG(0), INFO(1), WARN(2), ERROR(3)
  `);
}

// Export convenience functions
export const log = {
  debug: (category: string, message: string, data?: any) => logger.debug(category, message, data),
  info: (category: string, message: string, data?: any) => logger.info(category, message, data),
  warn: (category: string, message: string, data?: any) => logger.warn(category, message, data),
  error: (category: string, message: string, data?: any) => logger.error(category, message, data),
  apiCall: (url: string, method: string, data?: any) => logger.apiCall(url, method, data),
  apiSuccess: (url: string, method: string, status: number, duration: number, response?: any) => 
    logger.apiSuccess(url, method, status, duration, response),
  apiError: (url: string, method: string, error: any, duration?: number) => 
    logger.apiError(url, method, error, duration),
  apiTimeout: (url: string, method: string, duration: number) => 
    logger.apiTimeout(url, method, duration),
  connectionTest: (url: string, success: boolean, duration?: number) => 
    logger.connectionTest(url, success, duration),
};
