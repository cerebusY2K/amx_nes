import React, { useState, useEffect, useCallback } from 'react';
import { firestore, auth } from '../firebase';
import { doc, getDoc, updateDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { Container, Typography, Box, TextField, Button, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, FormControl, InputLabel, Select, FormHelperText, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import deepCleanObject from '../utils/deepCleanObject';

const generateUniqueId = () => '_' + Math.random().toString(36).substr(2, 9);

const ProjectDetail = ({ projectId }) => {
    const [project, setProject] = useState(null);
    const [newDocument, setNewDocument] = useState({ title: '', url: '', type: '' });
    const [userRole, setUserRole] = useState('');
    const [open, setOpen] = useState(false);
    const [errors, setErrors] = useState({ title: '', url: '', type: '' });
    const [highLevelBreakdown, setHighLevelBreakdown] = useState([{ task: '', platform: '', estimate: '' }]);
    const [newDeveloper, setNewDeveloper] = useState('');
    const [developers, setDevelopers] = useState([]);
    const [projectDevelopers, setProjectDevelopers] = useState([]);

    const fetchProject = useCallback(async () => {
        const docRef = doc(firestore, 'projects', projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setProject(docSnap.data());
        }
    }, [projectId]);

    const fetchDevelopers = useCallback(async () => {
        const querySnapshot = await getDocs(collection(firestore, 'users'));
        const developersData = querySnapshot.docs
            .map(doc => ({
                id: doc.id,
                email: doc.data().email,
                role: doc.data().role
            }))
            .filter(user => user.role === 'Developer');
        setDevelopers(developersData);
    }, []);

    const fetchProjectDevelopers = useCallback(async () => {
        const querySnapshot = await getDocs(collection(firestore, `projects/${projectId}/developers`));
        const developersData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setProjectDevelopers(developersData);
    }, [projectId]);

    useEffect(() => {
        const fetchUserRole = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(firestore, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserRole(userDoc.data().role);
                }
            }
        };

        fetchProject();
        fetchUserRole();
        fetchDevelopers();
        fetchProjectDevelopers();
    }, [fetchProject, fetchDevelopers, fetchProjectDevelopers]);

    const validateForm = () => {
        let valid = true;
        let newErrors = { title: '', url: '', type: '' };

        if (!newDocument.title) {
            newErrors.title = 'Document title is required';
            valid = false;
        }

        if (!newDocument.url) {
            newErrors.url = 'Document URL is required';
            valid = false;
        } else if (!/^https?:\/\//i.test(newDocument.url)) {
            newErrors.url = 'Document URL must be a valid URL';
            valid = false;
        }

        if (!newDocument.type) {
            newErrors.type = 'Document type is required';
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleAddDocument = async () => {
        if (!validateForm()) {
            return;
        }

        const docRef = doc(firestore, 'projects', projectId);
        const newDoc = {
            ...newDocument,
            addedBy: auth.currentUser.email,
            addedAt: new Date().toISOString(),
            signedOff: false,
        };

        // Determine the current phase and add the document to it
        const currentPhase = project.phases[project.phases.length - 1];
        const updatedPhases = project.phases.map((phase) => {
            if (phase.name === currentPhase.name) {
                return {
                    ...phase,
                    documents: phase.documents ? [...phase.documents, newDoc] : [newDoc],
                    timeline: [...phase.timeline, { id: generateUniqueId(), event: 'Document added', date: new Date().toISOString(), addedBy: auth.currentUser.email, document: newDoc }],
                };
            }
            return phase;
        });

        await updateDoc(docRef, deepCleanObject({ phases: updatedPhases }));
        fetchProject(); // Re-fetch the project data to sync state with Firestore
        setNewDocument({ title: '', url: '', type: '' });
        setOpen(false);
    };

    const handleSignOffDocument = async (phaseIndex, timelineId) => {
        const docRef = doc(firestore, 'projects', projectId);
        const updatedPhases = project.phases.map((phase, pIndex) => {
            if (pIndex === phaseIndex) {
                const updatedDocuments = phase.documents.map((document) => {
                    const timelineEntry = phase.timeline.find(entry => entry.id === timelineId);
                    if (
                        timelineEntry.document &&
                        timelineEntry.document.title === document.title &&
                        timelineEntry.document.url === document.url
                    ) {
                        return { ...document, signedOff: true };
                    }
                    return document;
                });

                const updatedTimeline = phase.timeline.map((entry) => {
                    if (entry.id === timelineId && entry.document) {
                        return {
                            ...entry,
                            document: { ...entry.document, signedOff: true },
                            signedOffBy: auth.currentUser.email,
                        };
                    }
                    return entry;
                });

                return {
                    ...phase,
                    documents: updatedDocuments,
                    timeline: updatedTimeline,
                };
            }
            return phase;
        });

        const allSignedOff = updatedPhases[phaseIndex].documents.every(doc => doc.signedOff);

        const updateData = deepCleanObject({ phases: updatedPhases });
        if (allSignedOff) {
            if (updatedPhases[phaseIndex].name === 'BA Phase') {
                updatedPhases.push({
                    name: 'Ideation Phase',
                    timeline: [{ id: generateUniqueId(), event: 'Project promoted to Ideation Phase', date: new Date().toISOString(), promotedBy: auth.currentUser.email }],
                    documents: [],
                });
                updateData.visibleToTeamLeads = true;
            } else if (updatedPhases[phaseIndex].name === 'Ideation Phase') {
                updatedPhases.push({
                    name: 'WBS Phase',
                    timeline: [{ id: generateUniqueId(), event: 'Project promoted to WBS Phase', date: new Date().toISOString(), promotedBy: auth.currentUser.email }],
                    documents: [],
                });
            }
        }

        await updateDoc(docRef, updateData);
        fetchProject(); // Re-fetch the project data to sync state with Firestore
    };

    const handleAddRow = () => {
        setHighLevelBreakdown([...highLevelBreakdown, { task: '', platform: '', estimate: '' }]);
    };

    const handleRemoveRow = (index) => {
        const updatedBreakdown = [...highLevelBreakdown];
        updatedBreakdown.splice(index, 1);
        setHighLevelBreakdown(updatedBreakdown);
    };

    const handleChange = (index, field, value) => {
        const updatedBreakdown = [...highLevelBreakdown];
        updatedBreakdown[index][field] = value;
        setHighLevelBreakdown(updatedBreakdown);
    };

    const handleSaveBreakdown = async () => {
        const docRef = doc(firestore, 'projects', projectId);
        const newBreakdown = {
            type: 'High Level Breakdown',
            data: highLevelBreakdown,
            addedBy: auth.currentUser.email,
            addedAt: new Date().toISOString(),
            signedOff: false,
        };
        const updatedPhases = (project.phases || []).map(phase => {
            if (phase.name === 'Ideation Phase') {
                return {
                    ...phase,
                    timeline: [...phase.timeline, { id: generateUniqueId(), event: 'High Level Breakdown added', date: new Date().toISOString(), addedBy: auth.currentUser.email, document: newBreakdown }],
                };
            }
            return phase;
        });
        await updateDoc(docRef, deepCleanObject({ phases: updatedPhases }));
        fetchProject(); // Re-fetch the project data to sync state with Firestore
        setHighLevelBreakdown([{ task: '', platform: '', estimate: '' }]); // Reset the breakdown
    };

    const handleSaveWBS = async () => {
        const docRef = doc(firestore, 'projects', projectId);
        const newBreakdown = {
            type: 'WBS',
            data: highLevelBreakdown,
            addedBy: auth.currentUser.email,
            addedAt: new Date().toISOString(),
            signedOff: false,
        };
        const updatedPhases = (project.phases || []).map(phase => {
            if (phase.name === 'WBS Phase') {
                return {
                    ...phase,
                    timeline: [...phase.timeline, { id: generateUniqueId(), event: 'WBS added', date: new Date().toISOString(), addedBy: auth.currentUser.email, document: newBreakdown }],
                };
            }
            return phase;
        });
        await updateDoc(docRef, deepCleanObject({ phases: updatedPhases }));
        fetchProject(); // Re-fetch the project data to sync state with Firestore
        setHighLevelBreakdown([{ task: '', platform: '', estimate: '' }]); // Reset the breakdown
    };

    const handleAddDeveloper = async () => {
        const docRef = doc(firestore, 'projects', projectId);
        const updatedDevelopers = (project.developers || []);
        // const docRef = doc(collection(firestore, `projects/${projectId}/developers`), newDeveloper);
        await setDoc(docRef, { email: newDeveloper });
        fetchProjectDevelopers();
        setNewDeveloper(''); // Reset the new developer input
    };

    if (!project) {
        return <Typography>Loading...</Typography>;
    }

    const renderTimeline = () => {
        return (project.phases || []).map((phase, phaseIndex) => (
            <Box key={phase.name} sx={{ mb: 4 }}>
                <Typography variant="h6">{phase.name}</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {phase.timeline.map((entry) => (
                        <Box key={entry.id} sx={{ padding: 2, borderLeft: '4px solid #000', marginLeft: 1 }}>
                            <Typography variant="body1">{entry.event}</Typography>
                            <Typography variant="body2" color="textSecondary">{new Date(entry.date).toLocaleString()}</Typography>
                            {entry.addedBy && <Typography variant="body2" color="textSecondary">Added by: {entry.addedBy}</Typography>}
                            {entry.developer && <Typography variant="body2" color="textSecondary">Developer: {entry.developer}</Typography>}
                            {entry.document && (
                                <>
                                    {entry.document.type === 'High Level Breakdown' || entry.document.type === 'WBS' ? (
                                        <>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Task</TableCell>
                                                        <TableCell>Platform</TableCell>
                                                        <TableCell>Estimate (hours)</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {entry.document.data.map((row, idx) => (
                                                        <TableRow key={idx}>
                                                            <TableCell>{row.task}</TableCell>
                                                            <TableCell>{row.platform}</TableCell>
                                                            <TableCell>{row.estimate}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                            {userRole === 'Business Analyst' && !entry.document.signedOff && (
                                                <Button variant="contained" color="primary" onClick={() => handleSignOffDocument(phaseIndex, entry.id)}>
                                                    Sign Off
                                                </Button>
                                            )}
                                            {entry.document.signedOff && <Typography variant="body2" color="textSecondary">Signed off by: {entry.signedOffBy}</Typography>}
                                        </>
                                    ) : (
                                        <>
                                            <Typography variant="body2" color="textSecondary">Title: {entry.document.title}</Typography>
                                            <Typography variant="body2" color="textSecondary">Type: {entry.document.type}</Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                URL: <a href={entry.document.url} target="_blank" rel="noopener noreferrer">{entry.document.url}</a>
                                            </Typography>
                                            {userRole === 'Admin' && !entry.document.signedOff && (
                                                <Button variant="contained" color="primary" onClick={() => handleSignOffDocument(phaseIndex, entry.id)}>
                                                    Sign Off
                                                </Button>
                                            )}
                                            {entry.document.signedOff && <Typography variant="body2" color="textSecondary">Signed off by: {entry.signedOffBy}</Typography>}
                                        </>
                                    )}
                                </>
                            )}
                        </Box>
                    ))}
                </Box>
            </Box>
        ));
    };

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const documentTypes = (phase) => {
        if (phase === 'BA Phase') {
            return ['BRD'];
        }
        if (phase === 'WBS Phase') {
            return ['Walkthrough'];
        }
        return [];
    };

    const currentPhaseName = project.phases[project.phases.length - 1]?.name;

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                {project.title}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
                {project.description}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Timeline</Typography>
                {userRole === 'Business Analyst' && (
                    <IconButton color="primary" onClick={handleClickOpen}>
                        <AddIcon />
                    </IconButton>
                )}
            </Box>
            <Box sx={{ height: '80vh', overflowY: 'auto' }}>
                {renderTimeline()}
            </Box>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Add Document or Link</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Document Title"
                        value={newDocument.title}
                        onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                        margin="normal"
                        error={!!errors.title}
                        helperText={errors.title}
                    />
                    <TextField
                        fullWidth
                        label="Document URL"
                        value={newDocument.url}
                        onChange={(e) => setNewDocument({ ...newDocument, url: e.target.value })}
                        margin="normal"
                        error={!!errors.url}
                        helperText={errors.url}
                    />
                    <FormControl fullWidth margin="normal" error={!!errors.type}>
                        <InputLabel>Document Type</InputLabel>
                        <Select
                            value={newDocument.type}
                            onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
                        >
                            {documentTypes(currentPhaseName).map(type => (
                                <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                        </Select>
                        {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="secondary">
                        Cancel
                    </Button>
                    <Button onClick={handleAddDocument} color="primary">
                        Add Document
                    </Button>
                </DialogActions>
            </Dialog>
            {userRole === 'Team Lead' && currentPhaseName === 'Ideation Phase' && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6">High-Level Breakdown</Typography>
                    {highLevelBreakdown.map((row, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <TextField
                                label="Task"
                                value={row.task}
                                onChange={(e) => handleChange(index, 'task', e.target.value)}
                                fullWidth
                            />
                            <FormControl fullWidth>
                                <InputLabel>Platform</InputLabel>
                                <Select
                                    value={row.platform}
                                    onChange={(e) => handleChange(index, 'platform', e.target.value)}
                                >
                                    <MenuItem value="Mobile">Mobile</MenuItem>
                                    <MenuItem value="JAX">JAX</MenuItem>
                                    <MenuItem value="DB">DB</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                label="Estimate (hours)"
                                type="number"
                                value={row.estimate}
                                onChange={(e) => handleChange(index, 'estimate', e.target.value)}
                                fullWidth
                            />
                            <IconButton onClick={() => handleRemoveRow(index)} color="error">
                                <RemoveIcon />
                            </IconButton>
                        </Box>
                    ))}
                    <Button onClick={handleAddRow} variant="contained" color="primary">
                        Add Row
                    </Button>
                    <Button onClick={handleSaveBreakdown} variant="contained" color="secondary" sx={{ ml: 2 }}>
                        Save Breakdown
                    </Button>
                </Box>
            )}
            {userRole === 'Team Lead' && currentPhaseName === 'WBS Phase' && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6">Add Developer</Typography>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Developer</InputLabel>
                        <Select
                            value={newDeveloper}
                            onChange={(e) => setNewDeveloper(e.target.value)}
                        >
                            {developers.map(dev => (
                                <MenuItem key={dev.id} value={dev.email}>{dev.email}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button onClick={handleAddDeveloper} variant="contained" color="primary">
                        Add Developer
                    </Button>
                </Box>
            )}
            {userRole === 'Developer' && currentPhaseName === 'WBS Phase' && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6">Work Breakdown Structure (WBS)</Typography>
                    {highLevelBreakdown.map((row, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <TextField
                                label="Task"
                                value={row.task}
                                onChange={(e) => handleChange(index, 'task', e.target.value)}
                                fullWidth
                            />
                            <FormControl fullWidth>
                                <InputLabel>Platform</InputLabel>
                                <Select
                                    value={row.platform}
                                    onChange={(e) => handleChange(index, 'platform', e.target.value)}
                                >
                                    <MenuItem value="Android">Android</MenuItem>
                                    <MenuItem value="iOS">iOS</MenuItem>
                                    <MenuItem value="Flutter">Flutter</MenuItem>
                                    <MenuItem value="Online">Online</MenuItem>
                                    <MenuItem value="JAX">JAX</MenuItem>
                                    <MenuItem value="DB">DB</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                label="Estimate (hours)"
                                type="number"
                                value={row.estimate}
                                onChange={(e) => handleChange(index, 'estimate', e.target.value)}
                                fullWidth
                            />
                            <IconButton onClick={() => handleRemoveRow(index)} color="error">
                                <RemoveIcon />
                            </IconButton>
                        </Box>
                    ))}
                    <Button onClick={handleAddRow} variant="contained" color="primary">
                        Add Row
                    </Button>
                    <Button onClick={handleSaveWBS} variant="contained" color="secondary" sx={{ ml: 2 }}>
                        Save WBS
                    </Button>
                </Box>
            )}
        </Container>
    );
};

export default ProjectDetail;
