import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description: string;
  image: string;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  image: {
    type: String,
    required: true
  },
  productCount: {
    type: Number,
    min: 0,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model<ICategory>('Category', CategorySchema);