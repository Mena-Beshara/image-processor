'use client';

import { useState, useRef, useCallback } from 'react';
import './globals.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Trial {
  id: number;
  label: string;
  base64: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<number | null>(null);
  const [width, setWidth] = useState<number>(1024);
  const [height, setHeight] = useState<number>(1024);
  const [loadingTrials, setLoadingTrials] = useState(false);
  const [loadingFinal, setLoadingFinal] = useState(false);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((selectedFile: File) => {
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File must be ≤ 50MB');
      return;
    }
    setFile(selectedFile);
    setError(null);
    setTrials([]);
    setSelectedStyle(null);
    setFinalUrl(null);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const uploadForTrials = async () => {
    if (!file) return;
    setLoadingTrials(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/trials`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setTrials([
        { id: 1, label: 'Style 1: Auto Contrast + Sharpness', base64: data.trial1 },
        { id: 2, label: 'Style 2: 4× Upscale', base64: data.trial2 },
        { id: 3, label: 'Style 3: Denoise + 2× Upscale', base64: data.trial3 },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to generate trials');
    } finally {
      setLoadingTrials(false);
    }
  };

  const generateFinal = async () => {
    if (!file || !selectedStyle) return;
    setLoadingFinal(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('style', String(selectedStyle));
      formData.append('width', String(width));
      formData.append('height', String(height));
      const res = await fetch(`${API_URL}/final`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      setFinalUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      setError(err.message || 'Failed to generate final image');
    } finally {
      setLoadingFinal(false);
    }
  };

  return (
    <div className="container">
      <h1>🖼️ Image Processor</h1>

      {/* Upload Zone */}
      <div
        className={`upload-zone ${dragOver ? 'dragover' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {file ? (
          <div>
            <strong>{file.name}</strong>
            <div style={{ color: '#a0a0b0', marginTop: 4 }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '1.25rem', marginBottom: 8 }}>📁 Drop an image or click to browse</div>
            <div style={{ color: '#a0a0b0', fontSize: '0.875rem' }}>PNG, JPG, WebP — max 50MB</div>
          </div>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {/* Generate Trials */}
      {file && trials.length === 0 && (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <button className="btn" onClick={uploadForTrials} disabled={loadingTrials}>
            {loadingTrials ? 'Generating trials...' : 'Generate Trial Previews'}
          </button>
        </div>
      )}

      {/* Trial Previews */}
      {trials.length > 0 && (
        <>
          <div className="trials-grid">
            {trials.map((trial) => (
              <div
                key={trial.id}
                className={`trial-card ${selectedStyle === trial.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedStyle(trial.id);
                  setFinalUrl(null);
                }}
              >
                <img src={`data:image/png;base64,${trial.base64}`} alt={trial.label} />
                <div className="trial-label">{trial.label}</div>
              </div>
            ))}
          </div>

          {/* Controls */}
          {selectedStyle && (
            <div className="controls">
              <div className="control-row">
                <label>Canvas Size</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  min={1}
                  max={4096}
                />
                <span style={{ color: '#a0a0b0' }}>×</span>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  min={1}
                  max={4096}
                />
              </div>
              <div className="control-row">
                <label>Selected</label>
                <span style={{ color: '#00d4aa', fontWeight: 600 }}>
                  Style {selectedStyle}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button className="btn" onClick={generateFinal} disabled={loadingFinal}>
                  {loadingFinal ? 'Processing...' : 'Generate Final PNG'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setTrials([]);
                    setSelectedStyle(null);
                    setFinalUrl(null);
                  }}
                >
                  Back to Upload
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Final Result */}
      {finalUrl && (
        <div className="result-section">
          <h3 style={{ marginBottom: '1rem' }}>Final Result</h3>
          <img src={finalUrl} alt="Final processed" />
          <div style={{ marginTop: '1rem' }}>
            <a
              href={finalUrl}
              download="final.png"
              className="btn"
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              Download PNG
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
