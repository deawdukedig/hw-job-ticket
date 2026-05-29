import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  ShopProfile, 
  RepairJob, 
  PrinterSize, 
  SyncPacket 
} from '../types';
import { 
  Camera, 
  Cpu, 
  Settings, 
  PlusCircle, 
  ListTodo, 
  Printer, 
  QrCode, 
  LogOut, 
  Trash2, 
  Share2, 
  ShoppingBag, 
  Database, 
  Smartphone, 
  RefreshCw, 
  UserPlus, 
  Users, 
  Layers, 
  FileText, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  AlertCircle,
  Scissors
} from 'lucide-react';

interface MobileSimulatorProps {
  onAddSyncLog: (action: string, details: string, status?: 'info' | 'success' | 'warning') => void;
  shopProfile: ShopProfile;
  setShopProfile: React.Dispatch<React.SetStateAction<ShopProfile>>;
  printerSize: PrinterSize;
  setPrinterSize: React.Dispatch<React.SetStateAction<PrinterSize>>;
  jobs: RepairJob[];
  setJobs: React.Dispatch<React.SetStateAction<RepairJob[]>>;
  staffAccounts: User[];
  setStaffAccounts: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

export function MobileSimulator({
  onAddSyncLog,
  shopProfile,
  setShopProfile,
  printerSize,
  setPrinterSize,
  jobs,
  setJobs,
  staffAccounts,
  setStaffAccounts,
  currentUser,
  setCurrentUser
}: MobileSimulatorProps) {
  // Mobile app navigation state
  // 'login' | 'dashboard' | 'add_job' | 'shop_settings' | 'manage_staff'
  const [activeTab, setActiveTab] = useState<string>('login');
  
  // Login input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // QR Scan simulator state
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [scanningStatus, setScanningStatus] = useState('');

  // Repair form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [device, setDevice] = useState('');
  const [issue, setIssue] = useState('');
  const [formError, setFormError] = useState('');

  // Add staff form states
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [staffFormError, setStaffFormError] = useState('');
  const [showQRModal, setShowQRModal] = useState<User | null>(null);

  // Print/Receipt popup state
  const [receiptJob, setReceiptJob] = useState<RepairJob | null>(null);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [printAnimate, setPrintAnimate] = useState(false);

  // PDF Preview/Export state
  const [pdfJob, setPdfJob] = useState<RepairJob | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Filter and Search jobs
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Auto-generate Job ID
  const generateNewJobId = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const prefix = `HW-${yyyy}${mm}${dd}`;
    
    // Find how many jobs exist for today
    const todaysJobs = jobs.filter(j => j.id.startsWith(prefix));
    const nextSeq = String(todaysJobs.length + 1).padStart(3, '0');
    return `${prefix}-${nextSeq}`;
  };

  // Switch tab safely if authenticated
  const navigateTo = (tab: string) => {
    if (!currentUser && tab !== 'login') {
      setActiveTab('login');
    } else {
      setActiveTab(tab);
    }
  };

