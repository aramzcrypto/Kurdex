export interface P2POffer {
  id: string;
  type: "buy" | "sell";
  asset: "USDT";
  amount: number;
  priceIqd: number;
  paymentMethods: string[];
  governorate: string;
  contactMethod: "telegram" | "phone";
  verified: boolean;
}
