"use client";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import MuiCard from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import * as React from 'react';
import { signIn } from "next-auth/react";
import GoogleIcon from '@mui/icons-material/Google';

const Card = styled(MuiCard)(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  alignItems: 'center',
  width: '100%',
  padding: '4px',
  gap: '2px',
  margin: 'auto',
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  backgroundColor: '#00000',
  color: '#000000',
}));

export default function SignInCard({ onToggle, handleSubmit }) {  
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');

  const validateInputs = () => {
    const email = document.getElementById('email');
    const password = document.getElementById('password');

    let isValid = true;

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  const handleGoogleSignIn = async () => {
    await signIn('google', { 
      callbackUrl: '/dashboard'  
    });
  };

  return (
    <Card variant="outlined">
      <Typography
        component="h1"
        variant="h4"
        sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
      >
        Sign in
      </Typography>

      {/* Google Sign-In Button */}
      <Box sx={{ width: '100%', my: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleSignIn}
          sx={{ 
            textTransform: 'none',
            py: 1,
            borderColor: '#ddd',
            '&:hover': {
              borderColor: '#888',
            }
          }}
        >
          Sign in with Google
        </Button>
      </Box>

      <Divider sx={{ width: '100%', my: 2 }}>
        <Typography color="textSecondary">or</Typography>
      </Divider>

      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}
      >
        <FormControl>
          <FormLabel htmlFor="email">Email</FormLabel>
          <TextField
            error={emailError}
            helperText={emailErrorMessage}
            id="email"
            type="email"
            name="email"
            placeholder="your@email.com"
            autoComplete="email"
            autoFocus
            required
            fullWidth
            variant="outlined"
            color={emailError ? 'error' : 'primary'}
          />
        </FormControl>
        <FormControl>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <FormLabel htmlFor="password">Password</FormLabel>
          </Box>
          <TextField
            error={passwordError}
            helperText={passwordErrorMessage}
            name="password"
            placeholder="••••••"
            type="password"
            id="password"
            autoComplete="current-password"
            required
            fullWidth
            variant="outlined"
            color={passwordError ? 'error' : 'primary'}
          />
        </FormControl>
        
        <Button 
          type="submit" 
          fullWidth 
          variant="contained" 
          onClick={(e) => {
            e.preventDefault();
            if(validateInputs()){
              handleSubmit();
            }
          }}
        >
          Sign in
        </Button>
        <Typography sx={{ textAlign: 'center' }}>
          Don&apos;t have an account?{' '}
          <Link
            href="#"
            variant="body2"
            onClick={onToggle}
            sx={{ alignSelf: 'center', cursor: 'pointer' }}
          >
            Sign up
          </Link>
        </Typography>
      </Box>
    </Card>
  );
}