import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShopProfile, 
  RepairJob, 
  PrinterSize, 
  SyncPacket 
} from './types';
import { MobileSimulator } from './components/MobileSimulator';
import { CodeExplorer } from './components/CodeExplorer';
import { SchemaViewer } from './components/SchemaViewer';
import { 
  Cpu, 
  Smartphone, 
  Database, 
  FileCode, 
  Network, 
  Info,
  ExternalLink,
  Bot
} from 'lucide-react';

export default function App() {
  // 1. Core Reactive States
  const [shopProfile, setShopProfile] = useState<ShopProfile>({
    name: 'สยามไอทีรีแพร์ แอนด์ เซอร์วิส',
    address: '99/9 อาคารศูนย์ไอที ชั้น 4 ห้อง 405 ถ.เดโช แขวงบางรัก เขตบางรัก กรุงเทพฯ 10500',
    phone: '02-123-4567'
  });

  const [printerSize, setPrinterSize] = useState<PrinterSize>('58mm');
  
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [staffAccounts, setStaffAccounts] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<SyncPacket[]>([]);

  // Right pane tab control: 'code' | 'schema'
  const [activeRightTab, setActiveRightTab] = useState<'code' | 'schema'>('code');

  // Unified logging helper
  const addSyncLog = (action: string, details: string, status: 'info' | 'success' | 'warning' = 'info') => {
    const newLog: SyncPacket = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      time: new Date().toLocaleTimeString('th-TH', { hour12: false }),
      action,
      details,
      status
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // 2. Prepopulate & Load stored data
  useEffect(() => {
    // A. Load or set default jobs
    const savedJobs = localStorage.getItem('repair_jobs');
    if (savedJobs) {
      setJobs(JSON.parse(savedJobs));
    } else {
      const initialJobs: RepairJob[] = [
        {
          id: 'HW-20260529-001',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          customerName: 'คุณสมศักดิ์ สายตรวจ',
          customerPhone: '0812345678',
          device: 'MacBook Pro 14 (M3 - 2024)',
          issue: 'ชาร์จไฟไม่เข้า เครื่องเปิดไม่ติด ทดสอบใช้สายชาร์จอื่นแล้วยังไม่มีแสงไฟแสดงสถานะ คาดระบบบอร์ดจ่ายไฟมีเงื่อนไขเสื่อมสภาพ',
          status: 'pending',
          createdByName: 'ช่างบอย'
        },
        {
          id: 'HW-20260528-002',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          customerName: 'คุณพัชราภรณ์ สวยเท่',
          customerPhone: '0898877665',
          device: 'iPad Air 5 (M1)',
          issue: 'หน้าจอสัมผัสเบลอและทัชสกรีนรวน สัมผัสเองในบางจุดหลังจากตัวเครื่องเคยตกน้ำจืดเบาๆ แต่เป่าแห้งใช้ได้ตามปกติมาสักระยะ',
          status: 'repairing',
          createdByName: 'ช่างบอย'
        },
        {
          id: 'HW-20260528-001',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          customerName: 'คุณชัยชนะ อัศวิน',
          customerPhone: '0854433221',
          device: 'PlayStation 5 Slim',
          issue: 'ระบบการอ่านแผ่น BD ขัดข้องบางครั้งแผ่นค้างด้านใน มอเตอร์กดแผ่นมีอาการสั่นเสียงดังลั่น',
          status: 'completed',
          createdByName: 'ช่างสมพล'
        }
      ];
      setJobs(initialJobs);
      localStorage.setItem('repair_jobs', JSON.stringify(initialJobs));
    }

    // B. Load or set profile
    const savedProfile = localStorage.getItem('shop_profile');
    if (savedProfile) {
      setShopProfile(JSON.parse(savedProfile));
    }

    // C. Prepopulate Staff Accounts
    const savedStaff = localStorage.getItem('staff_accounts');
    if (savedStaff) {
      setStaffAccounts(JSON.parse(savedStaff));
    } else {
      const defaultStaff: User[] = [
        { id: 'staff-01', name: 'ช่างบอย', email: 'boy@repair.com', role: 'staff', passwordPlain: 'boy123' },
        { id: 'staff-02', name: 'ช่างสมพล', email: 'sompon@repair.com', role: 'staff', passwordPlain: 'somp123' }
      ];
      setStaffAccounts(defaultStaff);
      localStorage.setItem('staff_accounts', JSON.stringify(defaultStaff));
    }

    // D. Initial Sync logs greeting
    addSyncLog(
      'เริ่มต้นระบบซิงค์ข้อมูล Firestore', 
      'เชื่อมอินสแตนซ์ Firebase Spark Plan: ตรวจสอบความปลอดภัย โหลดข้อมูล shop_profile และบัญชี users เรียบร้อย', 
      'info'
    );
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      
      {/* 1. TOP PREMIUM TOOLBAR / HEADER */}
      <header className="bg-white/95 border-b-2 border-slate-200 sticky top-0 backdrop-blur-md z-40 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Logo & title block */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-slate-900 text-amber-500 rounded-xl flex items-center justify-center shadow-md">
              <Cpu className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="font-extrabold text-slate-900 text-lg uppercase tracking-tight">ระบบรับงานซ่อม <span className="text-amber-500 underline decoration-amber-500 decoration-2">FixSync Pro</span></span>
                <span className="text-[10px] bg-slate-900 text-amber-400 font-black px-2.5 py-1 rounded-lg uppercase tracking-wider select-none">
                  Flutter + Firebase SDK Expert
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                สถาปัตยกรรมคุมขนาดสลิปใบเสร็จ 58 มม. / 80 มม. และซิงก์เรียลไทม์ความปลอดภัยขั้นสูงคู่กระดาษใบนำส่ง
              </p>
            </div>
          </div>

          {/* Quick status controls */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="px-4 py-2 bg-white rounded-lg border-2 border-slate-200 flex items-center space-x-2 shadow-xs transition select-none">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xs font-black text-slate-600 uppercase tracking-wider">FIREBASE: ONLINE</span>
            </div>
          </div>

        </div>
      </header>

      {/* 2. MAIN SPLIT MULTI-DEVICE VIEWPORT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: INTERACTIVE PHONE SIMULATOR PANEL (5COLS COMFORTABLE) */}
        <section className="lg:col-span-4 flex flex-col items-center">
          <div className="sticky top-24 space-y-3.5 w-full max-w-[390px]">
            
            <div className="text-center">
              <span className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center justify-center space-x-1.5">
                <Smartphone className="w-4 h-4 text-amber-500" />
                <span>ตัวทดสอบระบบบนเครื่องพกพา (Simulator)</span>
              </span>
              <p className="text-[11px] text-slate-500 mt-1 font-semibold">
                กดสแกน QR อัตโนมัติ จัดการงานซ่อม และสั่งทดสอบพิมพ์สลิปตามขนาดได้เรียลไทม์
              </p>
            </div>

            {/* Smart Simulator Frame */}
            <MobileSimulator 
              onAddSyncLog={addSyncLog}
              shopProfile={shopProfile}
              setShopProfile={setShopProfile}
              printerSize={printerSize}
              setPrinterSize={setPrinterSize}
              jobs={jobs}
              setJobs={setJobs}
              staffAccounts={staffAccounts}
              setStaffAccounts={setStaffAccounts}
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
            />
          </div>
        </section>

        {/* RIGHT COLUMN: CODE BROWSER & FIRESTORE SCHEMES (8COLS WIDE) */}
        <section className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* Tab switching controllers */}
          <div className="bg-white p-1.5 rounded-2xl border-2 border-slate-200 flex space-x-2 w-fit shadow-xs">
            <button
              onClick={() => setActiveRightTab('code')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer uppercase tracking-wider ${
                activeRightTab === 'code'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileCode className="w-4 h-4 text-amber-500" />
              <span>ซอร์สโค้ด Flutter (Dart)</span>
            </button>

            <button
              onClick={() => setActiveRightTab('schema')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer uppercase tracking-wider ${
                activeRightTab === 'schema'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Database className="w-4 h-4 text-amber-500" />
              <span>แผนผัง Firestore & ซิงก์เรียลไทม์</span>
            </button>
          </div>

          {/* Dynamic Tab Panel Content */}
          <div className="flex-1 min-h-0">
            {activeRightTab === 'code' ? (
              <CodeExplorer />
            ) : (
              <SchemaViewer logs={logs} onClearLogs={() => setLogs([])} />
            )}
          </div>

          {/* Thai Guidance / Educational Explanations Box */}
          <div className="bg-white border-2 border-slate-200 rounded-[28px] p-6 space-y-4 shadow-sm text-slate-800">
            <h4 className="text-base font-extrabold text-slate-900 flex items-center space-x-2 border-b-2 border-slate-100 pb-3 uppercase tracking-tight">
              <Bot className="w-5 h-5 text-amber-500 animate-bounce" />
              <span>คำอธิบายสถาปัตยกรรมแบบโมดูลาร์และการออกแบบของกระดาษสลิป</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
              <div className="space-y-2.5 bg-slate-50 p-5 rounded-2xl border-2 border-slate-105">
                <span className="font-bold text-slate-900 block text-sm border-b-2 border-slate-100 pb-1.5 mb-2 text-amber-600 uppercase tracking-wide">
                  📱 QR Code Auto-login (ไม่ต้องคีย์รหัส)
                </span>
                <p>
                  เพื่ออำนวยความสะดวกและความปลอดภัยสูงสุด แอดมินร้านจะเป็นผู้ออกรหัสผ่านสร้างบัญชีพนักงานใหม่ใน Firestore และจะแสดงรหัสผ่านนั้นในรูปแบบ QR Code ที่ประกอบไปด้วย <strong className="text-slate-900 font-bold underline decoration-amber-500">อีเมล|รหัสผ่าน</strong>
                </p>
                <p className="text-slate-500">
                  ช่างสามารถใช้กล้องหลังมือถือสแกนภาพครั้งแรกเพื่อสลายรหัส นำส่งคำร้องขอสิทธิ์ <code>signInWithEmailAndPassword</code> เข้าใช้บริการ Firebase อัตโนมัติ โดยระบบจะจำล็อกอินไว้ถาวรตลอดไป
                </p>
              </div>

              <div className="space-y-2.5 bg-slate-50 p-5 rounded-2xl border-2 border-slate-105">
                <span className="font-bold text-slate-900 block text-sm border-b-2 border-slate-100 pb-1.5 mb-2 text-amber-600 uppercase tracking-wide">
                  🖨️ ความต่างการคุมกระดาษ 58mm / 80mm
                </span>
                <p>
                  แอปพลิเคชันจะใช้ SharedPreferences บันทึกขนาดที่เลือกไว้ เมื่อสั่งพิมพ์สลิป 2 ใบ ระบบจะเช็กเงื่อนไขกระดาษเพื่อจัดวางอักษร:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-slate-500 pl-1">
                  <li><strong>ขนาด 58mm:</strong> จัดแถวไม่เกิน 32 คอลัมน์ต่อบรรทัด ค่อยๆ คั่นกลางด้วยอักษรประ <code>-</code> พร้อมผลักระยะบรรทัดขอบใบเพื่ออำนวยการฉีกด้วยมือปลอดภัย</li>
                  <li><strong>ขนาด 80mm:</strong> จัดแถว 48 คอลัมน์ต่อบรรทัด ขยายหัวบิลอักษรใหญ่ และส่งสตรีมคำสั่งมีดสับอิเล็กทรอนิกส์ <code>0x1D, 0x56, 0x41, 0x00</code> อัตโนมัติ</li>
                </ul>
              </div>
            </div>
          </div>

        </section>

      </main>

      {/* 3. APP FOOTER */}
      <footer className="bg-slate-900 text-slate-400 border-t-2 border-slate-950 py-8 text-center text-xs mt-12 select-none">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-medium text-slate-400">
            © ระบบจัดการลงทะเบียนเครื่องรับซ่อมฮาร์ดแวร์มือถือระบบ Multi-device Sync ~ 2026. All Rights Reserved.
          </p>
          <div className="flex space-x-3 text-[10px] font-bold">
            <span className="bg-slate-800 text-amber-400 px-3 py-1 rounded-lg border border-slate-700 uppercase tracking-widest">Flutter SDK ~3.0</span>
            <span className="bg-slate-800 text-amber-400 px-3 py-1 rounded-lg border border-slate-700 uppercase tracking-widest">Firebase Cloud DB</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
