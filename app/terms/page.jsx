'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';

const LAST_UPDATED = 'February 2025';

const TERMS_HEADINGS = [
  { id: 'acceptance', label: '1. Acceptance' },
  { id: 'the-platform', label: '2. The Platform' },
  { id: 'accounts', label: '3. Accounts' },
  { id: 'clients', label: '4. Clients' },
  { id: 'sellers', label: '5. Sellers' },
  { id: 'orders-payments', label: '6. Orders & Payments' },
  { id: 'fees', label: '7. Fees' },
  { id: 'disputes', label: '8. Disputes' },
  { id: 'conduct', label: '9. Conduct' },
  { id: 'intellectual-property', label: '10. Intellectual Property' },
  { id: 'limitation-of-liability', label: '11. Limitation of Liability' },
  { id: 'termination', label: '12. Termination' },
  { id: 'changes', label: '13. Changes' },
  { id: 'general', label: '14. General' },
  { id: 'contact', label: '15. Contact' },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms & Conditions"
      lastUpdated={LAST_UPDATED}
      headings={TERMS_HEADINGS}
    >
      <p className="body text-muted-foreground">
        Welcome to Quicklyway. By accessing or using our platform, you agree to be bound by these Terms &amp; Conditions. Please read them carefully.
      </p>

      <section id="acceptance">
        <h3 className="heading-3 text-foreground mb-3">1. Acceptance</h3>
        <p className="body text-muted-foreground mb-2">
          By creating an account, browsing services, placing orders, or offering services on Quicklyway, you agree to these Terms, our Privacy Policy, and any role-specific agreements (e.g. Client Agreement, Seller Agreement). If you do not agree, do not use the platform.
        </p>
      </section>

      <section id="the-platform">
        <h3 className="heading-3 text-foreground mb-3">2. The Platform</h3>
        <p className="body text-muted-foreground mb-2">
          Quicklyway is a marketplace that connects Clients (buyers) with Sellers (service providers). We facilitate discovery, communication, orders, and payments. We are not a party to the actual service contract between you and another user; that contract is between you and them.
        </p>
      </section>

      <section id="accounts">
        <h3 className="heading-3 text-foreground mb-3">3. Accounts</h3>
        <ul className="list-disc pl-5 space-y-1 body text-muted-foreground">
          <li>You must provide accurate, complete information and keep your account secure.</li>
          <li>You are responsible for all activity under your account.</li>
          <li>You may have different roles (e.g. Client and/or Seller) subject to our approval where applicable.</li>
          <li>You must be at least 18 years old (or the age of majority in your jurisdiction) to use the platform.</li>
        </ul>
      </section>

      <section id="clients">
        <h3 className="heading-3 text-foreground mb-3">4. Clients</h3>
        <p className="body text-muted-foreground mb-2">
          As a Client, you may search for services, place orders, and pay through the platform. You agree to provide clear requirements, communicate in good faith with Sellers, pay as agreed, and not use the platform for any illegal or prohibited purpose. Refunds and cancellations are subject to our policies and the dispute process.
        </p>
      </section>

      <section id="sellers">
        <h3 className="heading-3 text-foreground mb-3">5. Sellers</h3>
        <p className="body text-muted-foreground mb-2">
          As a Seller, you may list and deliver services in line with your approved categories. You agree to deliver work as described, meet agreed deadlines, and comply with our Seller guidelines. Listings and conduct must be professional and lawful. We may suspend or remove access for violations.
        </p>
      </section>

      <section id="orders-payments">
        <h3 className="heading-3 text-foreground mb-3">6. Orders & Payments</h3>
        <ul className="list-disc pl-5 space-y-1 body text-muted-foreground">
          <li>Orders are binding when placed and accepted according to platform flow.</li>
          <li>Payments are processed through the platform. You agree to pay fees and prices as displayed and in accordance with our payment terms.</li>
          <li>We may hold funds in escrow or release them according to our policies and order status.</li>
          <li>Chargebacks or attempting to transact outside the platform to avoid fees may result in account action.</li>
        </ul>
      </section>

      <section id="fees">
        <h3 className="heading-3 text-foreground mb-3">7. Fees</h3>
        <p className="body text-muted-foreground mb-2">
          We may charge platform or service fees. Any applicable fees will be shown at the time of use or in your account/seller dashboard. We may change fees with notice where required by law.
        </p>
      </section>

      <section id="disputes">
        <h3 className="heading-3 text-foreground mb-3">8. Disputes</h3>
        <p className="body text-muted-foreground mb-2">
          If you have a dispute with another user, you should try to resolve it through the platform (messages, revision requests). Our dispute process and admin assistance are available as described in the app. Our resolution decisions (where we provide them) are final to the extent permitted by law.
        </p>
      </section>

      <section id="conduct">
        <h3 className="heading-3 text-foreground mb-3">9. Conduct</h3>
        <p className="body text-muted-foreground mb-2">
          You must not harass others, post false or misleading information, spam, or use the platform for fraud or illegal activity. You must not circumvent the platform to avoid fees or violate these Terms. We may remove content, suspend, or terminate accounts for violations.
        </p>
      </section>

      <section id="intellectual-property">
        <h3 className="heading-3 text-foreground mb-3">10. Intellectual Property</h3>
        <p className="body text-muted-foreground mb-2">
          Quicklyway and its branding, design, and technology are owned by us or our licensors. When you post content, you grant us a license to use it to operate and promote the platform. You remain responsible for having the rights to any content you post and for not infringing others’ rights.
        </p>
      </section>

      <section id="limitation-of-liability">
        <h3 className="heading-3 text-foreground mb-3">11. Limitation of Liability</h3>
        <p className="body text-muted-foreground mb-2">
          The platform is provided “as is.” We do not guarantee uninterrupted or error-free service. To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential damages, or for any loss arising from your use of the platform or dealings with other users. Our total liability is limited to the amount you paid us in the twelve months before the claim.
        </p>
      </section>

      <section id="termination">
        <h3  className="heading-3 text-foreground mb-3">12. Termination</h3>
        <p className="body text-muted-foreground mb-2">
          You may close your account at any time. We may suspend or terminate your access for breach of these Terms or for other reasons we deem necessary. Upon termination, your right to use the platform ceases; provisions that by nature should survive (e.g. liability, disputes) will survive.
        </p>
      </section>

      <section id="changes">
        <h3 className="heading-3 text-foreground mb-3">13. Changes</h3>
        <p className="body text-muted-foreground mb-2">
          We may update these Terms from time to time. We will post the updated version on the platform and update the “Last updated” date. Continued use after changes constitutes acceptance. For material changes we may notify you by email or in-app notice where required.
        </p>
      </section>

      <section id="general">
        <h3 className="heading-3 text-foreground mb-3">14. General</h3>
        <p className="body text-muted-foreground mb-2">
          These Terms are the entire agreement between you and Quicklyway regarding the platform. If any part is held unenforceable, the rest remains in effect. Our failure to enforce a right does not waive it. You may not assign these Terms; we may assign them. Governing law and dispute resolution will be as stated in the platform or applicable law.
        </p>
      </section>

      <section id="contact">
        <h3 className="heading-3 text-foreground mb-3">15. Contact</h3>
        <p className="body text-muted-foreground">
          For questions about these Terms &amp; Conditions, contact us through the Support or Help section in the app or at the contact details provided on the platform.
        </p>
      </section>

      <div className="pt-4 border-t border-border">
        <Button variant="outline" className="rounded-xl" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </LegalPageLayout>
  );
}
