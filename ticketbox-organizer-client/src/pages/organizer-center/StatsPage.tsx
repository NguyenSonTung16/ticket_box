import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventService } from '../../features/events/eventService';

export const StatsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState<{ totalRevenue: number; totalPaidInvoices: number; ticketsSold: number } | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [seatingChartUrl, setSeatingChartUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const statsData = await eventService.getEventStats(Number(id));
        const paymentsData = await eventService.getEventPayments(Number(id));
        const draftData = await eventService.getDraft(Number(id));
        setStats(statsData);
        setPayments(paymentsData.items || []);
        setSeatingChartUrl(draftData.step_3?.seating_chart_url || null);
      } catch (err) {
        console.error('Failed to load stats', err);
        alert('Không thể tải dữ liệu thống kê.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-grow lg:ml-64 px-4 pt-32 pb-10 flex items-center justify-center">
        <p className="text-white">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="flex-grow lg:ml-64 px-4 md:px-6 lg:px-10 pb-10 pt-24 md:pt-28 lg:pt-32">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to="/organizer" className="text-primary hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Quay lại
            </Link>
            <h1 className="text-2xl font-bold text-white">Thống kê sự kiện</h1>
          </div>
          {!seatingChartUrl && (
            <div className="bg-warning/10 border border-warning/50 text-warning px-4 py-2 rounded-lg flex items-center gap-3">
              <span className="material-symbols-outlined">warning</span>
              <span className="text-sm">Sự kiện chưa có sơ đồ vé.</span>
              <Link to={`/organizer/create/step-3?eventId=${id}`} className="px-3 py-1 bg-warning text-on-primary rounded text-sm font-bold ml-2 hover:brightness-110">
                Bổ sung
              </Link>
            </div>
          )}
        </div>

        {/* Tổng quan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant">
            <h3 className="text-on-surface-variant font-medium mb-2">Tổng doanh thu</h3>
            <p className="text-4xl font-bold text-primary">
              {stats?.totalRevenue.toLocaleString('vi-VN')} đ
            </p>
          </div>
          <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant">
            <h3 className="text-on-surface-variant font-medium mb-2">Số vé đã bán</h3>
            <p className="text-4xl font-bold text-secondary">
              {stats?.ticketsSold.toLocaleString('vi-VN')}
            </p>
          </div>
          <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant">
            <h3 className="text-on-surface-variant font-medium mb-2">Giao dịch thành công</h3>
            <p className="text-4xl font-bold text-white">
              {stats?.totalPaidInvoices.toLocaleString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Danh sách thanh toán */}
        <h2 className="text-xl font-bold text-white mb-6">Lịch sử thanh toán</h2>
        <div className="bg-surface-container rounded-2xl overflow-hidden border border-outline-variant">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-highest border-b border-outline-variant text-sm text-on-surface-variant">
                  <th className="p-4 font-medium">Mã Đơn</th>
                  <th className="p-4 font-medium">Người Mua</th>
                  <th className="p-4 font-medium">Số Tiền</th>
                  <th className="p-4 font-medium">Trạng Thái</th>
                  <th className="p-4 font-medium">Ngày Tạo</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-on-surface-variant">
                      Chưa có giao dịch nào
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="border-b border-outline-variant/50 hover:bg-surface-container-high transition-colors">
                      <td className="p-4 text-sm font-mono text-on-surface-variant">#{p.id.toString().slice(0, 8)}</td>
                      <td className="p-4 text-sm text-white">{p.userEmail || 'Khách'}</td>
                      <td className="p-4 text-sm font-medium text-white">{p.totalAmount.toLocaleString('vi-VN')} ₫</td>
                      <td className="p-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'PAID' ? 'bg-primary/20 text-primary' : 'bg-outline-variant text-on-surface-variant'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-on-surface-variant">
                        {new Date(p.createdAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
