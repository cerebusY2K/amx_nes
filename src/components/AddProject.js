import React, { useState } from 'react';
import { firestore, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Container, Typography, TextField, Button, Box, Paper } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddProject = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const handleAddProject = async () => {
        try {
            const projectData = {
                title,
                description,
                createdBy: auth.currentUser.email,
                createdAt: new Date().toISOString(),
                phases: [{
                    name: 'BA Phase',
                    documents: [],
                    timeline: [{ event: 'Project created', date: new Date().toISOString(), createdBy: auth.currentUser.email }],
                }],
            };

            await addDoc(collection(firestore, 'projects'), projectData);
            setTitle('');
            setDescription('');
            toast.success('Project added successfully!');
        } catch (error) {
            console.error('Error adding project:', error);
            toast.error('Failed to add project');
        }
    };

    return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ padding: 3, marginTop: 5 }}>
                <Typography variant="h4" gutterBottom>
                    Add Project
                </Typography>
                <Box component="form" noValidate autoComplete="off">
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Project Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Project Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddProject}
                        sx={{ marginTop: 2 }}
                    >
                        Add Project
                    </Button>
                </Box>
            </Paper>
            <ToastContainer />
        </Container>
    );
};

export default AddProject;
