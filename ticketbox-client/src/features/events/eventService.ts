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
  image_url?: string;
  cover_image_url?: string;
  artist_ids?: string[];
  attachment_urls?: string[];
  description?: string;
}

export interface TicketTypeData {
  id?: string;
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
  seating_chart_url?: string;
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

  // (Upload Image) Lấy presigned URL để upload ảnh trực tiếp lên MinIO
  getImageUploadUrl: async (eventId: number, type: string, ext: string) => {
    const response = await axiosClient.get(`/api/organizer/concerts/${eventId}/upload-url`, {
      params: { type, ext },
    });
    return response.data as { presignedUrl: string; objectKey: string; expiresIn: number; maxSizeBytes: number };
  },

  // API mới
  cancelEvent: async (eventId: number) => {
    const response = await axiosClient.delete(`/api/organizer/concerts/${eventId}`);
    return response.data;
  },

  getEventStats: async (eventId: number) => {
    const response = await axiosClient.get(`/api/organizer/concerts/${eventId}/stats`);
    return response.data;
  },

  getEventPayments: async (eventId: number, page = 1, limit = 20) => {
    const response = await axiosClient.get(`/api/organizer/concerts/${eventId}/payments`, {
      params: { page, limit },
    });
    return response.data;
  },

  getArtists: async () => {
    const response = await axiosClient.get('/artist/bios');
    return response.data;
  },
};
