/**
 * Constants for the application configuration.
 * Using hardcoded values to avoid issues with environment variables in some Expo environments.
 */

const API_BASE_URL = "https://api-yugioh-woad.vercel.app/api";
const LOGIN_API_URL = "https://api.colomardo.space/api";

export const Config = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || API_BASE_URL,
  LOGIN_URL: process.env.EXPO_PUBLIC_API_LOGIN_URL || LOGIN_API_URL,
};

export default Config;
