import httpx
from fastapi import HTTPException, status

from app.core.config import settings

TOKEN_URL = "https://oauth2.googleapis.com/token"
TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


def google_configured() -> bool:
    return bool(settings.GOOGLE_CLIENT_ID)


def _profile_from_tokeninfo(info: dict) -> dict:
    if info.get("aud") != settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This Google sign-in is for a different app.",
        )
    if info.get("email_verified") not in (True, "true"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="That Google account email is not verified.",
        )

    email = (info.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google did not share an email address.",
        )

    full_name = (info.get("name") or "").strip()
    if not full_name:
        given = (info.get("given_name") or "").strip()
        family = (info.get("family_name") or "").strip()
        full_name = " ".join(part for part in (given, family) if part)

    return {"email": email, "full_name": full_name or None}


async def google_profile_from_id_token(id_token: str) -> dict:
    if not google_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google sign-in is not configured.",
        )

    async with httpx.AsyncClient(timeout=20) as client:
        info_response = await client.get(TOKENINFO_URL, params={"id_token": id_token})

    if info_response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google could not verify this sign-in.",
        )
    return _profile_from_tokeninfo(info_response.json())


async def google_profile_from_code(*, code: str, redirect_uri: str, code_verifier: str) -> dict:
    if not google_configured() or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google sign-in is not configured.",
        )

    async with httpx.AsyncClient(timeout=20) as client:
        token_response = await client.post(
            TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
                "code_verifier": code_verifier,
            },
            headers={"Accept": "application/json"},
        )
        if token_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google sign-in did not complete.",
            )
        id_token = token_response.json().get("id_token")
        if not id_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google did not return an identity token.",
            )
        info_response = await client.get(TOKENINFO_URL, params={"id_token": id_token})

    if info_response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google could not verify this sign-in.",
        )
    return _profile_from_tokeninfo(info_response.json())
