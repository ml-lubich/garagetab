"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Button, Input, Select, Card, Textarea, StatusBadge,
  LoadingSpinner, EmptyState,
} from "@/components/ui";
import {
  ArrowLeft, Plus, Trash2, Camera, FileText, Send, Copy,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, vehicleLabel } from "@/lib/utils";
import type { ROStatus, LineItemType } from "@/lib/types/database";

interface LineItem {
  id: string;
  type: LineItemType;
  description: string;
  quantity: number;
  unit_cost: number;
  markup_pct: number;
  total: number;
  sort_order: number;
}

interface RO {
  id: string;
  status: ROStatus;
  notes: string | null;
  tax_rate: number;
  subtotal: number;
  tax: number;
  total: number;
  approval_token: string | null;
  created_at: string;
  customers: { id: string; name: string; phone: string | null; email: string | null } | null;
  vehicles: { id: string; year: number | null; make: string; model: string; mileage: number | null } | null;
}

const STATUS_FLOW: ROStatus[] = [
  "draft", "estimate_sent", "approved", "in_progress", "complete", "invoiced", "paid",
];

export default function RepairOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [ro, setRo] = useState<RO | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);

  // New line item form
  const [showNewItem, setShowNewItem] = useState(false);
  const [itemType, setItemType] = useState<LineItemType>("labor");
  const [itemDesc, setItemDesc] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemCost, setItemCost] = useState("");
  const [itemMarkup, setItemMarkup] = useState("0");

  const loadData = useCallback(async () => {
    const [{ data: roData }, { data: items }] = await Promise.all([
      supabase
        .from("repair_orders")
        .select("*, customers(id, name, phone, email), vehicles(id, year, make, model, mileage)")
        .eq("id", id)
        .single(),
      supabase
        .from("ro_line_items")
        .select("*")
        .eq("repair_order_id", id)
        .order("sort_order"),
    ]);

    if (roData) {
      setRo(roData as unknown as RO);
      setNotes(roData.notes ?? "");
    }
    setLineItems((items ?? []) as LineItem[]);
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function addLineItem(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const qty = parseFloat(itemQty) || 1;
    const cost = parseFloat(itemCost) || 0;
    const markup = parseFloat(itemMarkup) || 0;
    const total = qty * cost * (1 + markup / 100);

    await supabase.from("ro_line_items").insert({
      repair_order_id: id,
      type: itemType,
      description: itemDesc,
      quantity: qty,
      unit_cost: cost,
      markup_pct: markup,
      total: Math.round(total * 100) / 100,
      sort_order: lineItems.length,
    });

    setItemDesc("");
    setItemQty("1");
    setItemCost("");
    setItemMarkup("0");
    setShowNewItem(false);
    setSaving(false);
    await loadData();
  }

  async function deleteLineItem(itemId: string) {
    await supabase.from("ro_line_items").delete().eq("id", itemId);
    await loadData();
  }

  async function updateStatus(newStatus: ROStatus) {
    await supabase.from("repair_orders").update({ status: newStatus }).eq("id", id);

    if (newStatus === "invoiced" && ro) {
      const { data: profile } = await supabase.auth.getUser();
      if (profile.user) {
        const { data: userProfile } = await supabase.from("users").select("shop_id").eq("id", profile.user.id).single();
        if (userProfile) {
          await supabase.from("invoices").insert({
            repair_order_id: id,
            shop_id: userProfile.shop_id,
            amount: ro.total,
            status: "sent",
          });
        }
      }
    }
    await loadData();
  }

  async function saveNotes() {
    setSaving(true);
    await supabase.from("repair_orders").update({ notes: notes || null }).eq("id", id);
    setSaving(false);
  }

  async function deleteRO() {
    if (!confirm("Delete this repair order? This cannot be undone.")) return;
    await supabase.from("repair_orders").delete().eq("id", id);
    router.push("/repair-orders");
  }

  function copyApprovalLink() {
    if (!ro?.approval_token) return;
    const url = `${window.location.origin}/approve/${ro.approval_token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <LoadingSpinner />;
  if (!ro) return <EmptyState title="Repair order not found" />;

  const currentIdx = STATUS_FLOW.indexOf(ro.status);
  const nextStatus = currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null;

  return (
    <div>
      <Link href="/repair-orders" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6">
        <ArrowLeft size={14} /> Back to repair orders
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {ro.customers?.name ?? "Unknown"}
            </h1>
            <StatusBadge status={ro.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {ro.vehicles ? vehicleLabel(ro.vehicles) : "No vehicle"}
            {ro.vehicles?.mileage ? ` · ${ro.vehicles.mileage.toLocaleString()} mi` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {nextStatus && (
            <Button size="sm" onClick={() => updateStatus(nextStatus)}>
              Mark {nextStatus.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </Button>
          )}
          <Link href={`/repair-orders/${id}/inspect`}>
            <Button size="sm" variant="secondary">
              <Camera size={14} className="mr-1" /> Inspect
            </Button>
          </Link>
          <Button size="sm" variant="secondary" onClick={copyApprovalLink}>
            <Copy size={14} className="mr-1" /> {copied ? "Copied!" : "Approval Link"}
          </Button>
          <Button size="sm" variant="danger" onClick={deleteRO}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Line Items */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Line Items</h2>
          <Button size="sm" variant="secondary" onClick={() => setShowNewItem(!showNewItem)}>
            <Plus size={14} className="mr-1" /> Add Item
          </Button>
        </div>

        {showNewItem && (
          <form onSubmit={addLineItem} className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4 p-4 bg-background rounded-lg">
            <Select value={itemType} onChange={(e) => setItemType(e.target.value as LineItemType)}>
              <option value="labor">Labor</option>
              <option value="part">Part</option>
              <option value="other">Other</option>
            </Select>
            <Input
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              placeholder="Description *"
              required
              className="md:col-span-2"
            />
            <Input
              value={itemQty}
              onChange={(e) => setItemQty(e.target.value)}
              placeholder="Qty"
              type="number"
              step="0.5"
              min="0"
            />
            <Input
              value={itemCost}
              onChange={(e) => setItemCost(e.target.value)}
              placeholder="Unit Cost"
              type="number"
              step="0.01"
              min="0"
              required
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={saving}>Add</Button>
              <button type="button" onClick={() => setShowNewItem(false)} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
          </form>
        )}

        {lineItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium text-right">Qty</th>
                  <th className="pb-2 font-medium text-right">Unit Cost</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                  <th className="pb-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="py-3 capitalize">{item.type}</td>
                    <td className="py-3">{item.description}</td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-right">{formatCurrency(Number(item.unit_cost))}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(Number(item.total))}</td>
                    <td className="py-3">
                      <button
                        onClick={() => deleteLineItem(item.id)}
                        className="text-muted hover:text-danger transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(Number(ro.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax ({(Number(ro.tax_rate) * 100).toFixed(1)}%)</span>
                <span>{formatCurrency(Number(ro.tax))}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span>{formatCurrency(Number(ro.total))}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            No line items yet. Add labor, parts, or other charges.
          </p>
        )}
      </Card>

      {/* Notes */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Notes</h2>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal notes about this repair order..."
          rows={4}
        />
        <div className="mt-3">
          <Button size="sm" variant="secondary" onClick={saveNotes} loading={saving}>
            Save Notes
          </Button>
        </div>
      </Card>

      {/* Customer Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Customer Info</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Name:</span>{" "}
            <Link href={`/customers/${ro.customers?.id}`} className="text-primary hover:underline">
              {ro.customers?.name}
            </Link>
          </div>
          <div><span className="text-muted-foreground">Phone:</span> {ro.customers?.phone || "—"}</div>
          <div><span className="text-muted-foreground">Email:</span> {ro.customers?.email || "—"}</div>
        </div>
      </Card>
    </div>
  );
}
