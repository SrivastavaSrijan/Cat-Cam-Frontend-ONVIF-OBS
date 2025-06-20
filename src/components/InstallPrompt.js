import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import { Close, GetApp } from '@mui/icons-material';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showInstallSnackbar, setShowInstallSnackbar] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      // Show install prompt after a short delay
      setTimeout(() => {
        setShowInstallDialog(true);
      }, 3000);
    };

    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setDeferredPrompt(null);
      setIsInstallable(false);
      setShowInstallSnackbar(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setIsInstallable(false);
    setShowInstallDialog(false);
  };

  const handleDismiss = () => {
    setShowInstallDialog(false);
  };

  const handleSnackbarClose = () => {
    setShowInstallSnackbar(false);
  };

  if (!isInstallable) {
    return null;
  }

  return (
    <>
      {/* Install Dialog */}
      <Dialog
        open={showInstallDialog}
        onClose={handleDismiss}
        aria-labelledby="install-dialog-title"
        aria-describedby="install-dialog-description"
      >
        <DialogTitle id="install-dialog-title">
          Install SSV Cam
          <IconButton
            aria-label="close"
            onClick={handleDismiss}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="install-dialog-description">
            Install SSV Cam as a PWA for a better experience! You'll get:
            <br />
            • Faster loading times
            <br />
            • Offline access
            <br />
            • Native app-like experience
            <br />
            • Easy access from your home screen
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDismiss} color="primary">
            Not Now
          </Button>
          <Button
            onClick={handleInstallClick}
            color="primary"
            variant="contained"
            startIcon={<GetApp />}
          >
            Install
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={showInstallSnackbar}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          SSV Cam has been installed successfully! 🎉
        </Alert>
      </Snackbar>
    </>
  );
};

export default InstallPrompt;