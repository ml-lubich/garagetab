import { getShopUser } from "@/lib/auth";
import { Card, StatCard, StatusBadge, EmptyState } from "@/components/ui";
import { formatCurrency, formatDate, vehicleLabel } from "@/lib/utils";
import { Wrench, DollarSign, FileText, Clock, Plus } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const { supabase, shopId, profile } = await getShopUser();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Fetch data in parallel
  const [
    { data: activeROs },
    { data: todayROs },
    { data: recentROs },
    { data: paidToday },
    { data: paidWeek },
    { data: paidMonth },
    { data: outstandingInvoices },
  ] = await Promise.all([
    supabase
      .from("repair_orders")
      .select("id")
      .eq("shop_id", shopId)
      .in("status", ["approved", "in_progress"])
      .then((r) => r),
    supabase
      .from("repair_orders")
      .select("id")
      .eq("shop_id", shopId)
      .gte("created_at", today.toISOString())
      .then((r) => r),
    supabase
      .from("repair_orders")
      .select("*, customers(name), vehicles(year, make, model)")
      .eq("shop_id", shopId)
      .order("updated_at", { ascending: false })
      .limit(10)
      .then((r) => r),
    supabase
      .from("invoices")
      .select("amount")
      .eq("shop_id", shopId)
      .eq("status", "paid")
      .gte("paid_at", today.toISOString())
      .then((r) => r),
    supabase
      .from("invoices")
      .select("amount")
      .eq("shop_id", shopId)
      .eq("status", "paid")
      .gte("paid_at", weekAgo.toISOString())
      .then((r) => r),
    supabase
      .from("invoices")
      .select("amount")
      .eq("shop_id", shopId)
      .eq("status", "paid")
      .gte("paid_at", monthStart.toISOString())
      .then((r) => r),
    supabase
      .from("invoices")
      .select("amount")
      .eq("shop_id", shopId)
      .in("status", ["sent", "overdue"])
      .then((r) => r),
  ]);

  const sumAmounts = (items: { amount: number }[] | null) =>
    items?.reduce((sum, i) => sum + Number(i.amount), 0) ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {profile.name}
          </p>
        </div>
        <Link
          href="/repair-orders/new"
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
        >
          <Plus size={16} /> New RO
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Jobs"
          value={activeROs?.length ?? 0}
          icon={<Wrench size={20} />}
        />
        <StatCard
          label="Today's Revenue"
          value={formatCurrency(sumAmounts(paidToday))}
          icon={<DollarSign size={20} />}
        />
        <StatCard
          label="This Week"
          value={formatCurrency(sumAmounts(paidWeek))}
          icon={<Clock size={20} />}
        />
        <StatCard
          label="This Month"
          value={formatCurrency(sumAmounts(paidMonth))}
          icon={<DollarSign size={20} />}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Repair Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Repair Orders</h2>
            <Link
              href="/repair-orders"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          {recentROs && recentROs.length > 0 ? (
            <div className="space-y-3">
              {recentROs.map((ro) => {
                const customer = ro.customers as { name: string } | null;
                const vehicle = ro.vehicles as {
                  year: number | null;
                  make: string;
                  model: string;
                } | null;
                return (
                  <Link
                    key={ro.id}
                    href={`/repair-orders/${ro.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-card-hover transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {customer?.name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {vehicle ? vehicleLabel(vehicle) : "No vehicle"}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={ro.status} />
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(Number(ro.total))}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Wrench size={32} />}
              title="No repair orders yet"
              description="Create your first repair order to get started."
              action={
                <Link
                  href="/repair-orders/new"
                  className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Create First RO
                </Link>
              }
            />
          )}
        </Card>

        {/* Outstanding Invoices */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Outstanding</h2>
            <Link
              href="/invoices"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="flex items-center gap-4 p-4 bg-background rounded-lg">
            <FileText size={24} className="text-warning" />
            <div>
              <p className="text-2xl font-bold">
                {formatCurrency(sumAmounts(outstandingInvoices))}
              </p>
              <p className="text-xs text-muted-foreground">
                {outstandingInvoices?.length ?? 0} unpaid invoice
                {(outstandingInvoices?.length ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Today's new ROs */}
          <div className="mt-4 flex items-center gap-4 p-4 bg-background rounded-lg">
            <Wrench size={24} className="text-primary" />
            <div>
              <p className="text-2xl font-bold">{todayROs?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">
                Repair orders created today
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
