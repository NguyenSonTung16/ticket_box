export class VerifyTicketDto {
  ticketId: string;
  concertId: string;
  seatInfo: string;
  issuedAt: number;
  signature: string;
}

export class OfflineCheckinItemDto {
  ticketId: string;
  concertId: string;
  seatInfo: string;
  scannedAt: string;
  issuedAt: number;
  signature: string;
}

export class SyncOfflineCheckinDto {
  deviceId: string;
  batchId: string;
  checkins: OfflineCheckinItemDto[];
}
