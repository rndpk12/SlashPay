import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Home,
  Landmark,
  ListTodo,
  Plus,
  ReceiptText,
  RefreshCcw,
  Send,
  Upload,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SlashPayBrand } from "@/components/slash-pay-brand";
import { createTransfer, getDashboard } from "@/services/dashboard-service";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/dashboard")({
  loader: () => getDashboard(),
  component: DashboardPage,
});

const nav = [
  [Home, "Home"],
  [ListTodo, "Transactions"],
  [Send, "Payments"],
  [CalendarClock, "Scheduled transfers"],
  [ReceiptText, "Pay Invoices"],
  [Users, "Recipients"],
  [Landmark, "Insights"],
] as const;

function DashboardPage() {
  const data = Route.useLoaderData();
  const [amount, setAmount] = useState("1000.00");
  const [source, setSource] = useState("USD");
  const [target, setTarget] = useState("INR");
  const [items, setItems] = useState<
    Array<{ id: string; amount: number; targetAmount: number; status: string }>
  >(data.transactions);
  const [sending, setSending] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = "/login";
    });
  }, []);
  const [includeFees, setIncludeFees] = useState(true);
  const value = Number(amount.replace(/,/g, "")) || 0;
  const rate =
    data.currencies.rates[target as keyof typeof data.currencies.rates] /
    data.currencies.rates[source as keyof typeof data.currencies.rates];
  const fee = Math.min(value * 0.005, 3);
  const received = Math.max(0, (value - (includeFees ? fee : 0)) * rate);
  const arrival = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }, []);
  async function send() {
    if (value <= 0 || sending) return;
    setSending(true);
    try {
      const transfer = await createTransfer({
        data: { amount: value, source, target },
      });
      setItems((current) => [transfer, ...current]);
    } finally {
      setSending(false);
    }
  }
  return (
    <main className="min-h-screen bg-white text-[#0e0f0c]">
      <aside className="fixed inset-y-0 left-0 hidden w-[320px] border-r border-[#e6e8e4] bg-white px-5 py-9 lg:flex lg:flex-col">
        <Link to="/" className="w-32">
          <SlashPayBrand />
        </Link>
        <nav className="mt-14 grid gap-1">
          {nav.map(([Icon, label], i) => (
            <button
              key={label}
              type="button"
              className={`flex items-center gap-4 rounded-full px-5 py-3 text-left text-[15px] ${i === 0 ? "bg-[#eef0ed] font-semibold text-[#163300]" : "text-[#646664] hover:bg-[#f4f5f3]"}`}
            >
              <Icon size={21} />
              {label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="min-h-screen lg:pl-[320px]">
        <header className="flex items-center justify-between px-6 py-6 sm:px-10 lg:px-14">
          <div className="lg:hidden">
            <Link to="/" className="block w-28">
              <SlashPayBrand />
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button type="button" className="flex items-center gap-2">
              <span className="grid size-11 place-items-center rounded-full bg-[#eef0ed] font-semibold">
                {data.profile.initials}
              </span>
              <span className="hidden text-sm font-medium xl:block">
                {data.profile.name}
              </span>
              <ChevronRight size={20} />
            </button>
          </div>
        </header>
        <section
          style={{ zoom: 0.88 }}
          className="mx-auto max-w-[1180px] px-5 pb-12 pt-1 sm:px-8 lg:px-10"
        >
          <div className="mt-6 flex items-center justify-between">
            <h1 className="text-[24px] font-bold tracking-tight">
              Transactions
            </h1>
            <button
              type="button"
              className="font-semibold text-[#163300] underline underline-offset-4"
            >
              See all
            </button>
          </div>
          <div className="mt-7 flex items-center gap-5 text-[#9b9d9b]">
            <span className="grid size-14 place-items-center rounded-full border border-[#e5e7e3] bg-[#fafbfa]">
              <CalendarClock size={28} />
            </span>
            <span className="font-medium">
              {items.length
                ? `${items.length} transfer${items.length > 1 ? "s" : ""} in progress`
                : "No transactions yet"}
            </span>
          </div>
          {items.length > 0 && (
            <div className="mt-5 grid gap-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-[#e5e7e3] px-5 py-4 text-sm"
                >
                  <span className="font-semibold">
                    ₹{item.amount.toFixed(2)} INR to $
                    {item.targetAmount.toFixed(2)} USD
                  </span>
                  <span className="rounded-full bg-[#e2f6d5] px-3 py-1 text-[#163300]">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
          <h2 className="mt-10 text-[28px] font-bold tracking-tight">
            Transfer calculator
          </h2>
          <div className="mx-auto mt-6 w-full max-w-[1180px] rounded-[24px] bg-[#eef0ed] p-5 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center">
              <div>
                <p className="text-[26px] font-bold">
                  1 {source} = {(1 / rate).toFixed(4)} {target}
                </p>
                <RateChart />
                <div className="mt-2 flex justify-between text-sm text-[#747674]">
                  <span>25 Aug</span>
                  <span>Today</span>
                </div>
              </div>
              <div className="space-y-3">
                <CurrencyInput
                  label={source}
                  flag={
                    source === "USD" ? "🇺🇸" : source === "INR" ? "🇮🇳" : "💱"
                  }
                  value={amount}
                  onChange={setAmount}
                  onCurrencyChange={setSource}
                />
                <div className="relative h-0">
                  <span className="absolute -top-4 left-1/2 grid size-9 -translate-x-1/2 place-items-center rounded-full bg-[#f6f7f5] text-[#163300]">
                    <RefreshCcw size={18} />
                  </span>
                </div>
                <CurrencyInput
                  label={target}
                  flag={
                    target === "USD" ? "🇺🇸" : target === "INR" ? "🇮🇳" : "💱"
                  }
                  value={received.toFixed(2)}
                  readOnly
                  onCurrencyChange={setTarget}
                />
                <div className="grid grid-cols-2 rounded-[22px] border border-[#d6d9d4] px-4 py-4 text-center text-sm text-[#747674]">
                  <span>
                    Includes fees
                    <br />
                    <strong className="text-[#4c4e4c]">
                      {fee.toFixed(2)} {source}
                    </strong>
                  </span>
                  <span className="border-l border-[#d6d9d4]">
                    Should arrive
                    <br />
                    <strong className="text-[#4c4e4c]">By {arrival}</strong>
                  </span>
                </div>
                <button
                  onClick={send}
                  disabled={sending || value <= 0}
                  type="button"
                  className="w-full rounded-full bg-[#9fe870] py-4 font-semibold text-[#163300] disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function CurrencyInput({
  label,
  flag,
  value,
  onChange,
  onCurrencyChange,
  readOnly = false,
}: {
  label: string;
  flag: string;
  value: string;
  onChange?: (value: string) => void;
  onCurrencyChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex h-20 items-center rounded-[22px] bg-white px-6">
      <input
        aria-label={`${label} amount`}
        className="min-w-0 flex-1 bg-transparent text-[26px] font-bold outline-none"
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
      />
      <span className="mr-2 text-2xl">{flag}</span>
      <select
        aria-label={`Currency: ${label}`}
        value={label}
        onChange={(event) => onCurrencyChange?.(event.target.value)}
        className="appearance-none bg-transparent pr-5 font-semibold outline-none"
      >
        <option>USD</option>
        <option>INR</option>
        <option>EUR</option>
        <option>GBP</option>
      </select>
      <ChevronDown size={19} aria-hidden="true" />
    </div>
  );
}
function RateChart() {
  return (
    <svg
      className="mt-7 h-[260px] w-full"
      viewBox="0 0 500 260"
      role="img"
      aria-label="Exchange rate chart"
    >
      <path
        d="M0 54L18 38L34 113L52 82L70 77L88 60L106 60L124 105L142 135L160 220L178 194L196 233L214 233L232 238L250 218L268 132L286 98L304 66L322 68L340 70L358 78L376 70L394 17L412 3L430 50L448 22L466 24L484 38L500 50"
        fill="none"
        stroke="#163300"
        strokeWidth="3"
      />
      <path
        d="M0 16H500M0 132H500M0 238H500"
        stroke="#d6d9d4"
        strokeDasharray="5 5"
      />
      <circle
        cx="500"
        cy="50"
        r="7"
        fill="#163300"
        stroke="#fff"
        strokeWidth="4"
      />
    </svg>
  );
}
