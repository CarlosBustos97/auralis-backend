import Message from '../models/Message.js';

const authorFields = 'name username role';

const getAllMessages = async () => {
  return Message.find()
    .populate('created_by', authorFields)
    .sort({ created_at: 1 });
};

const storeMessage = async (text, createdBy) => {
  const cleanText = (text || '').trim();
  if (!cleanText) throw new Error('El mensaje no puede estar vacío');
  if (cleanText.length > 500) throw new Error('El mensaje supera los 500 caracteres');

  const message = new Message({
    text: cleanText,
    created_by: createdBy,
    created_at: new Date(),
  });
  await message.save();

  return Message.findById(message._id).populate('created_by', authorFields);
};

export { getAllMessages, storeMessage };
