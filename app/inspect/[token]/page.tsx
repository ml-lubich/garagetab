"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, LoadingSpinner } from "@/components/ui";
import { Camera, XCircle } from "lucide-react";
import { vehicleLabel } from "@/lib/utils";
import type { InspectionCondition } from "@/lib/types/database";

interface InspItem {
  id: string;
  name: string;
  condition: InspectionCondition;
  photo_url: string | null;
  notes: string | null;
  recommended_service: string | null;
}

interface InspData {
  id: string;
  vehicles: { year: number | null; make: string; model: string; mileage: number | null } | null;
  shops: { name: string } | null;
}

const conditionLabel: Record<InspectionCondition, { text: string; color: string }> = {
  green: { text: "Good", color: "text-success" },
  yellow: { text: "Needs Attention", color: "text-warning" },
  red: { text: "Needs Immediate Service", color: "text-danger" },
};

const conditionBg: Record<InspectionCondition, string> = {
  green: "border-l-success",
  yellow: "border-l-warning",
  red: "border-l-danger",
};

export default function PublicInspectionPage() {
  const { token } = useParams<{ token: string }>();
  const [inspection, setInspection] = useState<InspData | null>(null);
  const [items, setItems] = useState<InspItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInspection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadInspection() {
    const supabase = createClient();

    const { data: insp } = await supabase
      .from("inspections")
      .select("*, vehicles(year, make, model, mileage), shops(name)")
      .eq("share_token", token)
      .single();

    if (insp) {
      setInspection(insp as unknown as InspData);
      const { data: inspItems } = await supabase
        .from("inspection_items")
        .select("*")
        .eq("inspection_id", insp.id)
        .order("sort_order");
      setItems((inspItems ?? []) as InspItem[]);
    }
    setLoading(false);
  }

  if (loading) return <LoadingSpinner />;

  if (!inspection) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <XCircle size={48} className="mx-auto text-danger mb-4" />
          <h1 className="text-xl font-bold mb-2">Inspection Not Found</h1>
          <p className="text-sm text-muted-foreground">This link may have expired or is invalid.</p>
        </Card>
      </div>
    );
  }

  const greenCount = items.filter((i) => i.condition === "green").length;
  const yellowCount = items.filter((i) => i.condition === "yellow").length;
  const redCount = items.filter((i) => i.condition === "red").length;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto pt-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-primary">{inspection.shops?.name ?? "Auto Shop"}</h1>
          <h2 className="text-lg font-semibold mt-2 flex items-center justify-center gap-2">
            <Camera size={20} /> Vehicle Inspection Report
          </h2>
          <p className="text-sm text-muted-foreground">
            {inspection.vehicles ? vehicleLabel(inspection.vehicles) : ""}
            {inspection.vehicles?.mileage ? ` · ${inspection.vehicles.mileage.toLocaleString()} mi` : ""}
          </p>
        </div>

        {/* Summary */}
        <Card className="p-4 mb-6">
          <div className="flex justify-around text-center">
            <div>
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-1">
                <span className="text-success font-bold text-sm">{greenCount}</span>
              </div>
              <span className="text-xs text-muted-foreground">Good</span>
            </div>
            <div>
              <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-1">
                <span className="text-warning font-bold text-sm">{yellowCount}</span>
              </div>
              <span className="text-xs text-muted-foreground">Fair</span>
            </div>
            <div>
              <div className="w-8 h-8 rounded-full bg-danger/20 flex items-center justify-center mx-auto mb-1">
                <span className="text-danger font-bold text-sm">{redCount}</span>
              </div>
              <span className="text-xs text-muted-foreground">Poor</span>
            </div>
          </div>
        </Card>

        {/* Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className={`p-4 border-l-4 ${conditionBg[item.condition]}`}>
              <div className="flex gap-4">
                {item.photo_url && (
                  <img
                    src={item.photo_url}
                    alt={item.name}
                    className="w-20 h-20 rounded-lg object-cover shrink-0"
                  />
                )}
                <div>
                  <h3 className="font-medium text-sm">{item.name}</h3>
                  <p className={`text-xs font-medium ${conditionLabel[item.condition].color}`}>
                    {conditionLabel[item.condition].text}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                  )}
                  {item.recommended_service && (
                    <p className="text-xs text-warning mt-1 font-medium">
                      Recommended: {item.recommended_service}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Powered by <span className="text-primary font-medium">GarageTab</span>
        </p>
      </div>
    </div>
  );
}
