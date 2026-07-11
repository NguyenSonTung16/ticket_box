import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../utils/axiosClient';
import { useAuth } from '../context/AuthContext';

interface LocalScan {
  ticketId: string;
  concertId: string;
  seatInfo: string;
  scannedAt: string;
  issuedAt: number;
  signature: string;
  status: 'valid' | 'checked_in' | 'refunded' | 'invalid' | 'pending_sync';
}

export const CheckinConsolePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Settings
  const [deviceCode, setDeviceCode] = useState('gate-A-scanner-01');
  const [concertId, setConcertId] = useState('1');
  const [isOffline, setIsOffline] = useState(false);

  // Input fields for scanning simulation
  const [ticketIdInput, setTicketIdInput] = useState('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d');
  const [seatInfoInput, setSeatInfoInput] = useState('SVIP-A-12');
  const [issuedAtInput, setIssuedAtInput] = useState('1717848000');
  const [signatureInput, setSignatureInput] = useState('gfMfUyBtKtYsG_8AhYwBV8Mq-sgPSfyC0yQBkehAlbJQu9yTj-nVMatTL6nvs6_JseDcLOxNArN5MoTCrad6Dg');

  // App states
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ status: 'SUCCESS' | 'ERROR' | 'CONFLICT' | 'WARNING'; message: string } | null>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [offlineScans, setOfflineScans] = useState<LocalScan[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [mockTickets, setMockTickets] = useState<any[]>([]);

  // Check auth - redirect user if they lack permissions
  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'ORGANIZER' && user.role !== 'CHECKIN_STAFF')) {
      alert('Bạn không có quyền truy cập trang soát vé.');
      navigate('/');
    }
  }, [user, navigate]);

  // Load scan history from server
  const fetchHistory = async () => {
    try {
      const res = await axiosClient.get(`/checkin/history?concertId=${concertId}&deviceId=${deviceCode}&limit=10`);
      setRecentScans(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch checkin history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [concertId, deviceCode]);

  const fetchMockTickets = async () => {
    try {
      const res = await axiosClient.get('/checkin/mock-tickets');
      setMockTickets(res.data || []);
    } catch (err) {
      console.error('Failed to fetch mock tickets:', err);
    }
  };

  useEffect(() => {
    fetchMockTickets();
  }, []);

  // Handle Scan Verification
  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketIdInput) return;

    setIsScanning(true);
    setScanResult(null);

    const payload = {
      ticketId: ticketIdInput,
      concertId: concertId,
      seatInfo: seatInfoInput,
      issuedAt: parseInt(issuedAtInput, 10),
      signature: signatureInput
    };

    if (isOffline) {
      // Offline mode simulation - save to local memory
      const exists = offlineScans.find(s => s.ticketId === payload.ticketId);
      if (exists) {
        setScanResult({
          status: 'WARNING',
          message: `[OFFLINE] Vé ${payload.ticketId.slice(0,8)} đã được quét ngoại tuyến trước đó!`
        });
        setIsScanning(false);
        return;
      }

      const newScan: LocalScan = {
        ...payload,
        scannedAt: new Date().toISOString(),
        status: 'pending_sync'
      };

      setOfflineScans([newScan, ...offlineScans]);
      setScanResult({
        status: 'SUCCESS',
        message: '[OFFLINE] Quét thành công! Đã lưu bản ghi quét ngoại tuyến.'
      });
      setIsScanning(false);
      
      // Auto clear simulation inputs
      setTicketIdInput('');
      setSeatInfoInput('');
      setSignatureInput('');
    } else {
      // Online mode API request
      try {
        const res = await axiosClient.post('/checkin/verify', payload, {
          headers: { 'x-device-code': deviceCode }
        });
        
        setScanResult({
          status: 'SUCCESS',
          message: `[ONLINE] Check-in thành công: Vé ${payload.ticketId.slice(0, 8)} (${seatInfoInput})`
        });

        // Refresh history
        fetchHistory();

        // Auto clear simulation inputs
        setTicketIdInput('');
        setSeatInfoInput('');
        setSignatureInput('');
      } catch (err: any) {
        const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi soát vé.';
        const errStatus = err.response?.status;
        
        setScanResult({
          status: errStatus === 409 ? 'CONFLICT' : 'ERROR',
          message: `[ONLINE LỖI]: ${errMsg}`
        });
      } finally {
        setIsScanning(false);
      }
    }
  };

  // Sync Offline Scans to server
  const handleSyncOffline = async () => {
    if (offlineScans.length === 0) return;
    setIsSyncing(true);

    const payload = {
      deviceId: deviceCode,
      batchId: `batch-${Date.now()}`,
      checkins: offlineScans.map(s => ({
        ticketId: s.ticketId,
        concertId: s.concertId,
        seatInfo: s.seatInfo,
        scannedAt: s.scannedAt,
        issuedAt: s.issuedAt,
        signature: s.signature
      }))
    };

    try {
      const res = await axiosClient.post('/checkin/sync', payload);
      const { successCount, conflicts } = res.data;
      
      alert(`Đồng bộ hoàn tất!\n- Thành công: ${successCount}/${offlineScans.length}\n- Xung đột/Lỗi: ${conflicts.length}`);
      
      // Clear offline state
      setOfflineScans([]);
      setScanResult({
        status: 'SUCCESS',
        message: `Đồng bộ thành công ${successCount} vé ngoại tuyến.`
      });
      
      fetchHistory();
    } catch (err: any) {
      alert(`Lỗi đồng bộ: ${err.response?.data?.message || 'Không thể kết nối đến server.'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Populate helper default inputs for quick testing
  const setQuickPayload = (type: 'valid' | 'checked_in' | 'refunded') => {
    if (type === 'valid') {
      setTicketIdInput('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d');
      setSeatInfoInput('SVIP-A-12');
      setSignatureInput('gfMfUyBtKtYsG_8AhYwBV8Mq-sgPSfyC0yQBkehAlbJQu9yTj-nVMatTL6nvs6_JseDcLOxNArN5MoTCrad6Dg');
    } else if (type === 'checked_in') {
      setTicketIdInput('8b2deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d');
      setSeatInfoInput('SVIP-A-13');
      setSignatureInput('any_dummy_sig');
    } else {
      setTicketIdInput('7b2deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d');
      setSeatInfoInput('SVIP-A-14');
      setSignatureInput('any_dummy_sig');
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white p-6 font-sans">
      {/* Header bar */}
      <header className="flex justify-between items-center pb-6 border-b border-white/10 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Trang chủ
          </button>
          <div className="h-6 w-[1px] bg-white/20"></div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">qr_code_scanner</span>
            BÀN SOÁT VÉ DI ĐỘNG (GATE CONSOLE)
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-white/10 px-3 py-1 rounded-full text-xs text-white/80">
            Nhân viên: <strong className="text-white">{user?.email}</strong>
          </span>
          <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Kết nối: Online
          </span>
        </div>
      </header>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
        
        {/* Left column: Setup & Simulator */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Quick Config Card */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-md font-bold mb-4 flex items-center gap-2 text-white/90">
              <span className="material-symbols-outlined text-primary text-[18px]">settings</span>
              Cấu hình thiết bị đầu cuối
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/60 block mb-1">Mã máy quét (Device Code)</label>
                <input 
                  type="text" 
                  value={deviceCode} 
                  onChange={(e) => setDeviceCode(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 w-full text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 block mb-1">Mã Concert (Concert ID)</label>
                <input 
                  type="text" 
                  value={concertId} 
                  onChange={(e) => setConcertId(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 w-full text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            
            {/* Offline toggle */}
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Chế độ soát vé Offline</h3>
                <p className="text-xs text-white/50">Lưu trữ quét cục bộ khi mất mạng và đồng bộ sau</p>
              </div>
              <button 
                onClick={() => setIsOffline(!isOffline)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isOffline ? 'bg-primary' : 'bg-white/20'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOffline ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Mock Tickets Helper List */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-md font-bold flex items-center gap-2 text-white/90">
                <span className="material-symbols-outlined text-primary text-[18px]">confirmation_number</span>
                Danh sách vé Test Case (Database)
              </h2>
              <button 
                type="button" 
                onClick={fetchMockTickets}
                className="text-xs bg-white/10 text-white/80 px-2.5 py-1 rounded-full hover:bg-white/20 transition-all"
              >
                Làm mới
              </button>
            </div>
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-2">
              {mockTickets.length > 0 ? (
                mockTickets.map((t, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                      setTicketIdInput(t.ticketId);
                      setSeatInfoInput(t.seatInfo);
                      setIssuedAtInput(String(t.issuedAt));
                      setSignatureInput(t.signature);
                    }}
                    className="flex justify-between items-center bg-black/40 hover:bg-primary/10 border border-white/5 hover:border-primary/30 p-2.5 rounded-xl cursor-pointer transition-all text-xs"
                  >
                    <div>
                      <div className="font-mono text-white/95">{t.ticketId.slice(0, 18)}...</div>
                      <div className="text-white/40 mt-0.5">Ghế: {t.seatInfo} | Concert: {t.concertId}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.status === 'valid' ? 'bg-emerald-500/10 text-emerald-400' :
                      t.status === 'checked_in' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-white/30">Không tìm thấy vé test.</div>
              )}
            </div>
          </div>

          {/* Simulator Scanner Card */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-md font-bold flex items-center gap-2 text-white/90">
                <span className="material-symbols-outlined text-primary text-[18px]">photo_camera</span>
                Trình giả lập quét QR vé
              </h2>
              {/* Quick test buttons */}
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setQuickPayload('valid')} className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded hover:bg-emerald-500/30">Vé Hợp Lệ</button>
                <button type="button" onClick={() => setQuickPayload('checked_in')} className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded hover:bg-amber-500/30">Vé Đã Dùng</button>
                <button type="button" onClick={() => setQuickPayload('refunded')} className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/20 px-2 py-0.5 rounded hover:bg-red-500/30">Vé Hoàn Tiền</button>
              </div>
            </div>

            <form onSubmit={handleScanSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-white/60 block mb-1">Mã vé (Ticket ID / UUID)</label>
                <input 
                  type="text" 
                  value={ticketIdInput} 
                  onChange={(e) => setTicketIdInput(e.target.value)}
                  placeholder="Nhập UUID vé..."
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 w-full text-sm text-white focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/60 block mb-1">Số ghế (Seat No)</label>
                  <input 
                    type="text" 
                    value={seatInfoInput} 
                    onChange={(e) => setSeatInfoInput(e.target.value)}
                    placeholder="SVIP-A-12"
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 w-full text-sm text-white focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60 block mb-1">Thời gian phát hành (Epoch)</label>
                  <input 
                    type="number" 
                    value={issuedAtInput} 
                    onChange={(e) => setIssuedAtInput(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 w-full text-sm text-white focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1">Chữ ký số (Ed25519 Signature)</label>
                <textarea 
                  value={signatureInput} 
                  onChange={(e) => setSignatureInput(e.target.value)}
                  placeholder="Nhập chuỗi signature dạng base64url..."
                  rows={2}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 w-full text-xs text-white focus:outline-none focus:border-primary font-mono"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={isScanning}
                className="bg-primary hover:brightness-110 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all mt-2"
              >
                <span className="material-symbols-outlined">sensors</span>
                {isScanning ? 'Đang xác thực vé...' : isOffline ? 'GHI QUÉT NGOẠI TUYẾN' : 'QUÉT VÉ ONLINE'}
              </button>
            </form>
          </div>

        </div>

        {/* Right column: Results & Logs */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Result Display Screen */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl min-h-[140px] flex flex-col justify-center relative overflow-hidden">
            {scanResult ? (
              <div className="flex gap-4 items-start z-10">
                <span className={`material-symbols-outlined text-[48px] ${
                  scanResult.status === 'SUCCESS' ? 'text-emerald-400' :
                  scanResult.status === 'CONFLICT' ? 'text-amber-400' :
                  scanResult.status === 'WARNING' ? 'text-blue-400' : 'text-red-400'
                }`}>
                  {scanResult.status === 'SUCCESS' ? 'check_circle' :
                   scanResult.status === 'CONFLICT' ? 'warning' :
                   scanResult.status === 'WARNING' ? 'info' : 'cancel'}
                </span>
                <div>
                  <h3 className="text-lg font-bold">
                    {scanResult.status === 'SUCCESS' ? 'XÁC THỰC THÀNH CÔNG' :
                     scanResult.status === 'CONFLICT' ? 'VÉ ĐÃ DÙNG / XUNG ĐỘT' :
                     scanResult.status === 'WARNING' ? 'CẢNH BÁO QUÉT' : 'XÁC THỰC THẤT BẠI'}
                  </h3>
                  <p className="text-sm text-white/80 mt-1">{scanResult.message}</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-white/40 flex flex-col items-center gap-2 z-10">
                <span className="material-symbols-outlined text-[40px] animate-pulse">barcode_reader</span>
                <p className="text-sm font-semibold">Chưa có lượt quét nào. Hãy nhấn nút để kiểm tra vé.</p>
              </div>
            )}
            
            {/* Background glow effects depending on state */}
            {scanResult && scanResult.status === 'SUCCESS' && <div className="absolute inset-0 bg-emerald-500/5 filter blur-3xl pointer-events-none"></div>}
            {scanResult && scanResult.status === 'ERROR' && <div className="absolute inset-0 bg-red-500/5 filter blur-3xl pointer-events-none"></div>}
            {scanResult && scanResult.status === 'CONFLICT' && <div className="absolute inset-0 bg-amber-500/5 filter blur-3xl pointer-events-none"></div>}
          </div>

          {/* Unsynced Offline Scans list */}
          {offlineScans.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-bold text-amber-400 flex items-center gap-2">
                  <span className="material-symbols-outlined">cloud_off</span>
                  Bộ nhớ tạm ngoại tuyến ({offlineScans.length} vé chưa đồng bộ)
                </h3>
                <button
                  onClick={handleSyncOffline}
                  disabled={isSyncing}
                  className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">{isSyncing ? 'cached' : 'sync'}</span>
                  {isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
                </button>
              </div>
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-2">
                {offlineScans.map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5 text-xs">
                    <div>
                      <span className="font-mono text-white/95">{s.ticketId.slice(0, 18)}...</span>
                      <div className="text-white/40 mt-0.5">Ghế: {s.seatInfo} | Lúc: {new Date(s.scannedAt).toLocaleTimeString()}</div>
                    </div>
                    <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded text-[10px]">Chờ đồng bộ</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Server Recent Logs list */}
          {user && user.role === 'ADMIN' ? (
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex-1 flex flex-col">
              <h2 className="text-md font-bold mb-4 flex items-center gap-2 text-white/90">
                <span className="material-symbols-outlined text-primary text-[18px]">history</span>
                Lịch sử quét tại cổng gần đây (Server Logs)
              </h2>
              
              <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 flex flex-col gap-3">
                {recentScans.length > 0 ? (
                  recentScans.map((scan, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white/[0.02] hover:bg-white/[0.04] p-3 rounded-xl border border-white/5 transition-colors text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white/90">{scan.ticketId.slice(0, 18)}...</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                            scan.isOffline ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {scan.isOffline ? 'Offline' : 'Online'}
                          </span>
                        </div>
                        <div className="text-white/40 mt-1">Ghế: {scan.seatInfo} | Máy: {scan.deviceId} | Lúc: {new Date(scan.scannedAt).toLocaleTimeString()}</div>
                      </div>
                      <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        scan.syncStatus === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' :
                        scan.syncStatus === 'CONFLICT' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {scan.syncStatus}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-white/30 text-xs py-10">Không tìm thấy bản ghi quét nào trên database.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center text-white/40 text-xs flex flex-col items-center justify-center min-h-[160px]">
              <span className="material-symbols-outlined text-[32px] text-white/20 mb-2">lock</span>
              <p>Bạn không có quyền xem nhật ký quét của Server (Yêu cầu vai trò ADMIN).</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
