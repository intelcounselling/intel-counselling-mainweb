import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, AlertTriangle, Compass } from 'lucide-react';
import { CLINIC } from '../utils/site';

// Static informational pages: crisis support, privacy, terms, and 404.

const Shell: React.FC<{ eyebrow: string; title: string; children: React.ReactNode }> = ({ eyebrow, title, children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen bg-[#F7EBD3] pt-24 md:pt-32 pb-16 px-4">
      <article className="max-w-3xl mx-auto bg-white rounded-[28px] md:rounded-[28px] shadow-xl border border-black/5 p-6 sm:p-10 md:p-14">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-intel-dark/50 hover:text-intel-dark mb-8">
          <ArrowLeft size={14} /> Home
        </Link>
        <span className="block text-terracotta font-black text-[11px] uppercase tracking-[0.1em] mb-3">{eyebrow}</span>
        <h1 className="text-3xl md:text-5xl font-black serif text-intel-dark mb-8 leading-tight">{title}</h1>
        <div className="space-y-6 text-intel-dark/75 text-sm sm:text-base leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-intel-dark [&_h2]:serif [&_h2]:mt-8 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_a]:text-serene-green [&_a]:underline">
          {children}
        </div>
      </article>
    </div>
  );
};

const ContactBlock = () => (
  <p>
    Questions? Email <a href={CLINIC.emailHref}>{CLINIC.email}</a> or call <a href={CLINIC.phoneHref}>{CLINIC.phone}</a>.
  </p>
);

export const CrisisSupportPage: React.FC = () => (
  <Shell eyebrow="Immediate help" title="Crisis Support">
    <div className="flex gap-3 p-5 rounded-2xl bg-red-50 border border-red-100 text-red-800">
      <AlertTriangle size={20} className="shrink-0 mt-0.5" />
      <p className="font-semibold">
        If you or someone else is in immediate danger, call <a href="tel:112" className="!text-red-800">112</a> now.
        Intel Counselling is not an emergency service.
      </p>
    </div>
    <h2>Free helplines in India (24×7)</h2>
    <ul>
      <li><strong>Emergency services:</strong> <a href="tel:112">112</a></li>
      <li><strong>Tele-MANAS</strong> (Government of India mental health helpline): <a href="tel:14416">14416</a> or <a href="tel:18008914416">1-800-891-4416</a></li>
      <li><strong>AASRA</strong> (crisis intervention): <a href="tel:+919820466726">+91-9820466726</a></li>
    </ul>
    <h2>When you're ready for ongoing support</h2>
    <p>
      Our counsellors offer online and in-person sessions. <Link to="/booking">Book an appointment</Link> or take a
      free, confidential <Link to="/assessments">self-assessment</Link> to understand how you're feeling.
    </p>
    <ContactBlock />
  </Shell>
);

export const PrivacyPage: React.FC = () => (
  <Shell eyebrow="Last updated 27 October 2026" title="Privacy Policy">
    <p>
      This policy explains what Intel Counselling collects through this website, how it is protected and how it is used.
    </p>
    <h2>What we collect</h2>
    <ul>
      <li><strong>Account details:</strong> your name and email, and either a password (stored only as a salted hash) or your Google sign-in.</li>
      <li><strong>Intake details:</strong> phone, age, gender, occupation and, optionally, your reason for seeking support.</li>
      <li><strong>Assessment answers and results</strong> for the screenings and career assessment you take.</li>
      <li><strong>Booking details</strong> you enter when requesting a session.</li>
      <li><strong>Payment status</strong> of your orders. Card and bank details are handled by our payment provider, Razorpay, and never reach our servers.</li>
    </ul>
    <h2>How we protect it</h2>
    <p>
      Assessment answers and intake details are encrypted at rest (AES-256-GCM). Results linked to an account can only be
      opened by that account. Connections to the site are encrypted in transit.
    </p>
    <h2>How we use it</h2>
    <ul>
      <li>To score your assessments, show your results and send you your reports.</li>
      <li>To arrange and confirm sessions, including creating Google Meet links for online sessions.</li>
      <li>To contact you about your bookings and enquiries.</li>
    </ul>
    <p>
      We use service providers only to run these features, under contract: Razorpay (payments), Brevo (email delivery),
      Google (sign-in, Calendar and Meet) and our hosting providers. We do not sell your data or use it for advertising.
    </p>
    <h2>Who sees your results</h2>
    <ul>
      <li><strong>You.</strong> Results linked to your account can only be opened by you.</li>
      <li><strong>Your counsellor</strong>, only when you choose to share, for example by ticking "share my report" when you book a session.</li>
      <li><strong>Safety exception:</strong> if a result suggests you may be at risk (for example the self-harm question on the PHQ-9), our team is alerted so we can reach out. Confidentiality can also be set aside when the law requires it, such as a court order or a mandatory report under the POCSO Act.</li>
    </ul>
    <h2>Children (under 18)</h2>
    <p>
      Under India's Digital Personal Data Protection Act, 2023, we need a parent or guardian's consent before we store a
      child's answers. If you tell us you are under 18, we email a code to your parent or guardian and save nothing until they
      confirm. We do not track children's behaviour or show them advertising.
    </p>
    <h2>How long we keep it</h2>
    <ul>
      <li>Free screenings taken without an account are deleted after 30 days.</li>
      <li>Accounts with no activity for 3 years are deleted, after we email you a 30-day warning.</li>
      <li>Payment records are kept as long as tax law requires, with your name removed if you delete your account.</li>
    </ul>
    <h2>Your rights</h2>
    <p>
      You can update your details, <strong>download a copy of all your data</strong> and <strong>delete your account</strong>
      at any time from <Link to="/my-results">My Results</Link>. You can withdraw your consent at any time by deleting
      your account. If you have a concern about how we handle your data, contact our{' '}
      <Link to="/grievance">Grievance Officer</Link>. You may also complain to the Data Protection Board of India.
    </p>
    <h2>Data breaches</h2>
    <p>
      If a breach affects your data, we will tell you and the Data Protection Board of India as the law requires.
    </p>
    <ContactBlock />
  </Shell>
);

export const GrievancePage: React.FC = () => (
  <Shell eyebrow="Privacy & complaints" title="Grievance Officer">
    <p>
      If you have a complaint about how we handle your personal data, a payment, or our services, contact our Grievance
      Officer. We acknowledge every complaint within 48 hours and aim to resolve it within 30 days.
    </p>
    <h2>Contact</h2>
    <ul>
      <li><strong>Grievance Officer:</strong> Intel Counselling</li>
      <li><strong>Email:</strong> <a href={CLINIC.emailHref}>{CLINIC.email}</a> (subject: "Grievance")</li>
      <li><strong>Phone:</strong> <a href={CLINIC.phoneHref}>{CLINIC.phone}</a></li>
      <li><strong>Address:</strong> {CLINIC.addressLines.join(' ')}</li>
    </ul>
    <h2>What to include</h2>
    <p>Your name, the email on your account, and what happened. Please do not email your assessment answers.</p>
    <h2>Your data rights</h2>
    <p>
      You can download or delete your data yourself from <Link to="/my-results">My Results</Link>. If you are not satisfied
      with our response, you may complain to the Data Protection Board of India.
    </p>
  </Shell>
);

// DRAFT — review with the clinic before publishing
export const RefundPage: React.FC = () => (
  <Shell eyebrow="Payments" title="Refund & Cancellation Policy">
    <p>All prices are in Indian Rupees and inclusive of all taxes.</p>
    <h2>Counselling sessions</h2>
    <ul>
      <li>Cancel or reschedule at least 24 hours before your session for a full refund or a free reschedule.</li>
      <li>Cancellations within 24 hours, or missed sessions, are not refunded.</li>
      <li>If we have to cancel, you get a full refund or a new time, whichever you prefer.</li>
    </ul>
    <h2>Assessments</h2>
    <ul>
      <li>Request a refund within 7 days of purchase if you have not started any of the paid assessments.</li>
      <li>Once you have started a paid assessment, the purchase is not refundable. You can still retake it as often as you like.</li>
    </ul>
    <h2>How refunds work</h2>
    <p>
      Email <a href={CLINIC.emailHref}>{CLINIC.email}</a> with your order ID. Approved refunds go back to your original
      payment method through Razorpay, usually within 5–7 working days.
    </p>
    <p>
      Problems with a payment? Contact our <Link to="/grievance">Grievance Officer</Link>.
    </p>
  </Shell>
);

export const TermsPage: React.FC = () => (
  <Shell eyebrow="Last updated 2 October 2026" title="Terms of Service">
    <h2>Our services</h2>
    <p>
      Intel Counselling provides counselling sessions, free self-screening tools and a paid career guidance assessment.
    </p>
    <h2>Assessments are not a diagnosis</h2>
    <p>
      Our assessments are screening and guidance tools. They do not replace clinical evaluation by a qualified
      professional. In an emergency, see <Link to="/crisis-support">Crisis Support</Link>.
    </p>
    <h2>Your account</h2>
    <p>
      Keep your sign-in details private. You are responsible for activity on your account; contact us if you believe it
      has been accessed without your permission.
    </p>
    <h2>Payments and sessions</h2>
    <p>
      Prices are shown in Indian Rupees before you pay and are processed securely by Razorpay. To reschedule a session,
      reply to your confirmation email at least 24 hours in advance. Cancellations and refunds follow our <Link to="/refunds">Refund &amp; Cancellation Policy</Link>.
    </p>
    <ContactBlock />
  </Shell>
);

export const NotFoundPage: React.FC = () => (
  <div className="min-h-screen bg-[#F7EBD3] pt-28 pb-16 px-4 flex items-center justify-center">
    <div className="bg-white max-w-md w-full p-8 sm:p-10 rounded-[32px] shadow-xl border border-black/5 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-terracotta/10 text-terracotta mb-5">
        <Compass size={24} />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black serif text-intel-dark mb-2">Page not found</h1>
      <p className="text-sm text-intel-dark/60 mb-8">The page you're looking for doesn't exist or has moved.</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/" className="flex-1 bg-intel-dark text-white py-4 rounded-2xl font-semibold text-xs">Go home</Link>
        <Link to="/assessments" className="flex-1 bg-white text-intel-dark border border-black/10 py-4 rounded-2xl font-semibold text-xs">Assessments</Link>
      </div>
      <p className="text-xs text-intel-dark/50 mt-6 flex items-center justify-center gap-4">
        <a href={CLINIC.phoneHref} className="inline-flex items-center gap-1 hover:text-intel-dark"><Phone size={12} /> Call us</a>
        <a href={CLINIC.emailHref} className="inline-flex items-center gap-1 hover:text-intel-dark"><Mail size={12} /> Email us</a>
      </p>
    </div>
  </div>
);
