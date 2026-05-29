import React from 'react';
import { SyncPacket } from '../types';
import { Database, ShieldCheck, Activity, Key, CheckCircle, Smartphone, Flame } from 'lucide-react';

interface SchemaViewerProps {
  logs: SyncPacket[];
  onClearLogs: () => void;
}

export function SchemaViewer({ logs, onClearLogs }: SchemaViewerProps) {
  return (
    <div className="space-y-5">
      
      {/* Visual DB Architecture Node Grid */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm text-slate-800">
        <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2 border-b-2 border-slate-100 pb-3 mb-4 uppercase tracking-tight">
          <Database className="w-5 h-5 text-amber-500" />
          <span>โครงสร้างฐานข้อมูล <span className="text-amber-500">Cloud Firestore</span> (Spark Plan)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* COLLECTION #1: USERS */}
          <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-105 flex flex-col justify-between text-slate-800">
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-[11px] font-bold bg-slate-900 text-amber-400 px-2.5 py-1 rounded-lg font-mono uppercase tracking-wider">
                  users
                </span>
                <span className="text-[10px] text-red-600 font-bold uppercase">Admin (R/W)</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3 font-medium">เก็บข้อมูลบัญชีช่างซ่อมและบทบาทในร้าน</p>
              
              <ul className="space-y-1.5 font-mono text-[10px] text-slate-700">
                <li className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-amber-600 font-bold">uid (doc_id)</span>
                  <span className="text-slate-400">String</span>
                </li>
                <li className="flex justify-between border-b border-slate-100 pb-1">
                  <span>name</span>
                  <span className="text-slate-400">String</span>
                </li>
                <li className="flex justify-between border-b border-slate-100 pb-1">
                  <span>email</span>
                  <span className="text-slate-400">String</span>
                </li>
                <li className="flex justify-between">
                  <span>role</span>
                  <span className="text-slate-900 font-bold bg-amber-500/25 px-1 rounded">staff | admin</span>
                </li>
              </ul>
            </div>
            
            <div className="mt-4 pt-3.5 border-t border-slate-100 text-[9px] text-slate-400 font-medium">
              * Staff ทั่วไปอ่านข้อมูลเพื่อระบุสถานะตนเองเท่านั้น
            </div>
          </div>

          {/* COLLECTION #2: SHOP_PROFILE */}
          <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-105 flex flex-col justify-between text-slate-800">
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-[11px] font-bold bg-slate-900 text-teal-400 px-2.5 py-1 rounded-lg font-mono uppercase tracking-wider">
                  shop_profile
                </span>
                <span className="text-[10px] text-emerald-600 font-bold uppercase">Public Read</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3 font-medium">เก็บข้อมูลหัวบิล ชื่อ/ที่อยู่/เบอร์ของของร้าน</p>
              
              <ul className="space-y-1.5 font-mono text-[10px] text-slate-700">
                <li className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-amber-600 font-bold">profile_id</span>
                  <span className="text-slate-400">String</span>
                </li>
                <li className="flex justify-between border-b border-slate-100 pb-1">
                  <span>name</span>
                  <span className="text-slate-400">String</span>
                </li>
                <li className="flex justify-between border-b border-slate-100 pb-1">
                  <span>address</span>
                  <span className="text-slate-400">String</span>
                </li>
                <li className="flex justify-between">
                  <span>phone</span>
                  <span className="text-slate-400">String</span>
                </li>
              </ul>
            </div>
            
            <div className="mt-4 pt-3.5 border-t border-slate-100 text-[9px] text-slate-400 font-medium">
              * บล็อกสิทธิ์เขียนเฉพาะ Admin เท่านั้น
            </div>
          </div>

          {/* COLLECTION #3: JOBS */}
          <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-105 flex flex-col justify-between text-slate-800">
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-[11px] font-bold bg-slate-900 text-sky-400 px-2.5 py-1 rounded-lg font-mono uppercase tracking-wider">
                  jobs
                </span>
                <span className="text-[10px] text-blue-600 font-bold uppercase">R/W Shared</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3 font-medium">คลังข้อมูลใบงานซ่อมรับเครื่อง (ซิงก์เรียลไทม์)</p>
              
              <ul className="space-y-1.5 font-mono text-[10px] text-slate-700">
                <li className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-amber-600 font-bold">job_id</span>
                  <span className="text-slate-400">HW-YYYYMMDD-X</span>
                </li>
                <li className="flex justify-between border-b border-slate-100 pb-1">
                  <span>customerName</span>
                  <span className="text-slate-400">String</span>
                </li>
                <li className="flex justify-between border-b border-slate-100 pb-1">
                  <span>device</span>
                  <span className="text-slate-400">String</span>
                </li>
                <li className="flex justify-between pb-1 border-b border-slate-100">
                  <span>status</span>
                  <span className="text-slate-950 font-bold bg-amber-500/25 px-1 rounded">pending | ...</span>
                </li>
                <li className="flex justify-between">
                  <span>timestamp</span>
                  <span className="text-slate-400">Timestamp</span>
                </li>
              </ul>
            </div>
            
            <div className="mt-4 pt-3.5 border-t border-slate-100 text-[9px] text-slate-400 font-medium">
              * สิทธิ์พนักงานสามารถแก้ไขได้ ห้ามลบข้อมูลใบรับซ่อม
            </div>
          </div>

        </div>

        {/* Visual Role security architecture */}
        <div className="mt-6 p-5 bg-slate-900 text-white rounded-2xl border-2 border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-slate-300 text-[11px] leading-relaxed">
            <ShieldCheck className="w-8 h-8 text-amber-500 shrink-0" />
            <div>
              <span className="font-bold text-white block uppercase text-xs tracking-wider">สิทธิ์การควบคุมระดับโครงสร้าง (Firebase Rules Protection)</span>
              แอดมินเจ้าของร้านสามารถจัดการพนักงาน ล้างระบบ ได้อย่างยืดหยุ่น ส่วนช่างรับเครื่องสามารถเข้าถึง และอัปเดตงานซ่อมได้อย่างราบรื่น
            </div>
          </div>
          
          <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs shrink-0 select-none">
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="font-bold text-amber-400 font-mono text-[10px] uppercase tracking-wider">Spark Plan Free Sync</span>
          </div>
        </div>
      </div>

      {/* Real-time sync logs block */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm text-slate-800">
        <div className="flex justify-between items-center border-b-2 border-slate-103 pb-3 mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 uppercase tracking-tight">
            <Activity className="w-5 h-5 text-amber-500" />
            <span>ตรวจสอบสตรีมแบบเรียลไทม์ (Real-time Firestore Sync Stream Monitor)</span>
          </h3>
          <button 
            onClick={onClearLogs}
            className="text-[10px] text-slate-400 hover:text-slate-900 hover:underline font-bold uppercase tracking-wider"
          >
            ล้างข้อมูลล็อก
          </button>
        </div>

        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 font-mono text-[11px] space-y-2 max-h-[220px] overflow-y-auto text-left leading-relaxed">
          {logs.map(log => (
            <div key={log.id} className="flex items-start space-x-2 hover:bg-slate-900 p-1.5 rounded transition border-b border-slate-900/40 pb-1.5">
              <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
              
              {log.status === 'success' && <span className="text-green-400 font-bold shrink-0">[SUCCESS]</span>}
              {log.status === 'info' && <span className="text-sky-400 font-bold shrink-0">[INFO]</span>}
              {log.status === 'warning' && <span className="text-amber-500 font-bold shrink-0">[ALARM]</span>}

              <div className="flex-1">
                <span className="text-slate-200 font-bold block">{log.action}</span>
                <span className="text-[10px] text-slate-400">{log.details}</span>
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="text-slate-500 text-center py-6 font-medium">
              ยังไม่มีการเรียกใช้บริการฐานข้อมูลเพิ่มเติม... เพิ่มหรือปรับแต่งงานซ่อมใน Simulator เพื่อให้ระบบสร้าง Logs ซิงก์เรียลไทม์!
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
