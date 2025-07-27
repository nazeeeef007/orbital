// export const BASE_URL = "http://192.168.68.101:3000";
import Constants from 'expo-constants';

export const BASE_URL = Constants.expoConfig?.extra?.BASE_URL;
// (or Constants.manifest?.extra?.BASE_URL in older SDKs)
