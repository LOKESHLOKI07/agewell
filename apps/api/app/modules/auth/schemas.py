from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class RegisterSeniorRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(default="", max_length=100)
    email: str = Field(min_length=3, max_length=255)
    phone: str = Field(min_length=8, max_length=20)
    password: str = Field(min_length=8, max_length=128)
    date_of_birth: date
    address: str = Field(min_length=1, max_length=500)
    emergency_contact: str = Field(min_length=1, max_length=100)
    preferred_language: Optional[str] = Field(default=None, max_length=20)
    identity_token: Optional[str] = Field(default=None, max_length=4096)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        email = value.strip().lower()
        if "@" not in email or "." not in email.split("@")[-1]:
            raise ValueError("Invalid email address")
        return email

    @field_validator("last_name")
    @classmethod
    def normalize_last_name(cls, value: str) -> str:
        return (value or "").strip()

    @model_validator(mode="after")
    def drop_copied_last_name(self):
        if self.last_name.lower() == self.first_name.strip().lower():
            self.last_name = ""
        return self


class RegisterFamilyRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=255)
    phone: str = Field(min_length=8, max_length=20)
    password: str = Field(min_length=8, max_length=128)
    relationship: str = Field(min_length=1, max_length=100)
    requested_senior_reference: Optional[str] = Field(default=None, max_length=200)
    date_of_birth: Optional[date] = None
    address: Optional[str] = Field(default=None, max_length=500)
    preferred_language: Optional[str] = Field(default=None, max_length=20)
    identity_token: Optional[str] = Field(default=None, max_length=4096)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        email = value.strip().lower()
        if "@" not in email or "." not in email.split("@")[-1]:
            raise ValueError("Invalid email address")
        return email


class RegisterCareAssociateRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=255)
    phone: str = Field(min_length=8, max_length=20)
    password: str = Field(min_length=8, max_length=128)
    skills: Optional[str] = Field(default=None, max_length=500)
    experience: Optional[str] = Field(default=None, max_length=500)
    languages: Optional[str] = Field(default=None, max_length=200)
    availability: Optional[str] = Field(default=None, max_length=200)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        email = value.strip().lower()
        if "@" not in email or "." not in email.split("@")[-1]:
            raise ValueError("Invalid email address")
        return email


class RegistrationResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    account_status: str
    care_status: Optional[str] = None
    message: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class EmailOtpRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        email = value.strip().lower()
        if "@" not in email or "." not in email.split("@")[-1]:
            raise ValueError("Invalid email address")
        return email


class EmailOtpVerifyRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    code: str = Field(min_length=6, max_length=6)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        email = value.strip().lower()
        if "@" not in email or "." not in email.split("@")[-1]:
            raise ValueError("Invalid email address")
        return email

    @field_validator("code")
    @classmethod
    def digits_only(cls, value: str) -> str:
        code = value.strip()
        if not code.isdigit() or len(code) != 6:
            raise ValueError("Enter the 6-digit code")
        return code


class GoogleAuthRequest(BaseModel):
    id_token: str | None = Field(default=None, max_length=8192)
    code: str | None = Field(default=None, max_length=4096)
    redirect_uri: str | None = Field(default=None, max_length=500)
    code_verifier: str | None = Field(default=None, max_length=128)

    @model_validator(mode="after")
    def require_android_token_or_code(self):
        if (self.id_token or "").strip():
            return self
        if self.code and self.redirect_uri and self.code_verifier:
            return self
        raise ValueError("Google sign-in token is required.")


class GoogleAuthResponse(BaseModel):
    is_new: bool
    email: str
    full_name: str | None = None
    identity_token: str | None = None
    access_token: str | None = None
    refresh_token: str | None = None
    token_type: str = "bearer"


class EmailOtpVerifyResponse(BaseModel):
    is_new: bool
    email: str
    otp_session_token: str | None = None
    access_token: str | None = None
    refresh_token: str | None = None
    token_type: str = "bearer"


class PasswordResetVerifyResponse(BaseModel):
    email: str
    reset_token: str


class PasswordResetRequest(BaseModel):
    reset_token: str = Field(min_length=16, max_length=4096)
    password: str = Field(min_length=8, max_length=128)


class PasswordResetResponse(BaseModel):
    message: str
