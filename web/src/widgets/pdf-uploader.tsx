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
  const [conversionComplete, setConversionComplete] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  const convertPdfToPng = async (file: File) => {
    setPdfFile(file);
    setIsConverting(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // Convert each page to PNG
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport } as any).promise;
          canvas.toDataURL('image/png'); // Generate PNG (not stored, just converted)
        }
      }

      setPageCount(pdf.numPages);
      setConversionComplete(true);
    } catch (error) {
      alert(`Conversion error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConverting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please select a PDF file");
      return;
    }

    convertPdfToPng(file);
  };

  // Success state
  if (conversionComplete) {
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
          <h2 style={{ margin: "0 0 10px 0" }}>PDF uploaded successfully</h2>
          <p style={{ margin: "0", opacity: "0.9" }}>
            {pdfFile?.name} - {pageCount} page{pageCount > 1 ? 's' : ''} converted to PNG
          </p>
        </div>
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
            Converting...
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
