import { RefreshCw, BookOpen } from "lucide-react";

export default function KnowledgebaseLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="relative mb-6">
          <BookOpen className="w-16 h-16 text-primary/20 mx-auto" />
          <RefreshCw className="w-8 h-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Loading Knowledge Base
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Preparing your knowledge base content...
        </p>
      </div>
    </div>
  );
}
