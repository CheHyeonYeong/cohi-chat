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


def test_user_detail_by_http_not_found(client: TestClient):
    # client = TestClient(app)
    response = client.get("/account/users/not_found")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_user_detail_by_http(client: TestClient, host_user: User):
    # client = TestClient(app)

    response = client.get(f"/account/users/{host_user.username}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == 1
    assert data["username"] == "test"
    assert data["email"] == "Oj9rX@example.com"
    assert data["display_name"] == "test"
    assert data["is_host"] is True
    assert data["created_at"] is not None
    assert data["updated_at"] is not None

# dsn = "sqlite+aiosqlite:///./test.db"
# engine = create_async_engine(dsn)

async def test_user_detail_for_real_user(client: TestClient, host_user: User):
    # client = TestClient(app)

    response = client.get(f"/account/users/{host_user.username}")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["username"] == host_user.username
    assert data["email"] == host_user.email
    assert data["display_name"] == host_user.display_name

    response = client.get("/account/users/not_found")
    assert response.status_code == status.HTTP_404_NOT_FOUND

    # async with engine.begin() as conn:
    #     await conn.run_sync(SQLModel.metadata.drop_all)
    # await engine.dispose()

async def test_user_detail_successfully(db_session : AsyncSession):

    result = await user_detail(host_user.username, db_session)
    assert result.id == host_user.id
    assert result.username == host_user.username
    assert result.email == host_user.email
    assert result.display_name == host_user.display_name
    assert result.is_host is True
    assert result.created_at is not None
    assert result.updated_at is not None
    
    host_user = User(
        username = "test-hostuser",
        password = "test",
        email = "test-hostuser@example",
        display_name = "test-hostuser",
        is_host = True,
    )
    db_session.add(host_user)
    await db_session.commit()
    result = await user_detail(host_user.username, db_session)
