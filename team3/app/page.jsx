"use client";
import { useState } from 'react';
import SignInCard from './components/login/SignInCard';
import SignUpCard from './components/login/SignUpCard';
import Box from '@mui/material/Box';



export default function Page() {
    const [signIn, setSignIn] = useState(true);

    const toggle = (prev) => {
        setSignIn(!prev);
    }


    const handleSubmit = (event) => {
        event.preventDefault();

        // place sign in method here

        
      };

    return (
            <Box 
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: 3,
                    margin:'auto',
                    height: { xs: '350px', md: '500px' },
                    width: { xs: '80vw', sm: '60vw', md: '30vw' },
                    
                }}
            >
            {signIn?<SignInCard onToggle={toggle} handleSubmit={handleSubmit} />:<SignUpCard onToggle={toggle} />}
            </Box>
            
  );
}