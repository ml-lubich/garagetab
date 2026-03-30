# REQUIREMENTS.md — GarageTab

> Lightweight shop management for independent auto repair shops (1-5 bays)

## Product Vision

GarageTab is the $29/mo alternative to Tekmetric ($199-399/mo) and Shop-Ware ($250+/mo) for solo mechanics and small independent shops. No sales calls, no contracts, no per-user fees. Sign up, add your first repair order in under 5 minutes.

**Tagline:** "Run your shop, not your software."

## Target Customer

- Solo mechanic with 1-2 bays
- Small independent shops (2-4 techs, no franchise)
- Mobile mechanics
- Specialty shops (German cars, classic cars, diesel, etc.)
- Currently using: paper, spreadsheets, or nothing
- Annual revenue: $100K-$500K
- NOT: multi-location franchises, dealerships, quick-lube chains

## Competitive Positioning

| Feature | GarageTab ($29/mo) | Tekmetric ($199+/mo) | AutoLeap ($200+/mo) | Torque360 ($79+/mo) |
|---------|-------------------|---------------------|--------------------|--------------------|
| Repair orders | ✅ | ✅ | ✅ | ✅ |
| Digital inspections | ✅ (photos) | ✅ (advanced) | ✅ | ✅ |
| Parts catalog integration | ❌ (manual) | ✅ | ✅ | ✅ |
| Customer approval via text | ✅ | ✅ | ✅ | ✅ |
| Payment processing | ✅ (Stripe) | ✅ | ✅ | ✅ |
| Multi-location | ❌ | ✅ | ✅ | ✅ |
| Tire/fleet management | ❌ | ✅ | ✅ | ❌ |
| Setup time | 5 min | Weeks | Weeks | Days |
| Contract required | No | Yes (12mo) | Yes | No |

**Key insight:** 80% of solo shops don't need parts catalog integration (they call their local parts store anyway). They need repair orders, customer communication, and invoicing.

## Core Features (MVP — Build in 2 days)

### 1. Repair Orders
- Create RO: customer info, vehicle (year/make/model/VIN), mileage
- Add line items: service description, labor hours, labor rate, parts (name + cost + markup)
- Auto-calculate totals (subtotal, tax, total)
- RO status: Draft → Estimate Sent → Approved → In Progress → Complete → Invoiced → Paid
- Print or PDF export

### 2. Customer Management
- Customer database: name, phone, email, address
- Vehicle history per customer (multiple vehicles per customer)
- Search by name, phone, or license plate
- Notes field per customer

### 3. Digital Estimates & Approvals
- Send estimate to customer via SMS or email (magic link, no login)
- Customer views itemized estimate on mobile-friendly page
- One-tap "Approve" or "Decline" with optional message
- Real-time notification to shop when approved
- E-signature capture on approval

### 4. Invoicing & Payments
- One-click: Approved RO → Invoice
- Send invoice via SMS/email
- Online payment via Stripe (card + ACH)
- Mark as paid (cash/check) manually
- Payment receipt auto-sent

### 5. Digital Vehicle Inspection (DVI)
- Photo upload per inspection item (brake pads, tires, fluid levels)
- Red/Yellow/Green condition indicators
- Customer-facing inspection report (shareable link)
- Upsell: "Your brake pads are yellow — recommend service within 30 days"

### 6. Dashboard
- Today's jobs (cards with status)
- Revenue: today / this week / this month
- Outstanding invoices
- Upcoming appointments (optional)

## Data Model (Supabase/Postgres)

```
customers
  id, name, phone, email, address, notes, created_at

vehicles
  id, customer_id, year, make, model, vin, license_plate, mileage, color, notes

repair_orders
  id, customer_id, vehicle_id, status, notes, tax_rate,
  subtotal, tax, total, created_at, updated_at

ro_line_items
  id, repair_order_id, type (labor|part|other), description,
  quantity, unit_cost, markup_pct, total

inspections
  id, repair_order_id, vehicle_id, created_at

inspection_items
  id, inspection_id, name, condition (green|yellow|red),
  photo_url, notes, recommended_service

invoices
  id, repair_order_id, amount, status (sent|paid|overdue),
  payment_method, paid_at, stripe_payment_id

shops
  id, name, address, phone, email, logo_url, tax_rate,
  labor_rate, stripe_account_id

users
  id, shop_id, email, name, role (owner|tech)
```

## Pages / Routes

```
/ → Dashboard
/repair-orders → List all ROs
/repair-orders/new → Create RO
/repair-orders/[id] → View/edit RO
/repair-orders/[id]/inspect → DVI form
/customers → Customer list
/customers/[id] → Customer detail + vehicle history
/invoices → Invoice list
/settings → Shop info, labor rate, tax rate, Stripe connect

# Public (no auth)
/approve/[token] → Customer estimate approval page
/invoice/[token] → Customer invoice + pay page
/inspect/[token] → Customer inspection report
```

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), Tailwind CSS, shadcn/ui
- **Backend:** Next.js API routes + Supabase (Postgres + Auth + Storage)
- **Database:** Supabase Postgres with Row Level Security
- **Auth:** Supabase Auth (email/password, magic link)
- **Payments:** Stripe Connect (platform takes 0.5% on top of Stripe fees)
- **SMS:** Twilio (estimate/invoice notifications)
- **File storage:** Supabase Storage (inspection photos)
- **Hosting:** Vercel
- **PDF generation:** @react-pdf/renderer or html-to-pdf

## Pricing Model

| Plan | Price | Includes |
|------|-------|----------|
| **Starter** | $29/mo | 1 user, unlimited ROs, Stripe payments, DVI |
| **Shop** | $49/mo | Up to 5 users, priority support, custom branding |
| Annual | 20% discount | $23/mo and $39/mo respectively |

Revenue streams:
1. Monthly subscription ($29-49/mo)
2. Payment processing margin (0.5% on Stripe transactions)
3. SMS costs passed through at cost (or included in plan)

## Launch Strategy

1. **Day 1-2:** Build MVP (repair orders, customers, invoicing, payments)
2. **Day 3:** Add DVI + customer approval flow
3. **Day 4:** Landing page, Stripe billing, deploy
4. **Day 5:** Post on Reddit r/mechanics, r/AutoDIY, r/smallbusiness
5. **Week 2:** Cold outreach to local shops, Facebook groups for mechanics
6. **Week 3-4:** Add features based on feedback

## Success Metrics

- **Week 1:** 10 signups (free trial)
- **Month 1:** 20 paying customers ($580-980 MRR)
- **Month 3:** 100 paying customers ($2,900-4,900 MRR)
- **Month 6:** 300 paying customers ($8,700-14,700 MRR)

## Out of Scope (v1)

- Parts catalog integration (AllData, WorldPAC) — future add-on
- Appointment scheduling / online booking — future
- Inventory management — future
- Multi-location — future
- Native mobile app — responsive web is fine for v1
- Accounting integration (QuickBooks) — CSV export is enough for v1

## Key Design Principles

1. **Mobile-first** — mechanics use phones/tablets in the bay
2. **Fast** — creating an RO should take <60 seconds
3. **No training needed** — if it needs a manual, it's too complex
4. **Professional output** — estimates and invoices should look better than paper
5. **Get paid faster** — tap to pay, text to approve, same-day invoicing
