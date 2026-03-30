"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, LoadingSpinner } from "@/components/ui";
import { CheckCircle, XCircle, Wrench } from "lucide-react";
import { formatCurrency, vehicleLabel } from "@/lib/utils";

interface LineItem {
  id: string;
  type: string;
  description: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

interface ROData {
  id: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  tax_rate: number;
  notes: string | null;
  customers: { name: string } | null;
  vehicles: { year: number | null; make: string; model: string; mileage: number | null } | null;
  shops: { name: string; phone: string | null; address: string | null } | null;
}

export default function ApprovePage() {
  const { token } = useParams<{ token: string }>();
  const [ro, setRo] = useState<ROData | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [response, setResponse] = useState<"approved" | "declined" | null>(null);

  useEffect(() => {
    loadEstimate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadEstimate() {
    const supabase = createClient();

    const { data: roData } = await supabase
      .from("repair_orders")
      .select("*, customers(name), vehicles(year, make, model, mileage), shops(name, phone, address)")
      .eq("approval_token", token)
      .single();

    if (roData) {
      setRo(roData as unknown as ROData);

      if (roData.status === "approved" || roData.status === "in_progress" || roData.status === "complete" || roData.status === "invoiced" || roData.status === "paid") {
        setResponse("approved");
      }

      const { data: items } = await supabase
        .from("ro_line_items")
        .select("*")
        .eq("repair_order_id", roData.id)
        .order("sort_order");

      setLineItems((items ?? []) as LineItem[]);
    }
    setLoading(false);
  }

  async function handleResponse(approved: boolean) {
    if (!ro) return;
    setResponding(true);

    const supabase = createClient();
    if (approved) {
      await supabase
        .from("repair_orders")
        .update({ status: "approved" })
        .eq("id", ro.id);
      setResponse("approved");
    } else {
      setResponse("declined");
    }
    setResponding(false);
  }

  if (loading) return <LoadingSpinner />;

  if (!ro) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <XCircle size={48} className="mx-auto text-danger mb-4" />
          <h1 className="text-xl font-bold mb-2">Estimate Not Found</h1>
          <p className="text-sm text-muted-foreground">
            This link may have expired or is invalid.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">
        {/* Shop Header */}
        <div className="text-center mb-6 pt-8">
          <h1 className="text-xl font-bold text-primary">
            {ro.shops?.name ?? "Auto Shop"}
          </h1>
          {ro.shops?.phone && (
            <p className="text-sm text-muted-foreground">{ro.shops.phone}</p>
          )}
        </div>

        <Card className="p-6 mb-4">
          <div className="text-center mb-6">
            <Wrench size={32} className="mx-auto text-primary mb-2" />
            <h2 className="text-lg font-semibold">Repair Estimate</h2>
            <p className="text-sm text-muted-foreground">
              {ro.customers?.name} · {ro.vehicles ? vehicleLabel(ro.vehicles) : ""}
            </p>
          </div>

          {/* Line Items */}
          <div className="space-y-3 mb-6">
            {lineItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium">{item.description}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {item.type} · Qty: {item.quantity}
                  </p>
                </div>
                <span className="font-medium">{formatCurrency(Number(item.total))}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-border pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(Number(ro.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(Number(ro.tax))}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
              <span>Total</span>
              <span>{formatCurrency(Number(ro.total))}</span>
            </div>
          </div>
        </Card>

        {/* Response */}
        {response === "approved" ? (
          <Card className="p-6 text-center">
            <CheckCircle size={48} className="mx-auto text-success mb-3" />
            <h3 className="text-lg font-semibold text-success">Approved</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Thank you! The shop has been notified and will begin work.
            </p>
          </Card>
        ) : response === "declined" ? (
          <Card className="p-6 text-center">
            <XCircle size={48} className="mx-auto text-danger mb-3" />
            <h3 className="text-lg font-semibold text-danger">Declined</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Please contact the shop if you have questions.
            </p>
          </Card>
        ) : (
          <div className="flex gap-3">
            <Button
              className="flex-1"
              size="lg"
              onClick={() => handleResponse(true)}
              loading={responding}
            >
              <CheckCircle size={18} className="mr-2" />
              Approve
            </Button>
            <Button
              className="flex-1"
              size="lg"
              variant="danger"
              onClick={() => handleResponse(false)}
              loading={responding}
            >
              <XCircle size={18} className="mr-2" />
              Decline
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
