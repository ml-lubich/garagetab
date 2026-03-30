-- GarageTab Initial Schema
-- Run this in Supabase SQL Editor

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Enums
create type ro_status as enum (
  'draft', 'estimate_sent', 'approved', 'in_progress', 'complete', 'invoiced', 'paid'
);
create type invoice_status as enum ('sent', 'paid', 'overdue');
create type line_item_type as enum ('labor', 'part', 'other');
create type inspection_condition as enum ('green', 'yellow', 'red');
create type user_role as enum ('owner', 'tech');

-- Shops
create table shops (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  phone text,
  email text,
  logo_url text,
  tax_rate numeric(5,3) not null default 0.085,
  labor_rate numeric(10,2) not null default 95.00,
  stripe_account_id text,
  created_at timestamptz not null default now()
);

-- Users (extends Supabase auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  email text not null,
  name text not null,
  role user_role not null default 'owner',
  created_at timestamptz not null default now()
);

-- Customers
create table customers (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references shops(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);

-- Vehicles
create table vehicles (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  year integer,
  make text not null,
  model text not null,
  vin text,
  license_plate text,
  mileage integer,
  color text,
  notes text,
  created_at timestamptz not null default now()
);

-- Repair Orders
create table repair_orders (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references shops(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  status ro_status not null default 'draft',
  notes text,
  tax_rate numeric(5,3) not null default 0.085,
  subtotal numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  approval_token uuid unique default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RO Line Items
create table ro_line_items (
  id uuid primary key default uuid_generate_v4(),
  repair_order_id uuid not null references repair_orders(id) on delete cascade,
  type line_item_type not null default 'labor',
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_cost numeric(10,2) not null default 0,
  markup_pct numeric(5,2) not null default 0,
  total numeric(10,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Inspections
create table inspections (
  id uuid primary key default uuid_generate_v4(),
  repair_order_id uuid not null references repair_orders(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  share_token uuid unique default uuid_generate_v4(),
  created_at timestamptz not null default now()
);

-- Inspection Items
create table inspection_items (
  id uuid primary key default uuid_generate_v4(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  name text not null,
  condition inspection_condition not null default 'green',
  photo_url text,
  notes text,
  recommended_service text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Invoices
create table invoices (
  id uuid primary key default uuid_generate_v4(),
  repair_order_id uuid not null references repair_orders(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  amount numeric(10,2) not null default 0,
  status invoice_status not null default 'sent',
  payment_method text,
  paid_at timestamptz,
  stripe_payment_id text,
  share_token uuid unique default uuid_generate_v4(),
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_users_shop on users(shop_id);
create index idx_customers_shop on customers(shop_id);
create index idx_customers_phone on customers(phone);
create index idx_vehicles_customer on vehicles(customer_id);
create index idx_vehicles_shop on vehicles(shop_id);
create index idx_vehicles_license on vehicles(license_plate);
create index idx_ro_shop on repair_orders(shop_id);
create index idx_ro_customer on repair_orders(customer_id);
create index idx_ro_status on repair_orders(status);
create index idx_ro_approval_token on repair_orders(approval_token);
create index idx_line_items_ro on ro_line_items(repair_order_id);
create index idx_inspections_ro on inspections(repair_order_id);
create index idx_inspection_items_inspection on inspection_items(inspection_id);
create index idx_invoices_ro on invoices(repair_order_id);
create index idx_invoices_shop on invoices(shop_id);
create index idx_invoices_share_token on invoices(share_token);

-- Row Level Security
alter table shops enable row level security;
alter table users enable row level security;
alter table customers enable row level security;
alter table vehicles enable row level security;
alter table repair_orders enable row level security;
alter table ro_line_items enable row level security;
alter table inspections enable row level security;
alter table inspection_items enable row level security;
alter table invoices enable row level security;

-- RLS Policies

-- Shops: users can see their own shop
create policy "Users can view own shop" on shops
  for select using (id in (select shop_id from users where id = auth.uid()));
create policy "Users can update own shop" on shops
  for update using (id in (select shop_id from users where id = auth.uid()));

-- Users: can see users in same shop
create policy "Users can view shop members" on users
  for select using (shop_id in (select shop_id from users where id = auth.uid()));
create policy "Users can insert self" on users
  for insert with check (id = auth.uid());
create policy "Users can update self" on users
  for update using (id = auth.uid());

-- Customers: shop-scoped
create policy "Shop members can view customers" on customers
  for select using (shop_id in (select shop_id from users where id = auth.uid()));
create policy "Shop members can insert customers" on customers
  for insert with check (shop_id in (select shop_id from users where id = auth.uid()));
create policy "Shop members can update customers" on customers
  for update using (shop_id in (select shop_id from users where id = auth.uid()));
create policy "Shop members can delete customers" on customers
  for delete using (shop_id in (select shop_id from users where id = auth.uid()));

-- Vehicles: shop-scoped
create policy "Shop members can view vehicles" on vehicles
  for select using (shop_id in (select shop_id from users where id = auth.uid()));
create policy "Shop members can insert vehicles" on vehicles
  for insert with check (shop_id in (select shop_id from users where id = auth.uid()));
create policy "Shop members can update vehicles" on vehicles
  for update using (shop_id in (select shop_id from users where id = auth.uid()));
create policy "Shop members can delete vehicles" on vehicles
  for delete using (shop_id in (select shop_id from users where id = auth.uid()));

-- Repair Orders: shop-scoped + public via approval token
create policy "Shop members can view ROs" on repair_orders
  for select using (shop_id in (select shop_id from users where id = auth.uid()));
create policy "Public can view RO by approval token" on repair_orders
  for select using (true);
create policy "Shop members can insert ROs" on repair_orders
  for insert with check (shop_id in (select shop_id from users where id = auth.uid()));
create policy "Shop members can update ROs" on repair_orders
  for update using (shop_id in (select shop_id from users where id = auth.uid()));
create policy "Shop members can delete ROs" on repair_orders
  for delete using (shop_id in (select shop_id from users where id = auth.uid()));

-- Line Items: via repair order
create policy "Shop members can view line items" on ro_line_items
  for select using (repair_order_id in (
    select id from repair_orders where shop_id in (select shop_id from users where id = auth.uid())
  ));
create policy "Public can view line items" on ro_line_items
  for select using (true);
create policy "Shop members can insert line items" on ro_line_items
  for insert with check (repair_order_id in (
    select id from repair_orders where shop_id in (select shop_id from users where id = auth.uid())
  ));
create policy "Shop members can update line items" on ro_line_items
  for update using (repair_order_id in (
    select id from repair_orders where shop_id in (select shop_id from users where id = auth.uid())
  ));
create policy "Shop members can delete line items" on ro_line_items
  for delete using (repair_order_id in (
    select id from repair_orders where shop_id in (select shop_id from users where id = auth.uid())
  ));

-- Inspections
create policy "Shop members can view inspections" on inspections
  for select using (shop_id in (select shop_id from users where id = auth.uid()));
create policy "Public can view inspections" on inspections
  for select using (true);
create policy "Shop members can insert inspections" on inspections
  for insert with check (shop_id in (select shop_id from users where id = auth.uid()));
create policy "Shop members can update inspections" on inspections
  for update using (shop_id in (select shop_id from users where id = auth.uid()));

-- Inspection Items
create policy "Shop members can view inspection items" on inspection_items
  for select using (inspection_id in (
    select id from inspections where shop_id in (select shop_id from users where id = auth.uid())
  ));
create policy "Public can view inspection items" on inspection_items
  for select using (true);
create policy "Shop members can insert inspection items" on inspection_items
  for insert with check (inspection_id in (
    select id from inspections where shop_id in (select shop_id from users where id = auth.uid())
  ));
create policy "Shop members can update inspection items" on inspection_items
  for update using (inspection_id in (
    select id from inspections where shop_id in (select shop_id from users where id = auth.uid())
  ));
create policy "Shop members can delete inspection items" on inspection_items
  for delete using (inspection_id in (
    select id from inspections where shop_id in (select shop_id from users where id = auth.uid())
  ));

-- Invoices
create policy "Shop members can view invoices" on invoices
  for select using (shop_id in (select shop_id from users where id = auth.uid()));
create policy "Public can view invoices" on invoices
  for select using (true);
create policy "Shop members can insert invoices" on invoices
  for insert with check (shop_id in (select shop_id from users where id = auth.uid()));
create policy "Shop members can update invoices" on invoices
  for update using (shop_id in (select shop_id from users where id = auth.uid()));

-- Updated_at trigger for repair_orders
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger repair_orders_updated_at
  before update on repair_orders
  for each row execute function update_updated_at();

-- Function to recalculate RO totals
create or replace function recalculate_ro_totals()
returns trigger as $$
declare
  ro_subtotal numeric(10,2);
  ro_tax_rate numeric(5,3);
begin
  select coalesce(sum(total), 0) into ro_subtotal
  from ro_line_items
  where repair_order_id = coalesce(new.repair_order_id, old.repair_order_id);

  select tax_rate into ro_tax_rate
  from repair_orders
  where id = coalesce(new.repair_order_id, old.repair_order_id);

  update repair_orders
  set subtotal = ro_subtotal,
      tax = round(ro_subtotal * ro_tax_rate, 2),
      total = round(ro_subtotal + (ro_subtotal * ro_tax_rate), 2)
  where id = coalesce(new.repair_order_id, old.repair_order_id);

  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger recalculate_ro_on_line_item_change
  after insert or update or delete on ro_line_items
  for each row execute function recalculate_ro_totals();

-- Storage bucket for inspection photos
insert into storage.buckets (id, name, public) values ('inspections', 'inspections', true)
on conflict do nothing;

create policy "Anyone can view inspection photos" on storage.objects
  for select using (bucket_id = 'inspections');
create policy "Authenticated users can upload inspection photos" on storage.objects
  for insert with check (bucket_id = 'inspections' and auth.role() = 'authenticated');
create policy "Authenticated users can update inspection photos" on storage.objects
  for update using (bucket_id = 'inspections' and auth.role() = 'authenticated');
create policy "Authenticated users can delete inspection photos" on storage.objects
  for delete using (bucket_id = 'inspections' and auth.role() = 'authenticated');
