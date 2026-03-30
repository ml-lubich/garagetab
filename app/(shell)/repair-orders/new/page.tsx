"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Select, Card, Textarea } from "@/components/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
}

interface Vehicle {
  id: string;
  customer_id: string;
  year: number | null;
  make: string;
  model: string;
}

export default function NewRepairOrderPage() {
  const router = useRouter();
  const supabase = createClient();

  const [shopId, setShopId] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [notes, setNotes] = useState("");

  // New customer fields
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // New vehicle fields
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [newYear, setNewYear] = useState("");
  const [newMake, setNewMake] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newVin, setNewVin] = useState("");
  const [newPlate, setNewPlate] = useState("");
  const [newMileage, setNewMileage] = useState("");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("users").select("shop_id").eq("id", user.id).single();
    if (!profile) return;
    setShopId(profile.shop_id);

    const { data } = await supabase.from("customers").select("id, name").eq("shop_id", profile.shop_id).order("name");
    setCustomers(data ?? []);
  }

  useEffect(() => {
    if (customerId) {
      supabase
        .from("vehicles")
        .select("id, customer_id, year, make, model")
        .eq("customer_id", customerId)
        .then(({ data }) => setVehicles(data ?? []));
    } else {
      setVehicles([]);
    }
    setVehicleId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    let cId = customerId;
    let vId = vehicleId;

    // Create new customer if needed
    if (showNewCustomer) {
      const { data: newCustomer, error } = await supabase
        .from("customers")
        .insert({ shop_id: shopId, name: newName, phone: newPhone || null, email: newEmail || null })
        .select()
        .single();
      if (error || !newCustomer) { setLoading(false); return; }
      cId = newCustomer.id;
    }

    // Create new vehicle if needed
    if (showNewVehicle) {
      const { data: newVehicle, error } = await supabase
        .from("vehicles")
        .insert({
          customer_id: cId,
          shop_id: shopId,
          year: newYear ? parseInt(newYear) : null,
          make: newMake,
          model: newModel,
          vin: newVin || null,
          license_plate: newPlate || null,
          mileage: newMileage ? parseInt(newMileage) : null,
        })
        .select()
        .single();
      if (error || !newVehicle) { setLoading(false); return; }
      vId = newVehicle.id;
    }

    // Get shop tax rate
    const { data: shop } = await supabase.from("shops").select("tax_rate").eq("id", shopId).single();

    const { data: ro, error } = await supabase
      .from("repair_orders")
      .insert({
        shop_id: shopId,
        customer_id: cId,
        vehicle_id: vId,
        notes: notes || null,
        tax_rate: shop?.tax_rate ?? 0.085,
      })
      .select()
      .single();

    if (error || !ro) { setLoading(false); return; }
    router.push(`/repair-orders/${ro.id}`);
  }

  return (
    <div className="max-w-2xl">
      <Link href="/repair-orders" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6">
        <ArrowLeft size={14} /> Back to repair orders
      </Link>

      <h1 className="text-2xl font-bold mb-6">New Repair Order</h1>

      <form onSubmit={handleSubmit}>
        {/* Customer Selection */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Customer</h2>
          {!showNewCustomer ? (
            <>
              <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required={!showNewCustomer}>
                <option value="">Select a customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
              <button
                type="button"
                onClick={() => { setShowNewCustomer(true); setCustomerId(""); }}
                className="text-sm text-primary hover:underline mt-2"
              >
                + New customer
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name *" required />
                <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone" />
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" />
              </div>
              <button
                type="button"
                onClick={() => { setShowNewCustomer(false); setNewName(""); setNewPhone(""); setNewEmail(""); }}
                className="text-sm text-primary hover:underline"
              >
                Select existing customer instead
              </button>
            </div>
          )}
        </Card>

        {/* Vehicle Selection */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Vehicle</h2>
          {!showNewVehicle ? (
            <>
              <Select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                required={!showNewVehicle}
                disabled={!customerId && !showNewCustomer}
              >
                <option value="">
                  {!customerId && !showNewCustomer
                    ? "Select a customer first..."
                    : vehicles.length === 0
                    ? "No vehicles — add one below"
                    : "Select a vehicle..."}
                </option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.year ? `${v.year} ` : ""}{v.make} {v.model}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                onClick={() => { setShowNewVehicle(true); setVehicleId(""); }}
                className="text-sm text-primary hover:underline mt-2"
              >
                + New vehicle
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Input value={newYear} onChange={(e) => setNewYear(e.target.value)} placeholder="Year" type="number" />
                <Input value={newMake} onChange={(e) => setNewMake(e.target.value)} placeholder="Make *" required />
                <Input value={newModel} onChange={(e) => setNewModel(e.target.value)} placeholder="Model *" required />
                <Input value={newVin} onChange={(e) => setNewVin(e.target.value)} placeholder="VIN" />
                <Input value={newPlate} onChange={(e) => setNewPlate(e.target.value)} placeholder="License Plate" />
                <Input value={newMileage} onChange={(e) => setNewMileage(e.target.value)} placeholder="Mileage" type="number" />
              </div>
              <button
                type="button"
                onClick={() => { setShowNewVehicle(false); }}
                className="text-sm text-primary hover:underline"
              >
                Select existing vehicle instead
              </button>
            </div>
          )}
        </Card>

        {/* Notes */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Customer complaint, initial observations, etc."
            rows={3}
          />
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={loading} size="lg">
            Create Repair Order
          </Button>
          <Link href="/repair-orders">
            <Button type="button" variant="secondary" size="lg">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
