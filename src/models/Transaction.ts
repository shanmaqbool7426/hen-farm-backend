import mongoose, { Schema, Document } from 'mongoose';

// A real egg-earning activity log - every time real eggs land in a user's
// account (daily hen yield or a referral bonus) a row is written here. The
// app never holds or moves money - buy-hen/sell-egg payments happen directly
// between buyer and seller (see routes/orders.ts). "quantity" is always a
// real egg count, never a cash amount.
export interface ITransaction extends Document {
  userId: string;
  type: 'referral-egg-bonus' | 'hen-egg-yield';
  quantity: number;
  description: string;
  metadata?: any;
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['referral-egg-bonus', 'hen-egg-yield'],
    required: true,
  },
  quantity: { type: Number, required: true },
  description: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
}, {
  timestamps: true,
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
