import * as FileSystem from "expo-file-system";
import { Alert } from "react-native";

const LOG_FILE = `${FileSystem.documentDirectory}scanner_logs.txt`;

const showLogs = async () => {
  const content = await FileSystem.readAsStringAsync(getLogPath());
  Alert.alert("Scanner Logs", content);
};
// Helper to see where the file is so you can pull it off the iPhone
export const getLogPath = () => LOG_FILE;

export const writeLog = async (data: any, share = false) => {
  const timestamp = new Date().toISOString();
  const message =
    typeof data === "object" ? JSON.stringify(data, null, 2) : data;
  const logEntry = `[${timestamp}] ${message}\n---\n`;

  try {
    const fileInfo = await FileSystem.getInfoAsync(LOG_FILE);

    if (fileInfo.exists) {
      // Append to the existing file
      const existingContent = await FileSystem.readAsStringAsync(LOG_FILE);
      await FileSystem.writeAsStringAsync(LOG_FILE, existingContent + logEntry);
    } else {
      // Create new file
      await FileSystem.writeAsStringAsync(LOG_FILE, logEntry);
    }
    if (share) {
      //   const canShare = await Sharing.isAvailableAsync();
      //   if (canShare) await Sharing.shareAsync(getLogPath());
      await showLogs();
    }
    console.log("📝 Log saved to device storage.");
  } catch (error) {
    console.error("Failed to write log file:", error);
  }
};
