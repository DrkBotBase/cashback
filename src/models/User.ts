import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  whatsapp: {
    type: String,
    required: [true, 'Please provide a WhatsApp number'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    select: false,
  },
  role: {
    type: String,
    enum: ['CUSTOMER', 'ADMIN'],
    default: 'CUSTOMER',
  },
  points: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

const User = models.User || model('User', UserSchema);

export default User;
