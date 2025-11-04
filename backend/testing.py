import base64
import os
import hashlib
import hmac

def _hash_password(password, salt=None):
        # Generate a random salt if not provided
        if salt is None:
            salt = os.urandom(16)
        # Use PBKDF2-HMAC-SHA256 as the hashing algorithm
        pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100_000)
        return salt, pwd_hash

us = "abc"
pwd = "abcabc"
salt, pwd_hash = _hash_password(pwd)
print(salt)
print(pwd_hash)
byte_string = ":".encode('utf-8')
print(byte_string)
print(salt + byte_string + pwd_hash)
stored_password = base64.b64encode(salt + byte_string + pwd_hash).decode('utf-8')
print(stored_password)

decoded_bytes = base64.b64decode(stored_password)
print(decoded_bytes)
salt_extracted, pwd_hash_extracted = decoded_bytes.split(b':')

_, pwd_hash = _hash_password(pwd, salt_extracted)
hmac_match = hmac.compare_digest(pwd_hash_extracted, pwd_hash)
print(hmac_match)