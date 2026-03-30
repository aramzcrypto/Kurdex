import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_OVERRIDE_KEY = "api_base_override";
let cachedBaseUrl: string | null = null;

function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.replace(/\/+$/, "");
  }
  return `http://${trimmed.replace(/\/+$/, "")}`;
}

export function getApiBaseCandidates() {
  const env = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (env) return [normalizeUrl(env)];

  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.hostUri ||
    (Constants.manifest as any)?.debuggerHost ||
    null;

  const candidates: string[] = [];
  if (cachedBaseUrl) candidates.push(cachedBaseUrl);
  if (hostUri) {
    const host = hostUri.split(":")[0];
    if (host) {
      if (host === "localhost" && Platform.OS === "android") {
        candidates.push("http://10.0.2.2:3000");
      } else {
        candidates.push(`http://${host}:3000`);
      }
    }
  }

  candidates.push("http://localhost:3000");
  candidates.push("http://127.0.0.1:3000");
  if (Platform.OS === "android") candidates.push("http://10.0.2.2:3000");

  return Array.from(new Set(candidates));
}

export function setApiBaseUrl(url: string) {
  cachedBaseUrl = normalizeUrl(url);
}

export function getApiBaseUrl() {
  return cachedBaseUrl || getApiBaseCandidates()[0];
}

export async function hydrateApiBaseOverride() {
  const stored = await AsyncStorage.getItem(API_OVERRIDE_KEY);
  if (stored) {
    cachedBaseUrl = normalizeUrl(stored);
  }
  return cachedBaseUrl;
}

export async function setApiBaseOverride(url: string) {
  const normalized = normalizeUrl(url);
  if (!normalized) {
    await AsyncStorage.removeItem(API_OVERRIDE_KEY);
    cachedBaseUrl = null;
    return null;
  }
  await AsyncStorage.setItem(API_OVERRIDE_KEY, normalized);
  cachedBaseUrl = normalized;
  return normalized;
}

export async function getApiBaseOverride() {
  const stored = await AsyncStorage.getItem(API_OVERRIDE_KEY);
  return stored ? normalizeUrl(stored) : null;
}

export { API_OVERRIDE_KEY };
