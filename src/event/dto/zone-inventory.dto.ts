export class ZoneInventoryDto {
  zone: string;          // Tên khu vực/hạng vé (VD: "VIP", "Normal")
  price: number;         // Giá vé (0 nếu free)
  totalCapacity: number; // Tổng số lượng vé
  ticketLimit: number;   // Số vé tối đa mỗi đơn hàng (mặc định 4)
}
