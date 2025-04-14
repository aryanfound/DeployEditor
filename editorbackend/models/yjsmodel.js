import mongoose from 'mongoose';

const YDocSchema = new mongoose.Schema({
  docId: {
    type: String,
    required: true,
    unique: true,
  },
  content: {
    type: Buffer, // This holds the compressed binary Yjs document
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const YDocModel = mongoose.model('YDoc', YDocSchema);
export default YDocModel;
