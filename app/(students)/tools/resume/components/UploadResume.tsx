"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  Check,
  MessageCircle,
  Sparkles,
  Download,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import APAPreview, { ResumeData } from "./APAPreview";
import { RESUME_PROMPTS } from "@/app/config/systemPrompts";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/userStore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type UploadResumeProps = {
  onAskMentor: () => void;
};

export default function UploadResume({ onAskMentor }: UploadResumeProps) {
  const { user } = useUserStore();
  const supabase = createClient();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileId, setFileId] = useState<string>("");
  const [vectorStoreId, setVectorStoreId] = useState<string>("");
  const [formattedResume, setFormattedResume] = useState<ResumeData | null>(
    null
  );

  const resetState = () => {
    setStep(1);
    setFile(null);
    setError(null);
    setFileId("");
    setVectorStoreId("");
    setFormattedResume(null);
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.type === "application/pdf" ||
        droppedFile.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        setFile(droppedFile);
        await uploadFile(droppedFile);
      } else {
        setError("Please upload a PDF or DOCX file");
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      await uploadFile(selectedFile);
    }
  };

  const uploadFile = async (fileToUpload: File) => {
    try {
      setLoading(true);
      setError(null);

      // Validate file type again to ensure it's PDF or DOCX
      if (
        fileToUpload.type !== "application/pdf" &&
        fileToUpload.type !==
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        throw new Error("Invalid file type. Please upload a PDF or DOCX file.");
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("inputType", "document");
      formData.append("fileType", "resume");
      formData.append("contentType", fileToUpload.type);
      formData.append("fileName", fileToUpload.name);

      const response = await fetch("/api/materials", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload file");
      }

      const data = await response.json();
      console.log("Upload successful:", data);

      // Store the file ID and vector store ID for later use
      setFileId(data.fileId);
      setVectorStoreId(data.vectorStoreId);

      // Auto-proceed to next step if upload is successful
      nextStep();
    } catch (error) {
      console.error("Upload error:", error);
      setError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFormatAsAPA = async () => {
    if (!vectorStoreId) {
      setError("No resume uploaded. Please upload a resume first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/vector-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vectorStoreId: vectorStoreId,
          prompt: RESUME_PROMPTS.FORMAT_APA,
          validator_name: "apaResume",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to format resume");
      }

      const data = await response.json();
      console.log("Format response:", data);

      if (data.response?.parsed_content) {
        setFormattedResume(data.response.parsed_content);
      } else if (data.parse_error) {
        throw new Error(data.parse_error);
      } else {
        throw new Error("Failed to parse formatted resume");
      }
    } catch (error) {
      console.error("Format error:", error);
      setError(error instanceof Error ? error.message : "Formatting failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResume = async () => {
    if (!formattedResume || !user) return;

    try {
      setLoading(true);
      setError(null);

      const fileName = file?.name || "Resume";
      const resumeName = fileName.replace(/\.[^/.]+$/, ""); // Remove file extension
      const documentName = `${resumeName} - APA Format`;

      // First, insert into documents table
      const { data: documentData, error: documentError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          name: documentName,
          type: "resume",
          metadata: {
            content: formattedResume,
            original_file_name: file?.name,
            format: "APA",
            created_from_id: fileId || null,
          },
        })
        .select()
        .single();

      if (documentError) {
        throw documentError;
      }

      if (!documentData?.id) {
        throw new Error("Failed to create document record");
      }

      // Then, insert into document_versions table
      const { data: versionData, error: versionError } = await supabase
        .from("document_versions")
        .insert({
          document_id: documentData.id,
          name: null,
          version_number: 1,
          metadata: {
            content: formattedResume,
            original_file_name: file?.name,
            format: "APA",
            created_from_id: fileId || null,
          },
        })
        .select()
        .single();

      if (versionError) {
        throw versionError;
      }

      toast.success("Resume saved successfully!");
      console.log("Resume saved:", {
        document: documentData,
        version: versionData,
      });

      // Navigate to the main resume listing page
      router.push("/tools/resume");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save resume");
      setError(
        error instanceof Error ? error.message : "Failed to save resume"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Progress Bar */}
      <div className="w-full mb-8 mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Resume Builder</span>
          <span>
            {step}/{totalSteps}
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4 mb-4">
          <div className="flex items-start">
            <AlertCircle
              className="text-red-600 mr-2 mt-0.5 flex-shrink-0"
              size={18}
            />
            <div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Steps Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          {/* Step 1: Upload Resume */}
          {step === 1 && (
            <div className="space-y-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-6"
              >
                <h1 className="text-2xl font-bold mb-2">Upload Your Resume</h1>
                <p className="text-gray-500">
                  Upload your resume to get started
                </p>
              </motion.div>

              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {loading && !file ? (
                  <>
                    <div className="flex justify-center mb-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Uploading...</h3>
                    <p className="text-sm text-gray-500">
                      This may take a moment
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center mb-4">
                      <Upload size={40} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      Drag & drop your resume
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Or click to browse your files
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                      Supported formats: PDF, DOCX
                    </p>
                    <label className="inline-block">
                      <span className="bg-blue-600 text-white py-2 px-4 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                        Choose File
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx"
                        onChange={handleFileChange}
                        disabled={loading}
                      />
                    </label>
                  </>
                )}
              </div>

              {file && (
                <div className="border rounded-xl p-4">
                  <div className="flex items-center">
                    <FileText className="text-blue-600 mr-3" size={24} />
                    <div className="flex-1">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    {loading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    ) : (
                      <Check className="text-green-500" size={24} />
                    )}
                  </div>
                </div>
              )}

              {file && !loading && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={nextStep}
                  className="w-full flex items-center justify-center bg-blue-600 text-white py-3 px-4 rounded-lg mt-4"
                >
                  Continue
                  <ArrowRight size={18} className="ml-2" />
                </motion.button>
              )}
            </div>
          )}

          {/* Step 2: Format as APA */}
          {step === 2 && (
            <div className="space-y-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-6"
              >
                <h1 className="text-2xl font-bold mb-2">Format Resume</h1>
                <p className="text-gray-500">
                  Transform your resume into APA format
                </p>
              </motion.div>

              <div className="border rounded-xl p-4 mb-4">
                <div className="flex items-center">
                  <FileText className="text-blue-600 mr-3" size={24} />
                  <div className="flex-1">
                    <p className="font-medium">{file?.name}</p>
                    <p className="text-xs text-gray-500">
                      {file && (file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Check className="text-green-500" size={24} />
                </div>
              </div>

              {!formattedResume && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFormatAsAPA}
                  disabled={loading}
                  className="w-full flex items-center justify-center bg-green-600 text-white py-3 px-4 rounded-lg"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Sparkles size={18} className="mr-2" />
                  )}
                  {loading ? "Formatting..." : "Format as APA"}
                </motion.button>
              )}

              {formattedResume && (
                <>
                  <div className="border rounded-xl p-4">
                    <h3 className="font-semibold mb-4">
                      APA Formatted Resume Preview
                    </h3>
                    <div className="mb-4">
                      <APAPreview
                        resumeData={formattedResume}
                        fileName={`${file?.name} - APA Format`}
                      />
                    </div>
                    <div className="flex space-x-4">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleFormatAsAPA}
                        disabled={loading}
                        className="flex items-center justify-center border border-gray-300 py-2 px-3 rounded-lg text-sm"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                        ) : (
                          <RefreshCw size={16} className="mr-2" />
                        )}
                        {loading ? "Reformatting..." : "Reformat"}
                      </motion.button>
                    </div>
                  </div>

                  <div className="flex space-x-4 mt-4">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={prevStep}
                      className="flex-1 flex items-center justify-center border border-gray-300 py-3 px-4 rounded-lg"
                      disabled={loading}
                    >
                      <ArrowLeft size={18} className="mr-2" />
                      Back
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={nextStep}
                      className="flex-1 flex items-center justify-center bg-blue-600 text-white py-3 px-4 rounded-lg"
                      disabled={loading}
                    >
                      Continue
                      <ArrowRight size={18} className="ml-2" />
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Save Resume */}
          {step === 3 && (
            <div className="space-y-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-6"
              >
                <h1 className="text-2xl font-bold mb-2">Save Your Resume</h1>
                <p className="text-gray-500">
                  Review and save your APA formatted resume
                </p>
              </motion.div>

              <APAPreview
                resumeData={formattedResume as ResumeData}
                fileName={`${file?.name} - APA Format`}
              />

              <div className="flex space-x-4 mt-6">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={prevStep}
                  className="flex-1 flex items-center justify-center border border-gray-300 py-3 px-4 rounded-lg"
                  disabled={loading}
                >
                  <ArrowLeft size={18} className="mr-2" />
                  Back
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveResume}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center bg-green-600 text-white py-3 px-4 rounded-lg"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Download size={18} className="mr-2" />
                  )}
                  {loading ? "Saving..." : "Save Resume"}
                </motion.button>
              </div>

              <div className="mt-6 pt-4 border-t text-center">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={resetState}
                  className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center mx-auto"
                >
                  <RefreshCw size={14} className="mr-2" />
                  Start Over
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
