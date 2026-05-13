from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    APP_ENV: str = "development"
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str

    # ML
    MODEL_PATH: str = "app/ml/best_model_gradient_boosting.pkl"
    ML_CONFIDENCE_THRESHOLD: float = 0.75
    PPP_FACTOR: float = 4750.0

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Fonnte (WhatsApp OTP)
    FONNTE_API_KEY: str = ""

    # Midtrans
    MIDTRANS_SERVER_KEY: str = ""
    MIDTRANS_CLIENT_KEY: str = ""
    MIDTRANS_IS_PRODUCTION: bool = False

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"


settings = Settings()
