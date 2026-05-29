import React, { useState } from 'react';
import { FLUTTER_CODE_FILES, DartFile } from '../flutter_code';
import { FileCode, Clipboard, Check, Info, FileSpreadsheet, KeyRound } from 'lucide-react';

export function CodeExplorer() {
  const [selectedFile, setSelectedFile] = useState<DartFile>(FLUTTER_CODE_FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-full text-slate-800">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-slate-100 pb-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2 uppercase tracking-tight">
            <FileCode className="w-5 h-5 text-amber-500" />
            <span>คลังซอร์สโค้ด <span className="text-amber-500">Dart & Flutter</span> สำหรับสมาร์ทโฟน</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            แยกโมดูลอย่างเป็นระบบ เสถียรภาพสูงด้วยดีไซน์อิสระ ESC/POS และ SQLite/Firebase Sync
          </p>
        </div>
        
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition shrink-0 uppercase tracking-wider"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-amber-400" />
              <span>คัดลอกสำเร็จ!</span>
            </>
          ) : (
            <>
              <Clipboard className="w-3.5 h-3.5 text-amber-400" />
              <span>คัดลอกไฟล์นี้</span>
            </>
          )}
        </button>
      </div>

      {/* Main split work pane layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-0">
        
        {/* Left Files List (4cols) */}
        <div className="md:col-span-4 flex flex-col space-y-2 overflow-y-auto max-h-[160px] md:max-h-[600px] pr-1.5">
          {FLUTTER_CODE_FILES.map(file => {
            const isSelected = file.path === selectedFile.path;
            return (
              <button
                key={file.path}
                onClick={() => {
                  setSelectedFile(file);
                  setCopied(false);
                }}
                className={`w-full text-left p-2.5 rounded-xl transition flex items-start space-x-2.5 text-xs border-2 ${
                  isSelected 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm font-semibold' 
                    : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-150 hover:text-slate-900'
                }`}
              >
                {file.path.endsWith('.rules') && <KeyRound className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />}
                {file.path.endsWith('.yaml') && <FileSpreadsheet className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />}
                {file.path.endsWith('.dart') && <FileCode className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />}
                
                <div className="overflow-hidden">
                  <p className="font-bold truncate">{file.name}</p>
                  <p className="text-[10px] opacity-75 truncate font-mono">{file.path}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Code Viewer Area (8cols) */}
        <div className="md:col-span-8 flex flex-col min-h-0 space-y-3.5">
          
          {/* File description header box */}
          <div className="bg-slate-50 border-2 border-slate-100 p-3 rounded-2xl flex items-start space-x-2.5 text-slate-600">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-slate-800 block uppercase text-[10px] tracking-wider text-amber-600 mb-0.5">รายละเอียดหน่วย (Description)</span>
              {selectedFile.description}
            </div>
          </div>

          {/* Actual Syntax Highlight Textarea Representation */}
          <div className="flex-1 bg-[#0d1117] border-2 border-slate-900 rounded-2xl overflow-hidden flex flex-col min-h-[300px]">
            <div className="bg-[#161b22] border-b border-slate-800 px-4 py-2 flex justify-between items-center text-[10px] font-mono text-slate-400 select-none">
              <span>{selectedFile.path}</span>
              <span className="uppercase text-amber-400 font-bold">{selectedFile.language}</span>
            </div>
            
            <pre className="flex-1 overflow-auto p-4 font-mono text-left text-xs text-slate-300 leading-relaxed bg-[#0d1117] relative selection:bg-amber-550 selection:text-slate-950">
              <code>{selectedFile.content}</code>
            </pre>
          </div>

        </div>

      </div>

    </div>
  );
}
