import { Injectable, Logger, Inject } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as QRCode from 'qrcode';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false, // true cho port 465, false cho các port khác
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  /**
   * Gửi email chứa QR code vé cho người dùng
   */
  async sendTicketEmail(
    toEmail: string,
    tickets: Array<{ id: string; seatNo?: string; zone?: string; price: number }>,
    invoiceId: string,
    showName: string,
  ): Promise<boolean> {
    try {
      // Sinh QR code cho từng vé (base64 PNG)
      const qrAttachments: any[] = [];
      const qrHtmlParts: string[] = [];

      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        const qrData = JSON.stringify({
          ticketId: ticket.id,
          invoiceId,
          seatNo: ticket.seatNo || null,
          zone: ticket.zone || null,
        });

        const qrBuffer = await QRCode.toBuffer(qrData, {
          type: 'png',
          width: 250,
          margin: 2,
          color: { dark: '#1C1B1B', light: '#FFFFFF' },
        });

        const cid = `qr_ticket_${i}`;
        qrAttachments.push({
          filename: `ticket_${i + 1}_qr.png`,
          content: qrBuffer,
          cid,
        });

        const ticketLabel = ticket.seatNo
          ? `SVIP — Ghế ${ticket.seatNo}`
          : `${ticket.zone || 'General'} — Vé ${i + 1}`;

        qrHtmlParts.push(`
          <div style="text-align:center; margin:20px 0; padding:20px; background:#f8f8f8; border-radius:12px; border:1px solid #e0e0e0;">
            <p style="font-size:16px; font-weight:bold; color:#333; margin-bottom:8px;">${ticketLabel}</p>
            <p style="font-size:14px; color:#666; margin-bottom:12px;">Giá: ${Number(ticket.price).toLocaleString('vi-VN')} đ</p>
            <img src="cid:${cid}" alt="QR Code" width="250" height="250" style="border-radius:8px;" />
            <p style="font-size:11px; color:#999; margin-top:8px;">Mã vé: ${ticket.id}</p>
          </div>
        `);
      }

      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#fafafa; padding:0; margin:0;">
          <div style="max-width:600px; margin:20px auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <div style="background:linear-gradient(135deg, #54DDA9 0%, #26bc8a 100%); padding:30px; text-align:center;">
              <h1 style="color:white; margin:0; font-size:28px; font-weight:bold;">🎫 TicketBox</h1>
              <p style="color:rgba(255,255,255,0.9); margin:8px 0 0; font-size:14px;">Xác nhận đặt vé thành công</p>
            </div>
            
            <!-- Content -->
            <div style="padding:30px;">
              <h2 style="color:#1C1B1B; font-size:20px; margin:0 0 8px;">Xin chào!</h2>
              <p style="color:#555; font-size:14px; line-height:1.6;">
                Cảm ơn bạn đã đặt vé cho sự kiện <strong style="color:#26bc8a;">${showName}</strong>.
                Dưới đây là mã QR vé của bạn. Vui lòng xuất trình mã QR tại cổng vào sự kiện.
              </p>
              
              <div style="background:#f0fdf4; border-left:4px solid #26bc8a; padding:12px 16px; margin:16px 0; border-radius:0 8px 8px 0;">
                <p style="margin:0; font-size:13px; color:#333;">
                  <strong>Mã hóa đơn:</strong> ${invoiceId}<br>
                  <strong>Số lượng vé:</strong> ${tickets.length}
                </p>
              </div>
              
              <!-- QR Codes -->
              ${qrHtmlParts.join('')}
              
              <div style="text-align:center; margin-top:24px; padding-top:24px; border-top:1px solid #eee;">
                <p style="color:#999; font-size:12px; margin:0;">
                  Email này được gửi tự động từ hệ thống TicketBox.<br>
                  Vui lòng không trả lời email này.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.SMTP_FROM || 'TicketBox <noreply@ticketbox.vn>',
        to: toEmail,
        subject: `🎫 Xác nhận vé — ${showName}`,
        html: htmlBody,
        attachments: qrAttachments,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`[Email] Đã gửi thành công ${tickets.length} vé QR đến ${toEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`[Email] Lỗi gửi email đến ${toEmail}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gửi email thông báo giữ vé tạm thời cho người dùng
   */
  async sendHoldNotificationEmail(
    toEmail: string,
    concert_id: number,
    zoneType: string,
    quantity: number,
  ): Promise<boolean> {
    try {
      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#fafafa; padding:0; margin:0;">
          <div style="max-width:600px; margin:20px auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding:30px; text-align:center;">
              <h1 style="color:white; margin:0; font-size:28px; font-weight:bold;">⏳ TicketBox</h1>
              <p style="color:rgba(255,255,255,0.9); margin:8px 0 0; font-size:14px;">Thông báo giữ vé tạm thời</p>
            </div>
            <div style="padding:30px;">
              <h2 style="color:#1C1B1B; font-size:20px; margin:0 0 8px;">Xin chào!</h2>
              <p style="color:#555; font-size:14px; line-height:1.6;">
                Bạn vừa giữ thành công <strong>${quantity} vé ${zoneType}</strong> cho sự kiện <strong>Show #${concert_id}</strong>.
              </p>
              <div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:12px 16px; margin:16px 0; border-radius:0 8px 8px 0;">
                <p style="margin:0; font-size:13px; color:#92400e;">
                  <strong>Lưu ý quan trọng:</strong> Vui lòng hoàn tất thanh toán trong vòng <strong>10 phút</strong>.<br>
                  Sau thời gian này, nếu chưa thanh toán, hệ thống sẽ tự động hủy giữ vé và nhả lại cho người dùng khác.
                </p>
              </div>
              <div style="text-align:center; margin-top:24px; padding-top:24px; border-top:1px solid #eee;">
                <p style="color:#999; font-size:12px; margin:0;">
                  Email này được gửi tự động từ hệ thống TicketBox.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'TicketBox <noreply@ticketbox.vn>',
        to: toEmail,
        subject: `⏳ Thông báo giữ vé thành công — Show #${concert_id}`,
        html: htmlBody,
      });
      this.logger.log(`[Email] Đã gửi email thông báo giữ vé cho ${toEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`[Email] Lỗi gửi email giữ vé đến ${toEmail}: ${error.message}`);
      return false;
    }
  }

  /**
   * Gửi email nhắc nhở 24h trước giờ diễn sự kiện
   */
  async sendReminderEmail(toEmail: string, showName: string): Promise<boolean> {
    try {
      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#fafafa; padding:0; margin:0;">
          <div style="max-width:600px; margin:20px auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding:30px; text-align:center;">
              <h1 style="color:white; margin:0; font-size:28px; font-weight:bold;">🔔 TicketBox</h1>
              <p style="color:rgba(255,255,255,0.9); margin:8px 0 0; font-size:14px;">Nhắc nhở sự kiện sắp diễn ra</p>
            </div>
            <div style="padding:30px;">
              <h2 style="color:#1C1B1B; font-size:20px; margin:0 0 8px;">Xin chào!</h2>
              <p style="color:#555; font-size:14px; line-height:1.6;">
                Sự kiện <strong>${showName}</strong> mà bạn đã mua vé sẽ chính thức diễn ra vào <strong>ngày mai</strong>.
              </p>
              <p style="color:#555; font-size:14px; line-height:1.6;">
                Vui lòng chuẩn bị sẵn email vé QR của bạn trên điện thoại để xuất trình tại cổng kiểm soát. Chúc bạn có một trải nghiệm tuyệt vời!
              </p>
              <div style="text-align:center; margin-top:24px; padding-top:24px; border-top:1px solid #eee;">
                <p style="color:#999; font-size:12px; margin:0;">
                  Email này được gửi tự động từ hệ thống TicketBox.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'TicketBox <noreply@ticketbox.vn>',
        to: toEmail,
        subject: `🔔 Nhắc nhở sự kiện: ${showName} diễn ra vào ngày mai!`,
        html: htmlBody,
      });
      this.logger.log(`[Email] Đã gửi email nhắc nhở cho ${toEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`[Email] Lỗi gửi email nhắc nhở đến ${toEmail}: ${error.message}`);
      return false;
    }
  }
}
