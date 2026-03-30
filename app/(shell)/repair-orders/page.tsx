"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, EmptyState, LoadingSpinner, StatusBadge, Input, Select } from "@/components/ui";
import { Wrench, Plus, Search } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, vehicleLabel } from "@/lib/utils";
import type { ROStatus } from "@/lib/types/database";

interface RORow {
  id: string;
  status: ROStatus;
  total: number;
  created_at: string;
  updated_at: string;
  customers: { name: string } | null;
  vehicles: { year: number | null; make: string; model: string } | null;
}

export default function RepairOrdersPage() {
  const [ros, setRos] = useState<RORow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadROs();
  }, []);

  async function loadROs() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("users").select("shop_id").eq("id", user.id).single();
    if (!profile) return;

    const { data } = await supabase
      .from("repair_orders")
      .select("*, customers(name), vehicles(year, make, model)")
      .eq("shop_id", profile.shop_id)
      .order("updated_at", { ascending: false });

    setRos((data ?? []) as unknown as RORow[]);
    setLoading(false);
  }

  const filtered = ros.filter((ro) => {
    const matchesSearch =
      !search ||
      (ro.customers?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (ro.vehicles ? vehicleLabel(ro.vehicles) : "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || ro.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Repair Orders</h1>
        <Link
          href="/repair-orders/new"
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
        >
          <Plus size={16} /> New RO
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer or vehicle..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-48">
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="estimate_sent">Estimate Sent</option>
          <option value="approved">Approved</option>
          <option value="in_progress">In Progress</option>
          <option value="complete">Complete</option>
          <option value="invoiced">Invoiced</option>
          <option value="paid">Paid</option>
        </Select>
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((ro) => (
            <Link key={ro.id} href={`/repair-orders/${ro.id}`}>
              <Card className="p-4 hover:bg-card-hover transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{ro.customers?.name ?? "Unknown Customer"}</p>
                    <p className="text-sm text-muted-foreground">
                      {ro.vehicles ? vehicleLabel(ro.vehicles) : "No vehicle"} · {formatDate(ro.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={ro.status} />
                    <p className="text-sm font-medium mt-1">{formatCurrency(Number(ro.total))}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Wrench size={32} />}
          title={search || statusFilter !== "all" ? "No matching repair orders" : "No repair orders yet"}
          description="Create your first repair order to get started."
          action={
            <Link
              href="/repair-orders/new"
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
            >
              <Plus size={16} /> Create First RO
            </Link>
          }
        />
      )}
    </div>
  );
}
