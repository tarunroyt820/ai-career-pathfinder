import { useRef, useState } from "react";
import { CheckCircle, FileText, Upload, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import axios from "@/services/http";
import { ResumeAnalysisReport } from "@/components/resume/ResumeAnalysisReport";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/resume`;

const getAuthHeader = () => {
  const token = localStorage.getItem("nextro_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisRaw, setAnalysisRaw] = useState("");
  const [structured, setStructured] = useState(true);
  const [analysisMessage, setAnalysisMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Only PDF or DOCX documents are supported");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }

    setFile(selectedFile);
    setUploaded(false);
    setAnalysis(null);
    setAnalysisRaw("");
    setStructured(true);
    setAnalysisMessage("");
    setUploadedFileName("");
  };

  const applyAnalysisResponse = (payload: any) => {
    const nextAnalysis = payload?.analysis || null;
    const nextAnalysisRaw = String(payload?.analysisRaw || "");
    const isStructured = payload?.structured !== false;
    const nextMessage = String(
      payload?.analysisError || payload?.parseWarning || payload?.message || "",
    );

    setAnalysis(nextAnalysis);
    setAnalysisRaw(nextAnalysisRaw);
    setStructured(isStructured);
    setAnalysisMessage(nextMessage);
    setUploaded(true);

    if (nextAnalysis) {
      toast.success("Resume analyzed successfully!");
    } else if (nextAnalysisRaw) {
      toast.warning("Resume analyzed with fallback AI feedback.");
    } else if (payload?.file?.fileName || uploadedFileName) {
      toast.warning(nextMessage || "Resume uploaded. Analysis can be retried without re-uploading.");
    } else {
      toast.error("Resume analysis finished, but no AI feedback was returned.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      if (targetRole.trim()) {
        formData.append("targetRole", targetRole.trim());
      }

      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadedFileName(String(response.data?.file?.fileName || ""));
      applyAnalysisResponse(response.data);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Upload failed. Please try again.";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleReanalyze = async () => {
    if (!uploadedFileName && !uploaded) {
      toast.error("Upload a resume first before updating the analysis.");
      return;
    }

    setUploading(true);

    try {
      const response = await axios.post(
        `${API_URL}/analyze`,
        {
          fileName: uploadedFileName,
          targetRole: targetRole.trim(),
        },
        {
          headers: {
            ...getAuthHeader(),
          },
        },
      );

      applyAnalysisResponse(response.data);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Could not update the resume analysis.";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight">CV / Resume Upload</h2>
        <p className="mt-1 text-muted-foreground">
          Upload your CV so our AI can personalise your career path.
        </p>
      </div>

      <input
        type="text"
        value={targetRole}
        onChange={(event) => setTargetRole(event.target.value)}
        placeholder="Optional: target role for job-specific ATS analysis (e.g., Senior Frontend Engineer)"
        className="h-12 w-full rounded-2xl border border-border/40 bg-background px-5 text-sm font-semibold text-foreground transition-colors focus:border-primary/50 focus:outline-none"
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const droppedFile = event.dataTransfer.files[0];
          if (droppedFile) handleFile(droppedFile);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-[2rem] border-2 border-dashed p-16 transition-all duration-300 ${
          dragging
            ? "border-primary bg-primary/10"
            : "border-border/40 hover:border-primary/50 hover:bg-muted/20"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0];
            if (selectedFile) handleFile(selectedFile);
          }}
        />

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Upload className="h-8 w-8 text-primary" />
        </div>

        <div className="text-center">
          <p className="text-lg font-black text-foreground">Drop your CV here</p>
          <p className="text-sm font-medium text-muted-foreground">
            PDF or DOCX - max 5MB
          </p>
        </div>
      </div>

      {file && (
        <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-card/60 p-5">
          <div className="flex items-center gap-4">
            {uploaded ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <FileText className="h-6 w-6 text-primary" />
            )}

            <div>
              <p className="font-black text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
              {uploadedFileName && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Change the target role and rerun analysis without uploading again.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!uploaded && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-[#168777] disabled:opacity-50"
              >
                {uploading ? "Working..." : "Upload & Analyze"}
              </button>
            )}

            {uploaded && uploadedFileName && (
              <button
                onClick={handleReanalyze}
                disabled={uploading}
                className="rounded-xl border border-primary/30 bg-primary/10 px-6 py-2.5 text-sm font-black uppercase tracking-widest text-primary transition-colors hover:bg-primary/15 disabled:opacity-50"
              >
                {uploading ? "Updating..." : "Update Analysis"}
              </button>
            )}

            <button
              onClick={() => {
                setFile(null);
                setUploadedFileName("");
                setUploaded(false);
                setAnalysis(null);
                setAnalysisRaw("");
                setStructured(true);
                setAnalysisMessage("");
              }}
              className="rounded-xl p-2 text-muted-foreground hover:bg-muted/50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {analysis && (
        <ResumeAnalysisReport
          analysis={analysis}
          fileName={file?.name || undefined}
          targetRole={targetRole || undefined}
        />
      )}

      {!analysis && analysisRaw && (
        <div className="rounded-[2rem] border border-amber-500/30 bg-amber-500/10 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
                Fallback AI Feedback
              </p>
              <h3 className="mt-2 text-xl font-black text-foreground">
                Structured resume report could not be rendered
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {analysisMessage ||
                  "The AI returned feedback, but it was not in the exact format needed for the ATS dashboard."}
              </p>
            </div>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
              {structured ? "Structured" : "Fallback"}
            </span>
          </div>

          <div className="mt-5 rounded-[2rem] border border-border/40 bg-card/70 p-6 shadow-xl shadow-black/5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                  Resume Feedback Card
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  AI-generated feedback shown in fallback mode.
                </p>
              </div>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                ATS Review
              </span>
            </div>

            <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-ul:my-3 prose-ol:my-3">
              <ReactMarkdown>{analysisRaw}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
