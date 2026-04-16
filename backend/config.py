from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATA_GOV_API_KEY: str = "DEMO_KEY"
    GEMINI_API_KEY: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    TELEGRAM_BOT_TOKEN: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
