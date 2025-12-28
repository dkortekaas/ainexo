import { useTranslations } from "next-intl";

export default function RequiredIndicator() {
  const t = useTranslations();
  return (
    <span className='text-xs text-gray-400 ml-1'>({t("common.required")})</span>
  );
}
