import json

from cryptography.fernet import Fernet

from app.config import ENCRYPTION_KEY


_cipher = Fernet(ENCRYPTION_KEY.encode())


class CredentialManager:

    @staticmethod
    def decrypt(data: str | dict) -> dict:
        if isinstance(data, dict):
            if "encrypted" in data:
                decrypted = _cipher.decrypt(data["encrypted"].encode())
                return json.loads(decrypted.decode())
            return data
            
        try:
            decrypted = _cipher.decrypt(data.encode())
            return json.loads(decrypted.decode())
        except Exception:
            try:
                return json.loads(data)
            except Exception:
                return {}
