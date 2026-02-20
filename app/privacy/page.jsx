'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';

const LAST_UPDATED = 'February 2025';

const PRIVACY_HEADINGS = [
  { id: 'information-we-collect', label: '1. Information We Collect' },
  { id: 'how-we-use-it', label: '2. How We Use It' },
  { id: 'sharing', label: '3. Sharing' },
  { id: 'security', label: '4. Security' },
  { id: 'your-choices', label: '5. Your Choices' },
  { id: 'retention', label: '6. Retention' },
  { id: 'changes', label: '7. Changes' },
  { id: 'contact', label: '8. Contact' },
];

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      headings={PRIVACY_HEADINGS}
    >
      <p className="body text-muted-foreground">
        Quicklyway (“we”, “our”) respects your privacy. This policy explains how we collect, use, and protect your information when you use our marketplace platform.
      </p>

      <section id="information-we-collect">
        <h3 className="heading-3 text-foreground mb-3">1. Information We Collect</h3>
        <p className="body text-muted-foreground mb-2">
          We collect information you provide (e.g. name, email, password, profile details, location if you set it, payment-related data) and information we get from your use of the platform (e.g. device, IP, logs, cookies). When you use services as a Client or Seller, we also process order and communication data necessary to run the marketplace.
        </p>
      </section>

      <section id="how-we-use-it">
        <h3 className="heading-3 text-foreground mb-3">2. How We Use It</h3>
        <ul className="list-disc pl-5 space-y-1 body text-muted-foreground">
          <li>To provide, operate, and improve the platform (accounts, search, orders, payments, disputes).</li>
          <li>To communicate with you (notifications, support, updates).</li>
          <li>To enforce our Terms and policies and protect security.</li>
          <li>To comply with law and for other purposes described in this policy or with your consent.</li>
        </ul>
      </section>

      <section id="sharing">
        <h3 className="heading-3 text-foreground mb-3">3. Sharing</h3>
        <p className="body text-muted-foreground mb-2">
          We may share data with service providers (hosting, payments, email, analytics) who act on our instructions. We share profile and order-related information between Clients and Sellers as needed for transactions. We may disclose information when required by law or to protect rights and safety.
        </p>
      </section>

      <section id="security">
        <h3 className="heading-3 text-foreground mb-3">4. Security</h3>
        <p className="body text-muted-foreground mb-2">
          We use reasonable technical and organisational measures to protect your data. No system is completely secure; you are responsible for keeping your password and account secure.
        </p>
      </section>

      <section id="your-choices">
        <h3 className="heading-3 text-foreground mb-3">5. Your Choices</h3>
        <p className="body text-muted-foreground mb-2">
          You can update your profile and preferences in your account. You may have rights to access, correct, or delete your data, or to object to or restrict certain processing, depending on your jurisdiction. Contact us to exercise these rights.
        </p>
      </section>

      <section id="retention">
        <h3 className="heading-3 text-foreground mb-3">6. Retention</h3>
        <p className="body text-muted-foreground mb-2">
          We retain your information for as long as your account is active or as needed to provide services, resolve disputes, enforce our terms, and comply with legal obligations.
        </p>
      </section>

      <section id="changes">
        <h3 className="heading-3 text-foreground mb-3">7. Changes</h3>
        <p className="body text-muted-foreground mb-2">
          We may update this Privacy Policy from time to time. We will post the updated version and the “Last updated” date. Continued use after changes constitutes acceptance. For material changes we may notify you as required by law.
        </p>
      </section>

      <section id="contact">
        <h3 className="heading-3 text-foreground mb-3">8. Contact</h3>
        <p className="body text-muted-foreground">
          For privacy-related questions or requests, contact us through the Support or Help section in the app or at the contact details provided on the platform.
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
