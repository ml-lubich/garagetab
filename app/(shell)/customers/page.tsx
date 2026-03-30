"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Card, EmptyState, LoadingSpinner } from "@/components/ui";
import { Users, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { formatPhone } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [shopId, setShopId] = useState("");

  const supabase = createClient();

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCustomers() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("users")
      .select("shop_id")
      .eq("id", user.id)
      .single();

    if (!profile) return;
    setShopId(profile.shop_id);

    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("shop_id", profile.shop_id)
      .order("name");

    setCustomers(data ?? []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);

    const { error } = await supabase.from("customers").insert({
      shop_id: shopId,
      name,
      phone: phone || null,
      email: email || null,
      address: address || null,
      notes: notes || null,
    });

    if (!error) {
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setNotes("");
      setShowForm(false);
      await loadCustomers();
    }
    setFormLoading(false);
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} className="mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Add Customer Form */}
      {showForm && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">New Customer</h2>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Address</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Notes</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes about this customer..." />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <Button type="submit" loading={formLoading}>Save Customer</Button>
              <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or email..."
          className="pl-9"
        />
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`}>
              <Card className="p-4 hover:bg-card-hover transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.phone ? formatPhone(c.phone) : ""}
                      {c.phone && c.email ? " · " : ""}
                      {c.email ?? ""}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users size={32} />}
          title={search ? "No customers found" : "No customers yet"}
          description={search ? "Try a different search term." : "Add your first customer to get started."}
          action={
            !search ? (
              <Button onClick={() => setShowForm(true)}>
                <Plus size={16} className="mr-2" /> Add Customer
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
