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
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pngFiles, setPngFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendComplete, setSendComplete] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setIsConverting(false);

      // Automatically send to Dust
      await sendToDust(pngFilesArray);
    } catch (error) {
      console.error('Conversion error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setIsConverting(false);
    }
  };

  const sendToDust = async (files: File[]) => {
    setIsSending(true);

    try {
      // Create empty conversation
      const conversationUrl = `https://dust.tt/api/v1/w/${workspaceId}/assistant/conversations`;
      const conversationJson = await callDustAPI(conversationUrl, {
        visibility: 'unlisted',
        title: null
      });
      const convId = conversationJson.conversation?.sId;
      if (!convId) throw new Error('Failed to create conversation');
      setConversationId(convId);

      // Upload PNG files
      for (const file of files) {
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

      // Send message
      await callDustAPI(
        `https://dust.tt/api/v1/w/${workspaceId}/assistant/conversations/${convId}/messages`,
        {
          content: `PDF converted: ${pdfFile?.name} (${files.length} pages)`,
          mentions: agentId ? [{ configurationId: agentId }] : [],
          context: { username: 'slidestorm', timezone: 'Europe/Paris' }
        }
      );

      setSendComplete(true);
    } catch (error) {
      console.error('Send error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      console.warn("Please select a PDF file");
      setError("Please select a PDF file");
      return;
    }

    convertPdfToPng(file);
  };

  // Success state - sent to Dust
  if (sendComplete) {
    return (
      <div className="container" style={{ padding: "20px", maxWidth: "600px" }}>
        <div style={{
          padding: "30px",
          textAlign: "center",
          background: "#4caf50",
          color: "white",
          borderRadius: "12px",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "15px" }}>✅</div>
          <h2 style={{ margin: "0 0 10px 0" }}>PDF sent to Dust successfully</h2>
          <p style={{ margin: "0", opacity: "0.9" }}>
            {pdfFile?.name} - {pngFiles.length} page{pngFiles.length > 1 ? 's' : ''} uploaded
          </p>
          {conversationId && (
            <p style={{ margin: "10px 0 0 0", fontSize: "14px", opacity: "0.8" }}>
              Conversation ID: {conversationId}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Sending to Dust state
  if (isSending) {
    return (
      <div className="container" style={{ padding: "20px", maxWidth: "600px" }}>
        <div style={{
          padding: "40px",
          textAlign: "center",
          background: "#e3f2fd",
          borderRadius: "12px",
        }}>
          <div style={{
            width: "50px",
            height: "50px",
            border: "4px solid #2196f3",
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

  // Converting state
  if (isConverting) {
    return (
      <div className="container" style={{ padding: "20px", maxWidth: "600px" }}>
        <div style={{
          padding: "40px",
          textAlign: "center",
          background: "#e3f2fd",
          borderRadius: "12px",
        }}>
          <div style={{
            width: "50px",
            height: "50px",
            border: "4px solid #2196f3",
            borderTop: "4px solid transparent",
            borderRadius: "50%",
            margin: "0 auto 20px",
            animation: "spin 1s linear infinite"
          }}></div>
          <p style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 10px 0" }}>
            Converting PDF to PNG...
          </p>
          <p style={{ fontSize: "14px", color: "#666" }}>
            {pdfFile?.name}
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

  // Upload state
  return (
    <div className="container" style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>Upload PDF</h2>
      <p>Select a PDF file to convert to PNG images</p>

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

      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileSelect}
        style={{
          marginTop: "20px",
          padding: "10px",
          border: "2px solid #ddd",
          borderRadius: "8px",
          width: "100%"
        }}
      />
    </div>
  );
}

export default PdfUploader;
mountWidget(<PdfUploader />);
