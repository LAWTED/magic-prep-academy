'use client';

import { useState } from 'react';
import { Upload, ArrowLeft, Loader2, Globe, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function MaterialUploadPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputType, setInputType] = useState<'document' | 'website'>('document');
  const [url, setUrl] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('inputType', inputType);

      if (inputType === 'document' && selectedFile) {
        formData.append('file', selectedFile);
      } else if (inputType === 'website' && url) {
        formData.append('url', url);
      } else {
        throw new Error('No file or URL provided');
      }

      const response = await fetch('/api/materials', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload material');
      }

      const { fileId } = await response.json();
      toast.success('Material uploaded successfully!');

      // Navigate to the next step with the fileId
      router.push(`/mentor/materials/process?fileId=${fileId}`);

    } catch (error) {
      console.error('Error uploading material:', error);
      toast.error('Failed to upload material. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const inputTypes = [
    { id: 'document', label: 'Upload Document', icon: FileText },
    { id: 'website', label: 'Website URL', icon: Globe }
  ] as const;

  return (
    <div className="w-full min-h-screen bg-background">
      <header className="w-full p-6 flex items-center gap-4 border-b bg-card">
        <Link href="/mentor/dashboard" className="hover:text-primary transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">Upload Learning Material</h1>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Input Type Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Input Method</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {inputTypes.map(({ id, label, icon: Icon }) => (
                <motion.button
                  key={id}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setInputType(id as 'document' | 'website')}
                  className={"p-6 bg-card rounded-xl shadow-sm border flex items-center gap-4 " +
                    (inputType === id
                      ? "border-primary hover:border-primary"
                      : "hover:border-primary/50") +
                    " transition-colors"}
                >
                  <Icon className={"w-6 h-6 " + (inputType === id ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-lg font-medium">{label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-card rounded-xl shadow-sm border space-y-4">
            <label className="block text-lg font-medium">
              {inputType === 'document' ? 'Upload File' : 'Website URL'}
            </label>
            {inputType === 'document' ? (
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.txt,.md"
                  required={inputType === 'document'}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  <Upload className="w-12 h-12 text-primary" />
                  <div className="space-y-2">
                    <p className="font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedFile ? selectedFile.name : 'PDF, DOC, DOCX, TXT, or MD'}
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full p-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Enter website URL (e.g., https://example.com)"
                  required={inputType === 'website'}
                />
                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-medium mb-2">Supported websites:</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Academic journals and papers</li>
                    <li>Educational blogs and articles</li>
                    <li>Research publications</li>
                    <li>Scientific websites</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isUploading}
            className="w-full p-4 bg-primary text-primary-foreground rounded-xl font-medium
              flex items-center justify-center gap-3 hover:bg-primary/90 transition-colors"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Upload Material'
            )}
          </motion.button>
        </form>
      </main>
    </div>
  );
}