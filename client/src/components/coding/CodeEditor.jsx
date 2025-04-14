import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress
} from '@mui/material';
import { PlayArrow, Save } from '@mui/icons-material';

const CodeEditor = ({ initialCode, language, onLanguageChange, onRun, onSubmit, loading }) => {
  const [code, setCode] = useState(initialCode || '');
  
  const languages = [
    { id: 'javascript', name: 'JavaScript' },
    { id: 'python', name: 'Python' },
    { id: 'java', name: 'Java' },
    { id: 'cpp', name: 'C++' }
  ];

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const handleRun = () => {
    onRun(code);
  };

  const handleSubmit = () => {
    onSubmit(code);
  };

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Code Editor</Typography>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="language-select-label">Language</InputLabel>
          <Select
            labelId="language-select-label"
            id="language-select"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            label="Language"
          >
            {languages.map((lang) => (
              <MenuItem key={lang.id} value={lang.id}>
                {lang.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      <Box sx={{ flexGrow: 1, border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            wordWrap: 'on'
          }}
        />
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlayArrow />}
          onClick={handleRun}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Run'}
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<Save />}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Submit'}
        </Button>
      </Box>
    </Paper>
  );
};

export default CodeEditor;
