"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Textarea, Card, EmptyState, LoadingSpinner, StatusBadge } from "@/components/ui";
import { ArrowLeft, Car, Wrench, Plus, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, vehicleLabel } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
}

interface Vehicle {
  id: string;
  year: number | null;
  make: string;
  model: string;
  vin: string | null;
  license_plate: string | null;
  mileage: number | null;
  color: string | null;
}

interface RO {
  id: string;
  status: string;
  total: number;
  created_at: string;
  vehicles: { year: number | null; make: string; model: string } | null;
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [ros, setRos] = useState<RO[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shopId, setShopId] = useState("");

  // Edit form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Vehicle form state
  const [vYear, setVYear] = useState("");
  const [vMake, setVMake] = useState("");
  const [vModel, setVModel] = useState("");
  const [vVin, setVVin] = useState("");
  const [vPlate, setVPlate] = useState("");
  const [vMileage, setVMileage] = useState("");
  const [vColor, setVColor] = useState("");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("users").select("shop_id").eq("id", user.id).single();
    if (!profile) return;
    setShopId(profile.shop_id);

    const [{ data: c }, { data: v }, { data: r }] = await Promise.all([
      supabase.from("customers").select("*").eq("id", id).single(),
      supabase.from("vehicles").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
      supabase.from("repair_orders").select("*, vehicles(year, make, model)").eq("customer_id", id).order("created_at", { ascending: false }),
    ]);

    if (c) {
      setCustomer(c);
      setName(c.name);
      setPhone(c.phone ?? "");
      setEmail(c.email ?? "");
      setAddress(c.address ?? "");
      setNotes(c.notes ?? "");
    }
    setVehicles(v ?? []);
    setRos((r ?? []) as RO[]);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from("customers").update({
      name, phone: phone || null, email: email || null,
      address: address || null, notes: notes || null,
    }).eq("id", id);
    setEditing(false);
    setSaving(false);
    await loadData();
  }

  async function handleAddVehicle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("vehicles").insert({
      customer_id: id,
      shop_id: shopId,
      year: vYear ? parseInt(vYear) : null,
      make: vMake,
      model: vModel,
      vin: vVin || null,
      license_plate: vPlate || null,
      mileage: vMileage ? parseInt(vMileage) : null,
      color: vColor || null,
    });
    setShowVehicleForm(false);
    setVYear(""); setVMake(""); setVModel(""); setVVin(""); setVPlate(""); setVMileage(""); setVColor("");
    setSaving(false);
    await loadData();
  }

  async function handleDelete() {
    if (!confirm("Delete this customer and all their data? This cannot be undone.")) return;
    await supabase.from("customers").delete().eq("id", id);
    router.push("/customers");
  }

  if (loading) return <LoadingSpinner />;
  if (!customer) return <EmptyState title="Customer not found" />;

  return (
    <div>
      <Link href="/customers" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6">
        <ArrowLeft size={14} /> Back to customers
      </Link>

      {/* Customer Info */}
      <Card className="p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button size="sm" onClick={handleSave} loading={saving}>Save</Button>
                <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={handleDelete}><Trash2 size={14} /></Button>
              </>
            )}
          </div>
        </div>

        {editing ? (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Address</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Notes</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Phone:</span> {customer.phone || "—"}</div>
            <div><span className="text-muted-foreground">Email:</span> {customer.email || "—"}</div>
            <div><span className="text-muted-foreground">Address:</span> {customer.address || "—"}</div>
            {customer.notes && (
              <div className="md:col-span-2"><span className="text-muted-foreground">Notes:</span> {customer.notes}</div>
            )}
          </div>
        )}
      </Card>

      {/* Vehicles */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Vehicles</h2>
          <Button size="sm" variant="secondary" onClick={() => setShowVehicleForm(!showVehicleForm)}>
            <Plus size={14} className="mr-1" /> Add Vehicle
          </Button>
        </div>

        {showVehicleForm && (
          <form onSubmit={handleAddVehicle} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-4 bg-background rounded-lg">
            <Input value={vYear} onChange={(e) => setVYear(e.target.value)} placeholder="Year" />
            <Input value={vMake} onChange={(e) => setVMake(e.target.value)} placeholder="Make *" required />
            <Input value={vModel} onChange={(e) => setVModel(e.target.value)} placeholder="Model *" required />
            <Input value={vColor} onChange={(e) => setVColor(e.target.value)} placeholder="Color" />
            <Input value={vVin} onChange={(e) => setVVin(e.target.value)} placeholder="VIN" />
            <Input value={vPlate} onChange={(e) => setVPlate(e.target.value)} placeholder="License Plate" />
            <Input value={vMileage} onChange={(e) => setVMileage(e.target.value)} placeholder="Mileage" type="number" />
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={saving}>Add</Button>
              <button type="button" onClick={() => setShowVehicleForm(false)} className="text-muted-foreground"><X size={16} /></button>
            </div>
          </form>
        )}

        {vehicles.length > 0 ? (
          <div className="space-y-2">
            {vehicles.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div className="flex items-center gap-3">
                  <Car size={18} className="text-muted" />
                  <div>
                    <p className="text-sm font-medium">{vehicleLabel(v)}</p>
                    <p className="text-xs text-muted-foreground">
                      {[v.color, v.license_plate, v.vin].filter(Boolean).join(" · ") || "No details"}
                      {v.mileage ? ` · ${v.mileage.toLocaleString()} mi` : ""}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No vehicles yet.</p>
        )}
      </Card>

      {/* Repair Order History */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Repair Orders</h2>
        {ros.length > 0 ? (
          <div className="space-y-2">
            {ros.map((ro) => (
              <Link key={ro.id} href={`/repair-orders/${ro.id}`}>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-card-hover transition-colors">
                  <div className="flex items-center gap-3">
                    <Wrench size={16} className="text-muted" />
                    <div>
                      <p className="text-sm font-medium">
                        {ro.vehicles ? vehicleLabel(ro.vehicles) : "Unknown Vehicle"}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(ro.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={ro.status} />
                    <p className="text-xs text-muted-foreground mt-1">{formatCurrency(Number(ro.total))}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No repair orders for this customer.</p>
        )}
      </Card>
    </div>
  );
}
