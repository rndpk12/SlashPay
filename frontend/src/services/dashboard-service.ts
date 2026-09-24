import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const currencyRates = { INR: 1, USD: 95.785, EUR: 105.12, GBP: 125.4 } as const;

const transferInput = z.object({
  amount: z.coerce.number().positive().max(1_000_000),
  source: z.string().length(3),
  target: z.string().length(3),
});

export const getDashboard = createServerFn({ method: "GET" }).handler(() => ({
  profile: { initials: "RD", name: "R N Dhanapraveenkrishna" },
  currencies: { source: "INR", target: "USD", rates: currencyRates, updatedAt: "Just now" },
  reward: "Earn ₹9,000",
  transactions: [],
}));

export const createTransfer = createServerFn({ method: "POST" })
  .validator((data: unknown) => transferInput.parse(data))
  .handler(({ data }) => ({
    id: `tr_${crypto.randomUUID()}`,
    status: "Processing" as const,
    createdAt: new Date().toISOString(),
    ...data,
    targetAmount: Number((data.amount * (currencyRates[data.target as keyof typeof currencyRates] / currencyRates[data.source as keyof typeof currencyRates])).toFixed(2)),
    fee: Number((data.amount * 0.005).toFixed(2)),
    arrival: "By Thursday",
  }));
