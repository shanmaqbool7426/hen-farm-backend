import mongoose, { Schema, Document } from 'mongoose';

// Tracks the real egg-laying lifecycle of a batch of hens a buyer actually
// purchased (one order = one holding). No cash fields here at all - this
// model only ever produces a real egg count, which the owner must sell to a
// real dealer (routes/orders.ts sell-egg flow) before any money changes hands.
export interface IHenHolding extends Document {
  userId: string;
  orderId: string;
  quantity: number;
  purchasedAt: Date;
  layingStartsAt: Date; // purchasedAt + INCUBATION_DAYS - no eggs credited before this
  expiresAt: Date;      // layingStartsAt + PRODUCTIVE_DAYS - hen retires, stops laying, after this
  lastEggCreditDate?: Date;
  retired: boolean; // true once expiry has been processed and hensOwned decremented
}

export const INCUBATION_DAYS = 0; // eggs start day 1, no incubation wait
export const PRODUCTIVE_DAYS = 65; // days 1-65: 1 egg/hen/day, then retires

const HenHoldingSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  orderId: { type: String, required: true },
  quantity: { type: Number, required: true },
  purchasedAt: { type: Date, required: true },
  layingStartsAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  lastEggCreditDate: { type: Date },
  retired: { type: Boolean, default: false },
}, {
  timestamps: true,
});

export default mongoose.model<IHenHolding>('HenHolding', HenHoldingSchema);
