import React, { useState, useEffect } from 'react';
import { firestore, auth } from '../firebase';
import { collection, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';
import {
    Container,
    Typography,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    Checkbox,
    FormControlLabel,
    Paper
} from '@mui/material';

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ForceUpdateService = () => {
    const [apps, setApps] = useState([]);
    const [selectedApp, setSelectedApp] = useState('');
    const [versionNumber, setVersionNumber] = useState('');
    const [versionCode, setVersionCode] = useState(0);
    const [priority, setPriority] = useState(0);
    const [isSuperUpdate, setIsSuperUpdate] = useState(false);
    const [isStagedUpdate, setIsStagedUpdate] = useState(false);

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

    useEffect(() => {
        const fetchLastVersionData = async () => {
            if (selectedApp) {
                try {
                    const docRef = doc(firestore, 'apps', selectedApp);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data().version;
                        setVersionNumber(data.versionNumber || '');
                        setVersionCode(data.versionCode || 0);
                        setPriority(data.priority || 0);
                        setIsSuperUpdate(data.isSuperUpdate || false);
                        setIsStagedUpdate(data.isStagedUpdate || false);
                    }
                } catch (error) {
                    console.error('Error fetching version data:', error);
                }
            }
        };

        fetchLastVersionData();
    }, [selectedApp]);

    const handleSuperUpdateChange = (e) => {
        const checked = e.target.checked;
        setIsSuperUpdate(checked);
        if (checked) {
            setIsStagedUpdate(false);
        }
    };

    const handleStagedUpdateChange = (e) => {
        const checked = e.target.checked;
        setIsStagedUpdate(checked);
        if (checked) {
            setIsSuperUpdate(false);
        }
    };

    const handleSubmit = async () => {
        try {
            const versionData = {
                versionNumber,
                versionCode,
                priority,
                isSuperUpdate,
                isStagedUpdate,
                updatedBy: auth.currentUser.email,
                timestamp: new Date(),
            };

            await setDoc(doc(firestore, 'apps', selectedApp), {
                version: versionData,
            }, { merge: true });

            if (isSuperUpdate) {
                await setDoc(doc(firestore, 'apps', selectedApp), {
                    lastSuperUpdate: versionNumber,
                }, { merge: true });
            }
            toast.success('Version updated successfully!');
        } catch (error) {
            console.error('Error updating version:', error);
        }
    };

    return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ padding: 3, marginTop: 5 }}>
                <Typography variant="h4" gutterBottom>
                    Force Update Service
                </Typography>
                <Box component="form" noValidate autoComplete="off">
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="app-select-label">Select App</InputLabel>
                        <Select
                            labelId="app-select-label"
                            value={selectedApp}
                            onChange={(e) => setSelectedApp(e.target.value)}
                            label="Select App"
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            {apps.map(app => (
                                <MenuItem key={app.id} value={app.id}>{app.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Version Number"
                        value={versionNumber}
                        onChange={(e) => setVersionNumber(e.target.value)}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Version Code"
                        type="number"
                        value={versionCode}
                        onChange={(e) => setVersionCode(Number(e.target.value))}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Priority"
                        type="number"
                        value={priority}
                        onChange={(e) => setPriority(Number(e.target.value))}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isSuperUpdate}
                                onChange={handleSuperUpdateChange}
                            />
                        }
                        label="Super Update"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isStagedUpdate}
                                onChange={handleStagedUpdateChange}
                            />
                        }
                        label="Enable Staged Update"
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        sx={{ marginTop: 2 }}
                    >
                        Submit
                    </Button>
                </Box>
            </Paper>
            <ToastContainer />
        </Container>
    );
};

export default ForceUpdateService;
