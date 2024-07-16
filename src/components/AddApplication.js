import React, { useState, useEffect } from 'react';
import { firestore, auth } from '../firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import {
    Container,
    Typography,
    Box,
    TextField,
    Button,
    Paper,
    List,
    ListItem,
    ListItemText,
    Divider,
} from '@mui/material';

const AddApplication = () => {
    const [appName, setAppName] = useState('');
    const [apps, setApps] = useState([]);

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const querySnapshot = await getDocs(collection(firestore, 'apps'));
                const appsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setApps(appsData);
            } catch (error) {
                console.error('Error fetching apps:', error);
            }
        };
        fetchApps();
    }, []);

    const handleSubmit = async () => {
        try {
            await addDoc(collection(firestore, 'apps'), {
                name: appName,
                version: {
                    versionNumber: '',
                    versionCode: 0,
                    priority: 0,
                    isSuperUpdate: false,
                    updatedBy: '',
                    timestamp: null,
                },
                lastSuperUpdate: '',
                createdBy: auth.currentUser.email,
                createdAt: new Date(),
            });
            setAppName('');
            // Re-fetch the apps after adding a new one
            const querySnapshot = await getDocs(collection(firestore, 'apps'));
            const appsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setApps(appsData);
        } catch (error) {
            console.error('Error adding application:', error);
        }
    };

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ padding: 3, marginTop: 5 }}>
                <Typography variant="h4" gutterBottom>
                    Add Application
                </Typography>
                <Box component="form" noValidate autoComplete="off" sx={{ marginBottom: 3 }}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Application Name"
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        sx={{ marginTop: 2 }}
                    >
                        Add Application
                    </Button>
                </Box>
                <Divider />
                <Typography variant="h5" gutterBottom sx={{ marginTop: 3 }}>
                    Existing Applications
                </Typography>
                <List>
                    {apps.map(app => (
                        <ListItem key={app.id}>
                            <ListItemText
                                primary={app.name}
                                secondary={`Version: ${app.version.versionNumber || 'N/A'}, Code: ${app.version.versionCode || 'N/A'}`}
                            />
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Container>
    );
};

export default AddApplication;
