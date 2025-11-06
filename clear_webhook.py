import asyncio
from telegram import Bot
import config

async def clear_webhook():
    bot = Bot(token=config.TELEGRAM_BOT_TOKEN)
    try:
        # Delete webhook with all pending updates
        result = await bot.delete_webhook(drop_pending_updates=True)
        print(f"✅ Webhook deleted: {result}")
        
        # Wait a bit
        await asyncio.sleep(3)
        
        # Check webhook info
        info = await bot.get_webhook_info()
        print(f"📊 Webhook info: {info}")
        
        if info.url:
            print(f"⚠️ Warning: Webhook still active: {info.url}")
        else:
            print("✅ No webhook active - ready for polling")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await bot.shutdown()

if __name__ == '__main__':
    asyncio.run(clear_webhook())
