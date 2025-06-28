"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("Auth callback started");
        console.log("Current URL:", window.location.href);
        console.log("Hash:", window.location.hash);
        console.log("Search params:", window.location.search);
        
        // Handle both hash-based and query parameter tokens
        let access_token = null;
        let refresh_token = null;
        
        // Check for hash-based tokens (from Supabase email link)
        if (window.location.hash) {
          const params = new URLSearchParams(window.location.hash.substring(1));
          access_token = params.get("access_token");
          refresh_token = params.get("refresh_token");
          console.log("Found tokens in hash:", { access_token: !!access_token, refresh_token: !!refresh_token });
        } else {
          // Check for query parameter tokens
          access_token = searchParams.get("access_token");
          refresh_token = searchParams.get("refresh_token");
          console.log("Found tokens in search params:", { access_token: !!access_token, refresh_token: !!refresh_token });
        }

        // If we have tokens, set the session
        if (access_token && refresh_token) {
          console.log("Setting session with tokens");
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          
          if (error) {
            console.error("Session setting error:", error);
            setStatus("error");
            setTimeout(() => {
              router.replace("/login");
            }, 2000);
            return;
          }

          console.log("Session set successfully:", data.session ? "Yes" : "No");
          if (data.session) {
            setStatus("success");
            // Wait a bit for the session to be properly established
            setTimeout(() => {
              console.log("Redirecting to onboarding");
              router.replace("/onboarding");
            }, 1000);
          } else {
            console.log("No session after setting tokens");
            setStatus("error");
            setTimeout(() => {
              router.replace("/login");
            }, 2000);
          }
        } else {
          console.log("No tokens found, checking current session");
          // Try to get the current session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Session retrieval error:", error);
            setStatus("error");
            setTimeout(() => {
              router.replace("/login");
            }, 2000);
            return;
          }

          console.log("Current session:", session ? "Exists" : "None");
          if (session) {
            setStatus("success");
            setTimeout(() => {
              console.log("Redirecting to onboarding with existing session");
              router.replace("/onboarding");
            }, 1000);
          } else {
            // Try to get user data directly
            console.log("No session, checking user data");
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError) {
              console.error("User retrieval error:", userError);
              setStatus("error");
              setTimeout(() => {
                router.replace("/login");
              }, 2000);
              return;
            }

            if (user) {
              console.log("User found:", user.email);
              setStatus("success");
              setTimeout(() => {
                console.log("Redirecting to onboarding with user data");
                router.replace("/onboarding");
              }, 1000);
            } else {
              console.log("No user available");
              setStatus("error");
              setTimeout(() => {
                router.replace("/login");
              }, 2000);
            }
          }
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        setStatus("error");
        setTimeout(() => {
          router.replace("/login");
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
        {status === "pending" && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Confirming your email</h2>
            <p className="text-gray-600">Please wait while we verify your account...</p>
          </div>
        )}
        {status === "success" && (
          <div className="text-center">
            <div className="text-green-600 text-4xl mb-4">✓</div>
            <h2 className="text-xl font-semibold mb-2">Email confirmed!</h2>
            <p className="text-gray-600">Redirecting to onboarding...</p>
          </div>
        )}
        {status === "error" && (
          <div className="text-center">
            <div className="text-red-600 text-4xl mb-4">✗</div>
            <h2 className="text-xl font-semibold mb-2">Verification failed</h2>
            <p className="text-gray-600">Could not confirm your email. Redirecting to login...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
} 