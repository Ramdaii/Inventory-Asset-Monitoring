/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Branch } from '../types';
import { Building2, ChevronDown } from 'lucide-react';

interface BranchSelectorProps {
  branches: Branch[];
  selectedBranchId: string; // 'all' or branch.id
  onSelectBranch: (branchId: string) => void;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({
  branches,
  selectedBranchId,
  onSelectBranch,
}) => {
  return (
    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg text-xs">
      <div className="flex items-center gap-1.5 px-2 text-slate-500 font-medium">
        <Building2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Cabang:</span>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => onSelectBranch('all')}
          className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
            selectedBranchId === 'all'
              ? 'bg-white text-slate-900 shadow-2xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Semua Cabang
        </button>

        {branches.map((b) => (
          <button
            key={b.id}
            onClick={() => onSelectBranch(b.id)}
            className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
              selectedBranchId === b.id
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {b.code}
          </button>
        ))}
      </div>
    </div>
  );
};
