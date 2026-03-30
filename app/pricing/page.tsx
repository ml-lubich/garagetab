import Link from "next/link";
import { CheckCircle, ArrowLeft } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            GarageTab
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-8">
          <ArrowLeft size={14} /> Back to home
        </Link>

        <h1 className="text-4xl font-bold text-center mb-4">Simple, honest pricing</h1>
        <p className="text-muted-foreground text-center mb-12">
          No contracts. No per-user fees. 14-day free trial on all plans.
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Starter */}
          <div className="bg-card border border-border rounded-xl p-8">
            <h2 className="text-xl font-semibold">Starter</h2>
            <p className="text-sm text-muted-foreground mt-1">For solo mechanics</p>
            <div className="mt-6">
              <span className="text-5xl font-bold">$29</span>
              <span className="text-muted-foreground">/mo</span>
            </div>
            <p className="text-sm text-muted mt-2">or $23/mo billed annually (save 20%)</p>
            <Link
              href="/signup"
              className="mt-8 block w-full bg-card-hover hover:bg-border text-foreground py-3 rounded-lg text-sm font-medium text-center border border-border"
            >
              Start 14-Day Free Trial
            </Link>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "1 user account",
                "Unlimited repair orders",
                "Digital vehicle inspections",
                "Photo uploads",
                "Customer approval links",
                "Invoicing",
                "Stripe payment processing",
                "Email support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle size={16} className="text-success shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Shop */}
          <div className="bg-card border-2 border-primary rounded-xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-3 py-1 rounded-full font-medium">
              Most Popular
            </div>
            <h2 className="text-xl font-semibold">Shop</h2>
            <p className="text-sm text-muted-foreground mt-1">For small teams (2-5 techs)</p>
            <div className="mt-6">
              <span className="text-5xl font-bold">$49</span>
              <span className="text-muted-foreground">/mo</span>
            </div>
            <p className="text-sm text-muted mt-2">or $39/mo billed annually (save 20%)</p>
            <Link
              href="/signup"
              className="mt-8 block w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg text-sm font-medium text-center"
            >
              Start 14-Day Free Trial
            </Link>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "Up to 5 user accounts",
                "Everything in Starter",
                "Priority support",
                "Custom branding / logo",
                "SMS notifications",
                "Advanced reporting",
                "CSV data export",
                "Phone support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle size={16} className="text-success shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-lg font-semibold mb-2">Questions?</h3>
          <p className="text-sm text-muted-foreground">
            Email us at{" "}
            <span className="text-foreground">support@garagetab.com</span>. We respond
            within 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
