import { screen, desktopCapturer, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import * as Tesseract from 'tesseract.js';

// Global variables to track monitoring state
let isMonitoring = false;
let monitorInterval: NodeJS.Timeout | null = null;
let mainWindow: Electron.BrowserWindow | null = null;

/**
 * Setup error monitoring functionality
 * @param win The Electron BrowserWindow instance
 */
export function setupErrorMonitoring(win: Electron.BrowserWindow) {
  mainWindow = win;
  
  // Setup IPC handlers
  ipcMain.handle('start-error-monitoring', startMonitoring);
  ipcMain.handle('stop-error-monitoring', stopMonitoring);
  
  // Return control functions for direct use
  return {
    startMonitoring,
    stopMonitoring
  };
}

/**
 * Start the screen monitoring process
 */
async function startMonitoring() {
  if (isMonitoring) {
    return { success: false, message: 'Monitoring is already running' };
  }
  
  try {
    isMonitoring = true;
    
    // Create temp directory for screenshots if it doesn't exist
    const tempDir = path.join(process.env.TEMP || process.env.TMP || '.', 'tally-monitor');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Set up monitoring interval (every 2 seconds)
    monitorInterval = setInterval(async () => {
      try {
        // Capture screenshot
        const screenshot = await captureScreen();
        
        // Save screenshot temporarily
        const screenshotPath = path.join(tempDir, `screen_${Date.now()}.png`);
        fs.writeFileSync(screenshotPath, screenshot);
        
        // Process screenshot with OCR
        const text = await performOCR(screenshotPath);
        
        // Check for error patterns
        const isError = checkForErrorPatterns(text);
        
        // Clean up temporary file
        fs.unlinkSync(screenshotPath);
        
        // If error found, terminate PowerShell commands and notify
        if (isError && mainWindow) {
          terminatePowerShellCommands();
          mainWindow.webContents.send('error-detected', { 
            message: 'Tally error detected', 
            errorText: text 
          });
        }
      } catch (error) {
        console.error('Error in monitoring loop:', error);
      }
    }, 2000);
    
    // Notify renderer process that monitoring has started
    if (mainWindow) {
      mainWindow.webContents.send('monitoring-status-changed', { isMonitoring: true });
    }
    
    return { success: true, message: 'Error monitoring started successfully' };
  } catch (error) {
    isMonitoring = false;
    return { success: false, message: `Failed to start monitoring: ${error.message}` };
  }
}

/**
 * Stop the screen monitoring process
 */
function stopMonitoring() {
  if (!isMonitoring) {
    return { success: false, message: 'Monitoring is not running' };
  }
  
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
  isMonitoring = false;
  
  // Notify renderer process that monitoring has stopped
  if (mainWindow) {
    mainWindow.webContents.send('monitoring-status-changed', { isMonitoring: false });
  }
  
  return { success: true, message: 'Error monitoring stopped successfully' };
}

/**
 * Capture the current screen as a Buffer
 */
async function captureScreen(): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // Get primary display
      const primaryDisplay = screen.getPrimaryDisplay();
      const { id } = primaryDisplay;
      
      // Capture the screen content
      const sources = await desktopCapturer.getSources({ 
        types: ['screen'],
        thumbnailSize: primaryDisplay.size 
      });
      
      // Find the primary display source
      const source = sources.find(s => s.display_id === id.toString()) || sources[0];
      
      if (!source) {
        reject(new Error('No screen source found'));
        return;
      }
      
      // Get the thumbnail as buffer
      const thumbnail = source.thumbnail;
      const buffer = thumbnail.toPNG();
      resolve(buffer);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Perform OCR on an image
 * @param imagePath Path to the image file
 */
async function performOCR(imagePath: string): Promise<string> {
  try {
    const worker = await Tesseract.createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    const { data } = await worker.recognize(imagePath);
    await worker.terminate();
    
    return data.text;
  } catch (error) {
    console.error('OCR error:', error);
    return '';
  }
}

/**
 * Check if the text contains error patterns
 * @param text Text extracted from the screenshot
 */
function checkForErrorPatterns(text: string): boolean {
  // Check for specific Tally error patterns based on the error image provided
  const errorPatterns = [
    /Error/i,
    /Oops/i,
    /Spelling Error/i,
    // Add more error patterns as needed
  ];
  
  // Check if the text contains at least two of the patterns
  // This helps reduce false positives
  let matchCount = 0;
  for (const pattern of errorPatterns) {
    if (pattern.test(text)) {
      matchCount++;
    }
  }
  
  return matchCount >= 2;
}

/**
 * Terminate all running PowerShell commands
 */
function terminatePowerShellCommands() {
  // Kill all running PowerShell processes
  exec('taskkill /F /IM powershell.exe', (error, stdout, stderr) => {
    if (error) {
      console.error(`Failed to terminate PowerShell: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`PowerShell termination stderr: ${stderr}`);
      return;
    }
    console.log(`PowerShell processes terminated: ${stdout}`);
  });
}