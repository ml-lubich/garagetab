"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Card, LoadingSpinner } from "@/components/ui";
import { Save } from "lucide-react";

interface Shop {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  tax_rate: number;
  labor_rate: number;
}

export default function SettingsPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [laborRate, setLaborRate] = useState("");

  useEffect(() => {
    loadShop();
  }, []);

  async function loadShop() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("users").select("shop_id").eq("id", user.id).single();
    if (!profile) return;

    const { data } = await supabase.from("shops").select("*").eq("id", profile.shop_id).single();
    if (data) {
      setShop(data);
      setName(data.name);
      setAddress(data.address ?? "");
      setPhone(data.phone ?? "");
      setEmail(data.email ?? "");
      setTaxRate((Number(data.tax_rate) * 100).toString());
      setLaborRate(Number(data.labor_rate).toString());
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!shop) return;
    setSaving(true);

    const supabase = createClient();
    await supabase.from("shops").update({
      name,
      address: address || null,
      phone: phone || null,
      email: email || null,
      tax_rate: parseFloat(taxRate) / 100,
      labor_rate: parseFloat(laborRate),
    }).eq("id", shop.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <form onSubmit={handleSave}>
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Shop Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Shop Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Address</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, City, ST 12345" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="shop@email.com" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Rates</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Tax Rate (%)</label>
              <Input
                type="number"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="8.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Default Labor Rate ($/hr)</label>
              <Input
                type="number"
                step="1"
                value={laborRate}
                onChange={(e) => setLaborRate(e.target.value)}
                placeholder="95"
              />
            </div>
          </div>
        </Card>

        <Button type="submit" loading={saving}>
          <Save size={16} className="mr-2" />
          {saved ? "Saved!" : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}
