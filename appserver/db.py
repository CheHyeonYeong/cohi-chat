from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
    AsyncEngine
)

def create_engine(dsn: str):
    
    return create_async_engine(
        dsn,
        echo=True
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

DSN = "sqllite+aiosqlite:///./local.db"

engine = create_engine(DSN)
async_session_factory = create_session(engine)