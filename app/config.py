from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database Configuration
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = "password"
    DB_NAME: str = "smarthostel"
    
    # JWT Configuration
    JWT_SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # QR Code Configuration
    QR_CODE_EXPIRY_MINUTES: int = 5
    QR_CODE_SIZE: int = 10
    
    # Application Settings
    APP_NAME: str = "SmartHostel"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    CURFEW_TIME: str = "22:00"
    
    @property
    def database_url(self) -> str:
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
