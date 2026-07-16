from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "ChessMaster Academy API"
    database_url: str = "sqlite:///./chessmaster.db"
    secret_key: str = "dev-secret-change-in-production-0000"
    access_token_minutes: int = 15
    refresh_token_days: int = 30
    google_client_id: str = ""
    cors_origins: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
