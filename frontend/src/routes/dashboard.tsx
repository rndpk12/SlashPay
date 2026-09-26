import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarClock,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileText,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  Landmark,
  ListTodo,
  Plus,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  Send,
  Upload,
  UserRound,
  Users,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { SlashPayBrand } from "@/components/slash-pay-brand";
import { createTransfer, getDashboard } from "@/services/dashboard-service";
import {
  clearBackendSession,
  createBackendBalanceOperation,
  createBackendQuote,
  createBackendRecipient,
  createBackendTransfer,
  createBackendWallet,
  deleteBackendRecipient,
  getBackendEmail,
  getBackendQuote,
  getBackendRecipients,
  getBackendToken,
  getBackendTransactions,
  getBackendWallets,
  type BackendRecipient,
  type BackendQuote,
  type BackendWallet,
  type BackendTransaction,
} from "@/lib/backend-api";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/dashboard")({
  loader: () => getDashboard(),
  component: DashboardPage,
});

const nav = [
  [LayoutDashboard, "Overview"],
  [Send, "Payments / Transfers"],
  [Users, "Recipients"],
  [FileText, "Invoices"],
  [CreditCard, "Balances and currencies"],
  [BarChart3, "Reports"],
  [LockKeyhole, "Settings and security"],
] as const;

type DashboardRecipient = {
  id: string;
  name: string;
  currency: string;
  account_identifier: string;
};

type DashboardTransfer = {
  id: string;
  amount: number;
  targetAmount: number;
  status: string;
  recipientId?: string;
  recipientLabel?: string;
  createdAt?: string;
  sourceCurrency?: string;
  targetCurrency?: string;
  quoteId?: string;
};

