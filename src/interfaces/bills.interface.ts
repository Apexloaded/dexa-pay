export enum BillStatus {
  Active = "0",
  Completed = "1",
}

export enum ParticipantType {
  Single = "0",
  Multiple = "1",
}

export enum PaymentScheme {
  Rotation = "0",
  Random = "1",
}

export interface Bills {
  id: string;
  billId: string;
  billUrl: string;
  title: string;
  description: string;
  amount: number;
  balance: number;
  creator: string;
  recipient: string;
  billToken: string;
  createdAt: string;
  expiresAt: string;
  isRemitted: boolean;
  isRecurring: boolean;
  isFixedAmount: boolean;
  status: BillStatus;
  realisedAmount: number;
  participants: string[];
  participantType: ParticipantType;
}

export interface CreateBill extends Partial<Bills> {}

export interface BillParticipants {
  user: string;
  amount: number;
  count: number;
  updatedAt: string;
}
