"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Select, Card, Textarea, LoadingSpinner } from "@/components/ui";
import { ArrowLeft, Plus, Trash2, Camera, Copy, CheckCircle } from "lucide-react";
import Link from "next/link";
import type { InspectionCondition } from "@/lib/types/database";

interface InspectionItem {
  id: string;
  name: string;
  condition: InspectionCondition;
  photo_url: string | null;
  notes: string | null;
  recommended_service: string | null;
  sort_order: number;
}

const PRESET_ITEMS = [
  "Brake Pads - Front",
  "Brake Pads - Rear",
  "Brake Rotors - Front",
  "Brake Rotors - Rear",
  "Tire - LF",
  "Tire - RF",
  "Tire - LR",
  "Tire - RR",
  "Engine Oil",
  "Coolant",
  "Transmission Fluid",
  "Brake Fluid",
  "Power Steering Fluid",
  "Air Filter",
  "Cabin Filter",
  "Battery",
  "Serpentine Belt",
  "Wiper Blades",
  "Headlights",
  "Tail Lights",
];

const conditionColors: Record<InspectionCondition, string> = {
  green: "bg-success text-white",
  yellow: "bg-warning text-black",
  red: "bg-danger text-white",
};

export default function InspectPage() {
  const { id: roId } = useParams<{ id: string }>();
  const supabase = createClient();

  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // New item form
  const [showNewItem, setShowNewItem] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCondition, setNewCondition] = useState<InspectionCondition>("green");
  const [newNotes, setNewNotes] = useState("");
  const [newRecommended, setNewRecommended] = useState("");

  const loadInspection = useCallback(async () => {
    // Check if inspection exists for this RO
    const { data: existing } = await supabase
      .from("inspections")
      .select("*")
      .eq("repair_order_id", roId)
      .single();

    if (existing) {
      setInspectionId(existing.id);
      setShareToken(existing.share_token);
      const { data: inspItems } = await supabase
        .from("inspection_items")
        .select("*")
        .eq("inspection_id", existing.id)
        .order("sort_order");
      setItems((inspItems ?? []) as InspectionItem[]);
    }
    setLoading(false);
  }, [roId, supabase]);

  useEffect(() => {
    loadInspection();
  }, [loadInspection]);

  async function createInspection() {
    setSaving(true);
    const { data: ro } = await supabase
      .from("repair_orders")
      .select("vehicle_id, shop_id")
      .eq("id", roId)
      .single();

    if (!ro) { setSaving(false); return; }

    const { data: inspection } = await supabase
      .from("inspections")
      .insert({
        repair_order_id: roId,
        vehicle_id: ro.vehicle_id,
        shop_id: ro.shop_id,
      })
      .select()
      .single();

    if (inspection) {
      setInspectionId(inspection.id);
      setShareToken(inspection.share_token);
    }
    setSaving(false);
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!inspectionId) return;
    setSaving(true);

    await supabase.from("inspection_items").insert({
      inspection_id: inspectionId,
      name: newName,
      condition: newCondition,
      notes: newNotes || null,
      recommended_service: newRecommended || null,
      sort_order: items.length,
    });

    setNewName("");
    setNewCondition("green");
    setNewNotes("");
    setNewRecommended("");
    setShowNewItem(false);
    setSaving(false);
    await loadInspection();
  }

  async function addPresetItems() {
    if (!inspectionId) return;
    setSaving(true);

    const inserts = PRESET_ITEMS.map((name, i) => ({
      inspection_id: inspectionId,
      name,
      condition: "green" as InspectionCondition,
      sort_order: items.length + i,
    }));

    await supabase.from("inspection_items").insert(inserts);
    setSaving(false);
    await loadInspection();
  }

  async function updateCondition(itemId: string, condition: InspectionCondition) {
    await supabase.from("inspection_items").update({ condition }).eq("id", itemId);
    await loadInspection();
  }

  async function deleteItem(itemId: string) {
    await supabase.from("inspection_items").delete().eq("id", itemId);
    await loadInspection();
  }

  async function handlePhotoUpload(itemId: string, file: File) {
    const path = `${inspectionId}/${itemId}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("inspections").upload(path, file);
    if (error) return;

    const { data: { publicUrl } } = supabase.storage.from("inspections").getPublicUrl(path);
    await supabase.from("inspection_items").update({ photo_url: publicUrl }).eq("id", itemId);
    await loadInspection();
  }

  function copyShareLink() {
    if (!shareToken) return;
    navigator.clipboard.writeText(`${window.location.origin}/inspect/${shareToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <Link href={`/repair-orders/${roId}`} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6">
        <ArrowLeft size={14} /> Back to repair order
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Vehicle Inspection</h1>
        {shareToken && (
          <Button size="sm" variant="secondary" onClick={copyShareLink}>
            <Copy size={14} className="mr-1" /> {copied ? "Copied!" : "Share Link"}
          </Button>
        )}
      </div>

      {!inspectionId ? (
        <Card className="p-8 text-center">
          <Camera size={48} className="mx-auto text-muted mb-4" />
          <h2 className="text-lg font-semibold mb-2">Start Vehicle Inspection</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Create a digital vehicle inspection with photos and condition ratings.
          </p>
          <Button onClick={createInspection} loading={saving}>
            Start Inspection
          </Button>
        </Card>
      ) : (
        <>
          {/* Actions */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button size="sm" variant="secondary" onClick={() => setShowNewItem(!showNewItem)}>
              <Plus size={14} className="mr-1" /> Add Item
            </Button>
            {items.length === 0 && (
              <Button size="sm" variant="secondary" onClick={addPresetItems} loading={saving}>
                Add Preset Items
              </Button>
            )}
          </div>

          {/* New Item Form */}
          {showNewItem && (
            <Card className="p-4 mb-6">
              <form onSubmit={addItem} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Item name (e.g. Brake Pads - Front)" required />
                  <Select value={newCondition} onChange={(e) => setNewCondition(e.target.value as InspectionCondition)}>
                    <option value="green">Good (Green)</option>
                    <option value="yellow">Needs Attention (Yellow)</option>
                    <option value="red">Needs Immediate Service (Red)</option>
                  </Select>
                </div>
                <Textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Notes..." rows={2} />
                <Input value={newRecommended} onChange={(e) => setNewRecommended(e.target.value)} placeholder="Recommended service (optional)" />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" loading={saving}>Add</Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setShowNewItem(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}

          {/* Items List */}
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start gap-4">
                  {/* Photo */}
                  <div className="w-20 h-20 bg-background rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center text-muted">
                        <Camera size={20} />
                        <span className="text-[10px] mt-1">Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handlePhotoUpload(item.id, f);
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      <button onClick={() => deleteItem(item.id)} className="text-muted hover:text-danger">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Condition buttons */}
                    <div className="flex gap-1 mt-2">
                      {(["green", "yellow", "red"] as const).map((c) => (
                        <button
                          key={c}
                          onClick={() => updateCondition(item.id, c)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            item.condition === c
                              ? conditionColors[c]
                              : "bg-card-hover text-muted-foreground hover:bg-border"
                          }`}
                        >
                          {c === "green" ? "Good" : c === "yellow" ? "Fair" : "Poor"}
                        </button>
                      ))}
                    </div>

                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-2">{item.notes}</p>
                    )}
                    {item.recommended_service && (
                      <p className="text-xs text-warning mt-1">
                        Recommended: {item.recommended_service}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {items.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No inspection items yet. Add items or use presets.</p>
            </Card>
          )}

          {/* Summary */}
          {items.length > 0 && (
            <Card className="p-6 mt-6">
              <h2 className="text-lg font-semibold mb-4">Summary</h2>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-sm">{items.filter((i) => i.condition === "green").length} Good</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <span className="text-sm">{items.filter((i) => i.condition === "yellow").length} Fair</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger" />
                  <span className="text-sm">{items.filter((i) => i.condition === "red").length} Poor</span>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
