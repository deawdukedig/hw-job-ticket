export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  passwordPlain?: string; // Stored to generate QR codes easily in Admin view
}

export interface ShopProfile {
  name: string;
  address: string;
  phone: string;
}

export interface RepairJob {
  id: string; // Job ID (e.g. HW-20260529-001)
  timestamp: string;
  customerName: string;
  customerPhone: string;
  device: string;
  issue: string;
  status: 'pending' | 'repairing' | 'completed' | 'delivered';
  createdByName: string;
}

export type PrinterSize = '58mm' | '80mm';

export interface SyncPacket {
  id: string;
  time: string;
  action: string;
  details: string;
  status: 'info' | 'success' | 'warning';
}
