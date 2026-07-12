export interface EventData {
  id: number;
  title: string;
  date: string;
  location: string;
  image: string;
  status: 'selling' | 'draft';
  ticketsSold: number;
  totalTickets: number;
}

export const MOCK_EVENTS: EventData[] = [
  {
    id: 1,
    title: 'Electric Forest: Midnight Pulse',
    date: 'Dec 24, 2024 • 20:00',
    location: 'Saigon Exhibition Center (SECC)',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD45MuNv6ym8q_8DqJ5OgH5REAtsjZb5mJ7oV5J38feMF_mYJz_MYuFepMPJIjZtQh_ru1ADauqQ64DGIoY5W2vnyyUc_jvKtGzwfzPk9EnzTU1h2owzt31VYKJHUSOntbkNbkx-ZmQbXRptuD03P3-xsVUysFjIB60AE3RunldN2XmvOEU-001AaP8HELY61Yob973MHf4JCARCd0jDytrwVa462lY6wmNZ47T__nNXYa6XkKmWuDm0-dSWJ8HEvZiDBP4_qGLaz0',
    status: 'selling',
    ticketsSold: 1240,
    totalTickets: 2000,
  },
  {
    id: 2,
    title: 'Neo-Jazz Evening: Obsidian Series',
    date: 'Jan 15, 2025 • 19:30',
    location: 'The Grand Theater, Dist 1',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBPcB-Q1xnXdk0Lkiqv0fwKxvS2nXC8Wnuo7jvBH_bwyj0AGfDQBXTUdsj7lhH14ahGBU-KaA91VqRnI0fyRCoC2zjyXm0W1MD7AOXT81fK9LtbLg6bGmYvJIvLpVWIvjhCvK0GvVkRzF953xxek5Gpu9C4VcKSDofDA352EVp5BNFVEpz7PvUghlxTSP19yjzKaiLIX5gsQiDUzsz2ApdG-w6TYQ_yIGA0cQYqBFNQ5ApQgHlTPRrBZ5av--WZm61DMPsO3937r20',
    status: 'draft',
    ticketsSold: 0,
    totalTickets: 500,
  },
];

export interface TicketType {
  id: number;
  name: string;
  price: number;
  sold: number;
  total: number;
  status: 'selling' | 'sold_out' | 'hidden';
}

export const MOCK_TICKET_TYPES: TicketType[] = [
  {
    id: 1,
    name: 'Vé Phổ thông (Early Bird)',
    price: 250000,
    sold: 150,
    total: 500,
    status: 'selling',
  },
  {
    id: 2,
    name: 'Vé VIP',
    price: 1500000,
    sold: 50,
    total: 100,
    status: 'selling',
  },
];

export interface FileData {
  id: string;
  name: string;
  size: string;
  type: string;
  dateRequested: string;
  status: 'completed' | 'processing' | 'failed';
}

export const MOCK_FILES: FileData[] = [
  {
    id: 'f1',
    name: 'Doanh_thu_t12_2024.csv',
    size: '1.2 MB',
    type: 'Báo cáo tài chính',
    dateRequested: '15/12/2024 14:30',
    status: 'completed',
  },
  {
    id: 'f2',
    name: 'Danh_sach_checkin_Electric_Forest.csv',
    size: '3.4 MB',
    type: 'Danh sách khách hàng',
    dateRequested: '25/12/2024 09:15',
    status: 'completed',
  },
  {
    id: 'f3',
    name: 'Bao_cao_ve_hoan_huy.csv',
    size: '450 KB',
    type: 'Báo cáo vé',
    dateRequested: '26/12/2024 10:00',
    status: 'processing',
  },
];
