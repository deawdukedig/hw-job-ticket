export interface DartFile {
  name: string;
  path: string;
  language: string;
  description: string;
  content: string;
}

export const FLUTTER_CODE_FILES: DartFile[] = [
  {
    name: "Firestore Security Rules",
    path: "firestore.rules",
    language: "javascript",
    description: "กฎความปลอดภัยบน Cloud Firestore กำหนดสิทธิ์การอ่านเขียนของ Admin และ Staff แบบ Role-based",
    content: `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // ฟังก์ชันตรวจสอบล็อกอิน
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // ดึง Role ของผู้ใช้จากคอลเลกชัน 'users'
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    function isAdmin() {
      return isAuthenticated() && getUserRole() == 'admin';
    }
    
    function isStaff() {
      return isAuthenticated() && (getUserRole() == 'staff' || getUserRole() == 'admin');
    }

    // 1. คอลเลกชันบัญชีผู้ใช้ (users)
    match /users/{userId} {
      // พนักงานทุกคนสามารถอ่านข้อมูลชื่อของตัวเองได้เพื่อเช็ก Role
      allow read: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      // เฉพาะ Admin เท่านั้นที่สามารถ เพิ่ม/แก้ไข/ลบ รายชื่อหรือแก้สิทธิ์พนักงานได้
      allow write: if isAdmin();
    }

    // 2. คอลเลกชันข้อมูลร้าน (shop_profile)
    match /shop_profile/{document} {
      // ทุกคนในแอปที่ล็อกอินแล้วสามารถดึงข้อมูลหัวบิลไปพิมพ์สลิปและใส่ใน PDF ได้
      allow read: if isAuthenticated();
      // เฉพาะ Admin เท่านั้นที่สามารถแก้ไขชื่อร้าน ที่อยู่ หรือเบอร์โทรศัพท์ได้
      allow write: if isAdmin();
    }

    // 3. คอลเลกชันงานซ่อม (jobs)
    match /jobs/{jobId} {
      // ทั้ง Admin และ Staff สามารถ อ่าน, เพิ่ม และแก้ไขข้อมูลงานซ่อมได้ (Multi-device Sync)
      allow read, create, update: if isStaff();
      // เฉพาะ Admin เท่านั้นที่สามารถกด ลบข้อมูลงานซ่อม หรือสั่งเคลียร์ล้างฐานข้อมูลได้
      allow delete: if isAdmin();
    }
  }
}`
  },
  {
    name: "pubspec.yaml",
    path: "pubspec.yaml",
    language: "yaml",
    description: "ไฟล์ระบุ Dependencies ที่จำเป็น เช่น Firebase API, QR Scanner, PDF Generator และ Bluetooth Printer",
    content: `name: hardware_repair_system
description: "ระบบรับงานซ่อมฮาร์ดแวร์ สำหรับ Admin และ Staff"
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # Firebase Core & Client Suite
  firebase_core: ^3.1.0
  firebase_auth: ^5.1.0
  cloud_firestore: ^5.0.1

  # State Management & Stream Sync
  provider: ^6.1.2

  # QR Code Scanning & Generation
  qr_code_scanner: ^2.1.2
  qr_flutter: ^4.1.0

  # PDF Generation & Dynamic Sharing
  pdf: ^3.10.8
  printing: ^5.11.1
  path_provider: ^2.1.3
  share_plus: ^9.0.0

  # Bluetooth thermal slip printing (ESC/POS)
  blue_thermal_printer: ^1.2.3
  shared_preferences: ^2.2.3

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/`
  },
  {
    name: "main.dart",
    path: "lib/main.dart",
    language: "dart",
    description: "จุดเริ่มต้นของแอปพลิเคชัน ตั้งค่า Firebase และจัดเส้นทาง Auto-login ตรวจสอบสถานะและเปลี่ยนหน้าอัตโนมัติ",
    content: `import 'package:flutter/material';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:provider/provider.dart';
import 'providers/job_provider.dart';
import 'services/auth_service.dart';
import 'pages/login_page.dart';
import 'pages/dashboard_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // เริ่มต้นทำงาน Firebase
  await Firebase.initializeApp();
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProxyProvider<AuthService, JobProvider>(
          create: (_) => JobProvider(),
          update: (_, auth, jobProv) => jobProv!..updateAuth(auth),
        ),
      ],
      child: const RepairApp(),
    ),
  );
}

class RepairApp extends StatelessWidget {
  const RepairApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ระบบรับงานซ่อมฮาร์ดแวร์',
      theme: ThemeData(
        primarySwatch: Colors.indigo,
        useMaterial3: true,
        fontFamily: 'Sukhumvit', // หรือฟอนต์อื่นที่รองรับภาษาไทยสวยงาม
      ),
      home: const AuthWrapper(),
      debugShowCheckedModeBanner: false,
    );
  }
}

// ระบบตรวจสอบการล็อกอินอัตโนมัติ (Persistent Session / Wrapper)
class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    
    // ฟัง Stream ของ Firebase Authentication เพื่อดู Auth State แบบ Real-time
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        
        if (snapshot.hasData && snapshot.data != null) {
          // โหลด Role และข้อมูลเพิ่มเติมของผู้ใช้เมื่อยืนยันล็อกอินแล้ว ค้างหน้า Dashboard ทันที
          return FutureBuilder(
            future: authService.loadCurrentUserDetails(snapshot.data!.uid),
            builder: (context, roleSnapshot) {
              if (roleSnapshot.connectionState == ConnectionState.waiting) {
                return const Scaffold(
                  body: Center(child: CircularProgressIndicator()),
                );
              }
              return const DashboardPage();
            },
          );
        }
        
        // หากไม่มี Session ให้พาไปหน้าสแกนล็อกอิน
        return const LoginPage();
      },
    );
  }
}`
  },
  {
    name: "auth_service.dart",
    path: "lib/services/auth_service.dart",
    language: "dart",
    description: "ระบบจัดการสิทธิ์ บัญชีผู้ใช้, Auto-login และแชร์ข้อมูล QR Code สำหรับพนักงาน",
    content: `import 'package:flutter/material';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class AuthService extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  User? _firebaseUser;
  String? _userName;
  String? _userRole; // 'admin' หรือ 'staff'
  String? _userEmail;

  User? get firebaseUser => _firebaseUser;
  String? get userName => _userName;
  String? get userRole => _userRole;
  String? get userEmail => _userEmail;
  bool get isAdmin => _userRole == 'admin';

  AuthService() {
    _auth.authStateChanges().listen((user) {
      _firebaseUser = user;
      notifyListeners();
    });
  }

  // โหลด Role และชื่อผู้ใช้งานจาก Firestore คอลเลกชัน "users"
  Future<void> loadCurrentUserDetails(String uid) async {
    try {
      DocumentSnapshot doc = await _db.collection('users').document(uid).get();
      if (doc.exists) {
        final data = doc.data as Map<String, dynamic>;
        _userName = data['name'] ?? 'ไม่มีชื่อ';
        _userRole = data['role'] ?? 'staff';
        _userEmail = data['email'] ?? '';
      } else {
        _userName = 'ไม่พบบัญชี';
        _userRole = 'staff';
      }
    } catch (e) {
      _userName = 'Error';
      _userRole = 'staff';
    }
    notifyListeners();
  }

  // ล็อกอินอีเมลและรหัสผ่านแบบปกติ
  Future<bool> loginWithEmailPassword(String email, String password) async {
    try {
      UserCredential cred = await _auth.signInWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
      if (cred.user != null) {
        await loadCurrentUserDetails(cred.user!.uid);
        return true;
      }
    } catch (e) {
      print("Login Error: $e");
    }
    return false;
  }

  // เข้าสู่ระบบด้วยรหัสผ่านจากการแกะ QR Code (email|password)
  Future<bool> loginWithQRCode(String decryptedQR) async {
    try {
      List<String> parts = decryptedQR.split('|');
      if (parts.length == 2) {
        String email = parts[0].trim();
        String password = parts[1].trim();
        return await loginWithEmailPassword(email, password);
      }
    } catch (e) {
      print("QR Decryption Login Error: $e");
    }
    return false;
  }

  // หน้า Admin: เพิ่มพนักงานใหม่ บันทึกลงระบบ Auth และ Firestore
  Future<void> createStaffAccount({
    required String name,
    required String email,
    required String password,
  }) async {
    // หมายเหตุ: สิทธิ์แอดมินใช้ Firebase Auth Admin SDK จะสะดวกสุด
    // หรือการสมัครแบบปกติผ่านแอปฝั่งแรกรองรับการสร้างได้เช่นกัน
    try {
      // 1. สร้างใน Firebase Auth
      UserCredential cred = await _auth.createUserWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
      
      if (cred.user != null) {
        // 2. บันทึกสิทธิ์ Staff ลงคอลเลกชัน "users" ของ Firestore
        await _db.collection('users').document(cred.user!.uid).setData({
          'name': name,
          'email': email,
          'role': 'staff',
          'createdAt': FieldValue.serverTimestamp(),
        });
      }
    } catch (e) {
      throw Exception("ไม่สามารถสร้างไอดีช่างซ่อมได้: $e");
    }
  }

  // ออกจากระบบ
  Future<void> signOut() async {
    await _auth.signOut();
    _userName = null;
    _userRole = null;
    _userEmail = null;
    notifyListeners();
  }
}`
  },
  {
    name: "qr_scanner_page.dart",
    path: "lib/pages/qr_scanner_page.dart",
    language: "dart",
    description: "หน้าจอสแกน QR Code สำหรับฝั่งพนักงาน ใช้เปิดกล้องหลังแสกนข้อความล็อกอินและสับเปลี่ยนเซสชันเรียลไทม์ทันที",
    content: `import 'package:flutter/material';
import 'package:qr_code_scanner/qr_code_scanner.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';

class QRScannerPage extends StatefulWidget {
  const QRScannerPage({super.key});

  @override
  State<QRScannerPage> createState() => _QRScannerPageState();
}

class _QRScannerPageState extends State<QRScannerPage> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  QRViewController? controller;
  bool isScanning = true;

  @override
  void reassemble() {
    super.reassemble();
    if (controller != null) {
      controller!.pauseCamera();
      controller!.resumeCamera();
    }
  }

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context, listen: false);

    return Scaffold(
      appBar: AppBar(
        title: const Text('สแกน QR Code เพื่อล็อกอิน'),
        backgroundColor: Colors.indigo,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: <Widget>[
          Expanded(
            flex: 5,
            child: QRView(
              key: qrKey,
              onQRViewCreated: (QRViewController controller) {
                this.controller = controller;
                controller.scannedDataStream.listen((scanData) async {
                  if (scanData.code != null && isScanning) {
                    setState(() {
                      isScanning = false;
                    });
                    controller.pauseCamera();
                    
                    // เรียกฟังก์ชันแกะรหัสผ่านสแกนเข้าใช้งาน
                    bool isSuccess = await authService.loginWithQRCode(scanData.code!);
                    
                    if (isSuccess) {
                      if (context.mounted) {
                        Navigator.pop(context); // ปิดหน้าแสกน พาไป Dashboard อัตโนมัติ
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับพนักงาน')),
                        );
                      }
                    } else {
                      setState(() {
                        isScanning = true;
                      });
                      controller.resumeCamera();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('รูปแบบ QR Code ไม่ถูกต้อง หรือรหัสผ่านผิดพลาด!'),
                            backgroundColor: Colors.red,
                          ),
                        );
                      }
                    }
                  }
                });
              },
              overlay: QrScannerOverlayShape(
                borderColor: Colors.indigo,
                borderRadius: 10,
                borderLength: 30,
                borderWidth: 10,
                cutOutSize: MediaQuery.of(context).size.width * 0.7,
              ),
            ),
          ),
          Expanded(
            flex: 1,
            child: Container(
              color: Colors.black87,
              width: double.infinity,
              alignment: Alignment.center,
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 24.0),
                child: Text(
                  'ทาบกล้องของคุณวางบนรูปภาพสิทธิ์ QR Code ที่มีข้อความ "อีเมล|รหัสผ่าน" ที่ออกความปลอดภัยโดยแอดมิน เพื่อล็อกอินแบบไม่ต้องพิมพ์ค่าใดๆ',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white70, fontSize: 13),
                ),
              ),
            ),
          )
        ],
      ),
    );
  }

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }
}`
  },
  {
    name: "job_provider.dart",
    path: "lib/providers/job_provider.dart",
    language: "dart",
    description: "ตัวจัดการสถานะและซิงค์ คอยสตรีมสแตตัสงานซ่อมผ่าน Cloud Firestore Real-time Sync มีฟังเบื้องหลังสำหรับการจัดเรียงข้อมูล",
    content: `import 'package:flutter/material';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import '../services/auth_service.dart';

class RepairJobModel {
  final String id;
  final DateTime timestamp;
  final String customerName;
  final String customerPhone;
  final String device;
  final String issue;
  final String status; // 'pending', 'repairing', 'completed', 'delivered'
  final String createdByName;

  RepairJobModel({
    required this.id,
    required this.timestamp,
    required this.customerName,
    required this.customerPhone,
    required this.device,
    required this.issue,
    required this.status,
    required this.createdByName,
  });

  factory RepairJobModel.fromMap(String docId, Map<String, dynamic> map) {
    return RepairJobModel(
      id: docId,
      timestamp: (map['timestamp'] as Timestamp?)?.toDate() ?? DateTime.now(),
      customerName: map['customerName'] ?? '',
      customerPhone: map['customerPhone'] ?? '',
      device: map['device'] ?? '',
      issue: map['issue'] ?? '',
      status: map['status'] ?? 'pending',
      createdByName: map['createdByName'] ?? 'Staff',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'timestamp': Timestamp.fromDate(timestamp),
      'customerName': customerName,
      'customerPhone': customerPhone,
      'device': device,
      'issue': issue,
      'status': status,
      'createdByName': createdByName,
    };
  }
}

class JobProvider extends ChangeNotifier {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  AuthService? _auth;
  List<RepairJobModel> _jobs = [];
  bool _isLoading = false;

  List<RepairJobModel> get jobs => _jobs;
  bool get isLoading => _isLoading;

  void updateAuth(AuthService auth) {
    _auth = auth;
    if (auth.firebaseUser != null) {
      // ทำการฟังสตรีมซิงค์ข้อมูล Firestore อัตโนมัติเมื่อไอดีล็อกอินเรียบร้อย
      listenToJobs();
    } else {
      _jobs = [];
      notifyListeners();
    }
  }

  // ดึง JobID ล่าสุดหรือสร้างแบบอัตโนมัติอ้างอิงกับเลขปีเดือนวัน และรันต่อลําดับ (Auto-generate sequential custom keys)
  Future<String> generateNextJobId() async {
    String datePrefix = DateFormat('yyyyMMdd').format(DateTime.now());
    
    // ดึงงานซ่อมของวันปัจจุบันมาค้นหาเลขลำดับล่าสุด
    QuerySnapshot query = await _db
        .collection('jobs')
        .where('timestamp', isGreaterThanOrEqualTo: DateTime.now().subtract(const Duration(days: 1)))
        .get();
        
    int maxSeq = 0;
    for (var doc in query.documents) {
      if (doc.documentID.startsWith('HW-$datePrefix-')) {
        String seqStr = doc.documentID.split('-').last;
        int? seq = int.tryParse(seqStr);
        if (seq != null && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
    String nextSeq = (maxSeq + 1).toString().padLeft(3, '0');
    return 'HW-$datePrefix-$nextSeq';
  }

  // ระบบ Streaming Real-time Sync ซิงก์งานซ่อมทันท่วงทีบนทุกเครื่อง (Multi-device Sync)
  void listenToJobs() {
    _isLoading = true;
    notifyListeners();

    _db.collection('jobs')
       .orderBy('timestamp', descending: true)
       .snapshots()
       .listen((snapshot) {
         _jobs = snapshot.documents.map((doc) {
           return RepairJobModel.fromMap(doc.documentID, doc.data as Map<String, dynamic>);
         }).toList();
         
         _isLoading = false;
         notifyListeners(); // ทำการอัปเดตรีเฟรช UI ในทันทีเมื่อมีการแก้ไข หรือเพิ่มงานเข้ามา
       }, onError: (e) {
         _isLoading = false;
         print("Real-time Sync Error: $e");
         notifyListeners();
       });
  }

  // เพิ่มข้อมูลงานซ่อมบันทึกลง Firestore
  Future<void> addNewJob({
    required String customerName,
    required String customerPhone,
    required String device,
    required String issue,
  }) async {
    try {
      String jobId = await generateNextJobId();
      String staffName = _auth?.userName ?? 'พนักงานร้าน';
      
      RepairJobModel newJob = RepairJobModel(
        id: jobId,
        timestamp: DateTime.now(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        device: device.trim(),
        issue: issue.trim(),
        status: 'pending',
        createdByName: staffName,
      );

      await _db.collection('jobs').document(jobId).setData(newJob.toMap());
    } catch (e) {
      throw Exception("ล้มเหลวในการสร้างใบงานซ่อม: $e");
    }
  }

  // ลบข้อมูลงานซ่อม (เฉพาะ Admin บัญชีจะผ่านสิทธิ์ Firestore safety Rules)
  Future<void> deleteJob(String jobId) async {
    if (_auth?.isAdmin != true) {
      throw Exception("เกิดข้อผิดพลาด: สิทธิ์พนักงานไม่สามารถลบใบงานซ่อมได้!");
    }
    try {
      await _db.collection('jobs').document(jobId).delete();
    } catch (e) {
      throw Exception("ไม่สามารถลบข้อมูลนี้ได้: $e");
    }
  }

  // เมนูแอดมินล้างข้อมูลฐานซ่อมทั้งหมด (Admin Clear Database)
  Future<void> clearAllJobs() async {
    if (_auth?.isAdmin != true) {
      throw Exception("สิทธิ์พนักงานไม่สามารถล้างฐานข้อมูลได้!");
    }
    try {
      WriteBatch batch = _db.batch();
      QuerySnapshot snapshot = await _db.collection('jobs').get();
      for (var doc in snapshot.documents) {
        batch.delete(doc.reference);
      }
      await batch.commit();
    } catch (e) {
      throw Exception("ล้มเหลวในการเคลียร์ฐานข้อมูล: $e");
    }
  }
}`
  },
  {
    name: "pdf_service.dart",
    path: "lib/services/pdf_service.dart",
    language: "dart",
    description: "ระบบเจนไฟล์เอกสาร PDF จัดหน้าและแบ่งขนาดกระดาษ รองรับการแชร์เข้า Line, Messenger ทันที",
    content: `import 'dart:io';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../providers/job_provider.dart';

class PdfService {
  // สร้างเทมเพลตใบรับซ่อมสวยงามด้วยแพ็กเกจ pdf/widgets
  static Future<void> exportAndShareJobInvoice(
    RepairJobModel job, {
    required String shopName,
    required String shopAddress,
    required String shopPhone,
  }) async {
    final pdf = pw.Document();

    // เพื่อให้อ่านภาษาไทย ต้องระบุฟอนต์ไทยตัวอย่างในแอป เช่น THSarabun.ttf
    final font = await PdfGoogleFonts.sarabunRegular();
    final fontBold = await PdfGoogleFonts.sarabunBold();

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return pw.Container(
            padding: const pw.EdgeInsets.all(32),
            child: pw.Column(
              cross: pw.CrossAxisAlignment.start,
              children: [
                // หัวกระดาษ: ข้อมูลส่วนร้านค้า
                pw.Row(
                  main: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Column(
                      cross: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(shopName, style: pw.TextStyle(font: fontBold, fontSize: 24, color: PdfColors.indigo)),
                        pw.Text(shopAddress, style: pw.TextStyle(font: font, fontSize: 12)),
                        pw.Text('โทร: $shopPhone', style: pw.TextStyle(font: font, fontSize: 12)),
                      ],
                    ),
                    pw.Column(
                      cross: pw.CrossAxisAlignment.end,
                      children: [
                        pw.Text('ใบรับงานซ่อมสินค้า', style: pw.TextStyle(font: fontBold, fontSize: 20)),
                        pw.Text('เลขที่ใบซ่อม: \${job.id}', style: pw.TextStyle(font: fontBold, fontSize: 13, color: PdfColors.red)),
                        pw.Text('วันที่ออกใบ: \${job.timestamp.toString().substring(0, 16)}', style: pw.TextStyle(font: font, fontSize: 11)),
                      ],
                    ),
                  ],
                ),
                pw.SizedBox(height: 20),
                pw.Divider(thickness: 1, color: PdfColors.grey300),
                pw.SizedBox(height: 10),

                // รายละเอียดลูกค้า
                pw.Text('ข้อมูลลูกค้า', style: pw.TextStyle(font: fontBold, fontSize: 14)),
                pw.SizedBox(height: 4),
                pw.Container(
                  padding: const pw.EdgeInsets.all(12),
                  decoration: pw.BoxDecoration(
                    color: PdfColors.grey100,
                    borderRadius: const pw.BorderRadius.all(pw.Radius.circular(6)),
                  ),
                  child: pw.Row(
                    main: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text('ชื่อลูกค้า: \${job.customerName}', style: pw.TextStyle(font: font, fontSize: 12)),
                      pw.Text('เบอร์โทรศัพท์: \${job.customerPhone}', style: pw.TextStyle(font: font, fontSize: 12)),
                    ],
                  ),
                ),
                pw.SizedBox(height: 20),

                // รายละเอียดไอเท็มและอาการเสีย
                pw.Text('รายละเอียดเครื่องซ่อมและปัญหาอาการเสีย', style: pw.TextStyle(font: fontBold, fontSize: 14)),
                pw.SizedBox(height: 8),
                pw.Table(
                  border: pw.TableBorder.all(color: PdfColors.grey300),
                  children: [
                    pw.TableRow(
                      decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                      children: [
                        pw.Padding(
                          padding: const pw.EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                          child: pw.Text('อุปกรณ์ / โมเดลเครื่อง', style: pw.TextStyle(font: fontBold, fontSize: 12)),
                        ),
                        pw.Padding(
                          padding: const pw.EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                          child: pw.Text('อาการเสีย / ปัญหาชำรุดที่พบ', style: pw.TextStyle(font: fontBold, fontSize: 12)),
                        ),
                      ],
                    ),
                    pw.TableRow(
                      children: [
                        pw.Padding(
                          padding: const pw.EdgeInsets.all(12),
                          child: pw.Text(job.device, style: pw.TextStyle(font: font, fontSize: 12)),
                        ),
                        pw.Padding(
                          padding: const pw.EdgeInsets.all(12),
                          child: pw.Text(job.issue, style: pw.TextStyle(font: font, fontSize: 12)),
                        ),
                      ],
                    ),
                  ],
                ),
                pw.SizedBox(height: 30),

                // ส่วนเซ็นยินยอม
                pw.Row(
                  main: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Column(
                      cross: pw.CrossAxisAlignment.center,
                      children: [
                        pw.Container(width: 120, border: const pw.Border(bottom: pw.BorderSide(width: 0.5))),
                        pw.SizedBox(height: 4),
                        pw.Text('ลงชื่อผู้ซ่อม/ผู้รับงาน (\${job.createdByName})', style: pw.TextStyle(font: font, fontSize: 11)),
                      ],
                    ),
                    pw.Column(
                      cross: pw.CrossAxisAlignment.center,
                      children: [
                        pw.Container(width: 120, border: const pw.Border(bottom: pw.BorderSide(width: 0.5))),
                        pw.SizedBox(height: 4),
                        pw.Text('ลงชื่อยินยอมของลูกค้า', style: pw.TextStyle(font: font, fontSize: 11)),
                      ],
                    ),
                  ],
                ),
                
                pw.Spacer(),
                pw.Divider(thickness: 0.5, color: PdfColors.grey400),
                pw.Align(
                  alignment: pw.Alignment.center,
                  child: pw.Text('ขอบคุณที่วางใจเลือกใช้บริการร้านของพวกเรา', style: pw.TextStyle(font: font, fontSize: 10, color: PdfColors.grey600)),
                )
              ],
            ),
          );
        },
      ),
    );

    // บันทึกเป็นไฟล์ลง Cache เครื่องและทำการเขียน Dynamic Share
    final bytes = await pdf.save();
    final tempDir = await getTemporaryDirectory();
    final file = File('\${tempDir.path}/\${job.id}_invoice.pdf');
    await file.writeAsBytes(bytes);

    // เปิด share sheet ของ iOS และ Android โดยสามารถแชร์เข้า Line ได้ทันที
    await Share.shareXFiles([XFile(file.path)], text: 'ใบรับงานซ่อมของคุณผู้รับบริการ รหัสงาน: \${job.id}');
  }
}`
  },
  {
    name: "esc_pos_printer_service.dart",
    path: "lib/services/esc_pos_printer_service.dart",
    language: "dart",
    description: "ระบบสั่งพิมพ์ความร้อนบลูทูธ ESC/POS คุมฮาร์ดแวร์กระดาษ 58mm / 80mm แยก Command ไร้ปัญหาเครื่องตัดสลิป",
    content: `import 'package:blue_thermal_printer/blue_thermal_printer.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import '../providers/job_provider.dart';

class EscPosPrinterService {
  final BlueThermalPrinter _bluetooth = BlueThermalPrinter.instance;

  // อ่านขนาดขนาดเครื่องพิมพ์จากหน่วยความจำเครื่อง "58mm" หรือ "80mm"
  Future<String> getSavedPrinterSize() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('printer_size') ?? '58mm';
  }

  // บันทึกขนาดกระดาษสำหรับใช้คุมฮาร์ดแวร์ใบมีด
  Future<void> savePrinterSize(String size) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('printer_size', size);
  }

  // ฟังก์ชันเขียนคำสั่ง ESC/POS พิมพ์สลิปต่อเนื่อง 2 ใบแยกแผ่นอัจฉริยะลื่นไหล
  Future<void> printReceipt({
    required RepairJobModel job,
    required String shopName,
    required String shopAddress,
    required String shopPhone,
  }) async {
    bool? isConnected = await _bluetooth.isConnected;
    if (isConnected != true) {
      throw Exception('ไม่ได้เชื่อมต่อเครื่องพิมพ์บลูทูธ ค้นหาและจับคู่อุปกรณ์ในการตั้งค่าร้านก่อน');
    }

    // โหลดขนาดกระดาษเพื่อเลือกคำสั่งควบคุมฮาร์ดแวร์
    String size = await getSavedPrinterSize();
    
    // ใบที่ 1: สำหรับลูกค้า
    await _printSingleInvoice(
      job: job,
      shopName: shopName,
      shopAddress: shopAddress,
      shopPhone: shopPhone,
      size: size,
      footerNote: 'สำหรับลูกค้า (CUSTOMER COPY)',
    );

    // ลอจิกการแบ่งหน้าของขนาด 58mm ป้องกันหดสั้นฉีกขาดไม่ได้ระยะ
    if (size == '58mm') {
      // ขนาด 58mm: ใช้พิมพ์เส้นประแนะแนวเป็นไกด์ฉีกกระดาษมือ และเว้นบรรทัดช่องว่าง
      _bluetooth.printNewLine();
      _bluetooth.printCustom("--------------------------------", 0, 1);
      _bluetooth.printCustom("ฉีกใบงานซ่อมตามรอยคอปลอยด้านบน", 0, 1);
      _bluetooth.printCustom("--------------------------------", 0, 1);
      _bluetooth.printNewLine();
      _bluetooth.printNewLine();
      _bluetooth.printNewLine();
    } else {
      // ขนาด 80mm: ส่งคำสั่งใบมีดตัดกระดาษอัตโนมัติ (ESC/POS Paper Cut Command)
      // บาง Library ของหน้ากระดาษ 80mm อาจนำส่ง Raw bytes [0x1D, 0x56, 0x41, 0x00] 
      // หรือเขียนผ่าน library ที่มีมาให้ เช่น blue_thermal_printer logic ตัดกระดาษ
      await _sendRawAutoCut();
    }

    // ใบที่ 2: สำหรับร้านค้า
    await _printSingleInvoice(
      job: job,
      shopName: shopName,
      shopAddress: shopAddress,
      shopPhone: shopPhone,
      size: size,
      footerNote: 'สำหรับทางร้าน (MERCHANT COPY)',
    );

    // ฉีกกระดาษปิดท้ายดึงขึ้นสูง
    _bluetooth.printNewLine();
    _bluetooth.printNewLine();
    _bluetooth.printNewLine();
    
    if (size == '80mm') {
      await _sendRawAutoCut();
    }
  }

  // พิมพ์ใบย่อยใบเดี่ยว
  Future<void> _printSingleInvoice({
    required RepairJobModel job,
    required String shopName,
    required String shopAddress,
    required String shopPhone,
    required String size,
    required String footerNote,
  }) async {
    bool is80mm = (size == '80mm');
    int titleSize = is80mm ? 2 : 1; // 80mm ใช้หัวข้อใหญ่ (Double width)
    
    // 1. หัวเรื่อง ชื่อร้าน
    _bluetooth.printCustom(shopName, titleSize, 1); // 1 = Center
    _bluetooth.printCustom(shopAddress, 0, 1);
    _bluetooth.printCustom("เบอร์โทรศัพท์: $shopPhone", 0, 1);
    
    // เส้นขอบสลิป
    String divider = is80mm 
        ? "================================================" // 48 คอลัมน์
        : "--------------------------------";                 // 32 คอลัมน์
    _bluetooth.printCustom(divider, 0, 1);

    _bluetooth.printCustom("ใบรับเครื่องซ่อมฮาร์ดแวร์", 1, 1);
    _bluetooth.printNewLine();

    // 2. รายละเอียดงานซ่อม
    String formattedDate = DateFormat('dd/MM/yyyy HH:mm').format(job.timestamp);
    _bluetooth.printLeftRight("เลขใบรับซ่อม:", job.id, 1);
    _bluetooth.printLeftRight("วันที่:", formattedDate, 0);
    _bluetooth.printLeftRight("ผู้รับเคลม:", job.createdByName, 0);
    
    _bluetooth.printCustom(divider, 0, 1);
    
    // 3. ข้อมูลผู้ใช้บริการ
    _bluetooth.printCustom("ข้อมูลลูกค้า:", 1, 0); // 0 = Left
    _bluetooth.printCustom("ชื่อ: \${job.customerName}", 0, 0);
    _bluetooth.printCustom("โทร: \${job.customerPhone}", 0, 0);
    
    _bluetooth.printCustom(divider, 0, 1);

    // 4. เครื่องชำรุดและสาเหตุซ่อม
    _bluetooth.printCustom("รายละเอียดอุปกรณ์:", 1, 0);
    _bluetooth.printCustom("ชื่ออุปกรณ์: \${job.device}", 0, 0);
    _bluetooth.printCustom("อาการเสียชำรุด:", 1, 0);
    
    // จัดตัวอักษรไม่ให้ตกสปีดขอบ ด้วยความยาวภาษาไทย
    _bluetooth.printCustom(job.issue, 0, 0);

    _bluetooth.printCustom(divider, 0, 1);
    _bluetooth.printCustom(footerNote, 0, 1);
    _bluetooth.printCustom("กรุณานำใบรับซ่อมมาแสดงขณะรับสินค้า", 0, 1);
  }

  // ส่งรหัส Code คำสั่งตัดกระดาษ ESC/POS (Paper Fast Cut command)
  Future<void> _sendRawAutoCut() async {
    // รัสมาตรฐานใบมีด (Half-Cut / Full-Cut) GS V 65 0 
    // Hex code: 1D 56 41 00 หรือ 1D 56 00
    final List<int> cutBytes = [0x1D, 0x56, 0x41, 0x00];
    await _bluetooth.writeBytes(cutBytes);
  }
}`
  }
];
