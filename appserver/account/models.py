from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship
from pydantic import EmailStr
from sqlalchemy import UniqueConstraint
from pydantic import AwareDatetime

class OAuthAccount(SQLModel, table=True):
    __tablename__ = "oauth_accounts"
    __table_args__ = (
        UniqueConstraint(
            "provider", 
            "provider_account_id", 
            name="uq_provider_provider_account_id"
            ),
    )
    provider: str = Field(max_length=10, description="OAuth Provider")
    provider_account_id: str = Field(max_length=128, description="OAuth Provider Account ID")
    user_id : int = Field(foreign_key="users.id")
    user : User = Relationship()

class User(SQLModel, table=True):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("email", name="email_unique"),
    )

    id: int = Field(default=None, primary_key=True)
    username: str = Field(unique=True, max_length=128, description="사용자 이메일")
    email: EmailStr = Field(unique=True, max_length=128, description="사용자 이메일")
    display_name : str = Field(max_length=40, description="사용자 표시 이름")
    password: str = Field(max_length=128, description="사용자 패스워드")
    is_host: bool = Field(default=False, description="사용자 호스트인지 여부")
    created_at: AwareDatetime = Field(
        default=None,
        nullable=False,
        sa_type=UtcDateTime,
        sa_column_kwargs={
            "server_default": func.now(),
        },    
        )
    updated_at: AwareDatetime = Field(
        default=None,
        nullable=False,
        sa_type=UtcDateTime,
        sa_column_kwargs={
            "server_default": func.now(),
            "onupdate": lambda: datetime.now(timezone.utc),
        },
    )