from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
    AsyncEngine
)
from typing import Annotated
from fastapi import Depends

DbSessionDep = Annotated[AsyncSession, Depends(use_session)]

def create_engine(dsn: str):
    
    return create_async_engine(
        dsn,
        echo=False
    )

def create_session(async_engine: AsyncEngine | None = None):
    if async_engine is None:
        async_engine = create_engine()
        
    return async_sessionmaker(
        async_engine,
        expire_on_commit=False,
        autoflush=False,
        class_=AsyncSession,
        )

async def use_session():    # fastAPI에서 사용하려고 만든 비공기 생성기
    async with async_session() as session:
        yield session

DSN = "sqlite+aiosqlite:///./local.db"

# Note: engine and async_session_factory are commented out to avoid import-time initialization
# Uncomment when running the actual application

engine = create_engine(DSN)

async_session_factory = create_session(engine)