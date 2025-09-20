"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

export default function DicomViewer() {
  // Use refs to store browser-only libraries (NO direct imports of cornerstone libraries)
  const cornerstoneRef = useRef(null);
  const cornerstoneWADOImageLoaderRef = useRef(null);
  const cornerstoneToolsRef = useRef(null);
  const dicomParserRef = useRef(null);
  const HammerRef = useRef(null);

  const elementRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [loadedImageId, setLoadedImageId] = useState(null);
  const [status, setStatus] = useState('No image loaded');
  const [isLoading, setIsLoading] = useState(false);
  const [imageInfo, setImageInfo] = useState(null);
  const [viewport, setViewport] = useState({ 
    scale: 1, 
    translation: { x: 0, y: 0 }, 
    invert: false, 
    voi: { windowWidth: 0, windowCenter: 0 } 
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(1);
  const [currentImage, setCurrentImage] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState(null); // 'rectangle', 'circle', null
  const [annotations, setAnnotations] = useState([]);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  
  // Client-side only flag to prevent SSR issues
  const [isClient, setIsClient] = useState(false);
  
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);

  // Set client flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const loadFile = useCallback(async (file) => {
    if (!file || typeof window === 'undefined') return;
    setIsLoading(true);
    setStatus('Loading file...');

    try {
      // Wait for cornerstone to be available
      if (!cornerstoneWADOImageLoaderRef.current || !cornerstoneRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return loadFile(file);
      }

      const cornerstone = cornerstoneRef.current;
      const cornerstoneWADOImageLoader = cornerstoneWADOImageLoaderRef.current;

      // Create a URL for the file
      const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
      setLoadedImageId(imageId);

      const el = elementRef.current;
      const image = await cornerstone.loadImage(imageId);
      setCurrentImage(image);
      
      // Check if this is a multi-frame image
      let numFrames = 1;
      try {
        // Try to get number of frames from DICOM data
        if (image.data && image.data.string) {
          const framesStr = image.data.string('x00280008'); // Number of Frames tag
          numFrames = framesStr ? parseInt(framesStr, 10) : 1;
        }
        // Alternative method for multi-frame detection
        if (image.data && image.data.numImages) {
          numFrames = image.data.numImages;
        }
      } catch (frameError) {
        console.warn('Could not detect frame count:', frameError);
        numFrames = 1;
      }
      
      setTotalFrames(numFrames);
      setCurrentFrame(0);
      
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
          windowCenter: viewport.voi.windowCenter,
          frames: numFrames
        });
      } catch (metaError) {
        console.warn('Could not extract DICOM metadata:', metaError);
        setImageInfo({
          dimensions: `${image.columns} x ${image.rows}`,
          windowWidth: viewport.voi.windowWidth,
          windowCenter: viewport.voi.windowCenter,
          frames: numFrames
        });
      }

      setStatus(`Image loaded successfully${numFrames > 1 ? ` (${numFrames} frames)` : ''}`);
    } catch (err) {
      console.error('Error loading DICOM file:', err);
      setStatus('Failed to load DICOM: The file may be corrupted or not a valid DICOM image');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      loadFile(files[0]);
    }
  }, [loadFile]);

  const navigateToFrame = useCallback((frameNumber) => {
    if (!currentImage || totalFrames <= 1 || !cornerstoneRef.current) return;
    if (frameNumber < 0 || frameNumber >= totalFrames) return;
    
    const el = elementRef.current;
    if (!el) return;
    
    try {
      // For multi-frame images, we need to create a new imageId with frame information
      const baseImageId = loadedImageId;
      const frameImageId = baseImageId + (baseImageId.includes('?') ? '&' : '?') + `frame=${frameNumber}`;
      
      cornerstoneRef.current.loadImage(frameImageId).then((image) => {
        cornerstoneRef.current.displayImage(el, image);
        const viewport = cornerstoneRef.current.getViewport(el);
        setViewport(viewport);
        setCurrentFrame(frameNumber);
        
        // Clear annotations when changing frames
        setAnnotations([]);
        setCurrentAnnotation(null);
      }).catch((err) => {
        console.warn('Frame navigation failed:', err);
        // Fallback: just update the frame counter
        setCurrentFrame(frameNumber);
      });
      
    } catch (err) {
      console.warn('Frame navigation to frame', frameNumber, 'failed', err);
    }
  }, [currentImage, totalFrames, loadedImageId]);

  const navigateFrame = useCallback((direction) => {
    if (!currentImage || totalFrames <= 1 || !cornerstoneRef.current) return;
    
    const el = elementRef.current;
    if (!el) return;
    
    try {
      let newFrame = currentFrame;
      if (direction === 'next' && currentFrame < totalFrames - 1) {
        newFrame = currentFrame + 1;
      } else if (direction === 'prev' && currentFrame > 0) {
        newFrame = currentFrame - 1;
      } else {
        return; // No change needed
      }
      
      navigateToFrame(newFrame);
      
    } catch (err) {
      console.warn('Frame navigation failed', err);
    }
  }, [currentImage, totalFrames, currentFrame, navigateToFrame]);

  const zoomImage = useCallback((factor) => {
    const el = elementRef.current;
    if (!el || typeof window === 'undefined' || !cornerstoneRef.current) return;
    
    try {
      // Check if there's an image loaded first
      const image = cornerstoneRef.current.getImage(el);
      if (!image) {
        console.warn('No image loaded for zoom');
        return;
      }

      const currentViewport = cornerstoneRef.current.getViewport(el);
      if (!currentViewport) {
        console.warn('No viewport available for zoom');
        return;
      }

      const newScale = Math.max(0.1, Math.min(10, currentViewport.scale * factor));
      const newViewport = { 
        ...currentViewport, 
        scale: newScale
      };
      
      cornerstoneRef.current.setViewport(el, newViewport);
      setViewport(newViewport);
      
      console.log(`Zoom: ${currentViewport.scale.toFixed(2)} -> ${newScale.toFixed(2)}`);
    } catch (err) {
      console.error('Zoom failed:', err);
    }
  }, []);

  // Drawing functionality
  const startDrawing = (e) => {
    if (!drawMode || !currentImage) return;
    
    const el = elementRef.current;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setCurrentAnnotation({
      type: drawMode,
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      id: Date.now()
    });
  };

  const updateDrawing = (e) => {
    if (!isDrawing || !currentAnnotation) return;
    
    const el = elementRef.current;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentAnnotation(prev => ({
      ...prev,
      endX: x,
      endY: y
    }));
  };

  const finishDrawing = () => {
    if (!isDrawing || !currentAnnotation) return;
    
    console.log('Finishing drawing:', currentAnnotation);
    
    // Only save annotation if it has some size
    const minSize = 5;
    const width = Math.abs(currentAnnotation.endX - currentAnnotation.startX);
    const height = Math.abs(currentAnnotation.endY - currentAnnotation.startY);
    
    console.log('Annotation size:', width, 'x', height);
    
    if (width > minSize || height > minSize) {
      console.log('Saving annotation to state');
      setAnnotations(prev => {
        const newAnnotations = [...prev, currentAnnotation];
        console.log('New annotations array:', newAnnotations);
        return newAnnotations;
      });
    } else {
      console.log('Annotation too small, not saving');
    }
    
    setIsDrawing(false);
    setCurrentAnnotation(null);
  };

  const clearAnnotations = () => {
    setAnnotations([]);
    setCurrentAnnotation(null);
  };

  const toggleDrawMode = (mode) => {
    setDrawMode(drawMode === mode ? null : mode);
    setIsDrawing(false);
    setCurrentAnnotation(null);
  };

  // Dynamic import and initialization of cornerstone libraries
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let isMounted = true;
    
    const initializeLibraries = async () => {
      try {
        const [core, wado, tools, dicom, hammer] = await Promise.all([
          import('cornerstone-core'),
          import('cornerstone-wado-image-loader'),
          import('cornerstone-tools'),
          import('dicom-parser'),
          import('hammerjs')
        ]);

        if (!isMounted) return;

        cornerstoneRef.current = core.default;
        cornerstoneWADOImageLoaderRef.current = wado.default;
        cornerstoneToolsRef.current = tools.default;
        dicomParserRef.current = dicom.default;
        HammerRef.current = hammer.default;

        const cornerstone = cornerstoneRef.current;
        const cornerstoneWADOImageLoader = cornerstoneWADOImageLoaderRef.current;
        const cornerstoneTools = cornerstoneToolsRef.current;
        const dicomParser = dicomParserRef.current;
        const Hammer = HammerRef.current;

        // Configure the WADO loader
        cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
        cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
        cornerstoneWADOImageLoader.external.Hammer = Hammer;

        const el = elementRef.current;
        if (!el) return;

        cornerstone.enable(el);

        // Mouse wheel zoom handler
        const onWheel = (e) => {
          e.preventDefault();
          if (!cornerstoneRef.current) return;
          
          try {
            // Check if there's an image loaded first
            const image = cornerstoneRef.current.getImage(el);
            if (!image) {
              return;
            }

            const currentViewport = cornerstoneRef.current.getViewport(el);
            if (!currentViewport) {
              return;
            }

            const delta = e.deltaY || e.wheelDelta;
            const scaleFactor = delta > 0 ? 0.9 : 1.1;
            const newScale = Math.max(0.1, Math.min(10, currentViewport.scale * scaleFactor));
            const newViewport = { 
              ...currentViewport, 
              scale: newScale
            };
            cornerstoneRef.current.setViewport(el, newViewport);
            setViewport(newViewport);
          } catch (err) {
            console.warn('Wheel zoom failed:', err);
          }
        };

        // Keyboard navigation handler
        const onKeyDown = (e) => {
          if (totalFrames <= 1) return;
          
          if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            navigateFrame('prev');
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            navigateFrame('next');
          } else if (e.key === 'Home') {
            e.preventDefault();
            navigateToFrame(0);
          } else if (e.key === 'End') {
            e.preventDefault();
            navigateToFrame(totalFrames - 1);
          }
        };

        document.addEventListener('keydown', onKeyDown);

        // Setup drawing event listeners
        const onMouseDown = (e) => {
          if (drawMode) {
            startDrawing(e);
          }
        };

        const onMouseMove = (e) => {
          if (drawMode && isDrawing) {
            updateDrawing(e);
          }
        };

        const onMouseUp = () => {
          if (drawMode && isDrawing) {
            finishDrawing();
          }
        };

        el.addEventListener('mousedown', onMouseDown);
        el.addEventListener('mousemove', onMouseMove);
        el.addEventListener('mouseup', onMouseUp);
        document.addEventListener('mouseup', onMouseUp); // Handle mouseup outside element

        // Setup drag and drop
        const dropArea = dropAreaRef.current;
        if (dropArea) {
          const preventDefaults = (e) => {
            e.preventDefault();
            e.stopPropagation();
          };
          const highlight = () => dropArea.classList.add('bg-gray-700', 'border-blue-400');
          const unhighlight = () => dropArea.classList.remove('bg-gray-700', 'border-blue-400');
          
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

        // Cleanup function
        return () => {
          el.removeEventListener('mousedown', onMouseDown);
          el.removeEventListener('mousemove', onMouseMove);
          el.removeEventListener('mouseup', onMouseUp);
          document.removeEventListener('keydown', onKeyDown);
          document.removeEventListener('mouseup', onMouseUp);
          try { cornerstone.disable(el); } catch (err) {}
        };

      } catch (error) {
        console.error('Failed to initialize cornerstone libraries:', error);
        setStatus('Failed to initialize DICOM viewer libraries');
      }
    };

    initializeLibraries();

    return () => { 
      isMounted = false; 
    };
  }, [handleDrop, navigateFrame, totalFrames, drawMode, isDrawing, finishDrawing, navigateToFrame, startDrawing, updateDrawing]);

  // Update canvas overlay when annotations change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      console.log('Rendering annotations:', annotations.length, currentAnnotation ? 'with current' : 'no current');
      
      const allAnnotations = currentAnnotation 
        ? [...annotations, currentAnnotation] 
        : annotations;
      
      if (allAnnotations.length > 0) {
        renderAnnotations(ctx, allAnnotations);
      }
    }
  }, [annotations, currentAnnotation]);

  const onFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) loadFile(file);
  };

  const resetView = () => {
    const el = elementRef.current;
    if (!el || typeof window === 'undefined' || !cornerstoneRef.current) return;
    try {
      const image = cornerstoneRef.current.getImage(el);
      if (!image) {
        console.warn('No image loaded for reset view');
        return;
      }
      
      const viewport = cornerstoneRef.current.getDefaultViewportForImage(el, image);
      cornerstoneRef.current.setViewport(el, viewport);
      setViewport(viewport);
      console.log('View reset to default');
    } catch (err) {
      console.warn('Reset view failed', err);
    }
  };

  const invertImage = () => {
    const el = elementRef.current;
    if (!el || typeof window === 'undefined' || !cornerstoneRef.current) return;
    try {
      const image = cornerstoneRef.current.getImage(el);
      if (!image) {
        console.warn('No image loaded for invert');
        return;
      }

      const currentViewport = cornerstoneRef.current.getViewport(el);
      const newViewport = {
        ...currentViewport,
        invert: !currentViewport.invert
      };
      cornerstoneRef.current.setViewport(el, newViewport);
      setViewport(newViewport);
      console.log(`Image invert: ${newViewport.invert ? 'ON' : 'OFF'}`);
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
      
      cornerstoneRef.current?.setViewport(el, newViewport);
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



  // Render annotations on canvas overlay
  const renderAnnotations = (ctx, allAnnotations) => {
    console.log('renderAnnotations called with:', allAnnotations.length, 'annotations');
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
    
    allAnnotations.forEach((annotation, index) => {
      console.log(`Rendering annotation ${index}:`, annotation);
      const { startX, startY, endX, endY, type } = annotation;
      
      if (type === 'rectangle') {
        const width = endX - startX;
        const height = endY - startY;
        ctx.fillRect(startX, startY, width, height);
        ctx.strokeRect(startX, startY, width, height);
        console.log(`Drew rectangle: ${startX},${startY} ${width}x${height}`);
      } else if (type === 'circle') {
        const centerX = (startX + endX) / 2;
        const centerY = (startY + endY) / 2;
        const radiusX = Math.abs(endX - startX) / 2;
        const radiusY = Math.abs(endY - startY) / 2;
        const radius = Math.max(radiusX, radiusY);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        console.log(`Drew circle: center ${centerX},${centerY} radius ${radius}`);
      }
    });
  };

  // Don't render anything until we're on the client side
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading DICOM Viewer...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0b354c] to-[#1a4a6b] text-white px-4 py-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg font-poppins">B</span>
            </div>
            <span className="text-2xl font-bold font-poppins">Thanusanth</span>
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
                  document.cookie = "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                  window.location.href = "/loginmain";
                }
              }}
              className="text-gray-200 hover:text-white transition-colors duration-200"
            >
              Logout
            </button>
          </nav>
          <button className="md:hidden p-2" onClick={toggleMenu} aria-label="Toggle menu">
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
                      document.cookie = "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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
        <h1 className="text-3xl font-bold mb-6 text-blue-300 border-b pb-2 border-gray-700">
          DICOM Image Viewer
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* File Upload Section */}
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-3 text-blue-400">Load DICOM Image</h2>
            
            <div 
              ref={dropAreaRef}
              className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center mb-4 transition-colors bg-gray-900"
            >
              <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-2 text-sm text-gray-400">
                Drag and drop your DICOM file here, or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".dcm,.dicom,application/dicom,application/octet-stream"
                onChange={onFileChange}
                className="hidden"
                id="file-upload"
              />
              <label 
                htmlFor="file-upload" 
                className="mt-2 inline-block bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                Browse Files
              </label>
            </div>
          </div>

          {/* Status and Image Info Section */}
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-3 text-blue-400">Status & Information</h2>
            
            <div className="mb-4 p-3 bg-gray-900 rounded-md">
              <div className="flex items-center">
                <span className={`h-2 w-2 rounded-full mr-2 ${
                  isLoading ? 'bg-yellow-500 animate-pulse' : 
                  status.includes('Failed') ? 'bg-red-500' : 'bg-green-500'
                }`}></span>
                <span className="font-medium text-gray-300">Status:</span>
                <span className="ml-2 text-gray-100">{status}</span>
              </div>
            </div>

            {imageInfo && (
              <div className="border-t border-gray-700 pt-3">
                <h3 className="font-medium text-gray-300 mb-2">Image Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {imageInfo.patientName && (
                    <>
                      <span className="text-gray-400">Patient Name:</span>
                      <span className="text-gray-100">{imageInfo.patientName}</span>
                    </>
                  )}
                  {imageInfo.patientId && (
                    <>
                      <span className="text-gray-400">Patient ID:</span>
                      <span className="text-gray-100">{imageInfo.patientId}</span>
                    </>
                  )}
                  {imageInfo.studyDate && (
                    <>
                      <span className="text-gray-400">Study Date:</span>
                      <span className="text-gray-100">{imageInfo.studyDate}</span>
                    </>
                  )}
                  {imageInfo.modality && (
                    <>
                      <span className="text-gray-400">Modality:</span>
                      <span className="text-gray-100">{imageInfo.modality}</span>
                    </>
                  )}
                  <span className="text-gray-400">Dimensions:</span>
                  <span className="text-gray-100">{imageInfo.dimensions}</span>
                  {imageInfo.frames > 1 && (
                    <>
                      <span className="text-gray-400">Frames:</span>
                      <span className="text-gray-100">{imageInfo.frames}</span>
                      <span className="text-gray-400">Current Frame:</span>
                      <span className="text-gray-100">{currentFrame + 1} of {totalFrames}</span>
                    </>
                  )}
                  <span className="text-gray-400">Window Width:</span>
                  <span className="text-gray-100">{Math.round(imageInfo.windowWidth)}</span>
                  <span className="text-gray-400">Window Center:</span>
                  <span className="text-gray-100">{Math.round(imageInfo.windowCenter)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Viewer Section */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg mb-6">
          <h2 className="text-lg font-semibold mb-4 text-blue-400">Image Viewer</h2>
          
          <div className="border border-gray-700 rounded-lg overflow-hidden relative" style={{ height: '600px' }}>
            {/* Viewer element: cornerstone will draw into this div */}
            <div 
              ref={elementRef} 
              style={{ 
                width: '100%', 
                height: '100%', 
                background: 'linear-gradient(45deg, #1f2937 25%, transparent 25%, transparent 75%, #1f2937 75%, #1f2937), linear-gradient(45deg, #1f2937 25%, transparent 25%, transparent 75%, #1f2937 75%, #1f2937)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px',
                cursor: drawMode ? 'crosshair' : 'default'
              }} 
            />
            
            {/* Annotation overlay canvas */}
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 10
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

        {/* Frame Navigation Scroll Bar - Only show for multi-frame images */}
        {totalFrames > 1 && (
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => navigateFrame('prev')}
                  disabled={currentFrame === 0}
                  className="bg-indigo-700 text-white px-3 py-1 rounded-md hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  ‹
                </button>
                <span className="text-sm font-medium text-gray-300 min-w-[80px] text-center">
                  Frame {currentFrame + 1} of {totalFrames}
                </span>
                <button 
                  onClick={() => navigateFrame('next')}
                  disabled={currentFrame === totalFrames - 1}
                  className="bg-indigo-700 text-white px-3 py-1 rounded-md hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  ›
                </button>
              </div>
              
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="0"
                  max={totalFrames - 1}
                  value={currentFrame}
                  onChange={(e) => navigateToFrame(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${(currentFrame / (totalFrames - 1)) * 100}%, #374151 ${(currentFrame / (totalFrames - 1)) * 100}%, #374151 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1</span>
                  <span>{Math.floor(totalFrames / 2)}</span>
                  <span>{totalFrames}</span>
                </div>
              </div>
              
              <div className="flex space-x-1">
                <button 
                  onClick={() => navigateToFrame(0)}
                  disabled={currentFrame === 0}
                  className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First frame"
                >
                  ⏮
                </button>
                <button 
                  onClick={() => navigateToFrame(totalFrames - 1)}
                  disabled={currentFrame === totalFrames - 1}
                  className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last frame"
                >
                  ⏭
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Drawing Tools Section */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg mb-6">
          <h2 className="text-lg font-semibold mb-4 text-blue-400">Drawing Tools</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-300">Annotation Tools</label>
              <div className="flex space-x-2">
                <button 
                  onClick={() => toggleDrawMode('rectangle')}
                  className={`flex-1 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    drawMode === 'rectangle' 
                      ? 'bg-orange-700 text-white' 
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  Rectangle
                </button>
                <button 
                  onClick={() => toggleDrawMode('circle')}
                  className={`flex-1 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    drawMode === 'circle' 
                      ? 'bg-orange-700 text-white' 
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  Circle
                </button>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Annotations ({annotations.length})
              </label>
              <div className="flex space-x-2">
                <button 
                  onClick={clearAnnotations}
                  disabled={annotations.length === 0}
                  className="flex-1 bg-red-700 text-white py-2 rounded-md hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear All
                </button>
                <button 
                  onClick={() => setDrawMode(null)}
                  disabled={!drawMode}
                  className="flex-1 bg-gray-700 text-gray-300 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Stop Drawing
                </button>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Mode: {drawMode ? `Drawing ${drawMode}` : 'Pan/Zoom'}
              </label>
              <div className="text-xs text-gray-400">
                {drawMode ? 'Click and drag to draw' : 'Use mouse wheel to zoom'}
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-300">Quick Actions</label>
              <button
                onClick={() => {
                  if (typeof window !== "undefined" && typeof document !== "undefined") {
                    try {
                      const el = elementRef.current;
                      const canvas = el?.querySelector('canvas');
                      if (!canvas) {
                        alert('No image available to save');
                        return;
                      }
                      
                      // Create a composite image with annotations
                      const tempCanvas = document.createElement('canvas');
                      const tempCtx = tempCanvas.getContext('2d');
                      tempCanvas.width = canvas.width;
                      tempCanvas.height = canvas.height;
                      
                      // Draw the DICOM image
                      tempCtx.drawImage(canvas, 0, 0);
                      
                      // Draw annotations on top
                      renderAnnotations(tempCtx, annotations);
                      
                      const dataUrl = tempCanvas.toDataURL('image/png');
                      const link = document.createElement('a');
                      link.href = dataUrl;
                      link.download = 'dicom-annotated.png';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (err) {
                      alert('Save with annotations failed: ' + err.message);
                    }
                  }
                }}
                disabled={!currentImage}
                className="flex-1 bg-green-700 text-white py-2 rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save with Annotations
              </button>
            </div>
          </div>
        </div>

        {/* Image Controls Section */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-blue-400">Image Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Frame Navigation (only show if multi-frame) */}
            {totalFrames > 1 && (
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Frame: {currentFrame + 1} / {totalFrames}
                </label>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => navigateFrame('prev')}
                    disabled={currentFrame === 0}
                    className="flex-1 bg-indigo-700 text-white py-2 rounded-md hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => navigateFrame('next')}
                    disabled={currentFrame === totalFrames - 1}
                    className="flex-1 bg-indigo-700 text-white py-2 rounded-md hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Zoom: {viewport.scale.toFixed(2)}x
              </label>
              <div className="flex space-x-2">
                <button 
                  onClick={() => zoomImage(1.2)}
                  disabled={!currentImage}
                  className="flex-1 bg-blue-700 text-white py-2 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Zoom In
                </button>
                <button 
                  onClick={() => zoomImage(0.8)}
                  disabled={!currentImage}
                  className="flex-1 bg-blue-700 text-white py-2 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Zoom Out
                </button>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-300">Window Width/Level</label>
              <div className="flex space-x-2">
                <button 
                  onClick={() => adjustWindowLevel('width', 10)}
                  disabled={!currentImage}
                  className="flex-1 bg-green-700 text-white py-2 rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  WW +
                </button>
                <button 
                  onClick={() => adjustWindowLevel('width', -10)}
                  disabled={!currentImage}
                  className="flex-1 bg-green-700 text-white py-2 rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  WW -
                </button>
                <button 
                  onClick={() => adjustWindowLevel('center', 10)}
                  disabled={!currentImage}
                  className="flex-1 bg-purple-700 text-white py-2 rounded-md hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  WL +
                </button>
                <button 
                  onClick={() => adjustWindowLevel('center', -10)}
                  disabled={!currentImage}
                  className="flex-1 bg-purple-700 text-white py-2 rounded-md hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  WL -
                </button>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-300">Image Operations</label>
              <div className="flex space-x-2">
                <button 
                  onClick={resetView}
                  disabled={!currentImage}
                  className="flex-1 bg-gray-700 text-gray-300 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset View
                </button>
                <button 
                  onClick={invertImage}
                  disabled={!currentImage}
                  className="flex-1 bg-gray-700 text-gray-300 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {viewport.invert ? 'Restore' : 'Invert'}
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== "undefined" && typeof document !== "undefined") {
                      try {
                        const el = elementRef.current;
                        const canvas = el?.querySelector('canvas');
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
                  disabled={!currentImage}
                  className="flex-1 bg-blue-700 text-white py-2 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save PNG
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-800 rounded-lg text-sm text-blue-300">
          <p className="font-semibold">Usage Notes:</p>
          <ul className="list-disc list-inside mt-1 ml-2 text-gray-300">
            <li>Drag and drop DICOM files or use the file browser to load images</li>
            <li>Use mouse wheel to zoom in and out (when not in drawing mode)</li>
            <li>For multi-frame DICOM files, use Previous/Next buttons or arrow keys to navigate</li>
            <li>Adjust Window Width/Level to change contrast and brightness</li>
            <li>Use keyboard shortcuts: Arrow keys for frame navigation</li>
            <li><strong>Drawing Tools:</strong> Click Rectangle/Circle buttons to start annotation mode</li>
            <li><strong>Annotations:</strong> Click and drag to draw shapes for marking regions of interest</li>
            <li><strong>Save with Annotations:</strong> Export images with your drawings included</li>
            <li>Click &quot;Stop Drawing&quot; or the same tool button to return to pan/zoom mode</li>
            <li>If a DICOM file fails to load, it may be corrupted or not a valid DICOM image</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