function DashboardPage() {
  const data = Route.useLoaderData();
  const [amount, setAmount] = useState("1000.00");
  const [source, setSource] = useState("USD");
  const [target, setTarget] = useState("INR");
  const [items, setItems] = useState<DashboardTransfer[]>(data.transactions);
  const [recipients, setRecipients] = useState<DashboardRecipient[]>([]);
  const [recipientId, setRecipientId] = useState("");
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [lockedQuote, setLockedQuote] = useState<BackendQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(
    null,
  );
  const [selectedQuote, setSelectedQuote] = useState<BackendQuote | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeSection, setActiveSection] = useState("Overview");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");
  const [wallets, setWallets] = useState<BackendWallet[]>([]);
  async function loadBackendRecipients() {
    const backendRecipients = await getBackendRecipients();
    const mapped = backendRecipients.map(mapBackendRecipient);
    setRecipients(mapped);
    setRecipientId((current) => current || mapped[0]?.id || "");
  }
  async function loadBackendWallets() {
    setWallets(await getBackendWallets());
  }
  useEffect(() => {
    if (getBackendToken()) {
      setAccountEmail(getBackendEmail());
      void getBackendTransactions()
        .then((history) =>
          setItems(
            history.content
              .filter((transaction) => transaction.recipientUserId)
              .map(mapBackendTransaction),
          ),
        )
        .catch((error) => setTransferError(formatTransferError(error)));
      void loadBackendRecipients().catch((error) =>
        setTransferError(formatTransferError(error)),
      );
      void loadBackendWallets().catch((error) =>
        setTransferError(formatTransferError(error)),
      );
      return;
    }
    const client = supabase;
    if (!client) return;
    client.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        window.location.href = "/login";
        return;
      }
      setAccountEmail(data.session.user.email ?? "");
      const { data: transfers, error: transfersError } = await client
        .from("transfers")
        .select(
          "id, amount, target_amount, status, recipient_id, created_at, source_currency, target_currency",
        )
        .order("created_at", { ascending: false });
      if (transfersError) setTransferError(formatTransferError(transfersError));
      if (transfers) {
        setItems(
          transfers.map((transfer) => ({
            id: transfer.id,
            amount: Number(transfer.amount),
            targetAmount: Number(transfer.target_amount),
            status: transfer.status,
            recipientId: transfer.recipient_id ?? undefined,
            createdAt: transfer.created_at ?? undefined,
            sourceCurrency: transfer.source_currency ?? undefined,
            targetCurrency: transfer.target_currency ?? undefined,
          })),
        );
      }
      const { data: recipientRows } = await client
        .from("recipients")
        .select("id, name, currency, account_identifier")
        .order("created_at", { ascending: false });
      if (recipientRows) {
        setRecipients(recipientRows);
        setRecipientId((current) => current || recipientRows[0]?.id || "");
      }
    });
  }, []);
  const [includeFees, setIncludeFees] = useState(true);
  const [liveRate, setLiveRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateUpdatedAt, setRateUpdatedAt] = useState("Cached rate");
  const value = Number(amount.replace(/,/g, "")) || 0;
  const fallbackRate =
    data.currencies.rates[source as keyof typeof data.currencies.rates] /
    data.currencies.rates[target as keyof typeof data.currencies.rates];
  const rate = liveRate ?? fallbackRate;
  useEffect(() => {
    let cancelled = false;
    async function loadLiveRate() {
      if (source === target) {
        setLiveRate(1);
        setRateUpdatedAt("Same currency");
        setRateLoading(false);
        return;
      }
      setLiveRate(null);
      setRateLoading(true);
      try {
        const response = await fetch(
          `https://api.frankfurter.dev/v2/rate/${source.toLowerCase()}/${target.toLowerCase()}`,
        );
        const payload = (await response.json()) as {
          rate?: number;
          date?: string;
          message?: string;
        };
        if (!response.ok || typeof payload.rate !== "number") {
          throw new Error(payload.message || "Live rate unavailable");
        }
        if (!cancelled) {
          setLiveRate(payload.rate);
          setRateUpdatedAt(payload.date || "Just now");
        }
      } catch {
        if (!cancelled) {
          setLiveRate(null);
          setRateUpdatedAt("Cached rate");
        }
      } finally {
        if (!cancelled) setRateLoading(false);
      }
    }
    void loadLiveRate();
    const refresh = window.setInterval(loadLiveRate, 15 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(refresh);
    };
  }, [source, target]);
  const fee = Math.min(value * 0.005, 3);
  const received = Math.max(0, (value - (includeFees ? fee : 0)) * rate);
  const arrival = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }, []);
  const sectionZoom = activeSection === "Overview" ? 0.94 : 0.88;
  const sourceWallet = wallets.find((wallet) => wallet.currency === source);
  const selectedRecipient = recipients.find((recipient) => recipient.id === recipientId);
  async function openTransferConfirmation() {
    setTransferError(null);
    setLockedQuote(null);
    if (value <= 0) return setTransferError("Enter a positive transfer amount.");
    if (!recipientId) return setTransferError("Select a recipient before sending this transfer.");
    if (getBackendToken()) {
      if (!sourceWallet) return setTransferError(`Create a ${source} wallet before sending.`);
      if (Number(sourceWallet.balance) < value) {
        return setTransferError(`Insufficient ${source} balance. Available: ${Number(sourceWallet.balance).toFixed(2)} ${source}.`);
      }
      setQuoteLoading(true);
      try {
        const quote = await createBackendQuote(value, source, target);
        setLockedQuote(quote);
        setConfirmationOpen(true);
      } catch (error) {
        setTransferError(formatTransferError(error));
      } finally {
        setQuoteLoading(false);
      }
      return;
    }
    setConfirmationOpen(true);
  }
  async function send() {
    if (value <= 0 || sending) return;
    if (!recipientId) {
      setTransferError("Select a recipient before sending this transfer.");
      return;
    }
    setSending(true);
    setTransferError(null);
    try {
      if (getBackendToken()) {
        if (!lockedQuote) throw new Error("Create a fresh quote before confirming this transfer.");
        const transfer = await createBackendTransfer(recipientId, lockedQuote.id, value);
        const recipient = recipients.find((item) => item.id === recipientId);
        setItems((current) => [
          {
            id: transfer.transactionId,
            amount: Number(transfer.sourceAmount),
            targetAmount: Number(transfer.destinationAmount),
            status: transfer.status.toLowerCase(),
            recipientId: transfer.recipientUserId,
            recipientLabel: recipient?.name ?? "Recipient",
            createdAt: transfer.completedAt ?? transfer.createdAt,
            sourceCurrency: transfer.sourceCurrency,
            targetCurrency: transfer.destinationCurrency,
            quoteId: lockedQuote.id,
          },
          ...current,
        ]);
        void loadBackendWallets();
        setConfirmationOpen(false);
        return;
      }
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id;
        if (!userId)
          throw new Error("Your session expired. Please sign in again.");
        const { data: transfer, error } = await supabase
          .from("transfers")
          .insert({
            user_id: userId,
            recipient_id: recipientId,
            source_currency: source,
            target_currency: target,
            amount: value,
            target_amount: received,
            fee,
            status: "processing",
          })
          .select(
            "id, amount, target_amount, status, recipient_id, created_at, source_currency, target_currency",
          )
          .single();
        if (error) throw error;
        if (transfer) {
          setItems((current) => [
            {
              id: transfer.id,
              amount: Number(transfer.amount),
              targetAmount: Number(transfer.target_amount),
              status: transfer.status,
              recipientId: transfer.recipient_id ?? recipientId,
              createdAt: transfer.created_at ?? new Date().toISOString(),
              sourceCurrency: transfer.source_currency ?? source,
              targetCurrency: transfer.target_currency ?? target,
            },
            ...current,
          ]);
          setConfirmationOpen(false);
        }
      } else {
        const transfer = await createTransfer({
          data: { amount: value, source, target },
        });
        setItems((current) => [{ ...transfer, recipientId }, ...current]);
        setConfirmationOpen(false);
      }
    } catch (error) {
      setTransferError(formatTransferError(error));
    } finally {
      setSending(false);
    }
  }
  async function updateTransferStatus(
    id: string,
    status: "completed" | "failed",
  ) {
    setTransferError(null);
    try {
      if (supabase && !id.startsWith("local_")) {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id;
        if (!userId)
          throw new Error("Your session expired. Please sign in again.");
        const { error } = await supabase
          .from("transfers")
          .update({ status })
          .eq("id", id)
          .eq("user_id", userId);
        if (error) throw error;
      }
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, status } : item)),
      );
    } catch (error) {
      setTransferError(formatTransferError(error));
    }
  }
  const selectedTransfer = items.find((item) => item.id === selectedTransferId);
  const filteredTransfers = items.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    const created = item.createdAt ? new Date(item.createdAt) : null;
    if (dateFrom && (!created || created < new Date(`${dateFrom}T00:00:00`))) return false;
    if (dateTo && (!created || created > new Date(`${dateTo}T23:59:59`))) return false;
    return true;
  });
  useEffect(() => {
    setSelectedQuote(null);
    if (!selectedTransfer?.quoteId || !getBackendToken()) return;
    void getBackendQuote(selectedTransfer.quoteId)
      .then(setSelectedQuote)
      .catch(() => setSelectedQuote(null));
  }, [selectedTransfer?.quoteId]);
  async function signOut() {
    clearBackendSession();
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/login";
  }
  return (
    <main className="min-h-screen bg-white text-[#0e0f0c]">
      {confirmationOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-transfer-title"
        >
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#57744a]">
              Review transfer
            </p>
            <h2 id="confirm-transfer-title" className="mt-2 text-2xl font-bold">
              Confirm your transfer
            </h2>
            <div className="mt-6 grid gap-4 rounded-2xl bg-[#f5f7f3] p-4 text-sm">
              <p><span className="text-[#747674]">Recipient</span><br /><strong>{selectedRecipient?.name ?? "Recipient"}</strong></p>
              <div className="grid grid-cols-2 gap-4">
                <p><span className="text-[#747674]">You send</span><br /><strong>{(lockedQuote?.sourceAmount ?? value).toFixed(2)} {source}</strong></p>
                <p><span className="text-[#747674]">Recipient gets</span><br /><strong>{(lockedQuote?.convertedAmount ?? received).toFixed(2)} {target}</strong></p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <p><span className="text-[#747674]">Rate</span><br /><strong>1 {source} = {(lockedQuote?.exchangeRate ?? rate).toFixed(4)} {target}</strong></p>
                <p><span className="text-[#747674]">Fee</span><br /><strong>{(lockedQuote?.feeAmount ?? fee).toFixed(2)} {source}</strong></p>
              </div>
              {getBackendToken() && (
                <p><span className="text-[#747674]">Available {source} balance</span><br /><strong>{Number(sourceWallet?.balance ?? 0).toFixed(2)} {source}</strong></p>
              )}
            </div>
            <p className="mt-4 text-xs leading-5 text-[#747674]">
              This creates an internal ledger transfer. It cannot be undone from this screen.
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => { setConfirmationOpen(false); setLockedQuote(null); }} disabled={sending} className="flex-1 rounded-full border border-[#cfd3cc] px-4 py-3 text-sm font-semibold">Cancel</button>
              <button type="button" onClick={() => void send()} disabled={sending} className="flex-1 rounded-full bg-[#163300] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{sending ? "Sending…" : "Confirm transfer"}</button>
            </div>
          </div>
        </div>
      )}
      {selectedTransfer && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="transfer-details-title"
        >
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#57744a]">Transfer details</p>
                <h2 id="transfer-details-title" className="mt-2 text-2xl font-bold">{selectedTransfer.recipientLabel || recipients.find((recipient) => recipient.id === selectedTransfer.recipientId)?.name || "Recipient"}</h2>
                <p className="mt-1 text-xs text-[#747674]">{formatTransferDate(selectedTransfer.createdAt)}</p>
              </div>
              <button type="button" onClick={() => setSelectedTransferId(null)} className="rounded-full px-3 py-1 text-xl text-[#747674] hover:bg-[#f4f5f3]" aria-label="Close transfer details">×</button>
            </div>
            <div className="mt-6 grid gap-3 rounded-2xl bg-[#f5f7f3] p-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <p><span className="text-[#747674]">You sent</span><br /><strong>{selectedTransfer.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedTransfer.sourceCurrency || source}</strong></p>
                <p><span className="text-[#747674]">Recipient gets</span><br /><strong>{selectedTransfer.targetAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedTransfer.targetCurrency || target}</strong></p>
              </div>
              {selectedQuote && (
                <div className="grid grid-cols-2 gap-4 border-t border-[#e1e4df] pt-3">
                  <p><span className="text-[#747674]">FX rate</span><br /><strong>1 {selectedQuote.fromCurrency} = {Number(selectedQuote.exchangeRate).toFixed(4)} {selectedQuote.toCurrency}</strong></p>
                  <p><span className="text-[#747674]">Fee</span><br /><strong>{Number(selectedQuote.feeAmount).toFixed(2)} {selectedQuote.fromCurrency}</strong></p>
                </div>
              )}
              <p><span className="text-[#747674]">Transfer ID</span><br /><strong className="break-all font-mono text-xs">{selectedTransfer.id}</strong></p>
            </div>
            <div className="mt-6">
              <p className="text-sm font-semibold">Status</p>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full bg-[#9fe870]" />
                <span className="capitalize">{selectedTransfer.status}</span>
                <span className="text-[#b0b4ae]">·</span>
                <span className="text-[#747674]">Internal ledger transfer</span>
              </div>
            </div>
            {selectedTransfer.status === "processing" && (
              <div className="mt-6 flex flex-wrap gap-2">
                <button type="button" onClick={() => void updateTransferStatus(selectedTransfer.id, "completed")} className="rounded-full bg-[#9fe870] px-4 py-2 text-xs font-semibold text-[#163300]">Mark completed</button>
                <button type="button" onClick={() => void updateTransferStatus(selectedTransfer.id, "failed")} className="rounded-full border border-[#c85b52] px-4 py-2 text-xs font-semibold text-[#b64940]">Mark failed</button>
              </div>
            )}
            <button type="button" onClick={() => setSelectedTransferId(null)} className="mt-6 w-full rounded-full border border-[#cfd3cc] px-4 py-3 text-sm font-semibold">Close</button>
          </div>
        </div>
      )}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[280px] border-r border-[#e6e8e4] bg-white px-5 py-9 lg:flex lg:flex-col">
        <Link to="/" aria-label="Slash Pay home" className="ml-3 w-40">
          <SlashPayBrand className="h-auto w-full" />
        </Link>
        <nav className="mt-14 grid gap-1">
          {nav.map(([Icon, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveSection(label)}
              className={`flex items-center gap-4 rounded-full px-5 py-3 text-left text-[15px] transition ${label === activeSection ? "bg-[#eef0ed] font-semibold text-[#163300]" : "text-[#646664] hover:bg-[#f4f5f3]"}`}
            >
              <Icon size={21} />
              {label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="min-h-screen lg:pl-[280px]">
        <header className="flex items-center justify-between px-6 py-6 sm:px-10 lg:px-14">
          <div className="lg:hidden">
            <Link to="/" className="block w-28">
              <SlashPayBrand />
            </Link>
          </div>
          <div className="relative ml-auto flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((current) => !current)}
                className="relative grid size-10 place-items-center rounded-full text-[#536152] transition hover:bg-[#f4f5f3]"
              >
                <Bell size={20} />
                {items.length > 0 && (
                  <span className="absolute right-1 top-1 size-2 rounded-full bg-[#e35d52]" />
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-30 w-80 rounded-2xl border border-[#e7e9e5] bg-white p-3 shadow-[0_14px_40px_rgba(22,51,0,0.12)]">
                  <div className="flex items-center justify-between border-b border-[#eef0ed] px-3 pb-3">
                    <p className="text-sm font-semibold">Notifications</p>
                    <span className="text-xs text-[#747674]">
                      Recent activity
                    </span>
                  </div>
                  {items.length === 0 ? (
                    <p className="px-3 py-5 text-sm text-[#747674]">
                      No new notifications.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#eef0ed]">
                      {items.slice(0, 3).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setNotificationsOpen(false);
                            setActiveSection("Payments / Transfers");
                            setSelectedTransferId(item.id);
                          }}
                          className="w-full px-3 py-3 text-left hover:bg-[#f8faf7]"
                        >
                          <p className="text-sm font-medium">
                            {item.amount.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}{" "}
                            {item.sourceCurrency || source} transfer
                          </p>
                          <p className="mt-1 text-xs capitalize text-[#747674]">
                            {item.status} · {formatTransferDate(item.createdAt)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((current) => !current)}
              className="flex items-center gap-2 rounded-full p-1 transition hover:bg-[#f4f5f3]"
            >
              <span className="grid size-11 place-items-center rounded-full bg-[#eef0ed] font-semibold">
                {data.profile.initials}
              </span>
              <span className="hidden text-sm font-medium xl:block">
                {data.profile.name}
              </span>
              <ChevronRight size={20} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-14 z-30 w-72 rounded-2xl border border-[#e7e9e5] bg-white p-3 shadow-[0_14px_40px_rgba(22,51,0,0.12)]">
                <div className="border-b border-[#eef0ed] px-3 pb-3">
                  <p className="text-sm font-semibold">{data.profile.name}</p>
                  <p className="mt-1 truncate text-xs text-[#747674]">
                    {accountEmail || "Signed-in account"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setActiveSection("Settings and security");
                  }}
                  className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[#31551d] hover:bg-[#f4f5f3]"
                >
                  <LockKeyhole size={17} />
                  Settings and security
                </button>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[#b64940] hover:bg-[#fff5f4]"
                >
                  <LogOut size={17} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="px-6 pb-2 sm:px-10 lg:hidden">
          <label className="sr-only" htmlFor="mobile-section">
            Dashboard section
          </label>
          <select
            id="mobile-section"
            value={activeSection}
            onChange={(event) => setActiveSection(event.target.value)}
            className="w-full rounded-2xl border border-[#dfe2dd] bg-white px-4 py-3 text-sm font-medium text-[#163300] outline-none focus:border-[#9fe870]"
          >
            {nav.map(([, label]) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <section
          style={{ zoom: sectionZoom }}
          className="mx-0 w-full max-w-none px-5 pb-12 pt-1 sm:px-8 lg:px-10"
        >
          {activeSection === "Overview" ? (
            <>
              <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
                <div>
                  <h1 className="text-[30px] font-bold tracking-tight">
                    Good evening, {data.profile.name.split(" ")[0]}
                  </h1>
                  <p className="mt-1 text-sm text-[#747674]">
                    Here&apos;s an overview of your business performance.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-[#dfe2dd] px-4 py-2 text-sm font-medium"
                >
                  Last 30 days{" "}
                  <ChevronDown className="ml-2 inline-block" size={15} />
                </button>
              </div>
              <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  ["Revenue", "$7.3k", "Selected period", "↗ 100%"],
                  ["Open", "$0", "0 invoices", ""],
                  ["Paid", "$7.3k", "1 invoice", "↗ 100%"],
                  ["Overdue", "$0", "0 invoices", ""],
                ].map(([label, value, detail, change]) => (
                  <div
                    key={label}
                    className="min-h-[142px] rounded-[20px] border border-[#e7e9e5] bg-[#fafbfa] p-5"
                  >
                    <div className="flex items-center justify-between text-xs text-[#747674]">
                      <span>{label}</span>
                      {change && (
                        <span className="rounded-full bg-[#e4f7d7] px-2 py-1 text-[#3f7a1d]">
                          {change}
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-[29px] font-bold">{value}</p>
                    <p className="mt-1 text-xs text-[#858785]">{detail}</p>
                  </div>
                ))}
                <div className="min-h-[142px] rounded-[20px] bg-[#eaf7e3] p-5 sm:col-span-2 xl:col-span-1">
                  <p className="text-sm text-[#4c4e4c]">Total cashflow</p>
                  <p className="mt-3 text-[32px] font-bold">$5.5k</p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      className="rounded-full bg-white px-3 py-2 text-xs font-semibold"
                    >
                      ＋ New invoice
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-[#d8efd0] px-3 py-2 text-xs font-semibold"
                    >
                      ＋ Expense
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="rounded-[22px] border border-[#e7e9e5] bg-[#fafbfa] p-5 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-[#747674]">Wallet balances</p>
                      <p className="mt-1 text-[26px] font-bold">
                        {wallets.length
                          ? wallets
                              .map((wallet) => `${wallet.currency} ${Number(wallet.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}`)
                              .join(" · ")
                          : "No wallets yet"}
                      </p>
                      <span className="mt-2 inline-block rounded-full bg-[#e4f7d7] px-2 py-1 text-xs font-semibold text-[#3f7a1d]">
                        {wallets.length} active {wallets.length === 1 ? "wallet" : "wallets"}
                      </span>
                    </div>
                    <div className="hidden gap-4 text-xs text-[#747674] sm:flex">
                      <span>● Paid 1</span>
                      <span>● Invoiced 0</span>
                      <span>● Expenses 4</span>
                    </div>
                  </div>
                  <RateChart />
                  <div className="mt-1 flex justify-between text-xs text-[#858785]">
                    <span>Apr 5</span>
                    <span>Apr 14</span>
                    <span>Apr 28</span>
                    <span>May 4</span>
                  </div>
                </div>
                <div className="rounded-[22px] border border-[#e7e9e5] bg-[#fafbfa] p-5">
                  <h2 className="text-lg font-bold">Activities</h2>
                  <p className="text-xs text-[#858785]">Latest updates</p>
                  <div className="mt-5 grid gap-5 text-sm">
                    {items.length === 0 ? (
                      <p className="text-[#747674]">No wallet activity yet.</p>
                    ) : (
                      items.slice(0, 4).map((item) => (
                        <p key={item.id}>
                          <strong>{item.status === "completed" ? "Completed transfer" : "Transfer"}</strong>
                          <br />
                          <span className="text-[#747674]">
                            {item.amount.toLocaleString()} {item.sourceCurrency} → {item.targetAmount.toLocaleString()} {item.targetCurrency} · {formatTransferDate(item.createdAt)}
                          </span>
                        </p>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                {[
                  ["Net Revenue", "$7.3k"],
                  ["VAT", "$0"],
                  ["Expenses", "$1.9k"],
                  ["Profit", "$5.5k"],
                  ["Margin", "75%"],
                  ["Business health", "Excellent"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[18px] border border-[#e7e9e5] bg-[#fafbfa] p-4"
                  >
                    <p className="text-xs text-[#747674]">{label}</p>
                    <p className="mt-2 truncate text-xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="rounded-[22px] border border-[#e7e9e5] bg-[#fafbfa] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">Latest activity</h2>
                      <p className="text-xs text-[#858785]">
                        Invoices, receipts, transfers and expenses
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full bg-[#163300] px-4 py-2 text-xs font-semibold text-white"
                    >
                      View all →
                    </button>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                      ["Expense", "Personal", "-$560.00"],
                      ["Expense", "Dinner with client", "-$98.00"],
                      ["Expense", "Conference in Tokyo", "-$1,000.00"],
                      ["Expense", "Figma", "-$192.00"],
                      ["Receipt", "Charles Richmond", "$8,000.00"],
                      ["Invoice", "Christina Yasmine", "$7,300.00"],
                    ].map((entry) => {
                      const [type, title, amount] = entry as [
                        string,
                        string,
                        string,
                      ];
                      return (
                        <div
                          key={title}
                          className="rounded-[15px] border border-[#e2e5e0] bg-white p-4"
                        >
                          <span className="rounded-full bg-[#eef0ed] px-2 py-1 text-[10px] font-semibold">
                            {type}
                          </span>
                          <p className="mt-5 truncate text-sm font-semibold">
                            {title}
                          </p>
                          <p
                            className={`mt-1 text-lg font-bold ${amount.startsWith("-") ? "text-[#d95454]" : ""}`}
                          >
                            {amount}
                          </p>
                          <p className="mt-1 text-[11px] text-[#858785]">
                            Recently updated
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-[22px] border border-[#e7e9e5] bg-[#fafbfa] p-5">
                  <h2 className="text-lg font-bold">Recent customers</h2>
                  <p className="text-xs text-[#858785]">
                    Latest billing activity
                  </p>
                  <div className="mt-6 flex gap-4">
                    <div>
                      <span className="grid size-12 place-items-center rounded-full bg-[#eef0ed] font-bold">
                        CR
                      </span>
                      <p className="mt-2 text-xs">Charles</p>
                    </div>
                    <div>
                      <span className="grid size-12 place-items-center rounded-full bg-[#d8efd0] font-bold">
                        CY
                      </span>
                      <p className="mt-2 text-xs">Christina</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="rounded-[22px] border border-[#e7e9e5] bg-[#fafbfa] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">Latest tasks</h2>
                      <p className="text-xs text-[#858785]">6 of 11 done</p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full bg-[#163300] px-4 py-2 text-xs font-semibold text-white"
                    >
                      ＋ Add task
                    </button>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {[
                      "Time tracking",
                      "Export finalized assets and documentation",
                      "Prepare an interactive prototype",
                      "Optimize the hero section",
                      "Develop a reusable component library",
                    ].map((task) => (
                      <label
                        key={task}
                        className="flex items-center gap-3 rounded-xl border border-[#e2e5e0] bg-white px-4 py-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="size-4 accent-[#163300]"
                        />
                        <span className="truncate">{task}</span>
                        <span className="ml-auto hidden rounded-full bg-[#eef0ed] px-2 py-1 text-[10px] text-[#747674] sm:inline">
                          In progress
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="rounded-[22px] border border-[#e7e9e5] bg-[#fafbfa] p-5">
                  <h2 className="text-lg font-bold">Last 3 months</h2>
                  <p className="text-xs text-[#858785]">Monthly balance</p>
                  <div className="mt-8 flex h-32 items-end justify-center gap-7">
                    <span className="h-6 w-12 rounded-t-lg bg-[#e2e5e0]" />
                    <span className="h-14 w-12 rounded-t-lg bg-[#d3d8d1]" />
                    <span className="h-28 w-12 rounded-t-lg bg-[#9fe870]" />
                  </div>
                  <div className="mt-3 flex justify-around text-xs text-[#747674]">
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                  </div>
                </div>
              </div>
            </>
          ) : activeSection === "Payments / Transfers" ? (
            <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
              <div className="self-start rounded-[24px] bg-[#eef0ed] p-5 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <h2
                    className="text-[28px] font-bold tracking-tight"
                    aria-live="polite"
                  >
                    1 {source} = {rate.toFixed(4)} {target}
                  </h2>
                  <span className="whitespace-nowrap text-xs font-semibold text-[#3f7a1d]">
                    {rateLoading
                      ? "Updating…"
                      : `● ${liveRate ? "Live" : "Cached"} · ${rateUpdatedAt}`}
                  </span>
                </div>
                <div className="mt-5 overflow-hidden">
                  <RateChart currentRate={rate} baselineRate={fallbackRate} />
                </div>
                <div className="mt-2 flex justify-between text-sm text-[#747674]">
                  <span>26 Aug</span>
                  <span>Today</span>
                </div>
              </div>
              <div className="grid gap-5">
                <div className="rounded-[24px] border border-[#e1e4df] bg-white p-5 sm:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h1 className="text-[30px] font-bold tracking-tight">
                        Payments / Transfers
                      </h1>
                      <p className="mt-1 text-sm text-[#747674]">
                        Send money internationally with live exchange rates.
                      </p>
                    </div>
                    <p className="rounded-full bg-[#eef0ed] px-4 py-2 text-sm font-semibold">
                      1 {source} = {rate.toFixed(4)} {target}
                    </p>
                  </div>
                  <div className="mb-6">
                    <label
                      className="mb-3 block text-sm font-medium text-[#747674]"
                      htmlFor="transfer-recipient"
                    >
                      Recipient
                    </label>
                    <select
                      id="transfer-recipient"
                      value={recipientId}
                      onChange={(event) => setRecipientId(event.target.value)}
                      className="h-16 w-full rounded-[20px] border border-[#e1e4df] bg-white px-5 text-base font-semibold outline-none focus:border-[#163300]"
                    >
                      <option value="">Select a recipient</option>
                      {recipients.map((recipient) => (
                        <option key={recipient.id} value={recipient.id}>
                          {recipient.name} · {recipient.currency} account ending
                          in {recipient.account_identifier.slice(-4)}
                        </option>
                      ))}
                    </select>
                    {recipients.length === 0 && (
                      <p className="mt-2 text-xs text-[#747674]">
                        Add a recipient first from the Recipients section.
                      </p>
                    )}
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <p className="mb-3 text-sm font-medium text-[#747674]">
                        You send
                      </p>
                      <CurrencyInput
                        label={source}
                        flag={
                          source === "USD"
                            ? "🇺🇸"
                            : source === "INR"
                              ? "🇮🇳"
                              : "💱"
                        }
                        value={amount}
                        onChange={setAmount}
                        onCurrencyChange={setSource}
                      />
                    </div>
                    <div>
                      <p className="mb-3 text-sm font-medium text-[#747674]">
                        Recipient gets
                      </p>
                      <CurrencyInput
                        label={target}
                        flag={
                          target === "USD"
                            ? "🇺🇸"
                            : target === "INR"
                              ? "🇮🇳"
                              : "💱"
                        }
                        value={received.toFixed(2)}
                        readOnly
                        onCurrencyChange={setTarget}
                      />
                    </div>
                  </div>
                  <div className="mt-6 grid gap-4 rounded-[20px] border border-[#d6d9d4] bg-[#fafbfa] p-5 sm:grid-cols-2">
                    <span className="text-center text-sm text-[#747674]">
                      Includes fees
                      <br />
                      <strong className="text-[#4c4e4c]">
                        {fee.toFixed(2)} {source}
                      </strong>
                    </span>
                    <span className="border-t border-[#d6d9d4] pt-4 text-center text-sm text-[#747674] sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                      Should arrive
                      <br />
                      <strong className="text-[#4c4e4c]">By {arrival}</strong>
                    </span>
                  </div>
                  <button
                    onClick={() => void openTransferConfirmation()}
                    disabled={sending || quoteLoading || value <= 0}
                    type="button"
                    className="mt-5 w-full rounded-full bg-[#9fe870] py-4 font-semibold text-[#163300] disabled:opacity-50"
                  >
                    {quoteLoading ? "Getting quote..." : sending ? "Sending..." : "Send"}
                  </button>
                  {transferError && (
                    <p className="mt-3 rounded-xl bg-[#fff1ef] px-4 py-3 text-sm text-[#b44336]">
                      {transferError}
                    </p>
                  )}
                </div>
                <div className="rounded-[24px] border border-[#e1e4df] bg-white p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Recent transfers</h2>
                    <span className="text-xs text-[#747674]">
                      {filteredTransfers.length} shown · {items.length} total
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-[#e1e4df] bg-white px-3 py-2 text-xs outline-none">
                      <option value="all">All statuses</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                    <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} aria-label="Transfers from date" className="rounded-xl border border-[#e1e4df] px-3 py-2 text-xs" />
                    <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} aria-label="Transfers to date" className="rounded-xl border border-[#e1e4df] px-3 py-2 text-xs" />
                  </div>
                  {filteredTransfers.length === 0 ? (
                    <p className="mt-4 text-sm text-[#747674]">
                      {items.length === 0 ? "No transfers yet. Your completed sends will appear here." : "No transfers match these filters."}
                    </p>
                  ) : (
                    <div className="mt-3 divide-y divide-[#e6e8e4]">
                      {filteredTransfers.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="flex cursor-pointer items-center justify-between gap-4 rounded-xl py-3 text-left text-sm transition hover:bg-[#fafbfa]"
                          onClick={() => setSelectedTransferId(item.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              setSelectedTransferId(item.id);
                            }
                          }}
                        >
                          <div>
                            <p className="text-xs font-semibold text-[#4c4e4c]">
                              {recipients.find(
                                (recipient) =>
                                  recipient.id === item.recipientId,
                              )?.name || item.recipientLabel || "Recipient"}
                            </p>
                            <p className="font-semibold">
                              {item.amount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              {item.sourceCurrency || source}
                            </p>
                            <p className="text-xs text-[#747674]">
                              Recipient gets{" "}
                              {item.targetAmount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              {item.targetCurrency || target}
                            </p>
                          </div>
                          <span className="rounded-full bg-[#eef0ed] px-3 py-1 text-xs font-medium capitalize text-[#4c4e4c]">
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeSection === "Recipients" ? (
            <RecipientsSection
              onSend={() => setActiveSection("Payments / Transfers")}
              onRecipientsChanged={() => void loadBackendRecipients()}
            />
          ) : activeSection === "Invoices" ? (
            <InvoicesSection />
          ) : activeSection === "Balances and currencies" ? (
            <BalancesSection onWalletsChanged={() => void loadBackendWallets()} />
          ) : activeSection === "Reports" ? (
            <ReportsSection />
          ) : activeSection === "Settings and security" ? (
            <SettingsSection profile={data.profile} />
          ) : (
            <div className="mt-6 rounded-[24px] border border-[#e7e9e5] bg-[#fafbfa] p-10 text-center">
              <h1 className="text-2xl font-bold">{activeSection}</h1>
              <p className="mt-2 text-sm text-[#747674]">
                This section is ready for the next data view.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

type SettingsSectionProps = {
  profile: {
    name: string;
    initials: string;
  };
};

function SettingsSection({ profile }: SettingsSectionProps) {
  const [fullName, setFullName] = useState(profile.name);
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      const metadataName = data.user?.user_metadata?.["full_name"];
      if (typeof metadataName === "string" && metadataName.trim()) {
        setFullName(metadataName);
      }
    });
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });
      if (updateError) throw updateError;
      setMessage("Profile details saved.");
    } catch (saveError) {
      setError(formatTransferError(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function sendPasswordReset() {
    setMessage(null);
    setError(null);
    if (!supabase || !email) {
      setError("Your account email is not available.");
      return;
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: window.location.origin + "/login" },
    );
    if (resetError) {
      setError(formatTransferError(resetError));
      return;
    }
    setMessage("Password reset instructions sent to your email.");
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="mt-6 max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-[30px] font-bold tracking-tight">
            Settings and security
          </h1>
          <p className="mt-1 text-sm text-[#747674]">
            Manage your profile, account access, and dashboard preferences.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[#eef0ed] px-4 py-2 text-sm font-medium text-[#163300]">
          <ShieldCheck size={17} />
          Account protected
        </div>
      </div>

      {(message || error) && (
        <div
          className={
            "mt-6 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm " +
            (error
              ? "bg-[#fff0ef] text-[#b64940]"
              : "bg-[#e4f7d7] text-[#3f7a1d]")
          }
        >
          <CheckCircle2 size={17} />
          {error || message}
        </div>
      )}

      <div className="mt-7 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <form
          onSubmit={saveProfile}
          className="rounded-[24px] border border-[#e7e9e5] bg-[#fafbfa] p-6"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-[#e4f7d7] text-[#163300]">
              <UserRound size={21} />
            </span>
            <div>
              <h2 className="font-semibold">Profile details</h2>
              <p className="text-xs text-[#747674]">
                This is how your account appears in Slash Pay.
              </p>
            </div>
          </div>
          <label className="mt-6 block text-sm font-medium">
            Full name
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#dfe2dd] bg-white px-4 py-3 outline-none transition focus:border-[#9fe870]"
              required
            />
          </label>
          <label className="mt-4 block text-sm font-medium">
            Email address
            <div className="relative mt-2">
              <Mail
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#747674]"
              />
              <input
                value={email}
                readOnly
                className="w-full rounded-2xl border border-[#dfe2dd] bg-[#f1f3f0] py-3 pl-11 pr-4 text-[#747674]"
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="mt-6 rounded-full bg-[#9fe870] px-5 py-3 text-sm font-semibold text-[#163300] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>

        <div className="rounded-[24px] border border-[#e7e9e5] bg-[#fafbfa] p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-[#eef0ed] text-[#163300]">
              <KeyRound size={21} />
            </span>
            <div>
              <h2 className="font-semibold">Password and access</h2>
              <p className="text-xs text-[#747674]">
                Keep your account credentials up to date.
              </p>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-[#e7e9e5] bg-white p-4">
            <p className="text-sm font-medium">Password</p>
            <p className="mt-1 text-xs text-[#747674]">
              Send yourself a secure password reset link.
            </p>
            <button
              type="button"
              onClick={() => void sendPasswordReset()}
              className="mt-4 rounded-full border border-[#7b8f70] px-4 py-2 text-sm font-semibold text-[#31551d]"
            >
              Reset password
            </button>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#b64940]"
          >
            <LogOut size={17} />
            Sign out of this account
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-[#e7e9e5] bg-[#fafbfa] p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-[#eef0ed] text-[#163300]">
            <Bell size={21} />
          </span>
          <div>
            <h2 className="font-semibold">Notifications</h2>
            <p className="text-xs text-[#747674]">
              Choose which account updates you want to receive.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {[
            {
              label: "Transfer updates",
              detail: "Get notified when a transfer changes status.",
              checked: notifications,
              setChecked: setNotifications,
            },
            {
              label: "Security alerts",
              detail: "Receive alerts for sign-ins and password changes.",
              checked: securityAlerts,
              setChecked: setSecurityAlerts,
            },
          ].map((item) => (
            <label
              key={item.label}
              className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#e7e9e5] bg-white p-4"
            >
              <span>
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="mt-1 block text-xs text-[#747674]">
                  {item.detail}
                </span>
              </span>
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(event) => item.setChecked(event.target.checked)}
                className="size-5 accent-[#4a8a27]"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-[24px] border border-[#e7e9e5] bg-[#f5f8f3] p-5 text-sm text-[#536152]">
        <LockKeyhole size={19} className="shrink-0 text-[#31551d]" />
        Your authentication is handled securely by Supabase. Slash Pay never
        stores your password.
      </div>
    </div>
  );
}

type ReportTransfer = {
  amount: number;
  source_currency: string;
  target_currency: string;
  status: string;
  created_at: string;
};

type ReportInvoice = {
  amount: number;
  currency: string;
  status: string;
  created_at: string;
};

function ReportsSection() {
  const [transfers, setTransfers] = useState<ReportTransfer[]>([]);
  const [invoices, setInvoices] = useState<ReportInvoice[]>([]);
  const [range, setRange] = useState("30");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setLoading(false);
      return;
    }
    client.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        setLoading(false);
        return;
      }
      const [transferResult, invoiceResult] = await Promise.all([
        client
          .from("transfers")
          .select(
            "amount, source_currency, target_currency, status, created_at",
          )
          .order("created_at", { ascending: false }),
        client
          .from("invoices")
          .select("amount, currency, status, created_at")
          .order("created_at", { ascending: false }),
      ]);
      if (transferResult.error)
        setError(formatTransferError(transferResult.error));
      else if (transferResult.data)
        setTransfers(
          transferResult.data.map((row) => ({
            ...row,
            amount: Number(row.amount),
          })),
        );
      if (invoiceResult.error)
        setError(formatTransferError(invoiceResult.error));
      else if (invoiceResult.data)
        setInvoices(
          invoiceResult.data.map((row) => ({
            ...row,
            amount: Number(row.amount),
          })),
        );
      setLoading(false);
    });
  }, []);

  const cutoff = useMemo(() => {
    if (range === "all") return 0;
    return Date.now() - Number(range) * 24 * 60 * 60 * 1000;
  }, [range]);
  const filteredTransfers = transfers.filter(
    (item) => new Date(item.created_at).getTime() >= cutoff,
  );
  const filteredInvoices = invoices.filter(
    (item) => new Date(item.created_at).getTime() >= cutoff,
  );
  const transferVolume = filteredTransfers.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const completedVolume = filteredTransfers
    .filter((item) => item.status === "completed")
    .reduce((sum, item) => sum + item.amount, 0);
  const paidInvoices = filteredInvoices.filter(
    (item) => item.status === "paid",
  );
  const invoiceVolume = filteredInvoices.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const paidInvoiceVolume = paidInvoices.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const statusCounts = {
    processing: filteredTransfers.filter((item) => item.status === "processing")
      .length,
    completed: filteredTransfers.filter((item) => item.status === "completed")
      .length,
    failed: filteredTransfers.filter((item) => item.status === "failed").length,
    paid: paidInvoices.length,
  };
  const currencyTotals = [
    ...new Set([
      ...filteredTransfers.map((item) => item.source_currency),
      ...filteredInvoices.map((item) => item.currency),
    ]),
  ]
    .map((currency) => ({
      currency,
      total:
        filteredTransfers
          .filter((item) => item.source_currency === currency)
          .reduce((sum, item) => sum + item.amount, 0) +
        filteredInvoices
          .filter((item) => item.currency === currency)
          .reduce((sum, item) => sum + item.amount, 0),
    }))
    .sort((a, b) => b.total - a.total);
  const maxCurrencyTotal = Math.max(
    ...currencyTotals.map((item) => item.total),
    1,
  );

  function exportCsv() {
    const rows = [
      ["Type", "Amount", "Currency", "Status", "Created at"],
      ...filteredTransfers.map((item) => [
        "Transfer",
        item.amount.toFixed(2),
        item.source_currency,
        item.status,
        item.created_at,
      ]),
      ...filteredInvoices.map((item) => [
        "Invoice",
        item.amount.toFixed(2),
        item.currency,
        item.status,
        item.created_at,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","),
      )
      .join("\\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "slash-pay-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold">Reports</h1>
          <p className="mt-1 text-sm text-[#747674]">
            Track transfers, invoices, and currency volume.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="rounded-full border border-[#dfe2dd] bg-white px-4 py-3 text-sm font-semibold outline-none"
          >
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-full bg-[#163300] px-5 py-3 text-sm font-semibold text-white"
          >
            Export CSV
          </button>
        </div>
      </div>
      {error && (
        <p className="mt-4 rounded-xl bg-[#fff1ef] px-4 py-3 text-sm text-[#b44336]">
          {error}
        </p>
      )}
      {loading ? (
        <p className="mt-8 text-sm text-[#747674]">Loading report data…</p>
      ) : (
        <>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[22px] border border-[#e1e4df] bg-white p-5">
              <p className="text-sm text-[#747674]">Transfer volume</p>
              <p className="mt-2 text-2xl font-bold">
                {transferVolume.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="mt-1 text-xs text-[#747674]">
                {filteredTransfers.length} transfers
              </p>
            </div>
            <div className="rounded-[22px] border border-[#e1e4df] bg-white p-5">
              <p className="text-sm text-[#747674]">Completed volume</p>
              <p className="mt-2 text-2xl font-bold">
                {completedVolume.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="mt-1 text-xs text-[#747674]">
                {statusCounts.completed} completed
              </p>
            </div>
            <div className="rounded-[22px] border border-[#e1e4df] bg-white p-5">
              <p className="text-sm text-[#747674]">Invoice volume</p>
              <p className="mt-2 text-2xl font-bold">
                {invoiceVolume.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="mt-1 text-xs text-[#747674]">
                {filteredInvoices.length} invoices
              </p>
            </div>
            <div className="rounded-[22px] border border-[#e1e4df] bg-white p-5">
              <p className="text-sm text-[#747674]">Paid invoices</p>
              <p className="mt-2 text-2xl font-bold">
                {paidInvoiceVolume.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="mt-1 text-xs text-[#747674]">
                {statusCounts.paid} paid
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            <div className="rounded-[24px] border border-[#e1e4df] bg-white p-5">
              <h2 className="font-semibold">Status breakdown</h2>
              <div className="mt-5 grid grid-cols-4 gap-3 text-center">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="rounded-2xl bg-[#fafbfa] p-3">
                    <p className="text-xl font-bold">{count}</p>
                    <p className="mt-1 text-xs capitalize text-[#747674]">
                      {status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] border border-[#e1e4df] bg-white p-5">
              <h2 className="font-semibold">Volume by currency</h2>
              {currencyTotals.length === 0 ? (
                <p className="mt-5 text-sm text-[#747674]">
                  No report data yet.
                </p>
              ) : (
                <div className="mt-5 space-y-4">
                  {currencyTotals.map((item) => (
                    <div key={item.currency}>
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">{item.currency}</span>
                        <span>
                          {item.total.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="mt-2 h-3 rounded-full bg-[#eef0ed]">
                        <div
                          className="h-3 rounded-full bg-[#9fe870]"
                          style={{
                            width: `${Math.max(4, (item.total / maxCurrencyTotal) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type BalanceRecord = {
  id: string;
  currency: string;
  available: number;
  pending: number;
};

type BalanceActivity = {
  id: string;
  kind: "deposit" | "withdrawal" | "transfer";
  amount: number;
  currency: string;
  detail: string;
  createdAt: string;
  status?: string;
};

function mapBackendActivity(transaction: BackendTransaction): BalanceActivity {
  const type = transaction.transactionType.toLowerCase();
  const kind = type.includes("withdraw")
    ? "withdrawal"
    : type.includes("deposit")
      ? "deposit"
      : "transfer";
  const amount = Number(transaction.sourceAmount ?? transaction.amount ?? 0);
  const currency = transaction.sourceCurrency ?? transaction.currency ?? "";
  const detail =
    kind === "deposit"
      ? "Wallet deposit"
      : kind === "withdrawal"
        ? "Wallet withdrawal"
        : `Transfer to ${transaction.destinationCurrency ?? "recipient"}`;
  return {
    id: transaction.transactionId,
    kind,
    amount,
    currency,
    detail,
    createdAt: transaction.completedAt ?? transaction.createdAt ?? new Date().toISOString(),
    status: transaction.status.toLowerCase(),
  };
}

function BalancesSection({ onWalletsChanged }: { onWalletsChanged?: () => void }) {
  const [balances, setBalances] = useState<BalanceRecord[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [actionCurrency, setActionCurrency] = useState("USD");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<BalanceActivity[]>([]);
  const [activityCurrency, setActivityCurrency] = useState("all");
  const currencies = ["USD", "EUR", "GBP", "INR"];

  useEffect(() => {
    if (getBackendToken()) {
      void Promise.all([getBackendWallets(), getBackendTransactions()])
        .then(([walletRows, history]) => {
          setBalances(
            walletRows.map((wallet) => ({
              id: wallet.id,
              currency: wallet.currency,
              available: Number(wallet.balance),
              pending: 0,
            })),
          );
          setActionCurrency(walletRows[0]?.currency || "USD");
          setActivities(history.content.map(mapBackendActivity));
        })
        .catch((loadError) => setError(formatTransferError(loadError)))
        .finally(() => setLoading(false));
      return;
    }
    const client = supabase;
    if (!client) {
      setLoading(false);
      return;
    }
    client.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        setLoading(false);
        return;
      }
      const { data: rows, error: loadError } = await client
        .from("balances")
        .select("id, currency, available, pending")
        .order("currency");
      if (loadError) setError(formatTransferError(loadError));
      if (rows) {
        setBalances(
          rows.map((row) => ({
            ...row,
            available: Number(row.available),
            pending: Number(row.pending),
          })),
        );
        setActionCurrency(rows[0]?.currency || "USD");
      }
      const { data: transferRows } = await client
        .from("transfers")
        .select(
          "id, amount, source_currency, target_currency, status, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(10);
      if (transferRows) {
        setActivities(
          transferRows.map((row) => ({
            id: row.id,
            kind: "transfer",
            amount: Number(row.amount),
            currency: row.source_currency,
            detail: "Transfer to " + row.target_currency,
            createdAt: row.created_at,
            status: row.status,
          })),
        );
      }
      setLoading(false);
    });
  }, []);

  async function addCurrency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (getBackendToken()) {
      setSaving(true);
      setError(null);
      try {
        const wallet = await createBackendWallet(currency);
        const record = {
          id: wallet.id,
          currency: wallet.currency,
          available: Number(wallet.balance),
          pending: 0,
        };
        setBalances((current) =>
          current.some((item) => item.id === record.id)
            ? current
            : [...current, record].sort((a, b) => a.currency.localeCompare(b.currency)),
        );
        setActionCurrency(wallet.currency);
        onWalletsChanged?.();
      } catch (insertError) {
        setError(formatTransferError(insertError));
      } finally {
        setSaving(false);
      }
      return;
    }
    if (!supabase) return;
    setSaving(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId)
        throw new Error("Your session expired. Please sign in again.");
      const { data: row, error: insertError } = await supabase
        .from("balances")
        .upsert(
          { user_id: userId, currency, available: 0, pending: 0 },
          { onConflict: "user_id,currency" },
        )
        .select("id, currency, available, pending")
        .single();
      if (insertError) throw insertError;
      if (row) {
        setBalances((current) =>
          current.some((item) => item.id === row.id)
            ? current
            : [
                ...current,
                {
                  ...row,
                  available: Number(row.available),
                  pending: Number(row.pending),
                },
              ].sort((a, b) => a.currency.localeCompare(b.currency)),
        );
        setActionCurrency(row.currency);
      }
    } catch (insertError) {
      setError(formatTransferError(insertError));
    } finally {
      setSaving(false);
    }
  }

  async function adjustBalance(
    event: FormEvent<HTMLFormElement>,
    direction: "deposit" | "withdraw",
  ) {
    event.preventDefault();
    const value = Number(amount);
    const balance = balances.find((item) => item.currency === actionCurrency);
    if (getBackendToken()) {
      if (!balance || !Number.isFinite(value) || value <= 0) {
        setError(balance ? "Enter a positive amount." : "Add this currency first.");
        return;
      }
      setSaving(true);
      setError(null);
      try {
        await createBackendBalanceOperation(
          direction === "deposit" ? "deposit" : "withdrawal",
          value,
          actionCurrency,
        );
        const [walletRows, history] = await Promise.all([
          getBackendWallets(),
          getBackendTransactions(),
        ]);
        setBalances(walletRows.map((wallet) => ({
          id: wallet.id,
          currency: wallet.currency,
          available: Number(wallet.balance),
          pending: 0,
        })));
        setActivities(history.content.map(mapBackendActivity));
        setAmount("");
        onWalletsChanged?.();
      } catch (operationError) {
        setError(formatTransferError(operationError));
      } finally {
        setSaving(false);
      }
      return;
    }
    if (!supabase || !balance || !Number.isFinite(value) || value <= 0) {
      setError(
        balance ? "Enter a positive amount." : "Add this currency first.",
      );
      return;
    }
    if (direction === "withdraw" && value > balance.available) {
      setError("Withdrawal cannot exceed the available balance.");
      return;
    }
    setSaving(true);
    setError(null);
    const nextAvailable =
      direction === "deposit"
        ? balance.available + value
        : balance.available - value;
    const updatedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("balances")
      .update({
        available: nextAvailable,
        updated_at: updatedAt,
      })
      .eq("id", balance.id);
    if (updateError) {
      setError(formatTransferError(updateError));
    } else {
      setBalances((current) =>
        current.map((item) =>
          item.id === balance.id ? { ...item, available: nextAvailable } : item,
        ),
      );
      setActivities((current) => [
        {
          id: "balance_" + Date.now(),
          kind: direction === "deposit" ? "deposit" : "withdrawal",
          amount: value,
          currency: actionCurrency,
          detail:
            direction === "deposit" ? "Balance deposit" : "Balance withdrawal",
          createdAt: updatedAt,
          status: "completed",
        },
        ...current,
      ]);
      setAmount("");
    }
    setSaving(false);
  }

  const totalAvailable = balances.reduce(
    (sum, item) => sum + item.available,
    0,
  );
  const totalPending = balances.reduce((sum, item) => sum + item.pending, 0);
  const visibleActivities = activities.filter((activity) => activityCurrency === "all" || activity.currency === activityCurrency);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold">Balances and currencies</h1>
          <p className="mt-1 text-sm text-[#747674]">
            Manage money held in each currency.
          </p>
        </div>
        <form onSubmit={addCurrency} className="flex gap-2">
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="rounded-full border border-[#dfe2dd] bg-white px-4 py-3 text-sm font-semibold outline-none"
          >
            {currencies.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <button
            disabled={saving}
            type="submit"
            className="rounded-full bg-[#9fe870] px-5 py-3 text-sm font-semibold text-[#163300]"
          >
            Add currency
          </button>
        </form>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[22px] border border-[#e1e4df] bg-white p-5">
          <p className="text-sm text-[#747674]">Total available</p>
          <p className="mt-2 text-3xl font-bold">
            {totalAvailable.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="rounded-[22px] border border-[#e1e4df] bg-white p-5">
          <p className="text-sm text-[#747674]">Total pending</p>
          <p className="mt-2 text-3xl font-bold">
            {totalPending.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>
      {error && (
        <p className="mt-4 rounded-xl bg-[#fff1ef] px-4 py-3 text-sm text-[#b44336]">
          {error}
        </p>
      )}
      <div className="mt-7 grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[24px] border border-[#e1e4df] bg-white p-5">
          <h2 className="font-semibold">Currency accounts</h2>
          {loading ? (
            <p className="mt-5 text-sm text-[#747674]">Loading balances…</p>
          ) : balances.length === 0 ? (
            <p className="mt-5 text-sm text-[#747674]">
              No currency accounts yet. Add one above to get started.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-[#e8ebe6]">
              {balances.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setActionCurrency(item.currency)}
                  className={`flex w-full items-center justify-between py-4 text-left ${actionCurrency === item.currency ? "text-[#163300]" : ""}`}
                >
                  <span>
                    <strong>{item.currency}</strong>
                    <span className="mt-1 block text-xs text-[#747674]">
                      Available · {item.available.toFixed(2)} · Pending ·{" "}
                      {item.pending.toFixed(2)}
                    </span>
                  </span>
                  <span className="font-semibold">
                    {item.available.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-[24px] border border-[#e1e4df] bg-white p-5">
          <h2 className="font-semibold">Adjust balance</h2>
          <p className="mt-1 text-xs text-[#747674]">
            Use this for test deposits and withdrawals.
          </p>
          <select
            value={actionCurrency}
            onChange={(event) => setActionCurrency(event.target.value)}
            className="mt-5 w-full rounded-xl border border-[#dfe2dd] bg-white px-4 py-3 text-sm outline-none"
          >
            {currencies.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Amount"
            className="mt-3 w-full rounded-xl border border-[#dfe2dd] bg-white px-4 py-3 text-sm outline-none"
          />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <form onSubmit={(event) => void adjustBalance(event, "deposit")}>
              <button
                disabled={saving}
                type="submit"
                className="w-full rounded-full bg-[#9fe870] px-4 py-3 text-sm font-semibold text-[#163300]"
              >
                Deposit
              </button>
            </form>
            <form onSubmit={(event) => void adjustBalance(event, "withdraw")}>
              <button
                disabled={saving}
                type="submit"
                className="w-full rounded-full border border-[#163300] px-4 py-3 text-sm font-semibold text-[#163300]"
              >
                Withdraw
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="mt-5 rounded-[24px] border border-[#e1e4df] bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Recent balance activity</h2>
            <p className="mt-1 text-xs text-[#747674]">
              Deposits, withdrawals, and transfers for this account.
            </p>
          </div>
          <span className="text-xs text-[#747674]">
            {visibleActivities.length} items
          </span>
        </div>
        <select value={activityCurrency} onChange={(event) => setActivityCurrency(event.target.value)} className="mt-4 rounded-xl border border-[#dfe2dd] bg-white px-3 py-2 text-xs outline-none">
          <option value="all">All currencies</option>
          {balances.map((item) => <option key={item.currency} value={item.currency}>{item.currency}</option>)}
        </select>
        {visibleActivities.length === 0 ? (
          <p className="mt-5 text-sm text-[#747674]">
            No balance activity yet.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-[#eef0ed]">
            {visibleActivities.slice(0, 12).map((activity) => (
              <div
                key={activity.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{activity.detail}</p>
                  <p className="mt-1 text-xs capitalize text-[#747674]">
                    {activity.status || activity.kind} ·{" "}
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p
                  className={
                    "text-sm font-semibold " +
                    (activity.kind === "withdrawal"
                      ? "text-[#b64940]"
                      : "text-[#31551d]")
                  }
                >
                  {activity.kind === "withdrawal" ? "−" : "+"}
                  {activity.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {activity.currency}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type InvoiceRecord = {
  id: string;
  customer_name: string;
  customer_email: string | null;
  amount: number;
  currency: string;
  due_date: string | null;
  status: "draft" | "sent" | "paid" | "overdue";
  created_at: string;
};

function InvoicesSection() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customer: "",
    email: "",
    amount: "",
    currency: "USD",
    dueDate: "",
  });

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    client.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: rows, error: loadError } = await client
        .from("invoices")
        .select(
          "id, customer_name, customer_email, amount, currency, due_date, status, created_at",
        )
        .order("created_at", { ascending: false });
      if (loadError) setError(formatTransferError(loadError));
      if (rows) {
        setInvoices(
          rows.map((row) => ({
            ...row,
            amount: Number(row.amount),
            status: row.status as InvoiceRecord["status"],
          })),
        );
      }
    });
  }, []);

  async function saveInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.customer.trim() || !Number.isFinite(amount) || amount < 0) return;
    if (!supabase) return;
    setSaving(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId)
        throw new Error("Your session expired. Please sign in again.");
      const { data: row, error: saveError } = await supabase
        .from("invoices")
        .insert({
          user_id: userId,
          customer_name: form.customer.trim(),
          customer_email: form.email.trim() || null,
          amount,
          currency: form.currency,
          due_date: form.dueDate || null,
          status: "draft",
        })
        .select(
          "id, customer_name, customer_email, amount, currency, due_date, status, created_at",
        )
        .single();
      if (saveError) throw saveError;
      if (row) {
        setInvoices((current) => [
          {
            ...row,
            amount: Number(row.amount),
            status: row.status as InvoiceRecord["status"],
          },
          ...current,
        ]);
      }
      setForm({
        customer: "",
        email: "",
        amount: "",
        currency: "USD",
        dueDate: "",
      });
      setShowForm(false);
    } catch (saveError) {
      setError(formatTransferError(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function updateInvoice(id: string, status: InvoiceRecord["status"]) {
    if (!supabase) return;
    setError(null);
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (updateError) {
      setError(formatTransferError(updateError));
      return;
    }
    setInvoices((current) =>
      current.map((invoice) =>
        invoice.id === id ? { ...invoice, status } : invoice,
      ),
    );
  }

  async function deleteInvoice(id: string) {
    if (
      !supabase ||
      !window.confirm("Delete this invoice? This action cannot be undone.")
    )
      return;
    setError(null);
    const { error: deleteError } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id);
    if (deleteError) {
      setError(formatTransferError(deleteError));
      return;
    }
    setInvoices((current) => current.filter((invoice) => invoice.id !== id));
  }

  const filtered =
    statusFilter === "all"
      ? invoices
      : invoices.filter((invoice) => invoice.status === statusFilter);
  const counts = {
    all: invoices.length,
    draft: invoices.filter((invoice) => invoice.status === "draft").length,
    sent: invoices.filter((invoice) => invoice.status === "sent").length,
    paid: invoices.filter((invoice) => invoice.status === "paid").length,
    overdue: invoices.filter((invoice) => invoice.status === "overdue").length,
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold">Invoices</h1>
          <p className="mt-1 text-sm text-[#747674]">
            Create and track invoices for your customers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="rounded-full bg-[#9fe870] px-5 py-3 text-sm font-semibold text-[#163300]"
        >
          {showForm ? "Close form" : "New invoice"}
        </button>
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {(["all", "draft", "sent", "paid", "overdue"] as const).map(
          (status) => (
            <button
              type="button"
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-2xl border p-4 text-left transition ${statusFilter === status ? "border-[#9fe870] bg-[#eaf7e3]" : "border-[#e1e4df] bg-white"}`}
            >
              <p className="text-xs capitalize text-[#747674]">
                {status === "all" ? "Total" : status}
              </p>
              <p className="mt-2 text-2xl font-bold">{counts[status]}</p>
            </button>
          ),
        )}
      </div>
      {showForm && (
        <form
          onSubmit={saveInvoice}
          className="mt-6 grid gap-3 rounded-[24px] border border-[#e1e4df] bg-[#fafbfa] p-5 sm:grid-cols-2"
        >
          <input
            required
            placeholder="Customer name"
            value={form.customer}
            onChange={(event) =>
              setForm({ ...form, customer: event.target.value })
            }
            className="rounded-xl border border-[#dfe2dd] bg-white px-4 py-3 text-sm outline-none"
          />
          <input
            type="email"
            placeholder="Customer email (optional)"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
            className="rounded-xl border border-[#dfe2dd] bg-white px-4 py-3 text-sm outline-none"
          />
          <input
            required
            min="0"
            step="0.01"
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={(event) =>
              setForm({ ...form, amount: event.target.value })
            }
            className="rounded-xl border border-[#dfe2dd] bg-white px-4 py-3 text-sm outline-none"
          />
          <select
            value={form.currency}
            onChange={(event) =>
              setForm({ ...form, currency: event.target.value })
            }
            className="rounded-xl border border-[#dfe2dd] bg-white px-4 py-3 text-sm outline-none"
          >
            <option>USD</option>
            <option>EUR</option>
            <option>GBP</option>
            <option>INR</option>
          </select>
          <label className="text-sm text-[#747674] sm:col-span-2">
            Due date
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) =>
                setForm({ ...form, dueDate: event.target.value })
              }
              className="mt-2 block w-full rounded-xl border border-[#dfe2dd] bg-white px-4 py-3 text-sm text-[#0e0f0c] outline-none"
            />
          </label>
          <button
            disabled={saving}
            type="submit"
            className="rounded-full bg-[#163300] px-5 py-3 text-sm font-semibold text-white sm:col-span-2"
          >
            {saving ? "Saving…" : "Save invoice"}
          </button>
        </form>
      )}
      {error && (
        <p className="mt-4 rounded-xl bg-[#fff1ef] px-4 py-3 text-sm text-[#b44336]">
          {error}
        </p>
      )}
      <div className="mt-7 overflow-hidden rounded-[24px] border border-[#e1e4df] bg-white">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#747674]">
            No invoices in this view yet.
          </p>
        ) : (
          <div className="divide-y divide-[#e8ebe6]">
            {filtered.map((invoice) => (
              <div
                key={invoice.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedInvoice(invoice)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedInvoice(invoice);
                  }
                }}
                className="flex cursor-pointer flex-wrap items-center justify-between gap-4 p-5 transition hover:bg-[#fafbfa]"
              >
                <div>
                  <p className="font-semibold">{invoice.customer_name}</p>
                  <p className="mt-1 text-xs text-[#747674]">
                    {invoice.customer_email || "No email"}
                    {invoice.due_date ? ` · Due ${invoice.due_date}` : ""}
                  </p>
                </div>
                <p className="font-semibold">
                  {invoice.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {invoice.currency}
                </p>
                <span className="rounded-full bg-[#eef0ed] px-3 py-1 text-xs font-medium capitalize text-[#4c4e4c]">
                  {invoice.status}
                </span>
                <div className="flex gap-2">
                  {invoice.status !== "paid" && (
                    <button
                      type="button"
                      onClick={() => void updateInvoice(invoice.id, "paid")}
                      className="rounded-full bg-[#e4f7d7] px-3 py-2 text-xs font-semibold text-[#3f7a1d]"
                    >
                      Mark paid
                    </button>
                  )}
                  {invoice.status === "draft" && (
                    <button
                      type="button"
                      onClick={() => void updateInvoice(invoice.id, "sent")}
                      className="rounded-full border border-[#163300] px-3 py-2 text-xs font-semibold text-[#163300]"
                    >
                      Mark sent
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void deleteInvoice(invoice.id)}
                    className="rounded-full border border-[#c85b52] px-3 py-2 text-xs font-semibold text-[#b44336]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-[#163300]/20 p-5"
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-detail-title"
            className="w-full max-w-lg rounded-[26px] border border-[#e1e4df] bg-white p-6 shadow-[0_18px_60px_rgba(22,51,0,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#747674]">
                  Invoice detail
                </p>
                <h2
                  id="invoice-detail-title"
                  className="mt-2 text-2xl font-bold"
                >
                  {selectedInvoice.customer_name}
                </h2>
                <p className="mt-1 text-sm text-[#747674]">
                  {selectedInvoice.customer_email || "No customer email"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="rounded-full border border-[#dfe2dd] px-3 py-1 text-sm text-[#747674] hover:bg-[#f4f5f3]"
              >
                Close
              </button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#f5f8f3] p-4">
                <p className="text-xs text-[#747674]">Invoice total</p>
                <p className="mt-1 text-2xl font-bold">
                  {selectedInvoice.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {selectedInvoice.currency}
                </p>
              </div>
              <div className="rounded-2xl bg-[#f5f8f3] p-4">
                <p className="text-xs text-[#747674]">Status</p>
                <p className="mt-2 inline-flex rounded-full bg-[#e4f7d7] px-3 py-1 text-sm font-semibold capitalize text-[#3f7a1d]">
                  {selectedInvoice.status}
                </p>
              </div>
            </div>
            <div className="mt-5 divide-y divide-[#eef0ed] rounded-2xl border border-[#e7e9e5] px-4">
              <div className="flex justify-between py-3 text-sm">
                <span className="text-[#747674]">Due date</span>
                <span className="font-medium">
                  {selectedInvoice.due_date || "Not set"}
                </span>
              </div>
              <div className="flex justify-between py-3 text-sm">
                <span className="text-[#747674]">Created</span>
                <span className="font-medium">
                  {new Date(selectedInvoice.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RecipientsSection({
  onSend,
  onRecipientsChanged,
  wide = false,
}: {
  onSend: () => void;
  onRecipientsChanged?: () => void;
  wide?: boolean;
}) {
  type Recipient = {
    id: string;
    name: string;
    email: string | null;
    country: string | null;
    currency: string;
    account_identifier: string;
  };
  type BankAccount = {
    id: string;
    holder_name: string;
    bank_name: string;
    country: string;
    currency: string;
    account_identifier: string;
  };
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    country: "",
    currency: "EUR",
    account: "",
  });
  const [bankForm, setBankForm] = useState({
    holder: "",
    bank: "",
    country: "",
    currency: "USD",
    account: "",
  });
  const backendMode = Boolean(getBackendToken());
  useEffect(() => {
    if (backendMode) {
      void getBackendRecipients().then((rows) => {
        setRecipients(rows.map(mapBackendRecipientForSection));
      });
      return;
    }
    const client = supabase;
    if (!client) return;
    Promise.all([
      client
        .from("recipients")
        .select("id, name, email, country, currency, account_identifier")
        .order("created_at", { ascending: false }),
      client
        .from("bank_accounts")
        .select(
          "id, holder_name, bank_name, country, currency, account_identifier",
        )
        .order("created_at", { ascending: false }),
    ]).then(([recipientResult, accountResult]) => {
      if (recipientResult.data) setRecipients(recipientResult.data);
      if (accountResult.data) setAccounts(accountResult.data);
    });
  }, []);
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (backendMode) {
      if (!form.email.trim()) {
        setRecipientError("Enter the email address of an existing Cross Pay user.");
        return;
      }
      setSaving(true);
      try {
        const row = await createBackendRecipient(form.email.trim());
        setRecipients((current) => [mapBackendRecipientForSection(row), ...current.filter((item) => item.id !== row.recipientUserId)]);
        setRecipientError(null);
        setForm({ name: "", email: "", country: "", currency: "EUR", account: "" });
        setShowForm(false);
        onRecipientsChanged?.();
      } catch (error) {
        setRecipientError(formatTransferError(error));
      } finally {
        setSaving(false);
      }
      return;
    }
    if (!supabase || !form.name.trim() || !form.account.trim()) return;
    setSaving(true);
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user.id;
    if (!userId) {
      setSaving(false);
      return;
    }
    const recipientPayload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      country: form.country.trim() || null,
      currency: form.currency,
      account_identifier: form.account.trim(),
    };
    const query = editingId
      ? supabase
          .from("recipients")
          .update(recipientPayload)
          .eq("id", editingId)
          .eq("user_id", userId)
      : supabase
          .from("recipients")
          .insert({ user_id: userId, ...recipientPayload });
    const { data: row, error } = await query
      .select("id, name, email, country, currency, account_identifier")
      .single();
    if (error) {
      setRecipientError(formatTransferError(error));
      setSaving(false);
      return;
    }
    if (row) {
      setRecipients((current) =>
        editingId
          ? current.map((item) => (item.id === editingId ? row : item))
          : [row, ...current],
      );
    }
    setRecipientError(null);
    setEditingId(null);
    setForm({ name: "", email: "", country: "", currency: "EUR", account: "" });
    setShowForm(false);
    setSaving(false);
  }
  async function remove(id: string) {
    if (backendMode) {
      if (!window.confirm("Remove this recipient?")) return;
      try {
        await deleteBackendRecipient(id);
        setRecipients((current) => current.filter((item) => item.id !== id));
        onRecipientsChanged?.();
      } catch (error) {
        setRecipientError(formatTransferError(error));
      }
      return;
    }
    if (
      !supabase ||
      !window.confirm("Delete this recipient? This action cannot be undone.")
    )
      return;
    await supabase.from("recipients").delete().eq("id", id);
    setRecipients((current) => current.filter((item) => item.id !== id));
  }
  async function addBankAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !supabase ||
      !bankForm.holder.trim() ||
      !bankForm.bank.trim() ||
      !bankForm.country.trim() ||
      !bankForm.account.trim()
    ) {
      return;
    }
    setSavingAccount(true);
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user.id;
    if (!userId) {
      setSavingAccount(false);
      return;
    }
    const bankPayload = {
      holder_name: bankForm.holder.trim(),
      bank_name: bankForm.bank.trim(),
      country: bankForm.country.trim(),
      currency: bankForm.currency,
      account_identifier: bankForm.account.trim(),
    };
    const query = editingAccountId
      ? supabase
          .from("bank_accounts")
          .update(bankPayload)
          .eq("id", editingAccountId)
          .eq("user_id", userId)
      : supabase
          .from("bank_accounts")
          .insert({ user_id: userId, ...bankPayload });
    const { data: row } = await query
      .select(
        "id, holder_name, bank_name, country, currency, account_identifier",
      )
      .single();
    if (row) {
      setAccounts((current) =>
        editingAccountId
          ? current.map((item) => (item.id === editingAccountId ? row : item))
          : [row, ...current],
      );
    }
    setEditingAccountId(null);
    setBankForm({
      holder: "",
      bank: "",
      country: "",
      currency: "USD",
      account: "",
    });
    setShowBankForm(false);
    setSavingAccount(false);
  }
  async function removeBankAccount(id: string) {
    if (
      !supabase ||
      !window.confirm("Delete this bank account? This action cannot be undone.")
    )
      return;
    await supabase.from("bank_accounts").delete().eq("id", id);
    setAccounts((current) => current.filter((item) => item.id !== id));
  }
  const filtered = recipients.filter((item) =>
    `${item.name} ${item.email ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <div className={`mt-6 ${wide ? "max-w-none" : "max-w-[1040px]"}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-bold">Recipients</h1>
          <p className="mt-1 text-sm text-[#747674]">
            Manage the people and accounts you send money to.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowBankForm((value) => !value)}
            className="rounded-full bg-[#9fe870] px-5 py-3 text-sm font-semibold text-[#163300]"
          >
            {showBankForm ? "Close bank form" : "Add your bank account"}
          </button>
          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className="rounded-full border border-[#163300] px-5 py-3 text-sm font-semibold text-[#163300]"
          >
            Add a recipient
          </button>
        </div>
      </div>
      <div className="mt-8 flex max-w-md items-center rounded-full border border-[#cfd3cc] px-4 py-3">
        <span className="mr-3 text-[#747674]">⌕</span>
        <input
          aria-label="Search recipients"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
      {showForm && (
        <form
          onSubmit={add}
          className="mt-6 grid gap-3 rounded-[20px] border border-[#e3e6e1] bg-[#fafbfa] p-5 sm:grid-cols-2"
        >
          <input
            required={!backendMode}
            placeholder="Account holder name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="rounded-xl border border-[#dfe2dd] bg-white px-4 py-3 text-sm outline-none"
          />
          <input
            type="email"
            required={backendMode}
            placeholder={backendMode ? "Existing Cross Pay user email" : "Email (optional)"}
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
            className="rounded-xl border border-[#dfe2dd] bg-white px-4 py-3 text-sm outline-none"
          />
          <input
            placeholder="Country"
            value={form.country}
            onChange={(event) =>
              setForm({ ...form, country: event.target.value })
            }
            className="rounded-xl border border-[#dfe2dd] bg-white px-4 py-3 text-sm outline-none"
          />
          <select
            value={form.currency}
            onChange={(event) =>
              setForm({ ...form, currency: event.target.value })
            }
            className="rounded-xl border border-[#dfe2dd] bg-white px-4 py-3 text-sm outline-none"
          >
            <option>EUR</option>
            <option>GBP</option>
            <option>USD</option>
            <option>INR</option>
          </select>
          <input
            required={!backendMode}
            placeholder="IBAN / account number"
            value={form.account}
            onChange={(event) =>
              setForm({ ...form, account: event.target.value })
            }
            className="rounded-xl border border-[#dfe2dd] bg-white px-4 py-3 text-sm outline-none sm:col-span-2"
          />
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button
              disabled={saving}
              type="submit"
              className="rounded-full bg-[#163300] px-5 py-3 text-sm font-semibold text-white"
            >
              {saving
                ? "Saving…"
                : editingId
                  ? "Save recipient changes"
                  : "Save recipient"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setShowForm(false);
                  setForm({
                    name: "",
                    email: "",
                    country: "",
                    currency: "EUR",
                    account: "",
                  });
                }}
                className="rounded-full border border-[#dfe2dd] px-5 py-3 text-sm font-semibold text-[#536152]"
              >
                Cancel edit
              </button>
            )}
          </div>
          {recipientError && (
            <p className="rounded-xl bg-[#fff1ef] px-4 py-3 text-sm text-[#b44336] sm:col-span-2">
              {recipientError}
            </p>
          )}
          {backendMode && (
            <p className="text-xs text-[#747674] sm:col-span-2">
              The recipient must already have a Cross Pay account. Their internal account is used for transfers.
            </p>
          )}
        </form>
      )}
      {showBankForm && (
        <form
          onSubmit={addBankAccount}
          className="mt-6 grid gap-3 rounded-[20px] border border-[#e3e6e1] bg-[#fafbfa] p-5 sm:grid-cols-2"
        >
          <input
            required
            placeholder="Account holder name"
            value={bankForm.holder}
            onChange={(event) =>
              setBankForm({ ...bankForm, holder: event.target.value })
            }
            className="rounded-xl border border-[#dfe2dd] bg-white px-4 py-3 text-sm outline-none"
          />
          <input
            required
            placeholder="Bank name"
            value={bankForm.bank}
            onChange={(event) =>
              setBankForm({ ...bankForm, bank: event.target.value })
            }
            className="rounded-xl border border-[#dfe2dd] bg-white px-4 py-3 text-sm outline-none"
          />
          <input
            required
            placeholder="Country"
            value={bankForm.country}
            onChange={(event) =>
              setBankForm({ ...bankForm, country: event.target.value })
            }
            className="rounded-xl border border-[#dfe2dd] bg-white px-4 py-3 text-sm outline-none"
          />
          <select
            value={bankForm.currency}
            onChange={(event) =>
              setBankForm({ ...bankForm, currency: event.target.value })
            }
            className="rounded-xl border border-[#dfe2dd] bg-white px-4 py-3 text-sm outline-none"
          >
            <option>USD</option>
            <option>EUR</option>
            <option>GBP</option>
            <option>INR</option>
          </select>
          <input
            required
            placeholder="IBAN / account number"
            value={bankForm.account}
            onChange={(event) =>
              setBankForm({ ...bankForm, account: event.target.value })
            }
            className="rounded-xl border border-[#dfe2dd] bg-white px-4 py-3 text-sm outline-none sm:col-span-2"
          />
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button
              disabled={savingAccount}
              type="submit"
              className="rounded-full bg-[#163300] px-5 py-3 text-sm font-semibold text-white"
            >
              {savingAccount
                ? "Saving…"
                : editingAccountId
                  ? "Save account changes"
                  : "Save bank account"}
            </button>
            {editingAccountId && (
              <button
                type="button"
                onClick={() => {
                  setEditingAccountId(null);
                  setShowBankForm(false);
                  setBankForm({
                    holder: "",
                    bank: "",
                    country: "",
                    currency: "USD",
                    account: "",
                  });
                }}
                className="rounded-full border border-[#dfe2dd] px-5 py-3 text-sm font-semibold text-[#536152]"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      )}
      <div className="mt-10">
        <div className="flex items-center justify-between border-b border-[#e1e4df] pb-3">
          <h2 className="text-sm font-medium">Your accounts</h2>
          <button
            type="button"
            onClick={() => setShowBankForm(true)}
            className="font-semibold text-[#163300] underline"
          >
            Add
          </button>
        </div>
        {accounts.length === 0 ? (
          <button
            type="button"
            onClick={() => setShowBankForm(true)}
            className="flex w-full items-center gap-4 border-b border-[#e8ebe6] py-6 text-left"
          >
            <span className="grid size-14 place-items-center rounded-full bg-[#eef0ed] text-[#163300]">
              <Landmark aria-hidden="true" size={28} strokeWidth={1.8} />
            </span>
            <span>
              <strong>Add one of your bank accounts</strong>
              <span className="mt-1 block text-sm text-[#747674]">
                Connect an account for faster transfers
              </span>
            </span>
            <ChevronRight className="ml-auto text-[#163300]" size={20} />
          </button>
        ) : (
          <div className="divide-y divide-[#e8ebe6]">
            {accounts.map((account) => (
              <div key={account.id} className="py-5">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedAccount((value) =>
                      value === account.id ? null : account.id,
                    )
                  }
                  className="flex w-full items-center gap-4 text-left"
                >
                  <span className="grid size-14 place-items-center rounded-full bg-[#eef0ed] text-lg font-bold text-[#163300]">
                    <Landmark aria-hidden="true" size={27} strokeWidth={1.8} />
                  </span>
                  <span>
                    <strong>{account.bank_name}</strong>
                    <span className="mt-1 block text-sm text-[#747674]">
                      {account.currency} account ending in{" "}
                      {account.account_identifier.slice(-4)}
                    </span>
                  </span>
                  <ChevronDown
                    className={`ml-auto transition-transform ${expandedAccount === account.id ? "rotate-180" : ""}`}
                    size={20}
                  />
                </button>
                {expandedAccount === account.id && (
                  <div className="mt-5 grid gap-4 rounded-2xl bg-[#fafbfa] p-5 text-sm sm:grid-cols-2">
                    <p>
                      <span className="text-[#747674]">Account holder</span>
                      <br />
                      <strong>{account.holder_name}</strong>
                    </p>
                    <p>
                      <span className="text-[#747674]">Country</span>
                      <br />
                      <strong>{account.country}</strong>
                    </p>
                    <p>
                      <span className="text-[#747674]">Account identifier</span>
                      <br />
                      <strong>{account.account_identifier}</strong>
                    </p>
                    <div className="flex flex-wrap gap-2 self-end justify-self-start sm:justify-self-end">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAccountId(account.id);
                          setBankForm({
                            holder: account.holder_name,
                            bank: account.bank_name,
                            country: account.country,
                            currency: account.currency,
                            account: account.account_identifier,
                          });
                          setShowBankForm(true);
                        }}
                        className="rounded-full border border-[#7b8f70] px-4 py-2 font-semibold text-[#31551d]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBankAccount(account.id)}
                        className="rounded-full border border-[#c65345] px-4 py-2 font-semibold text-[#b44336]"
                      >
                        Delete account
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-10">
        <div className="flex items-center justify-between border-b border-[#e1e4df] pb-3">
          <h2 className="text-sm font-medium">Your recipients</h2>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="font-semibold text-[#163300] underline"
          >
            Add
          </button>
        </div>
        <div className="divide-y divide-[#e8ebe6]">
          {filtered.map((item) => (
            <div key={item.id} className="py-5">
              <button
                type="button"
                onClick={() =>
                  setExpanded((value) => (value === item.id ? null : item.id))
                }
                className="flex w-full items-center gap-4 text-left"
              >
                <span className="grid size-14 place-items-center rounded-full bg-[#eef0ed] font-bold">
                  {item.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <span>
                  <strong>{item.name}</strong>
                  <br />
                  <span className="text-sm text-[#747674]">
                    {item.currency} account ending in{" "}
                    {item.account_identifier.slice(-4)}
                  </span>
                </span>
                <ChevronDown
                  className={`ml-auto transition-transform ${expanded === item.id ? "rotate-180" : ""}`}
                  size={20}
                />
              </button>
              {expanded === item.id && (
                <div className="mt-5 grid gap-4 rounded-2xl bg-[#fafbfa] p-5 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-[#747674]">Account holder name</span>
                    <br />
                    <strong>{item.name}</strong>
                  </p>
                  <p>
                    <span className="text-[#747674]">Summary</span>
                    <br />
                    <strong>
                      {item.currency} account ending in{" "}
                      {item.account_identifier.slice(-4)}
                    </strong>
                  </p>
                  <p>
                    <span className="text-[#747674]">Country</span>
                    <br />
                    <strong>{item.country || "Not provided"}</strong>
                  </p>
                  <p>
                    <span className="text-[#747674]">Email</span>
                    <br />
                    <strong>{item.email || "Not provided"}</strong>
                  </p>
                  <div className="flex gap-3 sm:col-span-2">
                    <button
                      type="button"
                      onClick={onSend}
                      className="rounded-full border border-[#163300] px-5 py-2 font-semibold text-[#163300]"
                    >
                      Send money
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item.id);
                        setForm({
                          name: item.name,
                          email: item.email || "",
                          country: item.country || "",
                          currency: item.currency,
                          account: item.account_identifier,
                        });
                        setShowForm(true);
                      }}
                      className="rounded-full border border-[#7b8f70] px-5 py-2 font-semibold text-[#31551d]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      className="ml-auto rounded-full border border-[#c85b52] px-5 py-2 font-semibold text-[#b64940]"
                    >
                      Delete recipient
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-[#747674]">
              No recipients yet. Add your first recipient above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTransferError(error: unknown) {
  if (error && typeof error === "object") {
    const details = error as {
      code?: string;
      message?: string;
      details?: string;
    };
    if (details.code === "42P01")
      return "Transfers table is missing. Run the core finance migration in Supabase.";
    if (details.code === "42501")
      return "Supabase denied this transfer. Check the transfers table RLS insert policy.";
    if (details.message) return details.message;
    if (details.details) return details.details;
  }
  if (error instanceof Error) return error.message;
  return "Unable to save this transfer. Check your Supabase connection and try again.";
}

function mapBackendTransaction(transaction: BackendTransaction): DashboardTransfer {
  const shortRecipientId = transaction.recipientUserId?.slice(0, 8);
  return {
    id: transaction.transactionId,
    amount: Number(transaction.sourceAmount ?? transaction.amount ?? 0),
    targetAmount: Number(transaction.destinationAmount ?? transaction.amount ?? 0),
    status: transaction.status.toLowerCase(),
    recipientId: transaction.recipientUserId,
    recipientLabel: shortRecipientId ? `Recipient ${shortRecipientId}` : "Recipient",
    createdAt: transaction.completedAt ?? transaction.createdAt ?? undefined,
    sourceCurrency: transaction.sourceCurrency ?? undefined,
    targetCurrency: transaction.destinationCurrency ?? undefined,
    quoteId: transaction.fxQuoteId ?? undefined,
  };
}

function mapBackendRecipient(recipient: BackendRecipient): DashboardRecipient {
  return {
    id: recipient.recipientUserId,
    name: recipient.name,
    currency: "Internal",
    account_identifier: recipient.recipientUserId,
  };
}

function mapBackendRecipientForSection(recipient: BackendRecipient) {
  return {
    id: recipient.recipientUserId,
    name: recipient.name,
    email: recipient.email,
    country: recipient.country,
    currency: "Internal",
    account_identifier: recipient.recipientUserId,
  };
}

function formatTransferDate(value?: string) {
  if (!value) return "Date unavailable";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
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
function RateChart({
  currentRate,
  baselineRate,
}: {
  currentRate?: number;
  baselineRate?: number;
}) {
  const ratio =
    currentRate && baselineRate && baselineRate > 0
      ? currentRate / baselineRate
      : 1;
  const currentY = Math.max(16, Math.min(238, 50 - (ratio - 1) * 1000));
  const chartPath = `M0 54L18 38L34 113L52 82L70 77L88 60L106 60L124 105L142 135L160 220L178 194L196 233L214 233L232 238L250 218L268 132L286 98L304 66L322 68L340 70L358 78L376 70L394 17L412 3L430 50L448 22L466 24L484 38L500 ${currentY}`;
  return (
    <svg
      className="mt-7 h-[220px] w-full"
      viewBox="0 0 500 260"
      role="img"
      aria-label="Exchange rate chart"
    >
      <path d={chartPath} fill="none" stroke="#163300" strokeWidth="3" />
      <path
        d="M0 16H500M0 132H500M0 238H500"
        stroke="#d6d9d4"
        strokeDasharray="5 5"
      />
      <circle
        cx="500"
        cy={currentY}
        r="7"
        fill="#163300"
        stroke="#fff"
        strokeWidth="4"
        className="animate-pulse"
      />
    </svg>
  );
}
