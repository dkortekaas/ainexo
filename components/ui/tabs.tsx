"use client";

import React, { createContext, useContext, useState } from "react";

type TabsContextType = {
  activeTab: string;
  setActiveTab: (value: string) => void;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function Tabs({
  children,
  defaultValue,
  value,
  className,
  onValueChange,
}: {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  className?: string;
  onValueChange?: (value: string) => void;
}) {
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultValue || ""
  );
  const activeTab = value !== undefined ? value : internalActiveTab;

  const handleTabChange = (newValue: string) => {
    if (value === undefined) {
      setInternalActiveTab(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children }: { children: React.ReactNode }) {
  return <div className="flex overflow-x-auto border-b border-gray-200 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0">{children}</div>;
}

export function TabsTrigger({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  const context = useContext(TabsContext);
  if (!context)
    throw new Error("TabsTrigger must be used within a Tabs component");

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  return (
    <button
      className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
        isActive
          ? "border-b-2 border-primary text-primary"
          : "text-gray-500 hover:text-gray-700"
      }`}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  const context = useContext(TabsContext);
  if (!context)
    throw new Error("TabsContent must be used within a Tabs component");

  const { activeTab } = context;

  if (activeTab !== value) return null;

  return <div>{children}</div>;
}
