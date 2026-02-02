// telegram-bot.js - Telegram Bot integrated with Express server
import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';

export function initTelegramBot() {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const ADMIN_IDS = process.env.TELEGRAM_ADMIN_IDS?.split(',').map(id => parseInt(id.trim())) || [];
  const API_URL = process.env.API_URL || 'https://cheatlibrary.fly.dev';

  if (!BOT_TOKEN) {
    console.log('⚠️  TELEGRAM_BOT_TOKEN not found, bot disabled');
    return null;
  }

  const bot = new TelegramBot(BOT_TOKEN, { polling: true });

  // Check if user is admin
  function isAdmin(userId) {
    return ADMIN_IDS.includes(userId);
  }

  // Main menu with inline keyboard
  function getMainMenu() {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📝 Tạo Key Mới', callback_data: 'create_key' },
            { text: '📋 Danh Sách Keys', callback_data: 'list_keys' }
          ],
          [
            { text: '🗑️ Xóa Key', callback_data: 'delete_key' },
            { text: '📊 Thống Kê', callback_data: 'stats' }
          ],
          [
            { text: '❓ Hướng Dẫn', callback_data: 'help' }
          ]
        ]
      }
    };
  }

  // Start command
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!isAdmin(userId)) {
      bot.sendMessage(chatId, '❌ Bạn không có quyền sử dụng bot này!');
      return;
    }

    bot.sendMessage(
      chatId,
      '👋 Xin chào Admin!\n\n' +
      '🔑 Bot quản lý Key Download VIP\n\n' +
      'Chọn chức năng bên dưới:',
      getMainMenu()
    );
  });

  // Create key command
  bot.onText(/\/create(?: (\d+))?(?: (\d+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!isAdmin(userId)) {
      bot.sendMessage(chatId, '❌ Bạn không có quyền sử dụng lệnh này!');
      return;
    }

    const days = match[1] ? parseInt(match[1]) : null;
    const maxUses = match[2] ? parseInt(match[2]) : null;

    try {
      const response = await fetch(`${API_URL}/api/keys/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramSecret: BOT_TOKEN,
          duration: days,
          maxUses: maxUses,
          notes: `Created by ${msg.from.username || msg.from.first_name}`
        })
      });

      const data = await response.json();

      if (data.success) {
        const daysText = days ? `${days} ngày` : '∞';
        const usesText = maxUses ? `${maxUses} lượt` : '∞';
        
        bot.sendMessage(
          chatId,
          `✅ Tạo key thành công!\n\n` +
          `🔑 Key: \`${data.key}\`\n` +
          `⏰ Thời hạn: ${daysText}\n` +
          `👥 Giới hạn: ${usesText}\n` +
          `📅 Tạo lúc: ${new Date(data.createdAt).toLocaleString('vi-VN')}`,
          { parse_mode: 'Markdown', ...getMainMenu() }
        );
      } else {
        bot.sendMessage(chatId, `❌ Lỗi: ${data.error}`, getMainMenu());
      }
    } catch (error) {
      console.error('Error creating key:', error);
      bot.sendMessage(chatId, '❌ Không thể kết nối đến API!', getMainMenu());
    }
  });

  // List keys command
  bot.onText(/\/list/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!isAdmin(userId)) {
      bot.sendMessage(chatId, '❌ Bạn không có quyền sử dụng lệnh này!');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/keys/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramSecret: BOT_TOKEN })
      });

      const data = await response.json();

      if (data.success) {
        if (data.keys.length === 0) {
          bot.sendMessage(chatId, '📋 Không có key nào!', getMainMenu());
          return;
        }

        let message = `📋 Danh sách Keys (${data.keys.length}):\n\n`;
        
        data.keys.slice(0, 10).forEach((key, index) => {
          const status = key.active ? '✅' : '❌';
          const expires = key.expiresAt 
            ? new Date(key.expiresAt).toLocaleDateString('vi-VN')
            : '∞';
          const uses = key.maxUses ? `${key.currentUses}/${key.maxUses}` : '∞';
          
          message += `${index + 1}. ${status} \`${key.key}\`\n`;
          message += `   ⏰ ${expires} | 👥 ${uses}\n\n`;
        });

        if (data.keys.length > 10) {
          message += `\n... và ${data.keys.length - 10} key khác`;
        }

        bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...getMainMenu() });
      } else {
        bot.sendMessage(chatId, `❌ Lỗi: ${data.error}`, getMainMenu());
      }
    } catch (error) {
      console.error('Error listing keys:', error);
      bot.sendMessage(chatId, '❌ Không thể kết nối đến API!', getMainMenu());
    }
  });

  // Delete key command
  bot.onText(/\/delete (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!isAdmin(userId)) {
      bot.sendMessage(chatId, '❌ Bạn không có quyền sử dụng lệnh này!');
      return;
    }

    const keyToDelete = match[1].trim();

    try {
      const response = await fetch(`${API_URL}/api/keys/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramSecret: BOT_TOKEN,
          key: keyToDelete
        })
      });

      const data = await response.json();

      if (data.success) {
        bot.sendMessage(
          chatId,
          `✅ Đã xóa key: \`${keyToDelete}\``,
          { parse_mode: 'Markdown', ...getMainMenu() }
        );
      } else {
        bot.sendMessage(chatId, `❌ Lỗi: ${data.error}`, getMainMenu());
      }
    } catch (error) {
      console.error('Error deleting key:', error);
      bot.sendMessage(chatId, '❌ Không thể kết nối đến API!', getMainMenu());
    }
  });

  // Handle callback queries (inline button clicks)
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;

    if (!isAdmin(userId)) {
      bot.answerCallbackQuery(query.id, { text: '❌ Bạn không có quyền!', show_alert: true });
      return;
    }

    // Answer callback query first
    bot.answerCallbackQuery(query.id);

    if (data === 'create_key') {
      bot.sendMessage(
        chatId,
        '📝 Tạo Key Mới\n\n' +
        'Sử dụng lệnh: `/create [days] [uses]`\n\n' +
        'Ví dụ:\n' +
        '• `/create` - Key vĩnh viễn, không giới hạn\n' +
        '• `/create 7` - Key 7 ngày, không giới hạn lượt\n' +
        '• `/create 30 100` - Key 30 ngày, tối đa 100 lượt',
        { parse_mode: 'Markdown' }
      );
    } else if (data === 'list_keys') {
      bot.sendMessage(chatId, '⏳ Đang tải danh sách keys...');
      
      try {
        const response = await fetch(`${API_URL}/api/keys/list`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramSecret: BOT_TOKEN })
        });

        const result = await response.json();

        if (result.success) {
          if (result.keys.length === 0) {
            bot.sendMessage(chatId, '📋 Không có key nào!', getMainMenu());
            return;
          }

          let message = `📋 Danh sách Keys (${result.keys.length}):\n\n`;
          
          result.keys.slice(0, 10).forEach((key, index) => {
            const status = key.active ? '✅' : '❌';
            const expires = key.expiresAt 
              ? new Date(key.expiresAt).toLocaleDateString('vi-VN')
              : '∞';
            const uses = key.maxUses ? `${key.currentUses}/${key.maxUses}` : '∞';
            
            message += `${index + 1}. ${status} \`${key.key}\`\n`;
            message += `   ⏰ ${expires} | 👥 ${uses}\n\n`;
          });

          if (result.keys.length > 10) {
            message += `\n... và ${result.keys.length - 10} key khác`;
          }

          bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...getMainMenu() });
        } else {
          bot.sendMessage(chatId, `❌ Lỗi: ${result.error}`, getMainMenu());
        }
      } catch (error) {
        console.error('Error listing keys:', error);
        bot.sendMessage(chatId, '❌ Không thể kết nối đến API!', getMainMenu());
      }
    } else if (data === 'delete_key') {
      bot.sendMessage(
        chatId,
        '🗑️ Xóa Key\n\n' +
        'Sử dụng lệnh: `/delete <key>`\n\n' +
        'Ví dụ:\n' +
        '`/delete ABCD-1234-EFGH-5678`',
        { parse_mode: 'Markdown' }
      );
    } else if (data === 'stats') {
      bot.sendMessage(
        chatId,
        '📊 Thống Kê\n\n' +
        'Chức năng đang phát triển...',
        getMainMenu()
      );
    } else if (data === 'help') {
      bot.sendMessage(
        chatId,
        '❓ Hướng Dẫn Sử Dụng\n\n' +
        '**Lệnh cơ bản:**\n' +
        '• `/start` - Khởi động bot\n' +
        '• `/create [days] [uses]` - Tạo key mới\n' +
        '• `/list` - Xem danh sách keys\n' +
        '• `/delete <key>` - Xóa key\n\n' +
        '**Lưu ý:**\n' +
        '• Chỉ Admin mới sử dụng được bot\n' +
        '• Key không giới hạn khi bỏ trống tham số',
        { parse_mode: 'Markdown', ...getMainMenu() }
      );
    }
  });

  // Handle button messages (keep for backward compatibility)
  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const userId = msg.from.id;

    if (!isAdmin(userId)) return;
    if (!text || text.startsWith('/')) return; // Ignore commands

    if (text === '📝 Tạo Key Mới') {
      bot.sendMessage(
        chatId,
        '📝 Tạo Key Mới\n\n' +
        'Sử dụng lệnh: `/create [days] [uses]`\n\n' +
        'Ví dụ:\n' +
        '• `/create` - Key vĩnh viễn, không giới hạn\n' +
        '• `/create 7` - Key 7 ngày, không giới hạn lượt\n' +
        '• `/create 30 100` - Key 30 ngày, tối đa 100 lượt',
        { parse_mode: 'Markdown' }
      );
    } else if (text === '📋 Danh Sách Keys') {
      bot.sendMessage(chatId, 'Đang tải...');
      // Trigger /list command
      bot.emit('message', { ...msg, text: '/list' });
    } else if (text === '🗑️ Xóa Key') {
      bot.sendMessage(
        chatId,
        '🗑️ Xóa Key\n\n' +
        'Sử dụng lệnh: `/delete <key>`\n\n' +
        'Ví dụ:\n' +
        '`/delete ABCD-1234-EFGH-5678`',
        { parse_mode: 'Markdown' }
      );
    } else if (text === '❓ Hướng Dẫn') {
      bot.sendMessage(
        chatId,
        '❓ Hướng Dẫn Sử Dụng\n\n' +
        '**Lệnh cơ bản:**\n' +
        '• `/start` - Khởi động bot\n' +
        '• `/create [days] [uses]` - Tạo key mới\n' +
        '• `/list` - Xem danh sách keys\n' +
        '• `/delete <key>` - Xóa key\n\n' +
        '**Lưu ý:**\n' +
        '• Chỉ Admin mới sử dụng được bot\n' +
        '• Key không giới hạn khi bỏ trống tham số',
        { parse_mode: 'Markdown' }
      );
    }
  });

  // Error handling
  bot.on('polling_error', (error) => {
    console.error('Telegram polling error:', error.code, error.message);
  });

  console.log('✅ Telegram Bot started!');
  return bot;
}
