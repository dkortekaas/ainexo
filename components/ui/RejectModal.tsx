"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

type RejectModalProps = {
  title: string;
  description: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => void;
  isProcessing: boolean;
};

export default function RejectModal({
  title,
  description,
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
}: RejectModalProps) {
  const t = useTranslations("common");
  const [comment, setComment] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    setComment("");
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(comment);
    setComment("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{description}</p>
        <textarea
          placeholder={t("commentPlaceholder")}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full min-h-[100px] p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          required
        />
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            disabled={isProcessing}
          >
            {t("buttons.cancel")}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            disabled={isProcessing || !comment.trim()}
          >
            {isProcessing ? t(`status.processing`) : t("buttons.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
