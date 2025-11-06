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
        
        logger.debug(f"Received init_data keys: {list(data_dict.keys())}")
        
        # Extract hash
        received_hash = data_dict.pop('hash', None)
        if not received_hash:
            logger.error("No hash in init_data - rejecting request")
            return None
        
        # Create data_check_string
        data_check_arr = [f"{k}={v}" for k, v in sorted(data_dict.items())]
        data_check_string = '\n'.join(data_check_arr)
        
        # Compute secret key: HMAC-SHA256("WebAppData", bot_token)
        # NOTE: "WebAppData" is the key, bot_token is the message
        secret_key = hmac.new(
            key=b"WebAppData",
            msg=bot_token.encode(),
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
            logger.error(f"Hash mismatch - Received: {received_hash[:20]}... Expected: {expected_hash[:20]}...")
            logger.error(f"Data check string: {repr(data_check_string[:100])}...")
            logger.error(f"Available keys: {sorted(data_dict.keys())}")
            return None
        
        # Extract user data
        import json
        user_data = json.loads(data_dict.get('user', '{}'))
        
        logger.info(f"✅ Validated user: {user_data.get('id')}")
        return user_data
        
    except Exception as e:
        logger.error(f"❌ Validation error: {e}", exc_info=True)
        return None
