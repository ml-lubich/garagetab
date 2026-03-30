"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, LoadingSpinner, StatusBadge } from "@/components/ui";
import { FileText, CheckCircle, XCircle } from "lucide-react";
import { formatCurrency, formatDate, vehicleLabel } from "@/lib/utils";

interface LineItem {
  id: string;
  type: string;
  description: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

interface InvoiceData {
  id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  payment_method: string | null;
  created_at: string;
  repair_orders: {
    id: string;
    subtotal: number;
    tax: number;
    total: number;
    tax_rate: number;
    customers: { name: string } | null;
    vehicles: { year: number | null; make: string; model: string } | null;
    shops: { name: string; phone: string | null; address: string | null; email: string | null } | null;
  } | null;
}

export default function PublicInvoicePage() {
  const { token } = useParams<{ token: string }>();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadInvoice() {
    const supabase = createClient();

    const { data: inv } = await supabase
      .from("invoices")
      .select("*, repair_orders(id, subtotal, tax, total, tax_rate, customers(name), vehicles(year, make, model), shops(name, phone, address, email))")
      .eq("share_token", token)
      .single();

    if (inv) {
      setInvoice(inv as unknown as InvoiceData);

      if (inv.repair_orders) {
        const { data: items } = await supabase
          .from("ro_line_items")
          .select("*")
          .eq("repair_order_id", (inv.repair_orders as { id: string }).id)
          .order("sort_order");
        setLineItems((items ?? []) as LineItem[]);
      }
    }
    setLoading(false);
  }

  if (loading) return <LoadingSpinner />;

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <XCircle size={48} className="mx-auto text-danger mb-4" />
          <h1 className="text-xl font-bold mb-2">Invoice Not Found</h1>
          <p className="text-sm text-muted-foreground">This link may have expired or is invalid.</p>
        </Card>
      </div>
    );
  }

  const ro = invoice.repair_orders;
  const shop = ro?.shops;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto pt-8">
        {/* Shop Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-primary">{shop?.name ?? "Auto Shop"}</h1>
          {shop?.address && <p className="text-sm text-muted-foreground">{shop.address}</p>}
          {shop?.phone && <p className="text-sm text-muted-foreground">{shop.phone}</p>}
        </div>

        <Card className="p-6 mb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText size={20} /> Invoice
              </h2>
              <p className="text-sm text-muted-foreground">{formatDate(invoice.created_at)}</p>
            </div>
            <StatusBadge status={invoice.status} />
          </div>

          <div className="mb-6 text-sm">
            <p><span className="text-muted-foreground">Customer:</span> {ro?.customers?.name}</p>
            <p><span className="text-muted-foreground">Vehicle:</span> {ro?.vehicles ? vehicleLabel(ro.vehicles) : "—"}</p>
          </div>

          {/* Line Items */}
          <div className="space-y-3 mb-6">
            {lineItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium">{item.description}</p>
                  <p className="text-xs text-muted-foreground capitalize">{item.type} · Qty: {item.quantity}</p>
                </div>
                <span className="font-medium">{formatCurrency(Number(item.total))}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-border pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(Number(ro?.subtotal ?? 0))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(Number(ro?.tax ?? 0))}</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
              <span>Total Due</span>
              <span>{formatCurrency(Number(invoice.amount))}</span>
            </div>
          </div>

          {invoice.status === "paid" && (
            <div className="mt-6 p-4 bg-success/10 rounded-lg text-center">
              <CheckCircle size={24} className="mx-auto text-success mb-2" />
              <p className="font-semibold text-success">Paid</p>
              {invoice.paid_at && (
                <p className="text-xs text-muted-foreground">
                  {formatDate(invoice.paid_at)} via {invoice.payment_method}
                </p>
              )}
            </div>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Powered by <span className="text-primary font-medium">GarageTab</span>
        </p>
      </div>
    </div>
  );
}
