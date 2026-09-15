from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        extra="ignore",
    )

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_debug: bool = True
    cors_origins: str = "http://localhost:8501,http://localhost:3000"
    database_url: str = "postgresql://postgres:openevm@localhost:54322/postgres"
    mvp_tenant_id: str = "mvp-demo"


settings = Settings()