  // Mock standard logins
  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (email === 'admin@shop.com' && password === 'admin123') {
      const adminUser: User = { id: 'admin-01', name: 'แอดมิน (เจ้าของร้าน)', email: 'admin@shop.com', role: 'admin' };
      setCurrentUser(adminUser);
      onAddSyncLog('สิทธิ์ Admin เข้าสู่ระบบ', 'ผ่านบัญชีผู้รักษาความปลอดภัยระบบหลัก', 'success');
      setActiveTab('dashboard');
    } else {
      // Look for staff account matching
      const foundStaff = staffAccounts.find(s => s.email.toLowerCase() === email.toLowerCase() && s.passwordPlain === password);
      if (foundStaff) {
        setCurrentUser(foundStaff);
        onAddSyncLog(`ช่างเทคนิค ${foundStaff.name} ล็อกอิน`, `ยืนยันสิทธิ์พนักงานผ่านรหัสผ่านอีเมล`, 'success');
        setActiveTab('dashboard');
      } else {
        setLoginError('อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือ QR Code ไม่ผ่านสิทธิ์');
      }
    }
  };

  // Mock auto staff logins from generated credentials
  const triggerSpeedQRScan = (staff: User) => {
    setIsScanningQR(true);
    setScanningStatus('กำลังวิเคราะห์โครงร่างบาร์โค้ด...');
    
    setTimeout(() => {
      setScanningStatus('แกะข้อมูลรหัสผ่านสำเร็จ: ' + staff.email + ' | ******');
      setTimeout(() => {
        setIsScanningQR(false);
        setCurrentUser(staff);
        onAddSyncLog(`ช่าง ${staff.name} สแกนล็อกอินผ่าน QR Code`, `ประมวลรหัส "อีเมล|รหัสผ่าน" สำเร็จโดยอัตโนมัติ (ไม่ต้องพิมพ์รหัส)`, 'success');
        setActiveTab('dashboard');
      }, 1000);
    }, 1200);
  };

  // Admin creating new Staff Account
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffFormError('');

    if (!newStaffName || !newStaffEmail || !newStaffPassword) {
      setStaffFormError('โปรดกรอกรายละเอียดชื่อ, อีเมล และรหัสผ่านพนักงานให้ครบถ้วน');
      return;
    }

    if (staffAccounts.some(s => s.email.toLowerCase() === newStaffEmail.toLowerCase()) || newStaffEmail === 'admin@shop.com') {
      setStaffFormError('อีเมลนี้ถูกเปิดใช้สิทธิ์ในระบบเรียบร้อยแล้ว');
      return;
    }

    const newStaff: User = {
      id: `staff-${Date.now()}`,
      name: newStaffName,
      email: newStaffEmail,
      role: 'staff',
      passwordPlain: newStaffPassword
    };

    setStaffAccounts([...staffAccounts, newStaff]);
    onAddSyncLog('ลงทะเบียนช่างซ่อมใหม่', `เพิ่ม ${newStaffName} (${newStaffEmail}) ลงในส่วนจัดการผู้ใช้ Firestore`, 'success');
    
    // Clear forms and show QR Code
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPassword('');
    setShowQRModal(newStaff);
  };

  // Intake Form Submit
  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName || !customerPhone || !device || !issue) {
      setFormError('โปรดตรวจสอบข้อมูล และป้อนรายละเอียดให้สมบูรณ์ทุกช่อง');
      return;
    }

    const newJobId = generateNewJobId();
    const newJob: RepairJob = {
      id: newJobId,
      timestamp: new Date().toISOString(),
      customerName,
      customerPhone,
      device,
      issue,
      status: 'pending',
      createdByName: currentUser?.name || 'พนักงานหลัก'
    };

    const updatedJobs = [newJob, ...jobs];
    setJobs(updatedJobs);
    localStorage.setItem('repair_jobs', JSON.stringify(updatedJobs));

    onAddSyncLog('สร้างใบงานซ่อมสำเร็จ', `เลขที่ ${newJobId} อุปกรณ์: ${device} บันทึกเรียลไทม์เข้าฐานข้อมูล`, 'success');

    // Reset forms
    setCustomerName('');
    setCustomerPhone('');
    setDevice('');
    setIssue('');
    setActiveTab('dashboard');
  };

  // Update Status
  const handleUpdateStatus = (jobId: string, newStatus: 'pending' | 'repairing' | 'completed' | 'delivered') => {
    const updatedJobs = jobs.map(j => {
      if (j.id === jobId) {
        return { ...j, status: newStatus };
      }
      return j;
    });
    setJobs(updatedJobs);
    localStorage.setItem('repair_jobs', JSON.stringify(updatedJobs));
    onAddSyncLog(`แก้สถานะงาน ${jobId}`, `ปรับปรุงข้อมูลเป็น: ${newStatus === 'pending' ? 'ค้างซ่อม' : newStatus === 'repairing' ? 'กำลังซ่อม' : newStatus === 'completed' ? 'ซ่อมเสร็จแล้ว' : 'ส่งมอบแล้ว'} เรียลไทม์ซิงก์เรียบร้อย`, 'info');
  };

  // Delete Job (Admin Only)
  const handleDeleteJob = (jobId: string) => {
    if (currentUser?.role !== 'admin') {
      alert('ขออภัย: เฉพาะสิทธิ์บัญชี Admin เท่านั้นที่สามารถลบใบงานรักษาเครื่องได้!');
      return;
    }
    const updatedJobs = jobs.filter(j => j.id !== jobId);
    setJobs(updatedJobs);
    localStorage.setItem('repair_jobs', JSON.stringify(updatedJobs));
    onAddSyncLog(`ลบใบงานซ่อม ${jobId}`, 'ดำเนินการลบรหัสเอกสารออกจาก Firestore สำเร็จถาวร', 'warning');
  };

  // Clear Database (Admin Only)
  const handleClearAllJobs = () => {
    if (currentUser?.role !== 'admin') {
      alert('ขออภัย: มีเพียงเจ้าของร้าน (Admin) เท่านั้นที่สามารถล้างระบบได้!');
      return;
    }
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะทำการ "ล้างข้อมูลใบงานซ่อมทั้งหมด" ในคอลเลกชัน Firestore? ข้อมูลระบบจะสูญหายทันที')) {
      setJobs([]);
      localStorage.setItem('repair_jobs', JSON.stringify([]));
      onAddSyncLog('สิทธิ์แอดมินล้างคอลเลกชัน "jobs"', 'Firebase Firestore ตารางงานซ่อมทั้งหมดถูกเคลียร์ความจำเรียบร้อย', 'warning');
    }
  };

  // Print slip command trigger
  const handlePrintSlip = (job: RepairJob) => {
    setReceiptJob(job);
    setShowReceiptPreview(true);
    setPrintAnimate(true);
    onAddSyncLog('พิมพ์ใบเสร็จความร้อนบลูทูธ', `สร้าง ESC/POS คำสั่งคู่ต่องาน ออกเครื่องพิมพ์ขนาด ${printerSize}`, 'success');
    
    // reset visual scroll tape animation
    setTimeout(() => {
      setPrintAnimate(false);
    }, 1500);
  };

  // PDF Export visual representation
  const handlePdfExport = (job: RepairJob) => {
    setPdfJob(job);
    setShowPdfPreview(true);
    onAddSyncLog('ส่งออกใบเครื่อซ่อม PDF', `สร้างสารบรรณ A4 Vector PDF สำหรับส่งต่อให้ลูกค้าทาง Line`, 'success');
  };

  // Simulated Line / App Share
  const shareViaLineSimulated = () => {
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
    }, 2000);
  };

  // Auto-login or persist session simulator
  useEffect(() => {
    const savedUser = localStorage.getItem('active_sim_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setCurrentUser(parsed);
      setActiveTab('dashboard');
      onAddSyncLog('ตรวจพบเซสชันคงค้าง (Persistent)', `Auto-login ผู้ใช้ ${parsed.name} เข้าสู่ Dashboard สำเร็จไม่ต้องสแกนใหม่`, 'info');
    } else {
      setActiveTab('login');
    }
  }, []);

  // Update localStorage session
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('active_sim_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('active_sim_user');
    }
  }, [currentUser]);

  // UI colors based on status helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">ค้างซ่อม</span>;
      case 'repairing':
        return <span className="bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">กำลังดำเนินการ</span>;
      case 'completed':
        return <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">ซ่อมเสร็จแล้ว</span>;
      case 'delivered':
        return <span className="bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">ส่งคืนสินค้าแล้ว</span>;
      default:
        return null;
    }
  };

  // Filter jobs based on states
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.customerPhone.includes(searchQuery) ||
                          job.device.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col items-center">
      {/* Visual Device Outer Frame Container */}
      <div className="relative w-full max-w-[390px] h-[780px] bg-slate-950 rounded-[48px] shadow-2xl border-[10px] border-slate-900 overflow-hidden flex flex-col ring-8 ring-slate-800/10">
        
        {/* Notch - Status elements */}
        <div className="absolute top-0 inset-x-0 h-8 bg-slate-900 text-slate-400 text-xs px-6 flex justify-between items-center z-40">
          <time className="font-semibold text-white">09:41</time>
          <div className="w-24 h-4 bg-black rounded-b-xl absolute left-1/2 transform -translate-x-1/2 top-0"></div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] bg-indigo-900/40 text-indigo-400 px-1.5 py-0.5 rounded font-bold border border-indigo-800">5G SENS</span>
            <div className="w-3.5 h-2.5 bg-emerald-500 rounded-xs"></div>
          </div>
        </div>

        {/* Dynamic Mobile Simulator Views */}
        <div className="flex-1 bg-slate-50 text-slate-900 pt-8 pb-12 overflow-y-auto flex flex-col relative">
          
          {/* View #1: LOGIN SCREEN */}
          {activeTab === 'login' && (
            <div className="p-6 flex-1 flex flex-col justify-between" id="view_login">
              <div className="text-center mt-6">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30 mb-4">
                  <Cpu className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">ระบบรับซ่อมฮาร์ดแวร์</h2>
                <p className="text-xs text-slate-500 mt-1">โมบายแอปพลิเคชันเชื่อม Firebase - Spark Plan</p>
              </div>

              {isScanningQR ? (
                /* QR Scanner Simulator HUD */
                <div className="my-4 bg-black rounded-2xl p-4 flex flex-col items-center justify-center text-white aspect-square relative border-2 border-indigo-500 shadow-inner overflow-hidden">
                  <div className="absolute inset-0 bg-indigo-500/10 animate-pulse pointer-events-none"></div>
                  {/* Glowing Reticle */}
                  <div className="w-48 h-48 border-2 border-dashed border-indigo-500 rounded-lg flex items-center justify-center relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-400"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-400"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-400"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-400"></div>
                    
                    {/* Floating beam line */}
                    <div className="w-full h-1 bg-red-500 absolute top-10 animate-bounce"></div>
                    <QrCode className="w-20 h-20 text-indigo-400/60" />
                  </div>
                  
                  <p className="text-[11px] text-zinc-300 mt-4 text-center px-4 font-mono">
                    {scanningStatus || 'กำลังเปิดเล็งกล้องตามหา QR สิทธิ์เข้าใช้งาน...'}
                  </p>
                  
                  <button 
                    onClick={() => setIsScanningQR(false)}
                    className="mt-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] rounded-lg transition"
                  >
                    ยกเลิกสแกน
                  </button>
                </div>
              ) : (
                /* Normal Login Form with Quick QR Shortcuts */
                <form onSubmit={handleEmailLogin} className="space-y-4 my-6">
                  {loginError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start space-x-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">อีเมลผู้ใช้งาน</label>
                    <input 
                      type="email" 
                      placeholder="เช่น owner@repair.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      id="input_email"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">รหัสผ่าน</label>
                    <input 
                      type="password" 
                      placeholder="ป้อนรหัสผ่านสิทธิ์ของท่าน" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      id="input_password"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-indigo-600/10 cursor-pointer"
                    id="btn_submit_login"
                  >
                    เข้าสู่ระบบปกติ
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-3 text-slate-400 text-[10px] font-medium uppercase">หรือล็อกอินช่างซ่อม</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  {/* QR Scan Trigger Buttons */}
                  <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200 text-center">
                    <p className="text-[10px] text-slate-500 font-medium mb-2">เข้าใช้งานอย่างรวดเร็วโดยไม่ต้องพิมพ์สำหรับช่างซ่อม</p>
                    
                    {staffAccounts.length === 0 ? (
                      <div className="text-[10px] text-amber-600 font-semibold flex items-center justify-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>แอดมินต้องทำการลงทะเบียนพนักงานก่อน</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {staffAccounts.map((staff, idx) => (
                          <button
                            key={staff.id}
                            type="button"
                            onClick={() => triggerSpeedQRScan(staff)}
                            className="bg-white hover:bg-indigo-50 border border-indigo-100 hover:border-indigo-300 p-1.5 rounded-xl flex flex-col items-center justify-center text-indigo-700 transition"
                          >
                            <QrCode className="w-4 h-4 text-indigo-600 mb-1" />
                            <span className="text-[10px] font-bold line-clamp-1">{staff.name}</span>
                            <span className="text-[8px] text-slate-400">สแกน QR อัตโนมัติ</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </form>
              )}

              {/* Default Admin Portal Credentials Helper */}
              <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200/60 text-slate-700 text-[11px] self-end w-full">
                <span className="font-bold text-amber-800">บัญชีสำหรับการทดสอบเข้าระบบ:</span>
                <ul className="list-disc list-inside mt-1 text-slate-600 space-y-0.5">
                  <li><strong>Admin:</strong> admin@shop.com / admin123</li>
                  <li><strong>Staff:</strong> กดลงทะเบียนพนักงานใหม่ และจำลองสแกน QR ได้ฟรี</li>
                </ul>
              </div>
            </div>
          )}

          {/* VIEW #2: DASHBOARD */}
          {activeTab === 'dashboard' && currentUser && (
            <div className="p-4 space-y-4" id="view_dashboard">
              
              {/* Header profile info */}
              <div className="bg-indigo-900 text-white rounded-2xl p-4 shadow-lg shadow-indigo-900/20 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-10">
                  <Database className="w-32 h-32 text-white" />
                </div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      ROLE: {currentUser.role === 'admin' ? 'แอดมิน (เจ้าของร้าน)' : 'ช่างซ่อม (Staff)'}
                    </span>
                    <h3 className="text-base font-bold mt-1.5 line-clamp-1">{currentUser.name}</h3>
                    <p className="text-[11px] text-indigo-200">{currentUser.email}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setCurrentUser(null);
                      setActiveTab('login');
                      onAddSyncLog('ระบบล็อกเอาต์สำเร็จ', 'เคลียร์เซสชันบัญชีเรียบร้อย', 'info');
                    }}
                    className="p-1.5 bg-indigo-800 hover:bg-indigo-700 text-white rounded-lg transition cursor-pointer"
                    title="ออกจากระบบ"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Shop title banner */}
                <div className="mt-4 pt-3 border-t border-indigo-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1 text-indigo-100">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span className="font-bold">{shopProfile.name}</span>
                  </div>
                  <span className="text-[10px] text-indigo-300 font-mono">
                    Printer: {printerSize}
                  </span>
                </div>
              </div>

              {/* Action grid based on roles */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveTab('add_job')}
                  className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 p-3 rounded-2xl flex flex-col items-center justify-center transition"
                  id="tab_add_job"
                >
                  <PlusCircle className="w-5 h-5 mb-1" />
                  <span className="text-xs font-bold">รับเครื่องซ่อม</span>
                </button>
                
                {currentUser.role === 'admin' ? (
                  <button
                    onClick={() => setActiveTab('manage_staff')}
                    className="bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 p-3 rounded-2xl flex flex-col items-center justify-center transition"
                  >
                    <UserPlus className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">จัดการช่างซ่อม</span>
                  </button>
                ) : (
                  <div className="bg-slate-100 border border-slate-200 text-slate-400 p-3 rounded-2xl flex flex-col items-center justify-center select-none">
                    <ShieldCheck className="w-5 h-5 mb-1 text-slate-300" />
                    <span className="text-xs font-semibold">เฉพาะ Admin</span>
                  </div>
                )}
              </div>

              {/* Search and Filters */}
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="ค้นหาตามชื่อลูกค้า, ID หรืออาการซ่อม"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs px-2 py-1.5 border border-slate-200 rounded-xl bg-white outline-none"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="pending">ค้างซ่อม</option>
                    <option value="repairing">กำลังซ่อม</option>
                    <option value="completed">ซ่อมเสร็จแล้ว</option>
                    <option value="delivered">ส่งมอบแล้ว</option>
                  </select>
                </div>
              </div>

              {/* Real-time Jobs Container List */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                  <h4 className="text-xs font-bold text-slate-700">รายการใบงานซ่อมในระบบ ({filteredJobs.length})</h4>
                  {currentUser.role === 'admin' && (
                    <button 
                      onClick={handleClearAllJobs}
                      className="text-[10px] text-rose-600 hover:text-rose-800 underline font-medium"
                    >
                      ล้างข้อมูลงามซ่อมทั้งหมด
                    </button>
                  )}
                </div>

                {filteredJobs.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center border border-slate-200/80 text-slate-400 text-xs">
                    ไม่พบลักษณะหรือรายการงานซ่อมที่เกี่ยวข้องในระบบ
                  </div>
                ) : (
                  filteredJobs.map(job => (
                    <div 
                      key={job.id} 
                      className="bg-white rounded-2xl p-3 border border-slate-200/80 hover:border-indigo-300 transition shadow-xs flex flex-col space-y-2 relative"
                    >
                      {/* Base Info */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-xs font-bold text-slate-900">{job.id}</span>
                            {getStatusBadge(job.status)}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">วันที่: {new Date(job.timestamp).toLocaleString('th-TH', { hour12: false })}</p>
                        </div>
                        {currentUser.role === 'admin' && (
                          <button 
                            onClick={() => handleDeleteJob(job.id)}
                            className="text-slate-300 hover:text-rose-600 p-1 rounded-md transition"
                            title="ลบใบงานซ่อม"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Customer / Hardware Details */}
                      <div className="bg-slate-50 rounded-xl p-2.5 text-xs text-slate-700 border border-slate-100">
                        <div className="grid grid-cols-2 gap-1 mb-1.5">
                          <p className="line-clamp-1">👤 <strong>ลูกค้า:</strong> {job.customerName}</p>
                          <p className="font-mono text-[11px] text-right">📞 {job.customerPhone}</p>
                        </div>
                        <p className="line-clamp-1">📱 <strong>อุปกรณ์:</strong> {job.device}</p>
                        <p className="line-clamp-2 text-slate-600 mt-1">🔧 <strong>อาการชำรุด:</strong> {job.issue}</p>
                      </div>

                      {/* Interactive printer / pdf shortcuts & technician change */}
                      <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
                        {/* Dropdown status update for all */}
                        <div className="flex items-center space-x-1">
                          <span className="text-[9px] text-slate-400 font-semibold">แก้ขั้น:</span>
                          <select
                            value={job.status}
                            onChange={(e) => handleUpdateStatus(job.id, e.target.value as any)}
                            className="text-[11px] bg-slate-100 border border-slate-200 rounded-lg px-1.5 py-0.5"
                          >
                            <option value="pending">ค้างซ่อม</option>
                            <option value="repairing">กำลังซ่อม</option>
                            <option value="completed">เสร็จสิ้น</option>
                            <option value="delivered">ส่งแล้ว</option>
                          </select>
                        </div>

                        {/* Prints & Export shortcut buttons */}
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handlePdfExport(job)}
                            className="flex items-center space-x-1 text-[10px] bg-sky-50 hover:bg-sky-100 text-sky-700 px-2 py-1 rounded-lg border border-sky-100 transition font-medium"
                            title="แชร์ PDF"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                          
                          <button
                            onClick={() => handlePrintSlip(job)}
                            className="flex items-center space-x-1 text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg border border-indigo-100 transition font-medium"
                            title="พิมพ์สลิปบลูทูธ 2 ใบ"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>สลิป</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* VIEW #3: ADD JOB INTAKE FORM */}
          {activeTab === 'add_job' && currentUser && (
            <div className="p-4 space-y-4" id="view_add_job">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-bold text-slate-800">ลงทะเบียนรับซ่อมสินค้าใหม่</h3>
                <span className="font-mono text-xs text-slate-400 font-bold">
                  ID: {generateNewJobId()}
                </span>
              </div>

              <form onSubmit={handleAddJob} className="space-y-3.5">
                {formError && (
                  <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">ชื่อลูกค้า (Customer Name)</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น คุณกอบเกียรติ มั่นคง"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">เบอร์โทรศัพท์ลูกค้า (Phone Number)</label>
                  <input
                    type="tel"
                    required
                    placeholder="เช่น 0891234567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">อุปกรณ์ / ยี่ห้อ / โมเดล (Hardware details)</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น MacBook Pro 16 นิ้ว (M2 Max - 2023)"
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">อาการเสียชำรุดชะงัก (Hardware Issue)</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="ระบุข้อบกพร่องชองตัวอุปกรณ์โดยละเอียด เช่น จอดับไฟไม่เข้า, เปิดเครื่องแล้วหน้าจอมีเส้นริ้วกระพริบแนวตั้ง"
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="w-1/2 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    บันทึก & ซิงก์ Firestore
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW #4: ADMIN SETTINGS (Profiles + Printer size) */}
          {activeTab === 'shop_settings' && currentUser && (
            <div className="p-4 space-y-4" id="view_settings">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2">ตั้งค่าโปรไฟล์ร้านและพิมพ์หลัก</h3>
              
              {currentUser.role !== 'admin' ? (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-800 text-xs">
                  ⚠️ <strong>สงวนสิทธิ์:</strong> สิทธิ์พนักงานช่างทั่วไป (Staff) สามารถดูผลอย่างเดียวได้ เฉพาะสิทธิ์แอดมินเจ้าของร้านเท่านั้นที่จะสามารถบันทึกค่าลงคอลเลกชัน Firestore 'shop_profile' ได้
                </div>
              ) : null}

              {/* Shop profile forms */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">ชื่อร้านซ่อม (Shop Name)</label>
                  <input
                    type="text"
                    disabled={currentUser.role !== 'admin'}
                    placeholder="เช่น ฟิกซ์ฮาร์ดแวร์เซ็นเตอร์"
                    value={shopProfile.name}
                    onChange={(e) => setShopProfile({ ...shopProfile, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">ที่อยู่ของร้าน (Shop Address)</label>
                  <textarea
                    rows={2}
                    disabled={currentUser.role !== 'admin'}
                    placeholder="เช่น 123/4 ถ.พระราม 9 แขวงห้วยขวาง กรุงเทพฯ 10310"
                    value={shopProfile.address}
                    onChange={(e) => setShopProfile({ ...shopProfile, address: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">เบอร์ติดต่อหน้าร้าน (Shop Telephone)</label>
                  <input
                    type="text"
                    disabled={currentUser.role !== 'admin'}
                    placeholder="เช่น 02-345-6789"
                    value={shopProfile.phone}
                    onChange={(e) => setShopProfile({ ...shopProfile, phone: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-slate-100 disabled:text-slate-500 font-mono"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 mb-1.5">ขนาดกระดาษสลิปบลูทูธที่ใช้งาน (ESC/POS Size)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPrinterSize('58mm');
                        onAddSyncLog('เปลี่ยนขนาดบลูทูธสลิป', 'ปรับขนาดเป็น 58 มม. (จัดรูปแบบข้อความ 32 คอลัมน์ต่อบรรทัด และยกเลิกการส่งคำสั่งตัดด้วยระบบกลไก)', 'info');
                      }}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border transition flex flex-col items-center ${
                        printerSize === '58mm'
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>58mm (32 cols / line)</span>
                      <span className="text-[9px] opacity-75 mt-0.5">ฉีกด้วยมือ (Tear off)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPrinterSize('80mm');
                        onAddSyncLog('เปลี่ยนขนาดบลูทูธสลิป', 'ปรับขนาดเป็น 80 มม. (จัดรูปแบบอักขระ 48 คอลัมน์ต่อบรรทัด ขยายหัวบิล และเปิดคำสั่งใบมีดตัดกระดาษอัตโนมัติ)', 'info');
                      }}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border transition flex flex-col items-center ${
                        printerSize === '80mm'
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>80mm (48 cols / line)</span>
                      <span className="text-[9px] opacity-75 mt-0.5">ใบมีดอัตโนมัติ (Auto-cut)</span>
                    </button>
                  </div>
                </div>

                {currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('shop_profile', JSON.stringify(shopProfile));
                      onAddSyncLog('บันทึกปรับปรุงโปรไฟล์ร้าน', 'แก้ไขข้อมูล shop_profile และพิมพ์บลูทูธซิงก์เรียบร้อย', 'success');
                      alert('บันทึกข้อมูลและซิงก์สู่ Firestore สำเร็จ!');
                      setActiveTab('dashboard');
                    }}
                    className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
                  >
                    บันทึกข้อมูลลง Firestore
                  </button>
                )}
              </div>
            </div>
          )}

          {/* VIEW #5: MANAGE STAFF (Admin Provision System & generate QR) */}
          {activeTab === 'manage_staff' && currentUser && currentUser.role === 'admin' && (
            <div className="p-4 space-y-4" id="view_manage_staff">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-sm font-bold text-slate-800">จัดการข้อมูลช่างซ่อมในร้าน</h3>
                <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">Admin Only</span>
              </div>

              {/* Create Staff Form */}
              <form onSubmit={handleCreateStaff} className="bg-slate-100 rounded-2xl p-3 border border-slate-200 space-y-2.5">
                <span className="text-[10px] font-bold text-indigo-700 block uppercase">➕ ลงทะเบียนพนักงานซ่อมใหม่</span>
                
                {staffFormError && (
                  <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[10px]">
                    {staffFormError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-600 mb-0.5">ชื่อช่าง</label>
                    <input
                      type="text"
                      placeholder="เช่น ขุนแผน จอพัง"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-600 mb-0.5">รหัสผ่านข้อความ</label>
                    <input
                      type="text"
                      placeholder="รหัสผ่านช่างซ่อม"
                      value={newStaffPassword}
                      onChange={(e) => setNewStaffPassword(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-slate-600 mb-0.5">อีเมลบัญชีหลัก</label>
                  <input
                    type="email"
                    placeholder="เช่น staff1@repair.com"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition"
                >
                  ออกสิทธิ์บัญชีพนักงานช่างซ่อม
                </button>
              </form>

              {/* Staff Account Directory */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700">รายชื่อบุคคลช่างซ่อมทีได้รับการอนุมัติ ({staffAccounts.length})</h4>
                
                {staffAccounts.length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-4">ยังไม่ได้มีรายชื่อพนักงานช่างซ่อมเพิ่มเติมในระบบ</p>
                ) : (
                  <div className="space-y-1.5">
                    {staffAccounts.map(account => (
                      <div 
                        key={account.id} 
                        className="bg-white rounded-xl p-2.5 border border-slate-200 flex justify-between items-center text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{account.name}</p>
                          <p className="text-[10px] text-slate-400">{account.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowQRModal(account)}
                          className="flex items-center space-x-1 text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 px-2 py-1 rounded-lg transition"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>ดูสิทธิ์ QR</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Persistent Sticky Bottom Navigation bar */}
          {currentUser && (
            <nav className="absolute bottom-0 inset-x-0 h-12 bg-white border-t border-slate-200 flex items-center justify-around text-slate-400 z-10">
              <button 
                onClick={() => navigateTo('dashboard')}
                className={`flex flex-col items-center p-1 cursor-pointer ${activeTab === 'dashboard' ? 'text-indigo-600' : 'hover:text-slate-600'}`}
              >
                <ListTodo className="w-5 h-5" />
                <span className="text-[9px] font-medium mt-0.5">งานซ่อมซิงก์</span>
              </button>
              
              <button 
                onClick={() => navigateTo('add_job')}
                className={`flex flex-col items-center p-1 cursor-pointer ${activeTab === 'add_job' ? 'text-indigo-600' : 'hover:text-slate-600'}`}
              >
                <PlusCircle className="w-5 h-5" />
                <span className="text-[9px] font-medium mt-0.5">รับงาน</span>
              </button>

              <button 
                onClick={() => navigateTo('shop_settings')}
                className={`flex flex-col items-center p-1 cursor-pointer ${activeTab === 'shop_settings' ? 'text-indigo-600' : 'hover:text-slate-600'}`}
              >
                <Settings className="w-5 h-5" />
                <span className="text-[9px] font-medium mt-0.5">ตั้งค่าร้าน</span>
              </button>
            </nav>
          )}

        </div>
      </div>

      {/* MODAL #1: STAFF CODE AUTOLOGIN QR VIEWER */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">QR Code สิทธิ์ล็อกอินสำหรับช่างซ่อม</h3>
              <p className="text-xs text-rose-500 font-semibold mt-1">คีย์รหัสความปลอดภัย: {showQRModal.name}</p>
            </div>

            {/* Simulated Interactive Vector QR Code Layout */}
            <div className="relative border-4 border-indigo-600 bg-white p-4 rounded-2xl w-48 h-48 mx-auto flex items-center justify-center">
              <div className="grid grid-cols-5 gap-1.5 w-full h-full relative">
                {/* 3 Large Corner Anchors */}
                <div className="col-span-1 row-span-1 border-4 border-black bg-white flex justify-center items-center">
                  <div className="w-3 h-3 bg-black"></div>
                </div>
                <div className="col-span-3"></div>
                <div className="col-span-1 row-span-1 border-4 border-black bg-white flex justify-center items-center">
                  <div className="w-3 h-3 bg-black"></div>
                </div>
                
                <div className="col-span-5 h-2"></div>

                <div className="col-span-1 row-span-1 border-4 border-black bg-white flex justify-center items-center">
                  <div className="w-3 h-3 bg-black"></div>
                </div>
                <div className="col-span-4"></div>

                {/* Aesthetic internal blocks */}
                <div className="absolute inset-4 flex flex-wrap justify-center items-center content-center gap-1 overflow-hidden opacity-80 select-none pointer-events-none p-1">
                  <div className="w-2.5 h-2.5 bg-black"></div>
                  <div className="w-2.5 h-2.5 bg-gray-400"></div>
                  <div className="w-2 rounded bg-black"></div>
                  <div className="w-1.5 h-1.5 bg-black"></div>
                  <div className="w-2.5 h-2 bg-black"></div>
                  <div className="w-2.5 h-2.5 bg-black"></div>
                  <div className="w-1 h-3 bg-zinc-800"></div>
                  <div className="w-2 h-2.5 bg-black"></div>
                  <div className="w-3 h-1.5 bg-black"></div>
                  <div className="w-1.5 h-2 bg-black"></div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-100 rounded-xl p-2.5 text-[10px] text-zinc-600 font-mono text-center">
              <span className="font-bold text-zinc-800">รหัสที่เก็บไว้ภายใน QR:</span>
              <p className="text-emerald-700 font-semibold truncate mt-0.5">
                {showQRModal.email}|{showQRModal.passwordPlain}
              </p>
            </div>

            <p className="text-[10px] text-slate-500 text-center leading-relaxed">
              สำหรับพนักงาน: ช่างเปิดแอปครั้งแรกแล้วกดปุ่ม "สแกน QR" ในหน้าล็อกอิน เพื่อจำลองแกะอีเมลและรหัสสิทธิ์โดยตรง
            </p>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${showQRModal.email}|${showQRModal.passwordPlain}`);
                  onAddSyncLog('คัดลอกรหัสผ่าน QR', `คัดลอกสิทธิ์พนักงาน ${showQRModal.name} ไว้ในคลิปบอร์ด`, 'info');
                  alert('จำลองการคัดลอกสิขสิทธิ์สำเสร็จ!');
                }}
                className="w-1/2 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition"
              >
                คัดลอกข้อความ
              </button>
              
              <button
                onClick={() => {
                  onAddSyncLog('ใช้ Share API บนโทรศัพท์', `ส่งมอบ QR บาร์โค้ดสิทธิ์ผ่าน LINE /แชร์ความปลอดภัยเครื่องเพื่อนร่วมทีมเรียบร้อย`, 'success');
                  alert('จำลองการส่งไฟล์ภาพสิทธิ์ QR Code ผ่านแอปพลิเคชัน Line!');
                }}
                className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
              >
                แชร์ภาพเข้า Line
              </button>
            </div>

            <button
              onClick={() => setShowQRModal(null)}
              className="w-full py-2 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 rounded-xl text-xs font-bold transition"
            >
              เสร็จสิ้น / ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* MODAL #2: 3D-THERMAL THERMAL ESC/POS TICKET PRINTER ENGINE */}
      {showReceiptPreview && receiptJob && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-3xl p-5 max-w-sm w-full shadow-2xl relative overflow-hidden text-white flex flex-col max-h-[90vh]">
            
            {/* Mock physical printer layout head */}
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-2">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-indigo-400 animate-pulse" />
                <span className="text-xs font-bold font-mono">Thermal Slip Bluetooth [{printerSize}]</span>
              </div>
              <button 
                onClick={() => {
                  setShowReceiptPreview(false);
                  setReceiptJob(null);
                }}
                className="text-xs text-zinc-400 hover:text-white underline"
              >
                ปิด
              </button>
            </div>

            <p className="text-[10px] text-zinc-400 mb-3 bg-zinc-800 p-2.5 rounded-xl border border-zinc-700">
              {printerSize === '58mm' ? (
                <span>📝 <strong>ฮาร์ดแวร์ 58 มม.:</strong> จำกัดขนาดข้อความ 32 คอลัมน์ต่อบรรทัด, คั่นช่วงกลางด้วยเส้นแบบประ, <strong>ไม่มีกลไกใบมีดกลไกตัด</strong></span>
              ) : (
                <span>⚡ <strong>ฮาร์ดแวร์ 80 มม.:</strong> ขีดจำกัด 48 คอลัมน์ต่อบรรทัด, หัวบิลฟอนต์หนาพิเศษ, <strong>สั่งรันมีดอัตโนมัติ 'generator.cut()'</strong></span>
              )}
            </p>

            {/* The Actual printed continuous receipt view container */}
            <div className={`bg-white text-slate-800 p-4 rounded-lg overflow-y-auto max-h-[480px] shadow-inner font-mono text-[11px] leading-relaxed relative ${printAnimate ? 'animate-slide-down' : ''}`}>
              <div className="absolute top-0 right-0 p-1 text-[8px] font-bold text-slate-400 tracking-tighter uppercase whitespace-nowrap bg-indigo-50 border-l border-b border-indigo-100">
                Printed via ESC/POS Commands
              </div>

              {/* TICKET 1: FOR CUSTOMER */}
              <div className="space-y-1.5 pt-4">
                <div className="text-center">
                  <h4 className={`font-bold ${printerSize === '80mm' ? 'text-sm' : 'text-xs'}`}>
                    {shopProfile.name}
                  </h4>
                  <p className="text-[9px] text-slate-500 leading-tight">{shopProfile.address}</p>
                  <p className="text-[9px] text-slate-500">โทร: {shopProfile.phone}</p>
                </div>
                
                <p className="truncate text-center">
                  {printerSize === '58mm' ? '--------------------------------' : '================================================'}
                </p>

                <div className="text-center font-bold text-xs uppercase my-1">
                  ใบรับซ่อมสินค้า (CUSTOMER COPY)
                </div>

                <div className="space-y-0.5">
                  <div className="flex justify-between">
                    <span>เลขที่ใบนำซ่อม:</span>
                    <span className="font-bold">{receiptJob.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>วันที่:</span>
                    <span>{new Date(receiptJob.timestamp).toLocaleDateString('th-TH')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ผู้ตรวจรับซ่อม:</span>
                    <span>{receiptJob.createdByName}</span>
                  </div>
                </div>

                <p className="truncate text-center">
                  {printerSize === '58mm' ? '--------------------------------' : '================================================'}
                </p>

                <div className="space-y-0.5">
                  <span className="font-bold">ข้อมูลลูกค้า:</span>
                  <p>ชื่อ: {receiptJob.customerName}</p>
                  <p>โทรศัพท์: {receiptJob.customerPhone}</p>
                </div>

                <p className="truncate text-center">
                  {printerSize === '58mm' ? '--------------------------------' : '================================================'}
                </p>

                <div className="space-y-0.5">
                  <span className="font-bold">รายละเอียดซ่อมแซม:</span>
                  <p>อุปกรณ์: {receiptJob.device}</p>
                  <p className="text-wrap break-all">อาการเสียชำรุด: {receiptJob.issue}</p>
                </div>

                <p className="truncate text-center">
                  {printerSize === '58mm' ? '--------------------------------' : '================================================'}
                </p>

                <div className="text-center text-[10px] space-y-1 py-1">
                  <p className="font-bold bg-amber-50 rounded-md border border-amber-200">*** สำหรับลูกค้าแสดงสิทธิ์เมื่อรับสินค้า ***</p>
                  <p className="text-[9px] text-slate-400">ขอบพระคุณที่โปรดเลือกใช้บริการ</p>
                </div>
              </div>

              {/* THE CUTAWAY BARRIER */}
              {printerSize === '58mm' ? (
                /* Hands-Tear Guideline for 58mm */
                <div className="my-6 py-2 border-y-2 border-dashed border-zinc-400 text-center text-zinc-400 bg-zinc-50 select-none text-[9px] uppercase tracking-wider font-sans flex items-center justify-center space-x-1">
                  <span>✂️ [ฉีกด้วยมือตามแนวประ] ✂️</span>
                </div>
              ) : (
                /* Auto Cutter Actuator Line for 80mm */
                <div className="my-6 py-2 bg-indigo-50 border-y border-indigo-200 text-indigo-700 text-center select-none text-[9px] uppercase tracking-wider font-sans flex items-center justify-center space-x-1.5 animate-pulse">
                  <Scissors className="w-3.5 h-3.5" />
                  <span>[ใบมีดตัดทำงาน AUTOMATIC CUT]</span>
                </div>
              )}

              {/* TICKET 2: FOR MERCHANT */}
              <div className="space-y-1.5 opacity-90">
                <div className="text-center">
                  <h4 className={`font-bold ${printerSize === '80mm' ? 'text-sm' : 'text-xs'}`}>
                    {shopProfile.name}
                  </h4>
                  <p className="text-[9px] text-slate-500 leading-tight">{shopProfile.address}</p>
                  <p className="text-[9px] text-slate-500">โทร: {shopProfile.phone}</p>
                </div>
                
                <p className="truncate text-center">
                  {printerSize === '58mm' ? '--------------------------------' : '================================================'}
                </p>

                <div className="text-center font-bold text-xs uppercase my-1">
                  ใบแนบงานในระบบ (MERCHANT COPY)
                </div>

                <div className="space-y-0.5">
                  <div className="flex justify-between">
                    <span>เลขที่ใบนำซ่อม:</span>
                    <span className="font-bold">{receiptJob.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ผู้รับเครื่อง:</span>
                    <span>{receiptJob.createdByName}</span>
                  </div>
                </div>

                <p className="truncate text-center">
                  {printerSize === '58mm' ? '--------------------------------' : '================================================'}
                </p>

                <div className="space-y-0.5">
                  <span className="font-bold">ข้อมูลการรับเคลม:</span>
                  <p>ลูกค้า: {receiptJob.customerName} ({receiptJob.customerPhone})</p>
                  <p>อุปกรณ์: {receiptJob.device}</p>
                  <p className="text-wrap break-all">ปัญหาซ่อม: {receiptJob.issue}</p>
                </div>

                <p className="truncate text-center">
                  {printerSize === '58mm' ? '--------------------------------' : '================================================'}
                </p>

                <div className="text-center text-[10px] py-1">
                  <p className="font-bold text-indigo-700">ใบเสร็จสำหรับติดคู่ตัวฮาร์ดแวร์เพื่อวินิจฉัย</p>
                </div>
              </div>

            </div>

            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => {
                  onAddSyncLog('พิมพ์ใบเสร็จซ้ำ', `ส่งข้อมูลดิบ ESC/POS ซ้ำอีกรอบ ไปอุปกรณ์ Slip Printer`, 'info');
                  alert('จำลองการทำงาน: ได้ทำการแจ้งคำสั่งพิมพ์บลูทูธซ้ำสำเร็จเรียบร้อยแล้ว!');
                }}
                className="w-1/2 py-2 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold transition"
              >
                พิมพ์สลิปอีกครั้ง
              </button>
              
              <button
                onClick={() => {
                  setShowReceiptPreview(false);
                  setReceiptJob(null);
                }}
                className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
              >
                เสร็จสิ้น / ปิดพิมพ์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL #3: GRAPHICAL REQUISITION A4 VECTOR PDF EXPORT */}
      {showPdfPreview && pdfJob && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3 text-slate-900">
              <div>
                <h3 className="text-base font-bold">เอกสาร PDF เอกสารใบงานซ่อมรับเครื่อง (A4 Form)</h3>
                <p className="text-xs text-slate-500">สร้างด้วย Flutter Printing API สำเร็จ</p>
              </div>
              <button 
                onClick={() => {
                  setShowPdfPreview(false);
                  setPdfJob(null);
                }}
                className="text-xs text-slate-400 hover:text-slate-900 border border-slate-200 px-2 py-1 rounded-lg"
              >
                ปิด
              </button>
            </div>

            {/* A4 Vector PDF Paper Mock Frame */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-slate-800 space-y-4 shadow-sm text-xs leading-relaxed max-h-[400px] overflow-y-auto">
              
              {/* PDF Header Section */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-indigo-700">{shopProfile.name}</h4>
                  <p className="text-[10px] text-slate-500 max-w-[200px] leading-snug">{shopProfile.address}</p>
                  <p className="text-[10px] font-mono text-slate-600">📞 Tel: {shopProfile.phone}</p>
                </div>
                <div className="text-right space-y-1">
                  <h5 className="font-bold text-xs uppercase text-slate-700">ใบรับงานซ่อมสินค้า</h5>
                  <p className="text-[11px] font-mono font-bold text-rose-600">ID: {pdfJob.id}</p>
                  <p className="text-[9px] text-slate-400">วันที่: {new Date(pdfJob.timestamp).toLocaleString('th-TH')}</p>
                </div>
              </div>

              <div className="border-t border-slate-300"></div>

              {/* Customer Info Box */}
              <div>
                <h5 className="font-bold text-[11px] text-slate-700 mb-1.5">👤 ข้อมูลลูกค้าและผู้ประสงค์ซ่อม</h5>
                <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-100">
                  <p><strong>ชื่อ-นามสกุล:</strong> {pdfJob.customerName}</p>
                  <p className="font-mono"><strong>เบอร์ติดต่อ:</strong> {pdfJob.customerPhone}</p>
                </div>
              </div>

              {/* Repair Hardware Diagnosis Box */}
              <div>
                <h5 className="font-bold text-[11px] text-slate-700 mb-1.5">🔬 รายละเอียดเครื่องชำรุดและอาการ</h5>
                <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[10px]">
                      <th className="p-2 w-1/2">โมเดลของอุปกรณ์</th>
                      <th className="p-2 w-1/2">อาการเสียชำรุดเสียหาย</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="p-2.5 align-top font-bold text-[11px]">{pdfJob.device}</td>
                      <td className="p-2.5 align-top text-slate-600 text-[11px]">{pdfJob.issue}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signature section */}
              <div className="grid grid-cols-2 gap-6 pt-6">
                <div className="text-center space-y-12">
                  <div className="border-b border-dashed border-slate-300 w-32 mx-auto"></div>
                  <p className="text-[10px] text-slate-500 font-semibold">ลงลายมือชื่อพนักงานควบคุม ({pdfJob.createdByName})</p>
                </div>
                <div className="text-center space-y-12">
                  <div className="border-b border-dashed border-slate-300 w-32 mx-auto"></div>
                  <p className="text-[10px] text-slate-500 font-semibold">ลงลายชื่อยินยอมของผู้ใช้บริการ</p>
                </div>
              </div>

              {/* Legal Warning footer */}
              <div className="text-center text-[9px] text-slate-400 border-t pt-3 leading-tight">
                * หมายเหตุ: ขอสงวนสิทธิ์ในการรับผิดชอบความเสียหายใด หากพ้นกำหนดส่งรับเครื่องซ่อมเมื่อครบ 60 วันนับจากวันที่ออกใบงานนี้
              </div>

            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={shareViaLineSimulated}
                className="w-1/2 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                {copiedLink ? 'คัดลอกลิงก์ PDF สำเร็จ!' : 'แชร์ไฟล์สิทธิ์เข้า Line'}
              </button>
              
              <button
                onClick={() => {
                  onAddSyncLog('เริ่มพิมพ์เอกสารระบบใหญ่ A4', `ส่งต่องาน ${pdfJob.id} PDF ปริ้นเตอร์สำนักงานเรียบร้อย`, 'success');
                  window.print();
                }}
                className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                พิมพ์เอกสารออกเครื่องพิมพ์หลัก
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
