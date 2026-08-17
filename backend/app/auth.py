"""
Authentication & Authorization Security Module for PatientTriage.ai.
Implements cryptographically secure password hashing (PBKDF2-HMAC-SHA256)
and signed JWT tokens (HMAC-SHA256) using standard library security primitives.
"""

import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List
from fastapi import Header, HTTPException, Depends, status

# In-memory secret key; in production loaded from environment
AUTH_SECRET_KEY = "patient-triage-ai-secure-secret-key-2026-multi-tenant-jwt"
TOKEN_ALGORITHM = "HS256"
DEFAULT_TOKEN_EXPIRY_HOURS = 24


def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with random salt and 100,000 iterations."""
    salt = secrets.token_hex(16)
    iterations = 100000
    hash_bytes = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        iterations
    )
    hash_hex = hash_bytes.hex()
    return f"pbkdf2_sha256${iterations}${salt}${hash_hex}"


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify plaintext password against stored PBKDF2 hash."""
    try:
        parts = hashed_password.split('$')
        if len(parts) != 4 or parts[0] != 'pbkdf2_sha256':
            return False
        iterations = int(parts[1])
        salt = parts[2]
        expected_hash = parts[3]
        
        computed_bytes = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            iterations
        )
        return hmac.compare_digest(computed_bytes.hex(), expected_hash)
    except Exception:
        return False


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')


def _base64url_decode(data_str: str) -> bytes:
    padding = '=' * ((4 - len(data_str) % 4) % 4)
    return base64.urlsafe_b64decode((data_str + padding).encode('utf-8'))


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generate signed JWT token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(hours=DEFAULT_TOKEN_EXPIRY_HOURS)
    
    to_encode.update({
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp())
    })
    
    header = {"alg": TOKEN_ALGORITHM, "typ": "JWT"}
    header_json = json.dumps(header, separators=(',', ':')).encode('utf-8')
    payload_json = json.dumps(to_encode, separators=(',', ':')).encode('utf-8')
    
    header_b64 = _base64url_encode(header_json)
    payload_b64 = _base64url_encode(payload_json)
    
    message = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(AUTH_SECRET_KEY.encode('utf-8'), message, hashlib.sha256).digest()
    signature_b64 = _base64url_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and verify JWT signature and expiration timestamp."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            raise ValueError("Malformed token structure")
            
        header_b64, payload_b64, signature_b64 = parts
        message = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_sig = hmac.new(AUTH_SECRET_KEY.encode('utf-8'), message, hashlib.sha256).digest()
        provided_sig = _base64url_decode(signature_b64)
        
        if not hmac.compare_digest(expected_sig, provided_sig):
            raise ValueError("Invalid signature")
            
        payload_bytes = _base64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode('utf-8'))
        
        # Verify expiration
        exp = payload.get("exp")
        if exp and exp < datetime.now(timezone.utc).timestamp():
            raise ValueError("Token expired")
            
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication token ({str(e)})",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user_payload(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Dependency extracting and verifying the JWT token from Authorization header."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization scheme. Use 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    payload = decode_access_token(token)
    return payload


def require_roles(*allowed_roles: str):
    """Dependency factory checking user role authorization."""
    def role_checker(payload: Dict[str, Any] = Depends(get_current_user_payload)) -> Dict[str, Any]:
        user_role = payload.get("role", "")
        if "PLATFORM_ADMIN" == user_role:
            return payload
        if allowed_roles and user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires role in {list(allowed_roles)}, current role is '{user_role}'"
            )
        return payload
    return role_checker
