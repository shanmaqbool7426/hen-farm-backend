import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: 'buyer' | 'seller' | 'admin';
  referralCode: string;
  referredBy?: string;
  // Referral program (one-time reward only, never recurring):
  referralFirstOrderDiscountUsed: boolean; // true once THIS user (if referred) has used their one-time first-order reward
  completedReferralCount: number;          // how many people this user referred have completed a real, delivered first order
  location?: string;
  rating: number;
  verified: boolean;
  easyPaisaAccount?: string;
  jazzCashAccount?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountTitle?: string;
  whatsappNumber?: string;
  availableHens: number;
  henSellPrice: number;
  hensOwned: number; // hens currently within their 65-day productive life (see HenHolding); decremented when a batch expires
  availableEggs: number;
  eggBuyRate: number;
  dealerResponseMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer', index: true },
  referralCode: { type: String, required: true, unique: true },
  referredBy: { type: String },
  referralFirstOrderDiscountUsed: { type: Boolean, default: false },
  completedReferralCount: { type: Number, default: 0 },
  location: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  easyPaisaAccount: { type: String },
  jazzCashAccount: { type: String },
  bankName: { type: String },
  bankAccountNumber: { type: String },
  bankAccountTitle: { type: String },
  whatsappNumber: { type: String },
  availableHens: { type: Number, default: 0 },
  henSellPrice: { type: Number, default: 900 },
  hensOwned: { type: Number, default: 0 },
  availableEggs: { type: Number, default: 0 },
  eggBuyRate: { type: Number, default: 28 },
  dealerResponseMinutes: { type: Number, default: 30 },
}, {
  timestamps: true,
});

export default mongoose.model<IUser>('User', UserSchema);
