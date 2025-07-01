"use client";
import React from "react";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    org: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success'|'error'|'info'}>({open: false, message: '', severity: 'success'});

  // Cooldown timer for resend button
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (form.password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // Register user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            name: form.name,
            org: form.org
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        setMessage("Registration successful! Please check your email to verify your account.");
        setSnackbar({open: true, message: "Registration successful! Please check your email to verify your account.", severity: 'success'});
        if (typeof window !== "undefined") {
          localStorage.setItem("admin_email", form.email);
        }
      }
    } catch (err: unknown) {
      const error = err as DatabaseError;
      setError(error.message);
      setSnackbar({open: true, message: error.message, severity: 'error'});
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg(null);
    try {
      const { error } = await supabase.auth.resend({ 
        type: 'signup', 
        email: form.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
      setResendMsg('Verification email resent! Please check your inbox.');
      setSnackbar({open: true, message: 'Verification email resent! Please check your inbox.', severity: 'success'});
      setResendCooldown(30); // 30 seconds cooldown
    } catch {
      setResendMsg('Failed to resend verification email. Please try again later.');
      setSnackbar({open: true, message: 'Failed to resend verification email. Please try again later.', severity: 'error'});
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f7f8fa">
      <Box component="form" onSubmit={handleSubmit} sx={{ bgcolor: 'white', p: 5, borderRadius: 3, boxShadow: 3, width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Typography variant="h4" fontWeight={700} align="center" mb={1}>
          Create Your Account
        </Typography>
        <TextField
          label="Full Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          fullWidth
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          fullWidth
        />
        <TextField
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={handleChange}
          required
          fullWidth
          inputProps={{ minLength: 6 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword((show) => !show)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <TextField
          label="Confirm Password"
          name="confirmPassword"
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          fullWidth
          inputProps={{ minLength: 6 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle confirm password visibility"
                  onClick={() => setShowConfirmPassword((show) => !show)}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <TextField
          label="Organization Name (if creating new company)"
          name="org"
          value={form.org}
          onChange={handleChange}
          fullWidth
        />
        {error && (
          <MuiAlert severity="error" variant="outlined">{error}</MuiAlert>
        )}
        {message && (
          <MuiAlert severity="success" variant="outlined" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
            {message}
            <Button
              variant="text"
              size="small"
              sx={{ mt: 1, alignSelf: 'flex-start' }}
              disabled={resendLoading || resendCooldown > 0}
              onClick={handleResend}
            >
              {resendLoading ? 'Resending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
            </Button>
            {resendMsg && <Typography variant="body2" color="primary">{resendMsg}</Typography>}
          </MuiAlert>
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          disabled={loading}
          sx={{ fontWeight: 600, fontSize: 18, py: 1.5, mt: 1, boxShadow: 2, transition: 'all 0.2s' }}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </Button>
        <Typography align="center" variant="body2" color="text.secondary">
          Already have an account?{' '}
          <a href="/login" style={{ color: '#1976d2', textDecoration: 'underline' }}>Login</a>
        </Typography>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({...s, open: false}))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert onClose={() => setSnackbar(s => ({...s, open: false}))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
} 