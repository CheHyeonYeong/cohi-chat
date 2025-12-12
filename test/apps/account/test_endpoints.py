from appserver.app import app
from appserver.apps.account.models import User
from appserver.apps.calendar.models import Calendar
import pytest
from fastapi import HTTPException, status
from fastapi.testclient import TestClient
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession
from appserver.db import create_async_engine, create_session
from appserver.apps.account.endpoints import user_detail

async def test_user_detail_not_found():
    with pytest.raises(HTTPException) as exc_info:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


def test_user_detail_by_http_not_found():
    client = TestClient(app)
    response = client.get("/account/users/not_found")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_user_detail_by_http():
    client = TestClient(app)

    response = client.get("/account/users/test")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == 1
    assert data["username"] == "test"
    assert data["email"] == "Oj9rX@example.com"
    assert data["display_name"] == "test"
    assert data["is_host"] is True
    assert data["created_at"] is not None
    assert data["updated_at"] is not None

dsn = "sqlite+aiosqlite:///./test.db"
engine = create_async_engine(dsn)

async def test_user_detail_for_real_user():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)

    session_factory = create_session(engine)

    async with session_factory() as session:
        user = User(
            username="test",
            password="test",
            email="test@example.com",
            display_name="test",
            is_host=True,
        )
        session.add(user)
        await session.commit()

    client = TestClient(app)

    response = client.get(f"/account/users/{user.username}")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["username"] == "test"
    assert data["email"] == "test@example.com"
    assert data["display_name"] == "test"

    response = client.get("/account/users/not_found")
    assert response.status_code == status.HTTP_404_NOT_FOUND

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    await engine.dispose()