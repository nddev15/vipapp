// api/keys/delete.js - Xóa một key
import { readData, writeData } from '../../utils/data-handler.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { telegramSecret, key } = req.body;
    
    // Xác thực Telegram Bot
    if (telegramSecret !== process.env.TELEGRAM_BOT_TOKEN) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid Telegram secret'
      });
    }

    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }

    // Fetch current keys
    let keys = await readData('data/keys.json');
    
    if (!keys || keys.length === 0) {
      return res.status(404).json({ 
        error: 'Keys database not found'
      });
    }

    // Tìm và xóa key
    const keyToDelete = keys.find(k => k.key === key.toUpperCase());
    
    if (!keyToDelete) {
      return res.status(404).json({ 
        error: 'Key not found',
        key: key
      });
    }

    // Filter out the key
    keys = keys.filter(k => k.key !== key.toUpperCase());

    // Update keys
    await writeData('data/keys.json', keys);

    return res.status(200).json({ 
      success: true, 
      message: 'Key deleted successfully',
      deletedKey: {
        key: keyToDelete.key,
        createdAt: keyToDelete.createdAt,
        currentUses: keyToDelete.currentUses
      }
    });

  } catch (error) {
    console.error('Delete key error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}
