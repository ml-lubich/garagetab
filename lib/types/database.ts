export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ROStatus =
  | "draft"
  | "estimate_sent"
  | "approved"
  | "in_progress"
  | "complete"
  | "invoiced"
  | "paid";

export type InvoiceStatus = "sent" | "paid" | "overdue";
export type LineItemType = "labor" | "part" | "other";
export type InspectionCondition = "green" | "yellow" | "red";
export type UserRole = "owner" | "tech";

export interface Database {
  public: {
    Tables: {
      shops: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          phone: string | null;
          email: string | null;
          logo_url: string | null;
          tax_rate: number;
          labor_rate: number;
          stripe_account_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          logo_url?: string | null;
          tax_rate?: number;
          labor_rate?: number;
          stripe_account_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          logo_url?: string | null;
          tax_rate?: number;
          labor_rate?: number;
          stripe_account_id?: string | null;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          shop_id: string;
          email: string;
          name: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          shop_id: string;
          email: string;
          name: string;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          email?: string;
          name?: string;
          role?: UserRole;
          created_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          customer_id: string;
          shop_id: string;
          year: number | null;
          make: string;
          model: string;
          vin: string | null;
          license_plate: string | null;
          mileage: number | null;
          color: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          shop_id: string;
          year?: number | null;
          make: string;
          model: string;
          vin?: string | null;
          license_plate?: string | null;
          mileage?: number | null;
          color?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          shop_id?: string;
          year?: number | null;
          make?: string;
          model?: string;
          vin?: string | null;
          license_plate?: string | null;
          mileage?: number | null;
          color?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      repair_orders: {
        Row: {
          id: string;
          shop_id: string;
          customer_id: string;
          vehicle_id: string;
          status: ROStatus;
          notes: string | null;
          tax_rate: number;
          subtotal: number;
          tax: number;
          total: number;
          approval_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          customer_id: string;
          vehicle_id: string;
          status?: ROStatus;
          notes?: string | null;
          tax_rate?: number;
          subtotal?: number;
          tax?: number;
          total?: number;
          approval_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          customer_id?: string;
          vehicle_id?: string;
          status?: ROStatus;
          notes?: string | null;
          tax_rate?: number;
          subtotal?: number;
          tax?: number;
          total?: number;
          approval_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ro_line_items: {
        Row: {
          id: string;
          repair_order_id: string;
          type: LineItemType;
          description: string;
          quantity: number;
          unit_cost: number;
          markup_pct: number;
          total: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          repair_order_id: string;
          type: LineItemType;
          description: string;
          quantity?: number;
          unit_cost?: number;
          markup_pct?: number;
          total?: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          repair_order_id?: string;
          type?: LineItemType;
          description?: string;
          quantity?: number;
          unit_cost?: number;
          markup_pct?: number;
          total?: number;
          sort_order?: number;
          created_at?: string;
        };
      };
      inspections: {
        Row: {
          id: string;
          repair_order_id: string;
          vehicle_id: string;
          shop_id: string;
          share_token: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          repair_order_id: string;
          vehicle_id: string;
          shop_id: string;
          share_token?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          repair_order_id?: string;
          vehicle_id?: string;
          shop_id?: string;
          share_token?: string | null;
          created_at?: string;
        };
      };
      inspection_items: {
        Row: {
          id: string;
          inspection_id: string;
          name: string;
          condition: InspectionCondition;
          photo_url: string | null;
          notes: string | null;
          recommended_service: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          inspection_id: string;
          name: string;
          condition?: InspectionCondition;
          photo_url?: string | null;
          notes?: string | null;
          recommended_service?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          inspection_id?: string;
          name?: string;
          condition?: InspectionCondition;
          photo_url?: string | null;
          notes?: string | null;
          recommended_service?: string | null;
          sort_order?: number;
          created_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          repair_order_id: string;
          shop_id: string;
          amount: number;
          status: InvoiceStatus;
          payment_method: string | null;
          paid_at: string | null;
          stripe_payment_id: string | null;
          share_token: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          repair_order_id: string;
          shop_id: string;
          amount: number;
          status?: InvoiceStatus;
          payment_method?: string | null;
          paid_at?: string | null;
          stripe_payment_id?: string | null;
          share_token?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          repair_order_id?: string;
          shop_id?: string;
          amount?: number;
          status?: InvoiceStatus;
          payment_method?: string | null;
          paid_at?: string | null;
          stripe_payment_id?: string | null;
          share_token?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      ro_status: ROStatus;
      invoice_status: InvoiceStatus;
      line_item_type: LineItemType;
      inspection_condition: InspectionCondition;
      user_role: UserRole;
    };
  };
}
