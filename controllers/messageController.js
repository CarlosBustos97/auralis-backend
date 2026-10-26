import { getAllMessages, storeMessage } from '../services/messageService.js';

const getAll = async (req, res) => {
  try {
    const messages = await getAllMessages();
    return res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudieron consultar los mensajes' });
  }
};

const store = async (req, res) => {
  try {
    const message = await storeMessage(req.body.text, req.user.id);
    const payload = message.toJSON();
    req.app.get('io').emit('message', payload);
    return res.status(201).json(payload);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export { getAll, store };
