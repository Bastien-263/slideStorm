import "@/index.css";
import { useState } from "react";
import { mountWidget } from "skybridge/web";

function SendMessageToDust() {
  const [pngFiles, setPngFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const pngOnly = files.filter(f => f.type === "image/png");
    if (pngOnly.length !== files.length) return;
    setPngFiles(pngOnly);
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    setIsUploading(true);

    try {
      let convId: string;

      // Create conversation (empty if files, with message if no files)
      const conversationUrl = `https://dust.tt/api/v1/w/${workspaceId}/assistant/conversations`;

      if (pngFiles.length > 0) {
        const conversationJson = await callDustAPI(conversationUrl, {
          visibility: 'unlisted',
          title: null
        });
        convId = conversationJson.conversation?.sId;
        if (!convId) throw new Error('Failed to create conversation');
        setConversationId(convId);
      } else {
        const conversationJson = await callDustAPI(conversationUrl, {
          message: {
            content: message,
            mentions: agentId ? [{ configurationId: agentId }] : [],
            context: { username: 'slidestorm', timezone: 'Europe/Paris' }
          },
          blocking: true
        });
        convId = conversationJson.conversation?.sId;
        if (!convId) throw new Error('Failed to create conversation');
        setConversationId(convId);
        setUploadComplete(true);
        return;
      }

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

      // Send user message with files already attached
      await callDustAPI(
        `https://dust.tt/api/v1/w/${workspaceId}/assistant/conversations/${convId}/messages`,
        {
          content: message,
          mentions: agentId ? [{ configurationId: agentId }] : [],
          context: { username: 'slidestorm', timezone: 'Europe/Paris' }
        }
      );

      setUploadComplete(true);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Success state
  if (uploadComplete) {
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
          <h2 style={{ margin: "0 0 10px 0" }}>Message sent successfully</h2>
          <p style={{ margin: "0", opacity: "0.9" }}>
            {pngFiles.length > 0 && `${pngFiles.length} file${pngFiles.length > 1 ? 's' : ''} attached`}
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

  // Uploading state
  if (isUploading) {
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
            {pngFiles.length > 0 && `Uploading ${pngFiles.length} file${pngFiles.length > 1 ? 's' : ''}...`}
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

  // Input state
  return (
    <div className="container" style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>Send Message to Dust</h2>

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
          Attach PNG files (optional)
        </label>
        <input
          type="file"
          accept="image/png"
          multiple
          onChange={handleFileSelect}
          style={{
            padding: "10px",
            border: "2px solid #ddd",
            borderRadius: "8px",
            width: "100%"
          }}
        />
        {pngFiles.length > 0 && (
          <p style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
            {pngFiles.length} file{pngFiles.length > 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      <button
        onClick={handleSend}
        disabled={!message.trim()}
        style={{
          marginTop: "20px",
          padding: "12px 24px",
          background: message.trim() ? "#2196f3" : "#ccc",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: message.trim() ? "pointer" : "not-allowed",
          width: "100%"
        }}
      >
        Send to Dust
      </button>
    </div>
  );
}

export default SendMessageToDust;
mountWidget(<SendMessageToDust />);
