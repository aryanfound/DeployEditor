import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['folder', 'file'],
    required: true,
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);

export default Item;
