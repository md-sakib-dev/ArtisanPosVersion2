// ======================================================
// PAYMENT — shared types & channel ids
// ======================================================

/**
 * One payment summary handed from a payment modal to the sale screen.
 * The modal owns the rich entry; the sale only needs the amount and the
 * chosen transaction-channel option to build the payment rows.
 */
export interface ChannelPaymentEntry {
  amount: number;
  channelOptionId: number;
  refNo?: string;
  /** Card payments only: the POS machine (channel 4) option that was used. */
  posMachineId?: number;
}

/** Transaction channel ids used when saving a sale and to fill dropdowns. */
export const PAYMENT_CHANNEL_IDS = {
  cash: 1,
  mfs: 2,
  card: 3,
  /** POS machines are configured as their own channel. */
  posMachine: 4,
  voucher: 5,
  slip: 6,
} as const;
