export interface User {
  id?: string;
  pushToken: string;
  plan: "free" | "pro";
  alertsUsed: number;
  alertsLimit: number;
  createdAt: string;
}
