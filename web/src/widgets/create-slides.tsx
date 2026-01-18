import "@/index.css";
import { useState } from "react";
import { mountWidget } from "skybridge/web";
import * as pdfjsLib from "pdfjs-dist";
import React from 'react';

// Configure PDF.js worker for client-side PDF processing
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// Embed frame-runner.html directly to avoid 404 in production
const FRAME_RUNNER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Frame Runner</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18.2.0/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/recharts@2.12.7/dist/Recharts.js"></script>
  <script src="https://unpkg.com/lucide@0.263.1/dist/umd/lucide.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    #root {
      /* Force strict 16:9 aspect ratio */
      aspect-ratio: 16 / 9;
      width: 100%;
      max-width: 100vw;
      max-height: 100vh;
      overflow: hidden;
      background: white;
      position: relative;
    }
    /* Ensure content fits within 16:9 */
    #root > * {
      width: 100%;
      height: 100%;
      overflow: hidden;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel" data-type="module">
    const { useState, useEffect, useMemo, useCallback } = React;

    // Custom hooks that Dust might use
    const useFile = (fileId) => {
      // Placeholder for file loading - returns null for now
      // In a real implementation, this would fetch file data
      return null;
    };

    // Simple Button component
    const Button = ({ children, variant, size, disabled, className = '', onClick, ...props }) => {
      const baseClasses = 'inline-flex items-center justify-center transition-all';
      const variantClasses = variant === 'outline' ? 'border border-current' : '';
      const sizeClasses = size === 'icon' ? 'p-2' : size === 'lg' ? 'px-6 py-3' : 'px-4 py-2';
      const disabledClasses = disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer';

      const handleClick = (e) => {
        if (!disabled && onClick) {
          onClick(e);
        }
      };

      return (
        <button
          onClick={handleClick}
          disabled={disabled}
          className={\`\${baseClasses} \${variantClasses} \${sizeClasses} \${disabledClasses} \${className}\`}
          {...props}
        >
          {children}
        </button>
      );
    };

    // Create a generic icon component factory that uses lucide dynamically
    const createLucideIcon = (iconName) => {
      return ({ className, size = 24, ...props }) => {
        const ref = React.useRef(null);

        React.useEffect(() => {
          if (ref.current && typeof lucide !== 'undefined' && lucide.createIcons) {
            // Clear previous content
            ref.current.innerHTML = '';

            // Create icon element
            const iconElement = document.createElement('i');
            iconElement.setAttribute('data-lucide', iconName.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, ''));
            ref.current.appendChild(iconElement);

            // Initialize lucide icons
            lucide.createIcons();
          }
        }, [iconName]);

        return <span ref={ref} className={className} style={{ display: 'inline-flex', width: size, height: size }} {...props}></span>;
      };
    };

    // Export all common lucide icons as React components dynamically
    const iconNames = [
      'ChevronLeft', 'ChevronRight', 'ArrowLeft', 'ArrowRight', 'CheckCircle', 'XCircle',
      'TrendingUp', 'TrendingDown', 'Heart', 'Star', 'Users', 'Calendar', 'Clock', 'Mail',
      'Phone', 'MapPin', 'AlertCircle', 'Info', 'Zap', 'Award', 'Target', 'Lightbulb',
      'Briefcase', 'FileText', 'Sparkles', 'Home', 'Search', 'Settings', 'Menu', 'X',
      'Plus', 'Minus', 'Edit', 'Trash', 'Save', 'Download', 'Upload', 'Share', 'Copy',
      'Check', 'AlertTriangle', 'HelpCircle', 'Eye', 'EyeOff', 'Lock', 'Unlock', 'Key',
      'User', 'UserPlus', 'UserMinus', 'Bell', 'BellOff', 'MessageCircle', 'MessageSquare',
      'Send', 'Inbox', 'Archive', 'Folder', 'File', 'Image', 'Video', 'Music', 'Code',
      'Terminal', 'Database', 'Server', 'Cloud', 'CloudOff', 'Wifi', 'WifiOff', 'Bluetooth',
      'Battery', 'BatteryCharging', 'Power', 'Loader', 'RefreshCw', 'RotateCw', 'RotateCcw',
      'ChevronUp', 'ChevronDown', 'ChevronsUp', 'ChevronsDown', 'ChevronsLeft', 'ChevronsRight',
      'ArrowUp', 'ArrowDown', 'ArrowUpRight', 'ArrowDownRight', 'ArrowUpLeft', 'ArrowDownLeft',
      'ExternalLink', 'Link', 'LinkOff', 'Maximize', 'Minimize', 'ZoomIn', 'ZoomOut',
      'Filter', 'Sliders', 'Grid', 'List', 'LayoutGrid', 'LayoutList', 'Columns', 'Rows',
      'Circle', 'Square', 'Triangle', 'Hexagon', 'Flag', 'Bookmark', 'Tag', 'Package',
      'ShoppingCart', 'ShoppingBag', 'CreditCard', 'DollarSign', 'TrendingDown', 'BarChart',
      'PieChart', 'Activity', 'GitBranch', 'GitCommit', 'GitMerge', 'Github', 'Gitlab',
      'Chrome', 'Figma', 'Framer', 'Slack', 'Twitter', 'Facebook', 'Instagram', 'Linkedin',
      'Youtube', 'Twitch', 'Globe', 'Compass', 'Navigation', 'Anchor', 'Cpu', 'HardDrive',
      'Smartphone', 'Tablet', 'Laptop', 'Monitor', 'Printer', 'Camera', 'Mic', 'MicOff',
      'Volume', 'Volume1', 'Volume2', 'VolumeX', 'Play', 'Pause', 'StopCircle', 'SkipBack',
      'SkipForward', 'FastForward', 'Rewind', 'Film', 'Tv', 'Radio', 'Cast', 'Sun', 'Moon',
      'CloudRain', 'CloudSnow', 'CloudLightning', 'Wind', 'Thermometer', 'Droplet', 'Umbrella',
      'Coffee', 'Pizza', 'Beer', 'Cake', 'Gift', 'Smile', 'Frown', 'Meh', 'ThumbsUp', 'ThumbsDown'
    ];

    // Create icon components for all common icons
    const LucideIcons = {};
    iconNames.forEach(name => {
      LucideIcons[name] = createLucideIcon(name);
    });

    // Listen for code from parent
    window.addEventListener('message', async (event) => {
      if (event.data.type === 'EXECUTE_CODE') {
        const code = event.data.code;

        try {
          // Transform the code
          let transformedCode = code;

          // Remove imports
          transformedCode = transformedCode.replace(/^import\\s+.*?from\\s+["'].*?["'];?\\s*$/gm, '');

          // Remove exports
          transformedCode = transformedCode
            .replace(/^export\\s+default\\s+/gm, '')
            .replace(/^export\\s+(const|function|class)\\s+/gm, '$1 ');

          // Use Babel to transform JSX to JavaScript
          const babelTransformed = Babel.transform(transformedCode, {
            presets: ['react'],
            filename: 'component.tsx'
          }).code;

          // Find component name
          const componentMatch = transformedCode.match(/(?:const|function)\\s+(\\w+)\\s*=?\\s*(?:\\(\\)|=>|\\()/);
          const componentName = componentMatch ? componentMatch[1] : null;

          if (componentName) {
            // Wrap in function that returns the component
            const wrappedCode = \`
              \${babelTransformed}

              return \${componentName};
            \`;

            // Execute the code to get the component
            // Provide all available components and icons
            // Create function parameters: React hooks, Button, all Lucide icons, and Recharts
            const functionParams = [
              'React', 'useState', 'useEffect', 'useMemo', 'useCallback', 'useFile',
              'Button', ...Object.keys(LucideIcons), 'Recharts'
            ];

            const functionArgs = [
              React, useState, useEffect, useMemo, useCallback, useFile,
              Button, ...Object.values(LucideIcons), typeof Recharts !== 'undefined' ? Recharts : {}
            ];

            const componentFactory = new Function(...functionParams, wrappedCode);
            const Component = componentFactory(...functionArgs);

            // Render the component
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(React.createElement(Component));

            // Send success message
            window.parent.postMessage({ type: 'RENDER_SUCCESS' }, '*');
          }
        } catch (error) {
          console.error('Render error:', error);

          // Display error in iframe
          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(
            React.createElement('div', {
              style: {
                padding: '20px',
                background: '#fee',
                color: '#c00',
                borderRadius: '8px',
                margin: '20px',
                fontFamily: 'monospace',
                fontSize: '14px'
              }
            }, error.toString())
          );

          // Send error message to parent
          window.parent.postMessage({
            type: 'RENDER_ERROR',
            error: error.toString()
          }, '*');
        }
      }
    });

    // Notify parent that iframe is ready
    window.parent.postMessage({ type: 'IFRAME_READY' }, '*');
  </script>
</body>
</html>`;

function PdfUploader() {
  const [message, setMessage] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pngFiles, setPngFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionComplete, setConversionComplete] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendComplete, setSendComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReceivingResponse, setIsReceivingResponse] = useState(false);
  const [tsxFileContent, setTsxFileContent] = useState<string | null>(null);
  const [tsxFileName, setTsxFileName] = useState<string | null>(null);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = React.useState(false);
  const [renderError, setRenderError] = React.useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const fullscreenContainerRef = React.useRef<HTMLDivElement>(null);

  const workspaceId = import.meta.env.VITE_WORKSPACE_ID;
  const agentId = import.meta.env.VITE_AGENT_ID;
  const proxyUrl = import.meta.env.VITE_PROXY_URL || 'http://localhost:3000';

  // Handle iframe communication
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('[WIDGET] Received message from iframe:', event.data);
      if (event.data.type === 'IFRAME_READY') {
        console.log('[WIDGET] Iframe is ready!');
        setIframeReady(true);
      } else if (event.data.type === 'RENDER_ERROR') {
        console.error('[WIDGET] Render error from iframe:', event.data.error);
        setRenderError(event.data.error);
      } else if (event.data.type === 'RENDER_SUCCESS') {
        console.log('[WIDGET] Render success!');
        setRenderError(null);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Send code to iframe when ready
  React.useEffect(() => {
    console.log('[WIDGET] Checking if should send code:', { iframeReady, hasIframeRef: !!iframeRef.current, hasTsxContent: !!tsxFileContent });
    if (iframeReady && iframeRef.current && tsxFileContent) {
      console.log('[WIDGET] Sending TSX code to iframe, length:', tsxFileContent.length);
      iframeRef.current.contentWindow?.postMessage({
        type: 'EXECUTE_CODE',
        code: tsxFileContent
      }, '*');
    }
  }, [iframeReady, tsxFileContent]);

  // Handle fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Toggle fullscreen presentation mode
  const toggleFullscreen = async () => {
    if (!fullscreenContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await fullscreenContainerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  const callDustAPI = async (url: string, body: any, method: string = 'POST', returnText: boolean = false) => {
    if (body instanceof FormData) {
      body.append('url', url);
      const response = await fetch(`${proxyUrl}/widgets/api/dust-upload`, {
        method: 'POST',
        body,
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    }

    const response = await fetch(`${proxyUrl}/widgets/api/dust-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, body, method, returnText })
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return returnText ? response.text() : response.json();
  };

  const convertPdfToPng = async (file: File) => {
    setPdfFile(file);
    setIsConverting(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const pngFilesArray: File[] = [];

      // Convert each page to PNG and create File objects
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport } as any).promise;

          // Convert canvas to blob then to File
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), 'image/png');
          });

          const pngFile = new File([blob], `${file.name.replace('.pdf', '')}_page_${pageNum}.png`, { type: 'image/png' });
          pngFilesArray.push(pngFile);
        }
      }

      setPngFiles(pngFilesArray);
      setConversionComplete(true);
    } catch (error) {
      console.error('Conversion error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsConverting(false);
    }
  };

  const streamAgentResponse = async (convId: string, messageContent: string) => {
    try {
      // Send message to Dust
      const messageUrl = `https://dust.tt/api/v1/w/${workspaceId}/assistant/conversations/${convId}/messages`;
      await callDustAPI(messageUrl, {
        content: messageContent,
        mentions: agentId ? [{ configurationId: agentId }] : [],
        context: { username: 'slidestorm', timezone: 'Europe/Paris' }
      });

      // Stream conversation events
      const streamUrl = `https://dust.tt/api/v1/w/${workspaceId}/assistant/conversations/${convId}/events`;
      const response = await fetch(`${proxyUrl}/widgets/api/dust-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: streamUrl })
      });

      if (!response.ok) throw new Error(`Stream error: ${response.status}`);
      if (!response.body) throw new Error('No response body');

      // Process SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let agentDone = false;

      while (!agentDone) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === 'done') continue;

            try {
              const event = JSON.parse(jsonStr);
              const data = event.data;

              // Wait for agent to finish
              if (data.type === 'agent_message_done') {
                agentDone = true;
                break;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Fetch conversation details to get generated TSX file
      const convDetailsUrl = `https://dust.tt/api/v1/w/${workspaceId}/assistant/conversations/${convId}`;
      const convDetails = await callDustAPI(convDetailsUrl, null, 'GET');

      // Find TSX files in agent actions
      const agentMessages = convDetails.conversation?.content
        ?.flat()
        .filter((item: any) => item.type === 'agent_message') || [];

      for (const msg of agentMessages) {
        for (const action of msg.actions || []) {
          if (action.functionCallName === 'interactive_content__create_interactive_content_file'
              && action.generatedFiles?.length > 0) {

            const file = action.generatedFiles[0];
            const fileId = file.fileId || file.sId;

            // Download TSX file content
            const fileUrl = `https://dust.tt/api/v1/w/${workspaceId}/files/${fileId}`;
            const fileContent = await callDustAPI(fileUrl, null, 'GET', true);
            console.log('Conversation ID:', convId);
            console.log('TSX file retrieved:', file.title, `(${fileContent.length} chars)`);

            setTsxFileContent(fileContent);
            setTsxFileName(file.title || 'generated.tsx');
            break;
          }
        }
      }

      setIsReceivingResponse(false);
      setSendComplete(true);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Stream error');
      setIsReceivingResponse(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      convertPdfToPng(file);
    } else if (file.type === "image/png") {
      // Handle PNG directly
      setPdfFile(file);
      setPngFiles([file]);
      setConversionComplete(true);
    } else {
      setError("Please select a PDF or PNG file");
      return;
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !conversionComplete) return;

    setIsSending(true);

    try {
      // Create conversation
      const conversationUrl = `https://dust.tt/api/v1/w/${workspaceId}/assistant/conversations`;
      const conversationJson = await callDustAPI(conversationUrl, {
        visibility: 'unlisted',
        title: null
      });
      const convId = conversationJson.conversation?.sId;
      if (!convId) throw new Error('Failed to create conversation');

      // Upload PNG files
      for (const file of pngFiles) {
        // Create file entry
        const fileCreateResponse = await callDustAPI(
          `https://dust.tt/api/v1/w/${workspaceId}/files`,
          {
            contentType: 'image/png',
            fileName: file.name,
            fileSize: file.size,
            useCase: 'conversation',
            useCaseMetadata: { conversationId: convId }
          }
        );
        const fileId = fileCreateResponse.file?.sId;
        if (!fileId) throw new Error('Failed to create file entry');

        // Upload file
        const formData = new FormData();
        formData.append('file', file);
        await callDustAPI(`https://dust.tt/api/v1/w/${workspaceId}/files/${fileId}`, formData);

        // Create content fragment
        await callDustAPI(
          `https://dust.tt/api/v1/w/${workspaceId}/assistant/conversations/${convId}/content_fragments`,
          { title: file.name, fileId }
        );
      }

      // Stream agent response
      setIsReceivingResponse(true);
      setIsSending(false);
      await streamAgentResponse(convId, message);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSending(false);
    }
  };

  // Generating slides state
  if (isReceivingResponse) {
    return (
      <div style={{ padding: "20px", maxWidth: "600px" }}>
        <div style={{
          padding: "40px",
          textAlign: "center",
          background: "#f3e5f5",
          borderRadius: "12px",
        }}>
          <div style={{
            width: "50px",
            height: "50px",
            borderLeft: "4px solid #9c27b0",
            borderRight: "4px solid #9c27b0",
            borderBottom: "4px solid #9c27b0",
            borderTop: "4px solid transparent",
            borderRadius: "50%",
            margin: "0 auto 20px",
            animation: "spin 1s linear infinite"
          }}></div>
          <p style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>
            Generating slides...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Success state - slides generated
  if (sendComplete) {
    return (
      <div style={{ padding: "20px", maxWidth: "800px" }}>
        <div style={{
          padding: "30px",
          textAlign: "center",
          background: "#4caf50",
          color: "white",
          borderRadius: "12px",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "15px" }}>✅</div>
          <h2 style={{ margin: "0 0 10px 0" }}>Slides generated successfully!</h2>
          <p style={{ margin: "0", opacity: "0.9" }}>
            {pdfFile?.name} - {pngFiles.length} page{pngFiles.length > 1 ? 's' : ''} processed
          </p>
        </div>
        {tsxFileContent && (
            <div style={{ marginTop: "20px" }}>
              <div style={{ marginBottom: "10px", display: "flex", gap: "10px", alignItems: "center" }}>
                <h3 style={{ margin: 0, flex: 1 }}>{tsxFileName}</h3>
                <button
                  onClick={toggleFullscreen}
                  style={{
                    padding: "8px 16px",
                    background: "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  {isFullscreen ? '✕ Exit Presentation' : '⛶ Presentation Mode'}
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(tsxFileContent);
                    alert('TSX content copied to clipboard!');
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "#2196f3",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  Copy Code
                </button>
              </div>

              {/* Iframe wrapper with strict 16:9 aspect ratio */}
              <div
                ref={fullscreenContainerRef}
                style={{
                  background: isFullscreen ? "#000" : "#f5f5f5",
                  borderRadius: isFullscreen ? "0" : "8px",
                  padding: isFullscreen ? "0" : "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: isFullscreen ? "100vw" : "auto",
                  height: isFullscreen ? "100vh" : "auto"
                }}
              >
                <div style={{
                  width: "100%",
                  maxWidth: isFullscreen ? "none" : "1200px",
                  aspectRatio: "16 / 9",
                  position: "relative",
                  height: isFullscreen ? "100%" : "auto"
                }}>
                  <iframe
                    ref={iframeRef}
                    srcDoc={FRAME_RUNNER_HTML}
                    onLoad={() => console.log('[WIDGET] Iframe loaded successfully')}
                    onError={(e) => console.error('[WIDGET] Iframe load error:', e)}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      border: "none",
                      borderRadius: isFullscreen ? "0" : "8px",
                      background: "white"
                    }}
                    sandbox="allow-scripts allow-same-origin"
                    title="TSX Frame Renderer"
                  />
                </div>
              </div>

              {/* Debug info */}
              <div style={{
                padding: "10px",
                background: "#e3f2fd",
                color: "#1976d2",
                borderRadius: "8px",
                marginTop: "10px",
                fontSize: "12px",
                fontFamily: "monospace"
              }}>
                <div>Iframe Ready: {iframeReady ? '✓' : '⏳'}</div>
                <div>TSX Content: {tsxFileContent ? `✓ (${tsxFileContent.length} chars)` : '✗'}</div>
                <div>Iframe: Embedded (srcDoc)</div>
              </div>

              {/* Error display */}
              {renderError && (
                <div style={{
                  padding: "10px",
                  background: "#ffebee",
                  color: "#c62828",
                  borderRadius: "8px",
                  marginTop: "10px",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  whiteSpace: "pre-wrap"
                }}>
                  {renderError}
                </div>
              )}
            </div>
        )}
      </div>
    );
  }

  // Sending to Dust state
  if (isSending) {
    return (
      <div style={{ padding: "20px", maxWidth: "600px" }}>
        <div style={{
          padding: "40px",
          textAlign: "center",
          background: "#e3f2fd",
          borderRadius: "12px",
        }}>
          <div style={{
            width: "50px",
            height: "50px",
            borderLeft: "4px solid #2196f3",
            borderRight: "4px solid #2196f3",
            borderBottom: "4px solid #2196f3",
            borderTop: "4px solid transparent",
            borderRadius: "50%",
            margin: "0 auto 20px",
            animation: "spin 1s linear infinite"
          }}></div>
          <p style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 10px 0" }}>
            Sending to Dust...
          </p>
          <p style={{ fontSize: "14px", color: "#666" }}>
            Uploading {pngFiles.length} page{pngFiles.length > 1 ? 's' : ''}...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const canSend = message.trim() && conversionComplete;

  // Main form
  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>Send PDF to Dust</h2>

      {error && (
        <div style={{
          padding: "15px",
          marginTop: "20px",
          background: "#ffebee",
          color: "#c62828",
          borderRadius: "8px",
          border: "1px solid #ef5350"
        }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: "20px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message..."
          style={{
            width: "100%",
            minHeight: "100px",
            padding: "10px",
            border: "2px solid #ddd",
            borderRadius: "8px",
            fontSize: "14px",
            fontFamily: "inherit",
            resize: "vertical"
          }}
        />
      </div>

      <div style={{ marginTop: "20px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
          PDF or PNG File
        </label>
        <input
          type="file"
          accept="application/pdf,image/png"
          onChange={handleFileSelect}
          disabled={isConverting}
          style={{
            padding: "10px",
            border: "2px solid #ddd",
            borderRadius: "8px",
            width: "100%"
          }}
        />
        {isConverting && (
          <p style={{ marginTop: "10px", fontSize: "14px", color: "#2196f3" }}>
            Converting PDF to PNG...
          </p>
        )}
        {conversionComplete && pdfFile && (
          <p style={{ marginTop: "10px", fontSize: "14px", color: "#4caf50" }}>
            ✓ {pdfFile.name} - {pngFiles.length} page{pngFiles.length > 1 ? 's' : ''} ready
          </p>
        )}
      </div>

      <button
        onClick={handleSend}
        disabled={!canSend}
        style={{
          marginTop: "20px",
          padding: "12px 24px",
          background: canSend ? "#2196f3" : "#ccc",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: canSend ? "pointer" : "not-allowed",
          width: "100%"
        }}
      >
        Send to Dust
      </button>
    </div>
  );
}

export default PdfUploader;
mountWidget(<PdfUploader />);
