import { ZoneInventoryDto } from './zone-inventory.dto';

export class SaveStep2Dto {
  start_time: string; // ISO datetime
  zones: ZoneInventoryDto[];
}

