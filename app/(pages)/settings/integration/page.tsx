import { EmbedCodeDisplay } from "@/components/assistant/EmbedCodeDisplay";

export default function IntegrationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Integratie</h1>
        <p className="mt-1 text-sm text-gray-500">
          Integreer je chatbot op je website
        </p>
      </div>

      <EmbedCodeDisplay />
    </div>
  );
}
