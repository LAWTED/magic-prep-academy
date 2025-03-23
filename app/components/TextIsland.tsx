"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Save, CheckCircle, Loader2 } from "lucide-react";
import { useEditorStore } from "../(students)/tools/store/editorStore";

interface TextIslandProps {
  onSave: () => void;
}

export default function TextIsland({ onSave }: TextIslandProps) {
  const {
    isSaving,
    isDirty,
    lastSaved,
    showDynamicIsland,
    setShowDynamicIsland
  } = useEditorStore();

  const handleHover = () => {
    // Clear any existing timeout when user hovers
    const timer = useEditorStore.getState().dynamicIslandTimeoutRef;
    if (timer) {
      clearTimeout(timer);
    }
    setShowDynamicIsland(true);
  };

  const handleMouseLeave = () => {
    // Set timeout to hide the island
    const timer = setTimeout(() => {
      setShowDynamicIsland(false);
    }, 2000);

    // Store the timer reference
    useEditorStore.getState().dynamicIslandTimeoutRef = timer;
  };

  return (
    <AnimatePresence>
      {showDynamicIsland && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-20 inset-x-0 flex justify-center z-50 safe-bottom"
          onMouseEnter={handleHover}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-gray-900 text-white rounded-full shadow-lg py-2 px-4 inline-flex items-center">
            {isSaving ? (
              <div className="flex items-center px-2">
                <Loader2
                  size={16}
                  className="text-blue-400 animate-spin mr-2"
                />
                <span className="text-sm">Saving...</span>
              </div>
            ) : lastSaved && !isDirty ? (
              <div className="flex items-center px-2">
                <CheckCircle size={16} className="text-green-400 mr-2" />
                <span className="text-sm">
                  Saved at {lastSaved.toLocaleTimeString()}
                </span>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSave}
                disabled={isSaving || !isDirty}
                className={`flex items-center px-3 py-1 text-sm ${
                  !isDirty
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-white cursor-pointer"
                }`}
              >
                <Save
                  size={16}
                  className={`mr-1.5 ${!isDirty ? "text-gray-500" : "text-blue-400"}`}
                />
                <span>Save</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
