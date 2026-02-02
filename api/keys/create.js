// api/keys/create.js - Tạo key mới
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
    const { telegramSecret, duration, maxUses, notes } = req.body;
    
    // Xác thực Telegram Bot
    if (telegramSecret !== process.env.TELEGRAM_BOT_TOKEN) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid Telegram secret'
      });
    }

    // Get current keys
    let currentKeys = await readData('data/keys.json');

    // Generate new key
    const newKey = {
      id: `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      key: generateRandomKey(),
      createdAt: new Date().toISOString(),
      expiresAt: duration && duration > 0 
        ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString() 
        : null,
      maxUses: maxUses && maxUses > 0 ? maxUses : null,
      currentUses: 0,
      active: true,
      createdBy: 'telegram_bot',
      notes: notes || `${duration || '∞'} days, ${maxUses || '∞'} uses`
    };

    // Add to beginning of array
    currentKeys.unshift(newKey);

    // Save keys
    await writeData('data/keys.json', currentKeys);

    return res.status(200).json({
      success: true,
      message: 'Key created successfully',
      key: newKey.key,
      expiresAt: newKey.expiresAt,
      maxUses: newKey.maxUses,
      details: {
        id: newKey.id,
        createdAt: newKey.createdAt,
        isUnlimited: !newKey.maxUses && !newKey.expiresAt
      }
    });

  } catch (error) {
    console.error('Create key error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message
    });
  }
}

// Helper function: Generate random key với format XXXX-XXXX-XXXX-XXXX
function generateRandomKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  
  for (let i = 0; i < 4; i++) {
    if (i > 0) key += '-';
    for (let j = 0; j < 4; j++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  
  return key;
}
