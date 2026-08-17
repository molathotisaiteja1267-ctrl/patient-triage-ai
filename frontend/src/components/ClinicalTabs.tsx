import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
}

interface ClinicalTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const ClinicalTabs: React.FC<ClinicalTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="border-b border-[#E2E8F0] bg-white px-2 overflow-x-auto flex items-center gap-1 scrollbar-none rounded-t-lg">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-[3px] flex items-center gap-1.5 -mb-[1px] ${
              isActive
                ? 'text-[#2563EB] border-[#2563EB]'
                : 'text-[#64748B] border-transparent hover:text-[#172033] hover:border-[#CBD5E1]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge !== 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-[#EAF2FF] text-[#2563EB]' : 'bg-[#F1F5F9] text-[#64748B]'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
