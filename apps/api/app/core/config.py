from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "AgeWell API"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str
    REDIS_URL: str
    JWT_SECRET: str
    JWT_REFRESH_SECRET: str
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_FROM: str = "AgeWell <mountainexplorersindia@gmail.com>"
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    # Seconds after SOS before Care Manager / Support are notified if Family+Companion have not acknowledged.
    # Due time is stored on emergency_cases.escalation_due_at so a process restart cannot drop the job.
    SOS_FIRST_RESPONSE_ESCALATION_SECONDS: float = 30.0
    # Expo Push Service delivers to FCM (Android) and APNs (iOS) when EAS credentials are configured.
    EXPO_PUSH_ENABLED: bool = True
    EXPO_PUSH_URL: str = "https://exp.host/--/api/v2/push/send"


    class Config:
        env_file = ".env"


settings = Settings()
