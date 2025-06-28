"use client";
import Link from "next/link";
import { FiUsers, FiClock, FiDollarSign, FiShield, FiSmartphone, FiCheckCircle, FiTrendingUp } from "react-icons/fi";

export default function LandingPage() {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-blue-100 min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="py-24 px-4 text-center bg-gradient-to-br from-blue-100 to-white">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-gray-900 leading-tight">
          The most trusted <span className="text-blue-700">HRMS</span> for your people operations
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Modern HR, Payroll, Attendance, and Employee Self Service in one platform. Empower your organization with automation, compliance, and a delightful employee experience.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/register" className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 transition">Get Started Free</Link>
          <Link href="/login" className="bg-white border border-blue-600 text-blue-600 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-50 transition">Login</Link>
        </div>
        <div className="flex flex-wrap justify-center gap-8 mt-12 text-gray-500 text-lg">
          <div><span className="font-bold text-blue-700 text-2xl">30,000+</span> Companies</div>
          <div><span className="font-bold text-blue-700 text-2xl">3M+</span> Users</div>
          <div><span className="font-bold text-blue-700 text-2xl">25+</span> Countries</div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto py-20 px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Why Choose PeoplePulse HR?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard icon={<FiUsers />} title="Employee Self Service" desc="Empower employees to access payslips, manage leave, and update profiles from anywhere."/>
          <FeatureCard icon={<FiClock />} title="Attendance & Leave" desc="Track attendance, manage leave requests, and view balances easily with automation."/>
          <FeatureCard icon={<FiDollarSign />} title="Payroll Automation" desc="Automate payroll, ensure compliance, and generate payslips in one click."/>
          <FeatureCard icon={<FiShield />} title="HR Compliance" desc="Stay compliant with built-in statutory and company policies."/>
          <FeatureCard icon={<FiSmartphone />} title="Mobile First" desc="Access HR tools on the go with a mobile-friendly portal."/>
          <FeatureCard icon={<FiTrendingUp />} title="Reports & Analytics" desc="150+ admin reports covering all HR and payroll needs."/>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-blue-50 py-20 px-4">
        <h2 className="text-4xl font-bold text-center mb-12">What Our Customers Say</h2>
        <div className="flex flex-col md:flex-row justify-center gap-8 max-w-5xl mx-auto">
          <TestimonialCard name="Hiral Dave" company="Masterly Solutions Pvt. Ltd." quote="PeoplePulse HR is our go-to software for streamlined HR processes, including Employee Information Management, Payroll, Leave Management, and Attendance Management. The user-friendly interface and expert support make it a top choice."/>
          <TestimonialCard name="Priya Sharma" company="Tech Innovators" quote="We love the automation and compliance features. Our HR team and employees are happier and more productive!"/>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-5xl mx-auto py-20 px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Simple Pricing</h2>
        <div className="flex flex-col md:flex-row justify-center gap-8">
          <PricingCard plan="Starter" price="Free" features={["Up to 10 employees","Payroll & Attendance","Leave Management","Email Support"]}/>
          <PricingCard plan="Pro" price="$49/mo" features={["Unlimited employees","All Starter features","Advanced Reports","Priority Support"]}/>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 text-center bg-gradient-to-br from-blue-100 to-white">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to transform your HR operations?</h2>
        <p className="text-lg text-gray-600 mb-8">Start your free trial today and experience the difference.</p>
        <Link href="/register" className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-blue-700 transition">Start Free Trial</Link>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-8 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-lg font-bold text-blue-700">PeoplePulse HR</div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/">Home</Link>
            <Link href="/register">Register</Link>
            <Link href="/login">Login</Link>
            <a href="#" className="text-gray-400">Privacy Policy</a>
            <a href="#" className="text-gray-400">Terms of Use</a>
          </div>
          <div className="text-xs text-gray-400">© {new Date().getFullYear()} PeoplePulse HR. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-2xl transition border border-blue-100 flex flex-col items-center">
      <div className="text-blue-600 text-4xl mb-4">{icon}</div>
      <h3 className="font-bold text-xl mb-2">{title}</h3>
      <p className="text-gray-600">{desc}</p>
    </div>
  );
}

function TestimonialCard({ name, company, quote }: { name: string; company: string; quote: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-left max-w-md mx-auto border border-blue-100">
      <p className="text-gray-700 italic mb-4">{quote}</p>
      <div className="font-bold text-blue-700">{name}</div>
      <div className="text-gray-500 text-sm">{company}</div>
    </div>
  );
}

function PricingCard({ plan, price, features }: { plan: string; price: string; features: string[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-10 text-center min-w-[250px] border border-blue-100">
      <div className="text-2xl font-bold mb-2 text-blue-700">{plan}</div>
      <div className="text-3xl font-extrabold mb-4">{price}</div>
      <ul className="mb-6 text-gray-600 space-y-2">
        {features.map((f, i) => <li key={i}><FiCheckCircle className="inline mr-2 text-blue-500" />{f}</li>)}
      </ul>
      <Link href="/register" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition">Get Started</Link>
    </div>
  );
}
