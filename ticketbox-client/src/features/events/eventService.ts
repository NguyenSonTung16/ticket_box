import axiosClient from '../../utils/axiosClient';

export interface EventData {
  name: string;
  category: string;
  address_type: 'OFFLINE' | 'ONLINE';
  venue_name: string;
  province: string;
  ward?: string;
  street?: string;
  organizer_name: string;
  organizer_info?: string;
}

export interface TicketTypeData {
  name: string;
  price: number;
  total_quantity: number;
  is_free: boolean;
}

export interface SaveStep2Data {
  start_time: string; // ISO string
  ticket_types: TicketTypeData[];
}

export interface SaveStep3Data {
  slug: string;
  privacy: 'PUBLIC' | 'PRIVATE';
  confirmation_message?: string;
}

export interface SaveStep4Data {
  bank_account_name: string;
  bank_account_number: string;
  bank_name: string;
  bank_branch?: string;
  vat_business_type: 'INDIVIDUAL' | 'COMPANY';
  vat_full_name?: string;
  vat_address?: string;
  vat_tax_code?: string;
}

export const eventService = {
  // BƯỚC 0: Tạo draft concert để lấy ID
  createDraft: async (): Promise<{ event_id: number; status: string }> => {
    const response = await axiosClient.post('/api/organizer/concerts');
    return response.data;
  },

  // BƯỚC 1: Thông tin sự kiện cơ bản
  saveStep1: async (eventId: number, data: EventData) => {
    const response = await axiosClient.put(`/api/organizer/concerts/${eventId}/step/1`, data);
    return response.data;
  },

  // BƯỚC 2: Thời gian và loại vé
  saveStep2: async (eventId: number, data: SaveStep2Data) => {
    const response = await axiosClient.put(`/api/organizer/concerts/${eventId}/step/2`, data);
    return response.data;
  },

  // BƯỚC 3: Thiết lập trang sự kiện (slug & privacy)
  saveStep3: async (eventId: number, data: SaveStep3Data) => {
    const response = await axiosClient.put(`/api/organizer/concerts/${eventId}/step/3`, data);
    return response.data;
  },

  // BƯỚC 4: Thông tin thanh toán & Publish event
  saveStep4: async (eventId: number, data: SaveStep4Data) => {
    const response = await axiosClient.put(`/api/organizer/concerts/${eventId}/step/4`, data);
    return response.data;
  },

  // (Helper) Lấy lại thông tin draft (nếu user quay lại sửa)
  getDraft: async (eventId: number) => {
    const response = await axiosClient.get(`/api/organizer/concerts/${eventId}/draft`);
    return response.data;
  },
  
  // (Cho Dashboard) Lấy danh sách sự kiện của organizer
  getOrganizerEvents: async () => {
    const response = await axiosClient.get('/api/organizer/concerts');
    return response.data;
  },
};
