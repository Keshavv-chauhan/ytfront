import React, { useState } from 'react';
import { Download, Info, Play, User, Calendar, Eye, Clock, AlertCircle } from 'lucide-react';
import './YouTubeDownloader.css';

const YouTubeDownloader = () => {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [format, setFormat] = useState('mp4');
  const [videoQuality, setVideoQuality] = useState('best');
  const [audioQuality, setAudioQuality] = useState('best');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);

  const API_BASE = 'https://ytdownkb.onrender.com';

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hrs > 0 ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` 
                   : `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num) => {
    if (!num) return 'N/A';
    return parseInt(num).toLocaleString();
  };

  const validateYouTubeURL = (url) => {
    const regex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return regex.test(url);
  };

  const getQualityLabel = (quality) => {
    if (quality === '2160p') return '2160p (4K)';
    if (quality === '1440p') return '1440p (2K)';
    if (quality === '1080p') return '1080p (Full HD)';
    if (quality === '720p') return '720p (HD)';
    if (quality === '480p') return '480p (SD)';
    if (quality === '360p') return '360p';
    if (quality === '240p') return '240p';
    if (quality === '144p') return '144p';
    return quality;
  };

  const getAudioQualityLabel = (quality) => {
    const bitrate = parseInt(quality.replace('kbps', ''));
    if (bitrate >= 320) return `${quality} (Very High)`;
    if (bitrate >= 256) return `${quality} (High)`;
    if (bitrate >= 192) return `${quality} (Good)`;
    if (bitrate >= 128) return `${quality} (Standard)`;
    return quality;
  };

  const getVideoInfo = async () => {
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!validateYouTubeURL(url)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('Getting video information...');
    setVideoInfo(null);

    try {
      const response = await fetch(`${API_BASE}/video-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get video info');
      }

      setVideoInfo(data);
      setMessage(`Video information loaded successfully! Available qualities: ${data.availableQualities.video.join(', ')}`);
      
      // Reset quality selections
      setVideoQuality('best');
      setAudioQuality('best');

    } catch (err) {
      setError(err.message || 'Failed to get video information');
      setVideoInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const debugFormats = async () => {
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!validateYouTubeURL(url)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('Getting debug information...');

    try {
      const response = await fetch(`${API_BASE}/debug-formats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get debug info');
      }

      setDebugInfo(data);
      setMessage(`Debug info loaded. Found ${data.totalFormats} formats.`);

    } catch (err) {
      setError(err.message || 'Failed to get debug information');
    } finally {
      setLoading(false);
    }
  };

  const downloadVideo = async () => {
    if (!videoInfo) {
      setError('Please get video information first');
      return;
    }

    setDownloading(true);
    setError('');
    setMessage(`Starting ${format.toUpperCase()} download at ${format === 'mp3' ? audioQuality : videoQuality} quality...`);
    setDownloadProgress(0);

    try {
      const response = await fetch(`${API_BASE}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          format,
          quality: format === 'mp3' ? audioQuality : videoQuality,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Download failed');
      }

      setDownloadProgress(100);
      setMessage(data.message);
      
      // Trigger download
      if (data.downloadUrl) {
        const link = document.createElement('a');
        link.href = `http://localhost:5000${data.downloadUrl}`;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    } catch (err) {
      setError(err.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleFormatChange = (newFormat) => {
    setFormat(newFormat);
    if (newFormat === 'mp3') {
      setAudioQuality('best');
    } else {
      setVideoQuality('best');
    }
  };

  return (
    <div className="youtube-downloader">
      <div className="main-card">
        {/* Header */}
        <div className="header">
          <h1>YouTube Video Downloader</h1>
          <p>Download YouTube videos in MP4 or MP3 format with support up to 4K quality</p>
        </div>

        {/* Main Card */}
        <div className="card">
          {/* URL Input */}
          <div className="input-group">
            <label className="input-label">YouTube URL</label>
            <div className="input-container">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                className="input-field"
                onKeyPress={(e) => e.key === 'Enter' && getVideoInfo()}
              />
              <button
                onClick={getVideoInfo}
                disabled={loading}
                className="btn btn-primary"
              >
                <Info size={18} />
                {loading ? 'Loading...' : 'Get Info'}
              </button>
              <button
                onClick={debugFormats}
                disabled={loading}
                className="btn btn-secondary"
              >
                Debug
              </button>
            </div>
          </div>

          {/* Format Selection */}
          <div className="input-group">
            <label className="input-label">Download Format</label>
            <div className="format-options">
              <label className="format-option">
                <input
                  type="radio"
                  value="mp4"
                  checked={format === 'mp4'}
                  onChange={(e) => handleFormatChange(e.target.value)}
                />
                <span>MP4 (Video + Audio)</span>
              </label>
              <label className="format-option">
                <input
                  type="radio"
                  value="mp3"
                  checked={format === 'mp3'}
                  onChange={(e) => handleFormatChange(e.target.value)}
                />
                <span>MP3 (Audio Only)</span>
              </label>
            </div>
          </div>

          {/* Quality Selection */}
          <div className="quality-grid">
            {/* Video Quality */}
            {format === 'mp4' && (
              <div>
                <label className="input-label">Video Quality</label>
                <select
                  value={videoQuality}
                  onChange={(e) => setVideoQuality(e.target.value)}
                  className="quality-select"
                >
                  <option value="best">Best Available Quality</option>
                  {videoInfo?.availableQualities.video.map((quality) => (
                    <option key={quality} value={quality}>
                      {getQualityLabel(quality)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Audio Quality */}
            <div>
              <label className="input-label">
                {format === 'mp3' ? 'Audio Quality' : 'Audio Quality (when merging)'}
              </label>
              <select
                value={audioQuality}
                onChange={(e) => setAudioQuality(e.target.value)}
                className="quality-select"
              >
                <option value="best">Best Available Quality</option>
                {videoInfo?.availableQualities.audio.map((quality) => (
                  <option key={quality} value={quality}>
                    {getAudioQualityLabel(quality)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quality Info Alert */}
          {videoInfo && (
            <div className="alert alert-info">
              <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                <AlertCircle size={16} />
                <div>
                  <p style={{ fontWeight: '600', marginBottom: '5px' }}>Quality Information:</p>
                  <p style={{ margin: 0 }}>
                    Higher quality videos (1080p+) may require merging separate video and audio streams, 
                    which takes longer but ensures the best quality. Some videos may only have combined 
                    streams up to 720p.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Download Button */}
          <button
            onClick={downloadVideo}
            disabled={!videoInfo || downloading}
            className="btn btn-success"
          >
            <Download size={20} />
            {downloading ? 'Downloading...' : `Download ${format.toUpperCase()}`}
          </button>

          {/* Progress Bar */}
          {downloading && (
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
              <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                {downloadProgress === 100 ? 'Download Complete!' : 'Processing...'}
              </p>
            </div>
          )}

          {/* Messages */}
          {message && (
            <div className="alert alert-info">
              <p style={{ margin: 0 }}>{message}</p>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <p style={{ margin: 0 }}>{error}</p>
            </div>
          )}
        </div>

        {/* Video Information Card */}
        {videoInfo && (
          <div className="card">
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Play style={{ color: '#ef4444' }} size={24} />
              Video Information
            </h2>
            
            <div className="video-info-grid">
              {/* Video Details */}
              <div className="video-details">
                <div>
                  <h3 style={{ fontWeight: '600', color: '#1f2937', fontSize: '1.125rem', marginBottom: '1rem' }}>
                    {videoInfo.title}
                  </h3>
                </div>
                
                <div className="video-meta">
                  <div className="meta-item">
                    <User size={16} />
                    <span>{videoInfo.author}</span>
                  </div>
                  
                  <div className="meta-item">
                    <Clock size={16} />
                    <span>{formatDuration(videoInfo.duration)}</span>
                  </div>
                  
                  <div className="meta-item">
                    <Eye size={16} />
                    <span>{formatNumber(videoInfo.viewCount)} views</span>
                  </div>
                  
                  <div className="meta-item">
                    <Calendar size={16} />
                    <span>{videoInfo.publishDate}</span>
                  </div>
                </div>

                {/* Available Qualities */}
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>Available Download Qualities:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {videoInfo.availableQualities.video.length > 0 && (
                      <div style={{ padding: '0.75rem', backgroundColor: '#dcfce7', borderRadius: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#166534', display: 'block', marginBottom: '0.25rem' }}>Video Qualities:</span>
                        <div className="quality-tags">
                          {videoInfo.availableQualities.video.map((quality) => (
                            <span key={quality} className="quality-tag quality-tag-video">
                              {getQualityLabel(quality)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {videoInfo.availableQualities.audio.length > 0 && (
                      <div style={{ padding: '0.75rem', backgroundColor: '#dbeafe', borderRadius: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1e40af', display: 'block', marginBottom: '0.25rem' }}>Audio Qualities:</span>
                        <div className="quality-tags">
                          {videoInfo.availableQualities.audio.map((quality) => (
                            <span key={quality} className="quality-tag quality-tag-audio">
                              {getAudioQualityLabel(quality)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Thumbnail */}
              <div className="video-thumbnail">
                <img
                  src={videoInfo.thumbnail}
                  alt="Video thumbnail"
                />
              </div>
            </div>

            {/* Description */}
            {videoInfo.description && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                <h4 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>Description:</h4>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
                  {videoInfo.description}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Debug Information Card */}
        {debugInfo && (
          <div className="card">
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem' }}>
              Debug Information - {debugInfo.title}
            </h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total formats found: {debugInfo.totalFormats}</p>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="debug-table">
                <thead>
                  <tr>
                    <th>ITAG</th>
                    <th>Container</th>
                    <th>Quality</th>
                    <th>Height</th>
                    <th>FPS</th>
                    <th>Video</th>
                    <th>Audio</th>
                    <th>Audio Bitrate</th>
                    <th>Size</th>
                  </tr>
                </thead>
                <tbody>
                  {debugInfo.formats.map((format, index) => (
                    <tr key={index}>
                      <td>{format.itag}</td>
                      <td>{format.container}</td>
                      <td>{format.qualityLabel || format.quality}</td>
                      <td>{format.height || 'N/A'}</td>
                      <td>{format.fps || 'N/A'}</td>
                      <td>{format.hasVideo ? '✓' : '✗'}</td>
                      <td>{format.hasAudio ? '✓' : '✗'}</td>
                      <td>{format.audioBitrate || 'N/A'}</td>
                      <td>{format.contentLength ? Math.round(format.contentLength / 1024 / 1024) + 'MB' : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeDownloader;
