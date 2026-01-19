import "@/index.css";
import { useState, useRef, useEffect } from "react";
import { mountWidget } from "skybridge/web";
import * as pdfjsLib from "pdfjs-dist";
import React from 'react';
import ReactDOM from 'react-dom/client';
import Frame, { FrameContextConsumer } from 'react-frame-component';
import * as LucideIcons from 'lucide-react';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs';

function PdfUploader() {
  const [slideSubjectAndContent, setSlideSubjectAndContent] = useState("");
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
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<any>(null);

  const workspaceId = import.meta.env.VITE_WORKSPACE_ID;
  const agentId = import.meta.env.VITE_AGENT_ID;
  const proxyUrl = import.meta.env.VITE_PROXY_URL || 'http://localhost:3000';

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Forward keyboard events to iframe for navigation (only in fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;

      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (['ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
        e.preventDefault();
        
        // Try to find and click navigation buttons in the frame
        if (frameRef.current?.node?.contentWindow) {
          const iframeDoc = frameRef.current.node.contentWindow.document;
          const allButtons = iframeDoc.querySelectorAll('button, [role="button"]');

          const matchesButton = (btn: Element, keywords: string[]) => {
            const text = btn.textContent?.toLowerCase() || '';
            const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
            return keywords.some(keyword => text.includes(keyword) || ariaLabel.includes(keyword));
          };

          let targetButton: Element | null = null;

          if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            for (const btn of allButtons) {
              if (matchesButton(btn, ['prev', 'précéd', 'previous', 'back'])) {
                targetButton = btn;
                break;
              }
            }
          } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
            for (const btn of allButtons) {
              if (matchesButton(btn, ['next', 'suiv', 'suivant', 'forward'])) {
                targetButton = btn;
                break;
              }
            }
          }

          if (targetButton) {
            (targetButton as HTMLElement).click();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const toggleFullscreen = async () => {
    if (!fullscreenContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await fullscreenContainerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
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

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport } as any).promise;

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
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsConverting(false);
    }
  };

  const streamAgentResponse = async (convId: string, messageContent: string) => {
    try {
      const messageUrl = `https://dust.tt/api/v1/w/${workspaceId}/assistant/conversations/${convId}/messages`;
      await callDustAPI(messageUrl, {
        content: messageContent,
        mentions: agentId ? [{ configurationId: agentId }] : [],
        context: { username: 'slidestorm', timezone: 'Europe/Paris' }
      });

      const streamUrl = `https://dust.tt/api/v1/w/${workspaceId}/assistant/conversations/${convId}/events`;
      const response = await fetch(`${proxyUrl}/widgets/api/dust-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: streamUrl })
      });

      if (!response.ok) throw new Error(`Stream error: ${response.status}`);
      if (!response.body) throw new Error('No response body');

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

      const convDetailsUrl = `https://dust.tt/api/v1/w/${workspaceId}/assistant/conversations/${convId}`;
      const convDetails = await callDustAPI(convDetailsUrl, null, 'GET');

      const agentMessages = convDetails.conversation?.content
        ?.flat()
        .filter((item: any) => item.type === 'agent_message') || [];

      for (const msg of agentMessages) {
        for (const action of msg.actions || []) {
          if (action.functionCallName === 'interactive_content__create_interactive_content_file'
              && action.generatedFiles?.length > 0) {

            const file = action.generatedFiles[0];
            const fileId = file.fileId || file.sId;

            const fileUrl = `https://dust.tt/api/v1/w/${workspaceId}/files/${fileId}`;
            const fileContent = await callDustAPI(fileUrl, null, 'GET', true);

            console.log(`✅ Slides created successfully! View conversation: https://dust.tt/w/${workspaceId}/assistant/${convId}`);

            setTsxFileContent(fileContent);
            setTsxFileName(file.title || 'generated.tsx');
            break;
          }
        }
      }

      setIsReceivingResponse(false);
      setSendComplete(true);
    } catch (error) {
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
      setPdfFile(file);
      setPngFiles([file]);
      setConversionComplete(true);
    } else if (file.type === "application/vnd.ms-powerpoint" || file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
      setPdfFile(file);
      setPngFiles([file]);
      setConversionComplete(true);
    } else {
      setError("Please select a PDF, PNG, or PowerPoint file");
      return;
    }
  };

  const handleSend = async () => {
    if (!slideSubjectAndContent.trim()) return;

    setIsSending(true);

    try {
      const conversationUrl = `https://dust.tt/api/v1/w/${workspaceId}/assistant/conversations`;
      const conversationJson = await callDustAPI(conversationUrl, {
        visibility: 'unlisted',
        title: null
      });
      const convId = conversationJson.conversation?.sId;
      if (!convId) throw new Error('Failed to create conversation');

      for (const file of pngFiles) {
        let contentType = 'image/png';
        if (file.type === 'application/vnd.ms-powerpoint') {
          contentType = 'application/vnd.ms-powerpoint';
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
          contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        }

        const fileCreateResponse = await callDustAPI(
          `https://dust.tt/api/v1/w/${workspaceId}/files`,
          {
            contentType: contentType,
            fileName: file.name,
            fileSize: file.size,
            useCase: 'conversation',
            useCaseMetadata: { conversationId: convId }
          }
        );
        const fileId = fileCreateResponse.file?.sId;
        if (!fileId) throw new Error('Failed to create file entry');

        const formData = new FormData();
        formData.append('file', file);
        await callDustAPI(`https://dust.tt/api/v1/w/${workspaceId}/files/${fileId}`, formData);

        await callDustAPI(
          `https://dust.tt/api/v1/w/${workspaceId}/assistant/conversations/${convId}/content_fragments`,
          { title: file.name, fileId }
        );
      }

      setIsReceivingResponse(true);
      setIsSending(false);
      await streamAgentResponse(convId, slideSubjectAndContent);
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
  if (sendComplete && tsxFileContent) {
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
          {pdfFile && (
            <p style={{ margin: "0", opacity: "0.9" }}>
              Template: {pdfFile.name} - {pngFiles.length} page{pngFiles.length > 1 ? 's' : ''} processed
            </p>
          )}
        </div>

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

          {/* Frame wrapper with strict 16:9 aspect ratio */}
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
              <Frame
                ref={frameRef}
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
                initialContent={`
                  <!DOCTYPE html>
                  <html lang="en">
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <script src="https://cdn.tailwindcss.com"></script>
                      <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
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
                          aspect-ratio: 16 / 9;
                          width: 100%;
                          max-width: 100vw;
                          max-height: 100vh;
                          overflow: hidden;
                          background: white;
                          position: relative;
                        }
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
                    </body>
                  </html>
                `}
              >
                <FrameContextConsumer>
                  {({ document: iframeDoc, window: iframeWindow }) => {
                    if (!iframeDoc || !iframeWindow) return null;

                    try {
                      // Inject React and ReactDOM into iframe
                      (iframeWindow as any).React = React;
                      (iframeWindow as any).ReactDOM = ReactDOM;

                      // Liste des propriétés protégées
                      const protectedProps = new Set([
                        'Infinity', 'NaN', 'undefined', 'eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt',
                        'Object', 'Function', 'Boolean', 'Symbol', 'Error', 'Number', 'Date',
                        'String', 'RegExp', 'Array', 'Map', 'Set', 'Promise',
                        'Math', 'JSON', 'console', 'window', 'document', 'navigator', 'location'
                      ]);

                      // Inject Lucide icons safely
                      Object.entries(LucideIcons).forEach(([name, Component]) => {
                        if (!protectedProps.has(name)) {
                          try {
                            (iframeWindow as any)[name] = Component;
                          } catch (e) {
                            console.warn(`Could not assign icon: ${name}`);
                          }
                        }
                      });

                      // Inject base hooks
                      (iframeWindow as any).useState = React.useState;
                      (iframeWindow as any).useEffect = React.useEffect;
                      (iframeWindow as any).useMemo = React.useMemo;
                      (iframeWindow as any).useCallback = React.useCallback;

                      // Simple components
                      (iframeWindow as any).Button = ({ children, variant, size, disabled, className = '', onClick, ...props }: any) => {
                        const baseClasses = 'inline-flex items-center justify-center transition-all';
                        const variantClasses = variant === 'outline' ? 'border border-current' : '';
                        const sizeClasses = size === 'icon' ? 'p-2' : size === 'lg' ? 'px-6 py-3' : 'px-4 py-2';
                        const disabledClasses = disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer';
                        return React.createElement('button', {
                          onClick: !disabled ? onClick : undefined,
                          disabled,
                          className: `${baseClasses} ${variantClasses} ${sizeClasses} ${disabledClasses} ${className}`,
                          ...props
                        }, children);
                      };

                      (iframeWindow as any).Card = ({ children, className = '', ...props }: any) => {
                        return React.createElement('div', {
                          className: `bg-white rounded-lg shadow-md ${className}`,
                          ...props
                        }, children);
                      };

                      (iframeWindow as any).CardHeader = ({ children, className = '', ...props }: any) => {
                        return React.createElement('div', {
                          className: `p-6 ${className}`,
                          ...props
                        }, children);
                      };

                      (iframeWindow as any).CardTitle = ({ children, className = '', ...props }: any) => {
                        return React.createElement('h3', {
                          className: `text-2xl font-bold ${className}`,
                          ...props
                        }, children);
                      };

                      (iframeWindow as any).CardContent = ({ children, className = '', ...props }: any) => {
                        return React.createElement('div', {
                          className: `p-6 pt-0 ${className}`,
                          ...props
                        }, children);
                      };

                      // Execute TSX code
                      let code = tsxFileContent;

                      // Remove imports and exports
                      code = code.replace(/^import\s+.*?from\s+["'].*?["'];?\s*$/gm, '');
                      code = code.replace(/^export\s+default\s+/gm, '').replace(/^export\s+(const|function|class)\s+/gm, '$1 ');

                      // ✅ Transform with Babel to remove TypeScript types and transform JSX
                      const Babel = (iframeWindow as any).Babel;
                      if (!Babel) {
                        throw new Error('Babel not loaded in iframe');
                      }

                      const transformedCode = Babel.transform(code, {
                        presets: ['typescript', 'react'],
                        filename: 'component.tsx'
                      }).code;

                      // Find component name from ORIGINAL code (before transformation)
                      const componentMatch = code.match(/(?:const|function)\s+(\w+)\s*=?\s*(?:\(\)|=>|\()/);
                      const componentName = componentMatch ? componentMatch[1] : null;

                      if (componentName) {
                        // Create component factory with ALL Lucide icons
                        const lucideIconNames = Object.keys(LucideIcons);
                        const lucideIconComponents = Object.values(LucideIcons);

                        const componentFactory = new Function(
                          'React', 'useState', 'useEffect', 'useMemo', 'useCallback',
                          ...lucideIconNames,
                          'Button', 'Card', 'CardHeader', 'CardTitle', 'CardContent',
                          `${transformedCode}\nreturn ${componentName};`
                        );

                        const Component = componentFactory(
                          React, React.useState, React.useEffect, React.useMemo, React.useCallback,
                          ...lucideIconComponents,
                          (iframeWindow as any).Button,
                          (iframeWindow as any).Card,
                          (iframeWindow as any).CardHeader,
                          (iframeWindow as any).CardTitle,
                          (iframeWindow as any).CardContent
                        );

                        // Render component
                        const rootElement = iframeDoc.getElementById('root');
                        if (rootElement) {
                          const IframeReactDOM = (iframeWindow as any).ReactDOM;
                          const root = IframeReactDOM.createRoot(rootElement);
                          root.render(React.createElement(Component));
                        }

                        setRenderError(null);
                      }
                    } catch (error) {
                      console.error('Render error:', error);
                      setRenderError(error instanceof Error ? error.message : String(error));
                    }

                    return null;
                  }}
                </FrameContextConsumer>
              </Frame>
            </div>
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
      </div>
    );
  }

  // Preparing request state
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
            Preparing request...
          </p>
          {pngFiles.length > 0 && (
            <p style={{ fontSize: "14px", color: "#666" }}>
              Uploading {pngFiles.length} template page{pngFiles.length > 1 ? 's' : ''}...
            </p>
          )}
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

  const canSend = slideSubjectAndContent.trim();

  // Main form
  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>Create Slides</h2>

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
          Slide Subject and Content
        </label>
        <textarea
          value={slideSubjectAndContent}
          onChange={(e) => setSlideSubjectAndContent(e.target.value)}
          placeholder="Enter the subject and content for your slides..."
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
          Template (Optional)
        </label>
        <input
          type="file"
          accept="application/pdf,image/png,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
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
            Converting template to images...
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
        Generate Slides
      </button>
    </div>
  );
}

export default PdfUploader;
mountWidget(<PdfUploader />);