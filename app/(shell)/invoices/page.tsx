"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, EmptyState, LoadingSpinner, StatusBadge, Button, Select } from "@/components/ui";
import { FileText, Copy } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Invoice {
  id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  paid_at: string | null;
  share_token: string | null;
  created_at: string;
  repair_orders: {
    id: string;
    customers: { name: string } | null;
    vehicles: { year: number | null; make: string; model: string } | null;
  } | null;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("users").select("shop_id").eq("id", user.id).single();
    if (!profile) return;

    const { data } = await supabase
      .from("invoices")
      .select("*, repair_orders(id, customers(name), vehicles(year, make, model))")
      .eq("shop_id", profile.shop_id)
      .order("created_at", { ascending: false });

    setInvoices((data ?? []) as unknown as Invoice[]);
    setLoading(false);
  }

  async function markPaid(invoiceId: string, method: string) {
    const supabase = createClient();
    await supabase.from("invoices").update({
      status: "paid",
      payment_method: method,
      paid_at: new Date().toISOString(),
    }).eq("id", invoiceId);

    // Also update RO status
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (invoice?.repair_orders?.id) {
      await supabase.from("repair_orders").update({ status: "paid" }).eq("id", invoice.repair_orders.id);
    }

    await loadInvoices();
  }

  function copyInvoiceLink(token: string | null, id: string) {
    if (!token) return;
    navigator.clipboard.writeText(`${window.location.origin}/invoice/${token}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filtered = filter === "all" ? invoices : invoices.filter((i) => i.status === filter);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-40">
          <option value="all">All</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </Select>
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((inv) => (
            <Card key={inv.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {inv.repair_orders?.customers?.name ?? "Unknown"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(inv.created_at)} · {formatCurrency(Number(inv.amount))}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={inv.status} />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyInvoiceLink(inv.share_token, inv.id)}
                    >
                      <Copy size={14} />
                      {copiedId === inv.id ? " Copied!" : ""}
                    </Button>
                    {inv.status !== "paid" && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => markPaid(inv.id, "cash")}>
                          Cash
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => markPaid(inv.id, "check")}>
                          Check
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => markPaid(inv.id, "card")}>
                          Card
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {inv.paid_at && (
                <p className="text-xs text-success mt-2">
                  Paid {formatDate(inv.paid_at)} via {inv.payment_method}
                </p>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FileText size={32} />}
          title="No invoices yet"
          description="Invoices are created when you mark a repair order as Invoiced."
        />
      )}
    </div>
  );
}
