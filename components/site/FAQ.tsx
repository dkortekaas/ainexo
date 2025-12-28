// components/home/FAQ.tsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

export default function FAQ() {
  const t = useTranslations("faq");
  const [openItems, setOpenItems] = useState<number[]>([]);

  const faqs = [
    {
      question: t("question_1"),
      answer: t("answer_1"),
    },
    {
      question: t("question_2"),
      answer: t("answer_2"),
    },
    {
      question: t("question_3"),
      answer: t("answer_3"),
    },
    {
      question: t("question_4"),
      answer: t("answer_4"),
    },
    {
      question: t("question_5"),
      answer: t("answer_5"),
    },
    {
      question: t("question_6"),
      answer: t("answer_6"),
    },
  ];

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <section className='py-20 px-4'>
      <div className='max-w-3xl mx-auto'>
        <div className='text-center mb-16'>
          <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
            {t("title")}
          </h2>
          <p className='text-xl text-gray-600'>{t("description")}</p>
        </div>

        <div className='space-y-4'>
          {faqs.map((faq, index) => (
            <div key={index} className='border border-gray-200 rounded-lg'>
              <button
                onClick={() => toggleItem(index)}
                className='w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50'
              >
                <h3 className='font-medium text-gray-900'>{faq.question}</h3>
                {openItems.includes(index) ? (
                  <ChevronUp className='text-gray-500' size={20} />
                ) : (
                  <ChevronDown className='text-gray-500' size={20} />
                )}
              </button>
              {openItems.includes(index) && (
                <div className='px-6 pb-4 text-gray-600'>{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
