import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithMicrosoft } from '../services/authService';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import {
    Container,
    Typography,
    Box,
    Button,
    Paper,
} from '@mui/material';
import SvgIcon from '@mui/material/SvgIcon';

// Custom Microsoft Icon using SVG
const MicrosoftIcon = (props) => (
    <SvgIcon {...props}>
        <svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 80 80" width="80px" height="80px"><path fill="#8bb7f0" d="M3.5 66.563L3.5 41.5 32.5 41.5 32.5 70.481z"/><path fill="#4e7ab5" d="M32,42v27.91L4,66.126V42H32 M33,41H3v26l30,4.054V41L33,41z"/><path fill="#8bb7f0" d="M35.5 70.888L35.5 41.5 76.5 41.5 76.5 76.428z"/><path fill="#4e7ab5" d="M76,42v33.856L36,70.45V42H76 M77,41H35v30.324L77,77V41L77,41z"/><g><path fill="#8bb7f0" d="M3.5 38.5L3.5 13.437 32.5 9.519 32.5 38.5z"/><path fill="#4e7ab5" d="M32,10.09V38H4V13.874L32,10.09 M33,8.946L3,13v26h30V8.946L33,8.946z"/></g><g><path fill="#8bb7f0" d="M35.5 38.5L35.5 9.112 76.5 3.572 76.5 38.5z"/><path fill="#4e7ab5" d="M76,4.144V38H36V9.55L76,4.144 M77,3L35,8.676V39h42V3L77,3z"/></g></svg>
    </SvgIcon>
);

const Login = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && user.email.endsWith('@almullaexchange.com')) {
                navigate('/dashboard');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const handleLogin = async () => {
        try {
            const result = await signInWithMicrosoft();
            const user = result.user;
            if (user.email.endsWith('@almullaexchange.com')) {
                // Redirect to dashboard
                navigate('/dashboard');
            } else {
                // Deny access
                alert('Access denied. Please use your company email.');
            }
        } catch (error) {
            console.error('Error signing in with Microsoft:', error);
        }
    };

    return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ padding: 3, marginTop: 5, textAlign: 'center' }}>
                <img 
                    src="https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/2d/a0/60/2da060b1-ceb3-f8c7-f7fb-b8ee5565e74e/AppIcon-1x_U007emarketing-0-7-0-sRGB-85-220-0.png/460x0w.webp" 
                    alt="Company Logo" 
                    style={{ width: '80px', marginBottom: '10px' }} 
                />
                <Typography variant="h4" gutterBottom>
                    Al Mulla Exchange
                </Typography>
                <Box textAlign="center" mt={2}>
                    <Button
                        variant="contained"
                        startIcon={<MicrosoftIcon />}
                        onClick={handleLogin}
                        sx={{ 
                            padding: 1.5, 
                            fontSize: '1rem', 
                            backgroundColor: '#2F2F2F', 
                            color: '#FFFFFF', 
                            '&:hover': { backgroundColor: '#1A1A1A' } 
                        }}
                    >
                        Login with Microsoft
                    </Button>
                </Box>
                <Typography variant="body2" color="textSecondary" mt={2}>
                    Powered by amXNes
                </Typography>
            </Paper>
        </Container>
    );
};

export default Login;
