"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import SaveModule from "./components/SaveModule";
import MultipleChoiceGenerator from "./components/MultipleChoiceGenerator";
import MatchingGenerator from "./components/MatchingGenerator";
import FillInTheBlankGenerator from "./components/FillInTheBlankGenerator";
import DialogueGenerator from "./components/DialogueGenerator";
import { useState, Suspense } from "react";

// Define steps for the process flow
const STEPS = {
  SAVE_MODULE: 0,
  CREATE_SESSIONS: 1,
};

function ProcessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const vectorStoreId = searchParams.get("vectorStoreId");
  const [currentStep, setCurrentStep] = useState(STEPS.SAVE_MODULE);
  const [moduleId, setModuleId] = useState<string>("");

  // Handle completion of module saving
  const handleModuleSaved = (savedModuleId: string, summary: string) => {
    setModuleId(savedModuleId);
    setCurrentStep(STEPS.CREATE_SESSIONS);

    // Update URL with moduleId
    const params = new URLSearchParams(searchParams.toString());
    params.set("moduleId", savedModuleId);
    router.push(`/mentor/materials/process?${params.toString()}`);
  };

  return (
    <div className="w-full min-h-screen bg-background">
      <header className="sticky top-0 z-10 w-full p-4 md:p-6 flex items-center gap-4 border-b bg-card shadow-sm">
        <Link
          href="/mentor/materials/upload"
          className="p-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </header>

      <main className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">
              {currentStep === STEPS.SAVE_MODULE
                ? "Create Module"
                : "Create Sessions"}
            </h2>
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {Object.keys(STEPS).length}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / Object.keys(STEPS).length) * 100}%`,
              }}
            />
          </div>
        </div>

        {currentStep === STEPS.SAVE_MODULE && (
          <SaveModule
            vectorStoreId={vectorStoreId}
            onModuleSaved={handleModuleSaved}
          />
        )}

        {currentStep === STEPS.CREATE_SESSIONS && (
          <div className="space-y-8">
            <MultipleChoiceGenerator
              vectorStoreId={vectorStoreId}
              moduleId={moduleId || searchParams.get("moduleId") || ""}
            />

            <MatchingGenerator
              vectorStoreId={vectorStoreId}
              moduleId={moduleId || searchParams.get("moduleId") || ""}
            />

            <FillInTheBlankGenerator
              vectorStoreId={vectorStoreId}
              moduleId={moduleId || searchParams.get("moduleId") || ""}
            />

            <DialogueGenerator
              vectorStoreId={vectorStoreId}
              moduleId={moduleId || searchParams.get("moduleId") || ""}
            />

            <div className="flex justify-center mt-12">
              <Link
                href="/mentor/materials/upload"
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center"
              >
                Done
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ProcessMaterialContent() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ProcessContent />
    </Suspense>
  );
}
