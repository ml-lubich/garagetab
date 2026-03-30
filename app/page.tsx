import Link from "next/link";
import {
  Wrench,
  Clock,
  CreditCard,
  Camera,
  CheckCircle,
  ArrowRight,
  Star,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-primary">GarageTab</span>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-6">
            <Star size={14} />
            $29/mo — No contracts, no per-user fees
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
            Run your shop,
            <br />
            <span className="text-primary">not your software.</span>
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto">
            GarageTab is the simple shop management tool built for solo mechanics and
            small independent shops. Repair orders, inspections, invoicing — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link
              href="/signup"
              className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-lg text-base font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              Start Free Trial <ArrowRight size={18} />
            </Link>
            <Link
              href="/pricing"
              className="bg-card hover:bg-card-hover border border-border text-foreground px-8 py-3 rounded-lg text-base font-medium transition-colors inline-flex items-center justify-center"
            >
              View Pricing
            </Link>
          </div>
          <p className="text-xs text-muted mt-4">
            14-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Built for shops doing $100K–$500K/year who need to stop losing
            repair orders on sticky notes.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Wrench size={24} />,
                title: "Repair Orders",
                desc: "Create an RO in under 60 seconds. Track status from estimate to paid.",
              },
              {
                icon: <Camera size={24} />,
                title: "Digital Inspections",
                desc: "Photo-based vehicle inspections. Red/yellow/green condition reports customers love.",
              },
              {
                icon: <CheckCircle size={24} />,
                title: "Customer Approvals",
                desc: "Send estimates via text. Customers approve with one tap — no login needed.",
              },
              {
                icon: <CreditCard size={24} />,
                title: "Invoicing & Payments",
                desc: "One-click invoicing. Accept card and ACH payments via Stripe.",
              },
              {
                icon: <Clock size={24} />,
                title: "5-Minute Setup",
                desc: "No sales calls, no onboarding meetings. Sign up and add your first RO today.",
              },
              {
                icon: <Star size={24} />,
                title: "Mobile-First",
                desc: "Designed for phones and tablets. Use it in the bay, not just the office.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="text-primary mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Simple pricing</h2>
          <p className="text-muted-foreground mb-10">
            No per-user fees. No hidden charges. Cancel anytime.
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-8">
              <h3 className="text-lg font-semibold">Starter</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-left">
                {[
                  "1 user",
                  "Unlimited repair orders",
                  "Digital vehicle inspections",
                  "Customer approvals via link",
                  "Stripe payments",
                  "Email support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle size={16} className="text-success shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg text-sm font-medium transition-colors text-center"
              >
                Start Free Trial
              </Link>
            </div>
            <div className="bg-card border-2 border-primary rounded-xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-3 py-1 rounded-full font-medium">
                Most Popular
              </div>
              <h3 className="text-lg font-semibold">Shop</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-left">
                {[
                  "Up to 5 users",
                  "Everything in Starter",
                  "Priority support",
                  "Custom branding",
                  "SMS notifications",
                  "Advanced reports",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle size={16} className="text-success shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg text-sm font-medium transition-colors text-center"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} GarageTab. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
