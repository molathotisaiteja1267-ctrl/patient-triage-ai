import React from 'react';

interface ClinicalSectionProps {
  title: string;
  subtitle?: string;
  badge?: string;
  headerRight?: React.ReactNode;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ClinicalSection: React.FC<ClinicalSectionProps> = ({
  title,
  subtitle,
  badge,
  headerRight,
  rightAction,
  children,
  className = '',
}) => {
  const actionElement = headerRight || rightAction;

  return (
    <section className={`bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] space-y-4 ${className}`}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F5F9] pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div>
            <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wide">{title}</h3>
            {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
          </div>
          {badge && (
            <span className="px-2 py-0.5 bg-[#EAF2FF] text-[#2563EB] font-bold text-[10px] rounded border border-[#C9DBF8]">
              {badge}
            </span>
          )}
        </div>
        {actionElement && <div className="shrink-0">{actionElement}</div>}
      </div>

      {/* Content */}
      <div>{children}</div>
    </section>
  );
};
