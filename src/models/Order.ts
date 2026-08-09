import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  orderType: 'buy-hen' | 'sell-egg';
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  paymentMethod?: 'easypaisa' | 'jazzcash' | 'bank' | 'wallet';
  paymentAccount?: string;
  buyerPaymentAccount?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled' | 'expired';
  paymentProof?: string;
  paymentProofUploaded: boolean;
  whatsappNumber: string;
  createdAt: Date;
  approvedAt?: Date;
  expiresAt: Date;
  completedAt?: Date;
  buyerNotes?: string;
  sellerNotes?: string;
  rejectionReason?: string;
}

const OrderSchema: Schema = new Schema({
  orderType: {
    type: String,
    enum: ['buy-hen', 'sell-egg'],
    required: true,
    index: true,
  },
  buyerId: { type: String, required: true, index: true },
  buyerName: { type: String, required: true },
  buyerPhone: { type: String, required: true },
  sellerId: { type: String, required: true, index: true },
  sellerName: { type: String, required: true },
  sellerPhone: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  pricePerUnit: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  paymentMethod: {
    type: String,
    enum: ['easypaisa', 'jazzcash', 'bank', 'wallet'],
    default: 'wallet',
  },
  paymentAccount: { type: String },
  buyerPaymentAccount: { type: String },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled', 'expired'],
    default: 'pending',
    index: true,
  },
  paymentProof: { type: String },
  paymentProofUploaded: { type: Boolean, default: false },
  whatsappNumber: { type: String, required: true },
  approvedAt: { type: Date },
  expiresAt: { type: Date, required: true, index: true },
  completedAt: { type: Date },
  buyerNotes: { type: String },
  sellerNotes: { type: String },
  rejectionReason: { type: String },
}, {
  timestamps: true,
});

OrderSchema.index({ buyerId: 1, status: 1 });
OrderSchema.index({ sellerId: 1, status: 1 });
OrderSchema.index({ orderType: 1, status: 1 });

export default mongoose.model<IOrder>('Order', OrderSchema);
