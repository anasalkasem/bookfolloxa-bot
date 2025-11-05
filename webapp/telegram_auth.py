"""
Telegram WebApp Authentication Validator
"""
import hashlib
import hmac
from urllib.parse import parse_qsl
import logging

logger = logging.getLogger(__name__)

def validate_telegram_webapp_data(init_data: str, bot_token: str) -> dict:
    """
    Validate Telegram WebApp init_data
    Returns user data if valid, None if invalid
    """
    try:
        # Parse init_data
        data_dict = dict(parse_qsl(init_data))
        
        # Extract hash
        received_hash = data_dict.pop('hash', None)
        if not received_hash:
            logger.warning("No hash in init_data")
            return None
        
        # Create data_check_string
        data_check_arr = [f"{k}={v}" for k, v in sorted(data_dict.items())]
        data_check_string = '\n'.join(data_check_arr)
        
        # Compute secret key (CORRECT: bot_token is key, "WebAppData" is message)
        secret_key = hmac.new(
            key=bot_token.encode(),
            msg=b"WebAppData",
            digestmod=hashlib.sha256
        ).digest()
        
        # Compute expected hash
        expected_hash = hmac.new(
            key=secret_key,
            msg=data_check_string.encode(),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        # Verify
        if received_hash != expected_hash:
            logger.warning("Hash mismatch - invalid data")
            return None
        
        # Extract user data
        import json
        user_data = json.loads(data_dict.get('user', '{}'))
        
        logger.info(f"✅ Validated user: {user_data.get('id')}")
        return user_data
        
    except Exception as e:
        logger.error(f"❌ Validation error: {e}")
        return None
