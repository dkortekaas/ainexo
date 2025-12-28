import { useTranslations } from "next-intl";
import Link from "next/link";

export default function NotFound() {
  const t = useTranslations();

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="text-6xl font-bold text-gray-700 mt-8">
          {t("notFound.title")}
        </h2>
        <p className="text-xl text-gray-500 mt-4 text-center">
          {t("notFound.description")}
        </p>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-md bg-primary/80 text-white font-medium hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
          >
            {t("notFound.backToPortal")}
          </Link>
        </div>
      </div>
    </div>
  );
}
