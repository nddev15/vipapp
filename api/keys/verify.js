// api/keys/verify.js - Xác thực và sử dụng key
import { readData, writeData } from '../../utils/data-handler.js';

export default async function handler(req, res) {
  // CORS headers
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
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }

    // 1. Fetch keys
    let keys = await readData('data/keys.json');
    
    if (!keys || keys.length === 0) {
      return res.status(404).json({ error: 'Keys database not found' });
    }

    // 2. Tìm key
    const keyIndex = keys.findIndex(k => k.key === key.toUpperCase());
    
    if (keyIndex === -1) {
      return res.status(404).json({ 
        error: 'Mã key không tồn tại',
        code: 'KEY_NOT_FOUND'
      });
    }

    const foundKey = keys[keyIndex];

    // 3. Kiểm tra key có active không
    if (!foundKey.active) {
      return res.status(403).json({ 
        error: 'Mã key đã bị vô hiệu hóa',
        code: 'KEY_INACTIVE'
      });
    }

    // 4. Kiểm tra thời hạn
    if (foundKey.expiresAt) {
      const expiryDate = new Date(foundKey.expiresAt);
      const now = new Date();
      
      if (expiryDate < now) {
        // Vô hiệu hóa key hết hạn
        foundKey.active = false;
        keys[keyIndex] = foundKey;
        
        await updateKeysOnGitHub(keys, sha, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, FILE_PATH);
        
        return res.status(403).json({ 
          error: 'Mã key đã hết hạn sử dụng',
          code: 'KEY_EXPIRED',
          expiredAt: foundKey.expiresAt
        });
      }
    }

    // 5. Kiểm tra số lượt sử dụng
    if (foundKey.maxUses && foundKey.currentUses >= foundKey.maxUses) {
      // Vô hiệu hóa key hết lượt
      foundKey.active = false;
      keys[keyIndex] = foundKey;
      
      await updateKeysOnGitHub(keys, sha, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, FILE_PATH);
      
      return res.status(403).json({ 
        error: 'Mã key đã hết lượt sử dụng',
        code: 'KEY_MAX_USES_REACHED',
        maxUses: foundKey.maxUses,
        currentUses: foundKey.currentUses
      });
    }

    // 6. Tăng số lượt sử dụng
    foundKey.currentUses = (foundKey.currentUses || 0) + 1;
    foundKey.lastUsedAt = new Date().toISOString();
    keys[keyIndex] = foundKey;

    // 7. Cập nhật keys
    await writeData('data/keys.json', keys);

    // 8. Trả về kết quả thành công
    const remainingUses = foundKey.maxUses 
      ? foundKey.maxUses - foundKey.currentUses 
      : null;

    return res.status(200).json({
      success: true,
      message: 'Xác thực thành công',
      remainingUses: remainingUses,
      isUnlimited: !foundKey.maxUses,
      expiresAt: foundKey.expiresAt
    });

  } catch (error) {
    console.error('Verify key error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
