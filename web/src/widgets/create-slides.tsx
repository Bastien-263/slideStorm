import "@/index.css";
import { useState } from "react";
import { mountWidget } from "skybridge/web";
import * as pdfjsLib from "pdfjs-dist";
import React from 'react';
import { LUCIDE_ICON_NAMES } from './lucide-icons';

// Configure PDF.js worker for client-side PDF processing
// Use CDN for worker to avoid build path issues in production
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs';

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

    // Simple Card component
    const Card = ({ children, className = '', ...props }) => {
      return (
        <div className={\`bg-white rounded-lg shadow-md \${className}\`} {...props}>
          {children}
        </div>
      );
    };

    const CardHeader = ({ children, className = '', ...props }) => {
      return (
        <div className={\`p-6 \${className}\`} {...props}>
          {children}
        </div>
      );
    };

    const CardTitle = ({ children, className = '', ...props }) => {
      return (
        <h3 className={\`text-2xl font-bold \${className}\`} {...props}>
          {children}
        </h3>
      );
    };

    const CardContent = ({ children, className = '', ...props }) => {
      return (
        <div className={\`p-6 pt-0 \${className}\`} {...props}>
          {children}
        </div>
      );
    };

    // Generic component factory - creates any missing component on the fly
    const createGenericComponent = (componentName) => {
      return ({ children, className = '', ...props }) => {
        // Detect common component patterns and provide appropriate defaults
        const lowerName = componentName.toLowerCase();

        if (lowerName.includes('header') || lowerName.includes('title')) {
          return <div className={\`font-bold text-lg \${className}\`} {...props}>{children}</div>;
        }
        if (lowerName.includes('content') || lowerName.includes('body')) {
          return <div className={\`p-4 \${className}\`} {...props}>{children}</div>;
        }
        if (lowerName.includes('footer')) {
          return <div className={\`mt-auto \${className}\`} {...props}>{children}</div>;
        }
        if (lowerName.includes('description')) {
          return <p className={\`text-sm text-gray-600 \${className}\`} {...props}>{children}</p>;
        }

        // Default: just a div with the class name
        return <div className={className} {...props}>{children}</div>;
      };
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

    // Initialize component cache ONCE at module load
    if (!window.__componentCache__) {
      window.__componentCache__ = {
        // Pre-register base components
        React, useState, useEffect, useMemo, useCallback,
        Button, Card, CardHeader, CardTitle, CardContent,
        useFile,
        Recharts: typeof Recharts !== 'undefined' ? Recharts : {}
      };

      // Pre-cache ALL Lucide icons (500+ icons) to avoid runtime resolution issues
      const allLucideIcons = ${JSON.stringify(LUCIDE_ICON_NAMES)};

      console.log('[Lucide] Pre-caching', allLucideIcons.length, 'icons');
      let successCount = 0;
      let skipCount = 0;
      let errorCount = 0;

      allLucideIcons.forEach(iconName => {
        const icon = createLucideIcon(iconName);
        window.__componentCache__[iconName] = icon;

        // Only assign to window if it's not a reserved property
        try {
          if (!(iconName in window) || window[iconName] === undefined) {
            window[iconName] = icon;
            successCount++;
          } else {
            console.log('[Lucide] Skipping "' + iconName + '" - already exists on window:', typeof window[iconName]);
            skipCount++;
          }
        } catch (e) {
          // Ignore read-only properties like 'Infinity'
          console.warn('[Lucide] Could not assign icon "' + iconName + '" to window (reserved property):', e.message);
          errorCount++;
        }
      });

      console.log('[Lucide] Pre-cache complete: ' + successCount + ' assigned, ' + skipCount + ' skipped, ' + errorCount + ' errors');
      console.log('[Lucide] Checking Globe in cache:', !!window.__componentCache__.Globe);
      console.log('[Lucide] Checking Globe on window:', typeof window.Globe, window.Globe);
    }

    // Universal component resolver - similar to Dust's scope injection
    // This allows ANY component to be resolved dynamically
    const resolveComponent = (componentName) => {
      // Check cache first (fast path)
      if (window.__componentCache__[componentName]) {
        return window.__componentCache__[componentName];
      }

      // Check if it's already on window
      if (window[componentName]) {
        window.__componentCache__[componentName] = window[componentName];
        return window[componentName];
      }

      // Create and cache new icon component (Lucide)
      // Assume any PascalCase name is a Lucide icon
      if (typeof componentName === 'string' && componentName[0] === componentName[0].toUpperCase()) {
        console.log(\`[ComponentResolver] Auto-creating Lucide icon: \${componentName}\`);
        const component = createLucideIcon(componentName);
        window.__componentCache__[componentName] = component;
        window[componentName] = component; // Also set globally for React access
        return component;
      }

      return undefined;
    };

    // Expose resolver globally for React components to access
    window.__resolveComponent__ = resolveComponent;

    // Listen for messages from parent
    window.addEventListener('message', async (event) => {
      // Handle keyboard events forwarded from parent
      if (event.data.type === 'KEYBOARD_EVENT') {
        const key = event.data.key;

        // Helper to check if a button matches navigation criteria
        const matchesButton = (btn, keywords) => {
          const text = btn.textContent?.toLowerCase() || '';
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          const innerHTML = btn.innerHTML.toLowerCase();

          return keywords.some(keyword =>
            text.includes(keyword) ||
            ariaLabel.includes(keyword) ||
            innerHTML.includes(keyword)
          );
        };

        // Helper to trigger all types of click events
        const triggerClick = (element) => {
          // Try multiple methods to ensure the click is registered
          element.click();
          element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
          element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
        };

        // Left arrow or Page Up -> Previous slide
        if (key === 'ArrowLeft' || key === 'PageUp') {
          const allButtons = document.querySelectorAll('button, [role="button"], div[onclick], span[onclick]');
          for (const btn of allButtons) {
            if (matchesButton(btn, ['prev', 'précéd', 'previous', 'chevron-left', 'arrow-left', '<'])) {
              triggerClick(btn);
              break;
            }
          }
        }

        // Right arrow, Page Down, or Space -> Next slide
        if (key === 'ArrowRight' || key === 'PageDown' || key === ' ') {
          const allButtons = document.querySelectorAll('button, [role="button"], div[onclick], span[onclick]');
          for (const btn of allButtons) {
            if (matchesButton(btn, ['next', 'suiv', 'suivant', 'chevron-right', 'arrow-right', '>'])) {
              triggerClick(btn);
              break;
            }
          }
        }

        // Home -> First slide
        if (key === 'Home') {
          const allButtons = document.querySelectorAll('button, [role="button"], div[onclick], span[onclick]');
          for (let i = 0; i < 100; i++) {
            let found = false;
            for (const btn of allButtons) {
              if (matchesButton(btn, ['prev', 'précéd', 'previous', 'chevron-left', 'arrow-left'])) {
                triggerClick(btn);
                found = true;
                break;
              }
            }
            if (!found) break;
          }
        }

        // End -> Last slide
        if (key === 'End') {
          const allButtons = document.querySelectorAll('button, [role="button"], div[onclick], span[onclick]');
          for (let i = 0; i < 100; i++) {
            let found = false;
            for (const btn of allButtons) {
              if (matchesButton(btn, ['next', 'suiv', 'suivant', 'chevron-right', 'arrow-right'])) {
                triggerClick(btn);
                found = true;
                break;
              }
            }
            if (!found) break;
          }
        }
      }

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
          // Use typescript preset to strip type annotations, then react preset for JSX
          const babelTransformed = Babel.transform(transformedCode, {
            presets: ['typescript', 'react'],
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

            // Make all base components available globally
            window.React = React;
            window.useState = useState;
            window.useEffect = useEffect;
            window.useMemo = useMemo;
            window.useCallback = useCallback;
            window.useFile = useFile;
            window.Button = Button;
            window.Card = Card;
            window.CardHeader = CardHeader;
            window.CardTitle = CardTitle;
            window.CardContent = CardContent;
            window.Recharts = typeof Recharts !== 'undefined' ? Recharts : {};
            window.createLucideIcon = createLucideIcon;
            window.createGenericComponent = createGenericComponent;

            // Extract all potential component names from the transformed code
            // Look for PascalCase identifiers that could be components
            const componentNamePattern = /\b([A-Z][a-zA-Z0-9]*)\b/g;
            const potentialComponents = new Set();
            let match;
            while ((match = componentNamePattern.exec(babelTransformed)) !== null) {
              potentialComponents.add(match[1]);
            }

            // Pre-resolve all potential components and expose them globally
            // This ensures they're available when the code executes
            console.log('[CodeExec] Found potential components:', Array.from(potentialComponents));
            potentialComponents.forEach(name => {
              if (!window[name]) {
                const resolved = window.__resolveComponent__(name);
                if (resolved) {
                  window[name] = resolved;
                  console.log('[CodeExec] Resolved and assigned:', name);
                } else {
                  console.warn('[CodeExec] Could not resolve:', name);
                }
              } else {
                console.log('[CodeExec] Component already exists on window:', name, typeof window[name]);
              }
            });

            // Also expose all cached components globally
            // Force assign all cached icons, even if the property exists on window
            console.log('[CodeExec] Force assigning', Object.keys(window.__componentCache__).length, 'cached components to window');
            let forceAssigned = 0;
            Object.keys(window.__componentCache__).forEach(key => {
              // Skip base React components that should not be overwritten
              const skipKeys = ['React', 'useState', 'useEffect', 'useMemo', 'useCallback', 'useFile', 'Button', 'Card', 'CardHeader', 'CardTitle', 'CardContent', 'Recharts'];
              if (!skipKeys.includes(key)) {
                try {
                  window[key] = window.__componentCache__[key];
                  forceAssigned++;
                } catch (e) {
                  console.warn('[CodeExec] Could not force assign:', key, e.message);
                }
              }
            });
            console.log('[CodeExec] Force assigned', forceAssigned, 'components');
            console.log('[CodeExec] Final check - Globe on window:', typeof window.Globe, !!window.Globe);
            console.log('[CodeExec] Final check - Globe in cache:', !!window.__componentCache__.Globe);

            // Create a Proxy that intercepts property access using the unified cache
            // This mirrors Dust's approach of checking a centralized component scope
            const componentProxy = new Proxy({}, {
              get: (target, prop) => {
                // Check window first (where we pre-resolved components)
                if (prop in window) {
                  return window[prop];
                }

                // Use the resolver function for consistent cache behavior
                const resolved = window.__resolveComponent__(prop);
                if (resolved) {
                  return resolved;
                }

                return undefined;
              }
            });

            const globalProxy = componentProxy;

            // Use 'with' statement via function wrapper to inject proxy
            const functionParams = ['componentProxy'];
            const wrappedWithProxy = \`
              with (componentProxy) {
                \${babelTransformed}
                return \${componentName};
              }
            \`;

            const componentFactory = new Function(...functionParams, wrappedWithProxy);
            const Component = componentFactory(globalProxy);

            // Render the component
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(React.createElement(Component));

            // Add keyboard navigation after component is rendered
            // Remove any existing keyboard listener to avoid duplicates
            if (window.keyboardNavigationHandler) {
              document.removeEventListener('keydown', window.keyboardNavigationHandler);
            }

            window.keyboardNavigationHandler = (e) => {
              if (['ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(e.key)) {
                e.preventDefault();

                const allButtons = document.querySelectorAll('button, [role="button"], [onclick]');
                let targetButton = null;

                if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                  // Find previous button
                  for (const btn of allButtons) {
                    const text = (btn.textContent || '').toLowerCase();
                    const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
                    const className = (btn.className || '').toLowerCase();

                    if (text.includes('prev') || text.includes('précéd') || text.includes('back') ||
                        ariaLabel.includes('prev') || ariaLabel.includes('back') ||
                        className.includes('prev') || className.includes('back')) {
                      targetButton = btn;
                      break;
                    }
                  }

                  // Fallback: look for left arrow SVG or icons
                  if (!targetButton) {
                    for (const btn of allButtons) {
                      const svgPath = btn.querySelector('svg path, svg polyline');
                      if (svgPath) {
                        const pathData = (svgPath.getAttribute('d') || svgPath.getAttribute('points') || '').toLowerCase();
                        if (pathData.includes('15 18 9 12') || pathData.includes('12 19 5 12')) {
                          targetButton = btn;
                          break;
                        }
                      }
                    }
                  }
                } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
                  // Find next button
                  for (const btn of allButtons) {
                    const text = (btn.textContent || '').toLowerCase();
                    const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
                    const className = (btn.className || '').toLowerCase();

                    if (text.includes('next') || text.includes('suiv') || text.includes('forward') ||
                        ariaLabel.includes('next') || ariaLabel.includes('forward') ||
                        className.includes('next') || className.includes('forward')) {
                      targetButton = btn;
                      break;
                    }
                  }

                  // Fallback: look for right arrow SVG or icons
                  if (!targetButton) {
                    for (const btn of allButtons) {
                      const svgPath = btn.querySelector('svg path, svg polyline');
                      if (svgPath) {
                        const pathData = (svgPath.getAttribute('d') || svgPath.getAttribute('points') || '').toLowerCase();
                        if (pathData.includes('9 18 15 12') || pathData.includes('12 5 19 12')) {
                          targetButton = btn;
                          break;
                        }
                      }
                    }
                  }
                }

                if (targetButton) {
                  targetButton.click();
                }
              }
            };

            setTimeout(() => {
              // Add listeners to both document and window to ensure we catch keyboard events
              document.addEventListener('keydown', window.keyboardNavigationHandler);
              window.addEventListener('keydown', window.keyboardNavigationHandler);

              // Also make the body focusable and focus it
              document.body.tabIndex = -1;
              document.body.style.outline = 'none';
              document.body.focus();

              // Auto-focus the root div to capture keyboard events
              const rootElement = document.getElementById('root');
              if (rootElement) {
                rootElement.tabIndex = -1; // Make it focusable
                rootElement.style.outline = 'none'; // Remove focus outline
              }
            }, 100);

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
      if (event.data.type === 'IFRAME_READY') {
        setIframeReady(true);
      } else if (event.data.type === 'RENDER_ERROR') {
        setRenderError(event.data.error);
      } else if (event.data.type === 'RENDER_SUCCESS') {
        setRenderError(null);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Send code to iframe when ready
  React.useEffect(() => {
    if (iframeReady && iframeRef.current && tsxFileContent) {
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

  // Forward keyboard events to iframe for navigation (only in fullscreen)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard navigation when in fullscreen mode
      if (!isFullscreen) return;

      // Don't interfere if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Only forward navigation keys
      if (['ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
        e.preventDefault();
        // Forward key event to iframe
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'KEYBOARD_EVENT',
            key: e.key
          }, '*');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

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
      // Fullscreen failed silently
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

            // KEEP THIS LOG: Link to the Dust conversation for easy access
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
      // Handle PNG directly
      setPdfFile(file);
      setPngFiles([file]);
      setConversionComplete(true);
    } else if (file.type === "application/vnd.ms-powerpoint" || file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
      // Handle PPT/PPTX directly
      setPdfFile(file);
      setPngFiles([file]);
      setConversionComplete(true);
    } else {
      setError("Please select a PDF, PNG, or PowerPoint file");
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

      // Upload files (PNG, PPT, or PPTX)
      for (const file of pngFiles) {
        // Determine content type based on file type
        let contentType = 'image/png';
        if (file.type === 'application/vnd.ms-powerpoint') {
          contentType = 'application/vnd.ms-powerpoint';
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
          contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        }

        // Create file entry
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
          PDF, PNG, or PowerPoint File
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
