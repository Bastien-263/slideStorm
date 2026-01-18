import "@/index.css";
import { useState } from "react";
import { mountWidget } from "skybridge/web";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker for client-side PDF processing
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

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

  const workspaceId = import.meta.env.VITE_WORKSPACE_ID;
  const agentId = import.meta.env.VITE_AGENT_ID;

  const callDustAPI = async (url: string, body: any) => {
    if (body instanceof FormData) {
      body.append('url', url);
      const response = await fetch('/api/dust-upload', { method: 'POST', body });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    }

    const response = await fetch('/api/dust-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, body })
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
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
      const response = await fetch('/api/dust-stream', {
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
      const convDetails = await fetch('/api/dust-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: convDetailsUrl, method: 'GET' })
      }).then(r => r.json());

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
            const fileResponse = await fetch('/api/dust-proxy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: fileUrl, method: 'GET', returnText: true })
            });

            const fileContent = await fileResponse.text();
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
          <div style={{
            marginTop: "20px",
            padding: "20px",
            background: "#f5f5f5",
            borderRadius: "8px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h3 style={{ margin: 0 }}>{tsxFileName}</h3>
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
            <div style={{
              padding: "15px",
              background: "#1e1e1e",
              color: "#d4d4d4",
              borderRadius: "8px",
              maxHeight: "400px",
              overflow: "auto",
              fontFamily: "'Courier New', monospace",
              fontSize: "12px",
              lineHeight: "1.5"
            }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                <code>{tsxFileContent}</code>
              </pre>
            </div>
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
