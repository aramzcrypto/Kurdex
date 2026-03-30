import { useEffect, useMemo, useState } from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { getApiBaseUrl } from "../constants/api";

const STORAGE_KEY = "push_token";
const REGISTERED_KEY = "push_token_registered";

let cachedToken: string | null = null;
let handlerSet = false;
let listenerSet = false;
const subscribers = new Set<(message: string) => void>();

function broadcast(message: string) {
  subscribers.forEach((fn) => fn(message));
}

export function useNotifications() {
  const [token, setToken] = useState<string | null>(cachedToken);
  const [inAppAlert, setInAppAlert] = useState<string | null>(null);

  useEffect(() => {
    subscribers.add(setInAppAlert);
    return () => {
      subscribers.delete(setInAppAlert);
    };
  }, []);

  useEffect(() => {
    if (Constants.appOwnership === "expo" || Platform.OS === "web") {
      return;
    }
    if (!handlerSet) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      handlerSet = true;
    }

    if (!listenerSet) {
      Notifications.addNotificationReceivedListener((notification) => {
        const content = notification.request.content;
        const message = content.body || content.title || "Price alert received";
        broadcast(message);
      });
      listenerSet = true;
    }
  }, []);

  useEffect(() => {
    const timer = inAppAlert
      ? setTimeout(() => setInAppAlert(null), 6000)
      : null;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [inAppAlert]);

  useEffect(() => {
    const register = async () => {
      if (Constants.appOwnership === "expo" || Platform.OS === "web") {
        return;
      }
      if (cachedToken) {
        setToken(cachedToken);
        return;
      }

      const { status } = await Notifications.getPermissionsAsync();
      let finalStatus = status;
      if (status !== "granted") {
        const request = await Notifications.requestPermissionsAsync();
        finalStatus = request.status;
      }

      if (finalStatus !== "granted") return;

      const projectId =
        Constants.easConfig?.projectId ||
        Constants.expoConfig?.extra?.eas?.projectId ||
        (Constants.manifest as any)?.extra?.eas?.projectId ||
        null;

      if (!projectId) {
        return;
      }

      let expoToken: string | null = null;
      try {
        expoToken = (
          await Notifications.getExpoPushTokenAsync({ projectId })
        ).data;
      } catch (_err) {
        return;
      }
      if (!expoToken) return;
      cachedToken = expoToken;
      setToken(expoToken);
      await AsyncStorage.setItem(STORAGE_KEY, expoToken);

      const registered = await AsyncStorage.getItem(REGISTERED_KEY);
      if (registered === expoToken) return;

      try {
        const API_BASE_URL = getApiBaseUrl();
        await axios.post(`${API_BASE_URL}/api/notifications/register`, {
          token: expoToken,
        });
        await AsyncStorage.setItem(REGISTERED_KEY, expoToken);
      } catch (_err) {
        // ignore registration failure
      }
    };

    register();
  }, []);

  const value = useMemo(() => ({ token, inAppAlert }), [token, inAppAlert]);
  return value;
}
