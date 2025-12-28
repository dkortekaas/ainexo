"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const presetColors = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#84CC16", // Lime
];

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);

  // Ensure color is always a string to prevent controlled/uncontrolled input issues
  const safeColor = color || "#3B82F6";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <div
            className="w-4 h-4 rounded mr-2 border"
            style={{ backgroundColor: safeColor }}
          />
          {safeColor}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("assistants.chooseColor")}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {presetColors.map((presetColor) => (
                <button
                  key={presetColor}
                  className={`w-8 h-8 rounded border-2 ${
                    safeColor === presetColor
                      ? "border-gray-900"
                      : "border-gray-200"
                  }`}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => {
                    onChange(presetColor);
                    setIsOpen(false);
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("assistants.orEnterHexCode")}
            </label>
            <Input
              value={safeColor}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#3B82F6"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
