from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_ENV: str = "development"
    SECRET_KEY: str = "changethisbeforeproduction"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str = "mysql+pymysql://root@127.0.0.1:3306/loan_approval_db"

    MODEL_PATH: str = "app/ml/best_model_gradient_boosting.pkl"
    ML_CONFIDENCE_THRESHOLD: float = 0.90

    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
