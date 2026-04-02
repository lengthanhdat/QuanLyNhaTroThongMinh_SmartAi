import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RoomService } from '../room/room.service';
import { TenantService } from '../tenant/tenant.service';
import { ContractService } from '../contract/contract.service';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private readonly logger = new Logger(AiService.name);

  constructor(
    private configService: ConfigService,
    private roomService: RoomService,
    private tenantService: TenantService,
    private contractService: ContractService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || 'dummy-key';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async processCommand(command: string) {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: "application/json" }
      });
      
      const prompt = `Bạn là "SmartTrọ AI" - chuyên gia quản lý nhà trọ. Xác định intent của user và trả về JSON chuẩn.
      Lệnh: "${command}"
      
      Danh sách ACTION hợp lệ:
      1. "create_room": Tạo 1 hoặc nhiều phòng lẻ tẻ (data: { rooms: [{roomNumber: "Mã", price: GiáHoặc0}] }). Vd: "tạo phòng bếp, phòng khách" -> rooms: [{roomNumber:"Bếp", price:0}, {roomNumber:"Khách", price:0}]
      2. "bulk_create_rooms": Tạo hàng chục phòng (data: { start: số_bắt_đầu, end: số_kết_thúc, floor: số_tầng, prefix: 'chỉ cho phần đầu, vd. '''' hay '' Khu '''' })
      3. "delete_room": Xóa 1 hoặc nhiều phòng (data: { roomNumbers: ["22", "23"] }). NẾU user bảo "Xóa từ phòng 1 đến 5", BẠN PHẢI TỰ SINH MẢNG ["1","2","3","4","5"].
      4. "update_room_price": Sửa giá tiền phòng (data: { roomNumber: "Mã", price: sốTiềnMới })
      5. "rename_room": Đổi tên/mã phòng (data: { oldRoomNumber: "Mã Cũ", newRoomNumber: "Mã Mới" })
      6. "update_room_status": Đổi trạng thái phòng sang bảo trì/trống/đã thuê (data: { roomNumber: "Mã", status: "available" | "rented" | "maintenance" })
      7. "create_tenant": Khách mới vào trọ (data: { fullName: "Tên", phone: "SĐT" })
      8. "create_contract": Ký hợp đồng thuê (data: { roomNumber: "Mã", tenantName: "Tên", price: number })
      9. "record_meters": Chốt số điện nước, ví dụ điện lên 50k, nước 10 khối (data: { roomNumber: "Mã", electricity: số_điện, water: khối_nước })
      10. "pay_invoice": Đóng tiền phòng (data: { roomNumber: "Mã", amount: SốTiềnĐóng })
      11. "ask_stats": Xem doanh thu/nợ (data: { type: "doanhthu" | "no" | "trong" })
      12. "delete_floor_rooms": Xóa sạch toàn bộ phòng thuộc 1 tầng (data: { floorDigit: "Mã tầng, vd: '3'" }). Lệnh này dùng khi nói "xóa tất cả phòng tầng X".
      13. "unknown": Lệnh tào lao.
      
      Quy tắc bắt buộc:
      - Các text tiền bạc (vd "3 triệu", "3 củ") BẮT BUỘC ĐỔI THÀNH SỐ (vd 3000000).
      - "roomNumber" tuyệt đối không tự gắn chữ "Phòng/Tầng" dư thừa.
      - CỰC KỲ THÔNG MINH: Nếu lệnh cộc lốc "Tạo tầng 2" mà không kèm mã phòng, PHẢI tự rẽ nhánh sang "bulk_create_rooms" (start: 201, end: 205, prefix: ""). 
      - KHÔNG GIẢI THÍCH MŨI TÊN. ĐẦU RA 100% LÀ JSON.`;

      const result = await model.generateContent(prompt);
      const output = result.response.text();
      const parsed = JSON.parse(output.replace(/```json|```/g, '').trim());

      this.logger.log('AI Super Parsed Output: ' + JSON.stringify(parsed));
      return this.executeAction(parsed);
    } catch (e: any) {
      this.logger.error('Error processing AI NLP:', e);
      if (e.message && e.message.includes('429')) {
         return { success: false, message: "AI SmartTrọ đang cần nghỉ ngơi một chút, vui lòng thử lại sau 30 giây nhé! ☕" };
      }
      return { success: false, message: "AI SmartTrọ chưa thể xử lý yêu cầu này, hãy thử diễn đạt lại theo cách khác nhé!" };
    }
  }

  private async executeAction(parsed: any) {
    const { action, data } = parsed;
    try {
      switch (action) {
        case 'create_room': { // enhanced to support multiple arbitrary rooms
          if (!data.rooms || !Array.isArray(data.rooms)) {
             // fallback for legacy single create
             data.rooms = [{ name: data.roomNumber, price: data.price || 0 }];
          }
          let count = 0;
          for (let r of data.rooms) {
            const existing = await this.roomService.findByName(r.name.toString());
            if (!existing) {
              await this.roomService.create({ name: r.name.toString(), price: r.price || 0 });
              count++;
            }
          }
          return { success: true, message: `Hệ thống ghi nhận: Đã tạo mới ${count} phòng thành công!`, data };
        }
        case 'bulk_create_rooms': {
          const { start, end, floor = 1, prefix = '' } = data;
          let count = 0;
          for (let i = start; i <= end; i++) {
             const rName = `${prefix}${i}`;
             const existing = await this.roomService.findByName(rName);
             if (!existing) {
               await this.roomService.create({ name: rName, floor: Number(floor), price: 0 });
               count++;
             }
          }
          return { success: true, message: `Tự động hóa: Đã dựng thành công chuỗi tổng ${count} phòng (Từ ${start} đến ${end}).`, data };
        }
        case 'delete_room': {
          const targets = Array.isArray(data.roomNumbers) ? data.roomNumbers : (data.roomNumber ? [data.roomNumber] : []);
          let count = 0;
          for (let r of targets) {
             const existing = await this.roomService.findByName(r.toString());
             if (existing) {
               await this.roomService.remove(existing.id);
               count++;
             }
          }
          if (count > 0) return { success: true, message: `✅ Quét dọn: Đã tiêu hủy vĩnh viễn ${count} phòng ra khỏi hệ thống!` };
          return { success: false, message: `❌ Rà soát: Lệnh bị hủy vì các phòng [${targets.join(', ')}] không hề tồn tại.` };
        }
        case 'delete_floor_rooms': {
          const rooms = await this.roomService.findAll();
          const floorNum = parseInt(data.floorDigit?.toString());
          const targets = rooms.filter(r => 
            r.floor === floorNum || 
            r.name.startsWith(data.floorDigit?.toString()) || 
            r.name.includes(`Tầng ${data.floorDigit}`)
          );
          let count = 0;
          for (const room of targets) {
             await this.roomService.remove(room.id);
             count++;
          }
          if (count > 0) return { success: true, message: `💣 Giải tỏa: Đã san bình địa dứt điểm ${count} phòng thuộc Tầng ${data.floorDigit}!` };
          return { success: false, message: `❌ Lệnh giải tỏa: Chưa thể thực thi do trinh sát báo về Tầng ${data.floorDigit} không có phòng nào.` };
        }
        case 'update_room_price': {
          const existing = await this.roomService.findByName(data.roomNumber);
          if (existing) {
            await this.roomService.update(existing.id, { price: data.price });
            return { success: true, message: `✅ Bảng giá: Đã gán giá mới cho phòng [${data.roomNumber}] thành mức ${data.price.toLocaleString('vi-VN')} VND.` };
          }
          return { success: false, message: `❌ Mã phòng [${data.roomNumber}] không tồn tại trên bản đồ.` };
        }
        case 'rename_room': {
          const existing = await this.roomService.findByName(data.oldRoomNumber);
          if (existing) {
            await this.roomService.update(existing.id, { name: data.newRoomNumber });
            return { success: true, message: `✅ Danh tính mới: Phòng [${data.oldRoomNumber}] nay đã được đổi tên thành [${data.newRoomNumber}]!` };
          }
          return { success: false, message: `❌ Không tìm thấy phòng [${data.oldRoomNumber}] để thực hiện đổi tên.` };
        }
        case 'update_room_status': {
          const existing = await this.roomService.findByName(data.roomNumber);
          if (existing) {
            await this.roomService.update(existing.id, { status: data.status });
            const viStatus = data.status === 'maintenance' ? 'Đang sửa chữa' : (data.status === 'rented' ? 'Đã cho thuê' : 'Trống');
            return { success: true, message: `⚙️ Trạng thái: Phòng [${data.roomNumber}] vừa được treo biển "${viStatus}".` };
          }
          return { success: false, message: `❌ Không tìm thấy phòng [${data.roomNumber}] để gắn bảng trạng thái.` };
        }
        case 'create_tenant': {
          const tenant = await this.tenantService.create({ fullName: data.fullName, phone: data.phone || '' });
          return { success: true, message: `✅ Hồ sơ khách: Đã lưu thông tin cho [${tenant.fullName}] vào hộ khẩu.`, data: tenant };
        }
        case 'create_contract':
        case 'record_meters':
        case 'pay_invoice':
        case 'ask_stats': {
           return { success: true, message: `⏳ Logic chuyên sâu đang được phát triển ngầm. Sẽ kết nối DB Backend vào Sprint sau!`, data };
        }
        case 'unknown':
        default: {
          return { success: false, message: `🤖 Lệnh ngoài vùng phủ sóng! Vui lòng dùng lệnh rõ ràng về phòng ốc, khách khứa, tiền bạc.` };
        }
      }
    } catch(err: any) {
      this.logger.error('Lỗi Data Pipeline:', err);
      return { success: false, message: 'AI SmartTrọ gặp sự cố nhỏ, vui lòng thử lại sau!' };
    }
  }
}
