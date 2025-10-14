import React from 'react';
import { Info, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface ExportInstructionsProps {
  className?: string;
}

export const ExportInstructions: React.FC<ExportInstructionsProps> = ({
  className = '',
}) => {
  return (
    <div
      className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-blue-900 mb-2">
              CSV Export Instructions
            </h4>
            <p className="text-sm text-blue-800">
              The exported CSV file is optimized for Excel and other spreadsheet
              applications. Phone numbers and Aadhar numbers are formatted to
              display correctly.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Opening in Excel:
              </span>
            </div>
            <ul className="text-sm text-blue-800 space-y-1 ml-6">
              <li>• Double-click the downloaded CSV file to open in Excel</li>
              <li>
                • Numbers like phone numbers and Aadhar will display correctly
              </li>
              <li>
                • If you see scientific notation, the file may need to be
                imported differently
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Alternative Import Method:
              </span>
            </div>
            <ul className="text-sm text-blue-800 space-y-1 ml-6">
              <li>• Open Excel → Data → From Text/CSV</li>
              <li>• Select the downloaded file</li>
              <li>• Choose "Delimited" and "Comma" as separator</li>
              <li>• Set number columns as "Text" format</li>
            </ul>
          </div>

          <div className="pt-2 border-t border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> The CSV file includes proper formatting to
              prevent Excel from converting long numbers to scientific notation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
