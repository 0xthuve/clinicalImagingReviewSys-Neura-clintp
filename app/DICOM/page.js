"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

// Import these only on the client side to avoid SSR issues
let cornerstone, cornerstoneWADOImageLoader, dicomParser, Hammer;

if (typeof window !== 'undefined') {
  // Dynamically import these libraries only on the client side
  import('cornerstone-core').then((module) => {
    cornerstone = module.default;
  });
  import('cornerstone-wado-image-loader').then((module) => {
    cornerstoneWADOImageLoader = module.default;
  });
  import('dicom-parser').then((module) => {
    dicomParser = module.default;
  });
  import('hammerjs').then((module) => {
    Hammer = module.default;
  });
}

export default function DicomViewer() {
  const elementRef = useRef(null);
  const [loadedImageId, setLoadedImageId] = useState(null);
  const [status, setStatus] = useState('No image loaded');
  const [isLoading, setIsLoading] = useState(false);
  const [imageInfo, setImageInfo] = useState(null);
  const [viewport, setViewport] = useState({ scale: 1, translation: { x: 0, y: 0 }, invert: false, voi: { windowWidth: 0, windowCenter: 0 } });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const urlRef = useRef(null);
  const dropAreaRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDrop = useCallback((e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      loadFile(files[0]);
    }
  }, [loadFile]);

  useEffect(() => {
    // Only run this effect on the client side
    if (typeof window === 'undefined') return;

    const initializeCornerstone = async () => {
      // Wait for libraries to load
      if (!cornerstone || !cornerstoneWADOImageLoader || !dicomParser || !Hammer) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return initializeCornerstone();
      }

      // Configure the WADO loader for simple local file loading
      cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
      cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
      cornerstoneWADOImageLoader.external.Hammer = Hammer;

      const el = elementRef.current;
      if (!el) return;

      // Enable cornerstone on our DOM element
      cornerstone.enable(el);

      // Set up basic mouse wheel zoom behavior
      const onWheel = (e) => {
        e.preventDefault();
        try {
          const viewport = cornerstone.getViewport(el);
          const delta = e.deltaY || e.wheelDelta;
          const scaleFactor = delta > 0 ? 0.9 : 1.1;
          const newViewport = { 
            ...viewport, 
            scale: viewport.scale * scaleFactor 
          };
          cornerstone.setViewport(el, newViewport);
          setViewport(newViewport);
        } catch (err) {
          console.warn('Wheel interaction failed:', err);
        }
      };

      el.addEventListener('wheel', onWheel);

      // Set up drag and drop
      const dropArea = dropAreaRef.current;
      if (dropArea) {
        const preventDefaults = (e) => {
          e.preventDefault();
          e.stopPropagation();
        };
        
        const highlight = () => dropArea.classList.add('bg-blue-100', 'border-blue-400');
        const unhighlight = () => dropArea.classList.remove('bg-blue-100', 'border-blue-400');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
          dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
          dropArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
          dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        dropArea.addEventListener('drop', handleDrop, false);
      }

      return () => {
        el.removeEventListener('wheel', onWheel);
        try { cornerstone.disable(el); } catch (err) {}
      };
    };

    initializeCornerstone();
  }, [handleDrop]);

  const loadFile = async (file) => {
    if (!file || typeof window === 'undefined') return;
    setIsLoading(true);
    setStatus('Loading file...');

    try {
      // Wait for cornerstone to be available
      if (!cornerstoneWADOImageLoader) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return loadFile(file);
      }

      // Create a URL for the file
      const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
      setLoadedImageId(imageId);

      const el = elementRef.current;
      const image = await cornerstone.loadImage(imageId);
      cornerstone.displayImage(el, image);

      // Set a basic viewport (fit to window)
      const viewport = cornerstone.getDefaultViewportForImage(el, image);
      cornerstone.setViewport(el, viewport);
      setViewport(viewport);

      // Extract and display DICOM metadata if available
      try {
        const metaData = cornerstone.metaData.get('instance', imageId) || {};
        setImageInfo({
          patientName: metaData.PatientName || 'Unknown',
          patientId: metaData.PatientID || 'Unknown',
          studyDate: metaData.StudyDate || 'Unknown',
          modality: metaData.Modality || 'Unknown',
          dimensions: `${image.columns} x ${image.rows}`,
          windowWidth: viewport.voi.windowWidth,
          windowCenter: viewport.voi.windowCenter
        });
      } catch (metaError) {
        console.warn('Could not extract DICOM metadata:', metaError);
        setImageInfo({
          dimensions: `${image.columns} x ${image.rows}`,
          windowWidth: viewport.voi.windowWidth,
          windowCenter: viewport.voi.windowCenter
        });
      }

      setStatus('Image loaded successfully');
    } catch (err) {
      console.error('Error loading DICOM file:', err);
      setStatus('Failed to load DICOM: The file may be corrupted or not a valid DICOM image');
    } finally {
      setIsLoading(false);
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) loadFile(file);
  };

  const onLoadUrl = async () => {
    const url = urlRef.current && urlRef.current.value.trim();
    if (!url || typeof window === 'undefined') return;
    setIsLoading(true);
    setStatus('Loading URL...');

    try {
      // Wait for cornerstone to be available
      if (!cornerstone) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return onLoadUrl();
      }

      // For remote URLs, prefix with wadouri:
      const imageId = url.startsWith('wadouri:') ? url : 'wadouri:' + url;
      setLoadedImageId(imageId);

      const el = elementRef.current;
      const image = await cornerstone.loadImage(imageId);
      cornerstone.displayImage(el, image);
      const viewport = cornerstone.getDefaultViewportForImage(el, image);
      cornerstone.setViewport(el, viewport);
      setViewport(viewport);

      setStatus('Image loaded from URL successfully');
    } catch (err) {
      console.error(err);
      setStatus('Failed to load URL: ' + (err.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  const resetView = () => {
    const el = elementRef.current;
    if (!el || typeof window === 'undefined') return;
    try {
      const image = cornerstone.getImage(el);
      const viewport = cornerstone.getDefaultViewportForImage(el, image);
      cornerstone.setViewport(el, viewport);
      setViewport(viewport);
    } catch (err) {
      console.warn('Reset view failed', err);
    }
  };

  const invertImage = () => {
    const el = elementRef.current;
    if (!el || typeof window === 'undefined') return;
    try {
      const newViewport = {
        ...viewport,
        invert: !viewport.invert
      };
      cornerstone.setViewport(el, newViewport);
      setViewport(newViewport);
    } catch (err) {
      console.warn('Invert failed', err);
    }
  };

  const adjustWindowLevel = (type, value) => {
    const el = elementRef.current;
    if (!el || typeof window === 'undefined') return;
    try {
      const newViewport = { ...viewport };
      
      if (type === 'width') {
        newViewport.voi.windowWidth = Math.max(1, viewport.voi.windowWidth + value);
      } else if (type === 'center') {
        newViewport.voi.windowCenter = viewport.voi.windowCenter + value;
      }
      
      cornerstone.setViewport(el, newViewport);
      setViewport(newViewport);
      
      // Update image info if available
      if (imageInfo) {
        setImageInfo({
          ...imageInfo,
          windowWidth: newViewport.voi.windowWidth,
          windowCenter: newViewport.voi.windowCenter
        });
      }
    } catch (err) {
      console.warn('Window/Level adjustment failed', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0b354c] to-[#1a4a6b] text-white px-4 py-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg font-poppins">
                B
              </span>
            </div>
            <span className="text-2xl font-bold font-poppins">
              Thanusanth
            </span>
          </div>
          <nav className="hidden md:flex space-x-6">
            {[
              { name: "Home", href: "/" },
              { name: "Medical Expert Evaluation", href: "/login" },
              { name: "Datasets", href: "/datasets" },
              { name: "Researches", href: "#" },
              { name: "DICOM Viewer", href: "/DICOM" },
              { name: "Contact", href: "#" },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-200 hover:text-white transition-colors duration-200"
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  document.cookie =
                    "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                  window.location.href = "/loginmain";
                }
              }}
              className="text-gray-200 hover:text-white transition-colors duration-200"
            >
              Logout
            </button>
          </nav>
          <button
            className="md:hidden p-2"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.nav
            className="md:hidden mt-4 bg-[#0b354c]/95 rounded-lg p-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ul className="flex flex-col space-y-4">
              {[
                { name: "Home", href: "/" },
                { name: "Medical Expert Evaluation", href: "/login" },
                { name: "Datasets", href: "/datasets" },
                { name: "Researches", href: "#" },
                { name: "DICOM Viewer", href: "/DICOM" },
                { name: "Contact", href: "#" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="block text-gray-200 hover:text-white transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      document.cookie =
                        "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                      window.location.href = "/loginmain";
                    }
                  }}
                  className="block text-gray-200 hover:text-white transition-colors duration-200"
                >
                  Logout
                </button>
              </li>
            </ul>
          </motion.nav>
        )}
      </header>

      {/* DICOM Viewer Content */}
      <div className="p-4 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-blue-800 border-b pb-2">DICOM Image Viewer</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* File Upload Section */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3 text-blue-700">Load DICOM Image</h2>
            
            <div 
              ref={dropAreaRef}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 transition-colors"
            >
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">Drag and drop your DICOM file here, or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".dcm,.dicom,application/dicom,application/octet-stream"
                onChange={onFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="mt-2 inline-block bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                Browse Files
              </label>
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Load from URL</label>
              <div className="flex">
                <input 
                  ref={urlRef} 
                  placeholder="https://example.com/image.dcm" 
                  className="flex-grow border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
                <button 
                  onClick={onLoadUrl} 
                  className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  disabled={isLoading}
                >
                  Load
                </button>
              </div>
            </div>
          </div>

          {/* Status and Image Info Section */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3 text-blue-700">Status & Information</h2>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <span className={`h-2 w-2 rounded-full mr-2 ${isLoading ? 'bg-yellow-500 animate-pulse' : status.includes('Failed') ? 'bg-red-500' : 'bg-green-500'}`}></span>
                <span className="font-medium">Status:</span>
                <span className="ml-2">{status}</span>
              </div>
            </div>

            {imageInfo && (
              <div className="border-t pt-3">
                <h3 className="font-medium text-gray-700 mb-2">Image Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {imageInfo.patientName && (
                    <>
                      <span className="text-gray-600">Patient Name:</span>
                      <span>{imageInfo.patientName}</span>
                    </>
                  )}
                  {imageInfo.patientId && (
                    <>
                      <span className="text-gray-600">Patient ID:</span>
                      <span>{imageInfo.patientId}</span>
                    </>
                  )}
                  {imageInfo.studyDate && (
                    <>
                      <span className="text-gray-600">Study Date:</span>
                      <span>{imageInfo.studyDate}</span>
                    </>
                  )}
                  {imageInfo.modality && (
                    <>
                      <span className="text-gray-600">Modality:</span>
                      <span>{imageInfo.modality}</span>
                    </>
                  )}
                  <span className="text-gray-600">Dimensions:</span>
                  <span>{imageInfo.dimensions}</span>
                  <span className="text-gray-600">Window Width:</span>
                  <span>{Math.round(imageInfo.windowWidth)}</span>
                  <span className="text-gray-600">Window Center:</span>
                  <span>{Math.round(imageInfo.windowCenter)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Viewer Section */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4 text-blue-700">Image Viewer</h2>
          
          <div className="border rounded-lg overflow-hidden relative" style={{ height: '600px' }}>
            {/* Viewer element: cornerstone will draw into this div */}
            <div 
              ref={elementRef} 
              style={{ 
                width: '100%', 
                height: '100%', 
                background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0), linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px',
                cursor: 'default'
              }} 
            />
            
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-lg">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                  <p className="mt-2">Loading image...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-blue-700">Image Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-700">Zoom: {viewport.scale.toFixed(2)}x</label>
              <div className="flex space-x-2">
                <button 
                  onClick={() => {
                    const el = elementRef.current;
                    if (!el || typeof window === 'undefined') return;
                    const newViewport = { ...viewport, scale: viewport.scale * 1.2 };
                    cornerstone.setViewport(el, newViewport);
                    setViewport(newViewport);
                  }}
                  className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Zoom In
                </button>
                <button 
                  onClick={() => {
                    const el = elementRef.current;
                    if (!el || typeof window === 'undefined') return;
                    const newViewport = { ...viewport, scale: viewport.scale * 0.8 };
                    cornerstone.setViewport(el, newViewport);
                    setViewport(newViewport);
                  }}
                  className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Zoom Out
                </button>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-700">Window Width/Level</label>
              <div className="flex space-x-2">
                <button 
                  onClick={() => adjustWindowLevel('width', 10)}
                  className="flex-1 bg-green-100 text-green-700 py-2 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  WW +
                </button>
                <button 
                  onClick={() => adjustWindowLevel('width', -10)}
                  className="flex-1 bg-green-100 text-green-700 py-2 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  WW -
                </button>
                <button 
                  onClick={() => adjustWindowLevel('center', 10)}
                  className="flex-1 bg-purple-100 text-purple-700 py-2 rounded-md hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  WL +
                </button>
                <button 
                  onClick={() => adjustWindowLevel('center', -10)}
                  className="flex-1 bg-purple-100 text-purple-700 py-2 rounded-md hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  WL -
                </button>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-700">Image Operations</label>
              <div className="flex space-x-2">
                <button 
                  onClick={resetView}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Reset View
                </button>
                <button 
                  onClick={invertImage}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  {viewport.invert ? 'Restore' : 'Invert'}
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== "undefined" && typeof document !== "undefined") {
                      try {
                        const el = elementRef.current;
                        const canvas = el.querySelector('canvas');
                        if (!canvas) {
                          alert('No image available to save');
                          return;
                        }
                        const dataUrl = canvas.toDataURL('image/png');
                        const link = document.createElement('a');
                        link.href = dataUrl;
                        link.download = 'dicom-snapshot.png';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      } catch (err) {
                        alert('Save failed: ' + err.message);
                      }
                    }
                  }}
                  className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Save PNG
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
          <p className="font-semibold">Usage Notes:</p>
          <ul className="list-disc list-inside mt-1 ml-2">
            <li>Drag and drop DICOM files or use the file browser to load images</li>
            <li>Use mouse wheel to zoom in and out</li>
            <li>Adjust Window Width/Level to change contrast and brightness</li>
            <li>If a DICOM file fails to load, it may be corrupted or not a valid DICOM image</li>
            <li>For advanced features, install and configure <code>cornerstone-tools</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}