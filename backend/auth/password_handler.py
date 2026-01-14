import bcrypt

def hash_password(plain_password: str) -> str:
    # Truncate password to 72 bytes to comply with bcrypt limit
    password_bytes = plain_password.encode('utf-8')
    truncated_bytes = password_bytes[:72]
    # bcrypt.hashpw expects bytes
    hashed = bcrypt.hashpw(truncated_bytes, bcrypt.gensalt())
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Truncate password to 72 bytes to comply with bcrypt limit
    password_bytes = plain_password.encode('utf-8')
    truncated_bytes = password_bytes[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(truncated_bytes, hashed_bytes)
