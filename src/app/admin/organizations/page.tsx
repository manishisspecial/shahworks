"use client";
import React, { useEffect, useState } from "react";
import { DatabaseService, Company } from "@/lib/database";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

export default function AdminOrganizationsPage() {
  const [deletedOrgs, setDeletedOrgs] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success'|'error'}>({open: false, message: '', severity: 'success'});

  const fetchDeletedOrgs = async () => {
    setLoading(true);
    const { data, error } = await DatabaseService.listCompanies(true);
    if (error) {
      setSnackbar({open: true, message: error.message, severity: 'error'});
      setDeletedOrgs([]);
    } else {
      setDeletedOrgs((data || []).filter((org: Company) => org.is_active === false));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDeletedOrgs();
  }, []);

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    const { error } = await DatabaseService.restoreCompany(id);
    if (error) {
      setSnackbar({open: true, message: error.message, severity: 'error'});
    } else {
      setSnackbar({open: true, message: 'Organization restored successfully!', severity: 'success'});
      fetchDeletedOrgs();
    }
    setRestoringId(null);
  };

  return (
    <Box minHeight="100vh" display="flex" flexDirection="column" alignItems="center" bgcolor="#f7f8fa" p={4}>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Restore Deleted Organizations
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : deletedOrgs.length === 0 ? (
        <Typography variant="body1" color="text.secondary">No deleted organizations found.</Typography>
      ) : (
        <Box width="100%" maxWidth={600}>
          {deletedOrgs.map(org => (
            <Box key={org.id} display="flex" alignItems="center" justifyContent="space-between" bgcolor="white" p={2} mb={2} borderRadius={2} boxShadow={1}>
              <Box>
                <Typography variant="h6">{org.name}</Typography>
                {org.email && <Typography variant="body2" color="text.secondary">{org.email}</Typography>}
                {org.address && <Typography variant="body2" color="text.secondary">{org.address}</Typography>}
              </Box>
              <Button
                variant="contained"
                color="primary"
                disabled={restoringId === org.id}
                onClick={() => handleRestore(org.id)}
              >
                {restoringId === org.id ? <CircularProgress size={24} /> : "Restore"}
              </Button>
            </Box>
          ))}
        </Box>
      )}
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