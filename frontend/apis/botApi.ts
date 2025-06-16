// src/apis/botApi.ts
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/config';

export const botApi = {
  sendPrompt: async (prompt: string) => {
    const res = await fetch(`${BASE_URL}/api/bot/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Unknown backend error");
    }

    return data; // e.g., nutrition info
  }
};
