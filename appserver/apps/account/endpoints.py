from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from .models import User

router = APIRouter(prefix="/account")

@router.get("/users/{username}")
async def user_detail(username:str) -> dict:
    if username == "test":
        return{
            "id":1,
            "username":username,
            "email":"Oj9rX@example.com",
            "display_name":username,            
            "is_host":True,
            "created_at":datetime.now(timezone.utc),
            "updated_at":datetime.now(timezone.utc)
        }
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")