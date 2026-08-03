import json

from cryptography.fernet import Fernet

from app.config import ENCRYPTION_KEY


_cipher = Fernet(ENCRYPTION_KEY.encode())


class CredentialManager:

    @staticmethod
    def decrypt(data: str) -> dict:
        decrypted = _cipher.decrypt(data.encode())
        return json.loads(decrypted.decode())
