"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, company, loading } = useUser();
  const router = useRouter();
  const [companyError, setCompanyError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    } else if (!loading && user && !company) {
      setCompanyError("Your company has been deleted or is missing. Please register a new company or contact support.");
    }
  }, [user, company, loading, router]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (companyError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center text-red-600 gap-4">
        <div>{companyError}</div>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition font-semibold"
          onClick={() => router.push("/onboarding")}
        >
          Register New Organization
        </button>
      </div>
    );
  }
  return <>{children}</>;
} 