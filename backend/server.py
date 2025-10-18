from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 720  # 30 days

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Enums
class MarkerCategory(str, Enum):
    EVENT = "event"
    OBSTACLE = "obstacle"
    OBJECT = "object"
    ALERT = "alert"

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserResponse(BaseModel):
    id: str
    email: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class MarkerCreate(BaseModel):
    title: str
    category: MarkerCategory
    description: str
    latitude: float
    longitude: float
    image: Optional[str] = None  # Base64 encoded image

class MarkerUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[MarkerCategory] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image: Optional[str] = None

class Marker(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_email: str
    title: str
    category: MarkerCategory
    description: str
    latitude: float
    longitude: float
    image: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str, email: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        email = payload.get("email")
        
        if not user_id or not email:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        return {"user_id": user_id, "email": email}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Auth Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = User(email=user_data.email)
    user_dict = user.model_dump()
    user_dict['password_hash'] = hash_password(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Generate token
    token = create_access_token(user.id, user.email)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user.id, email=user.email, created_at=user.created_at)
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(credentials.password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Generate token
    token = create_access_token(user_doc['id'], user_doc['email'])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_doc['id'],
            email=user_doc['email'],
            created_at=datetime.fromisoformat(user_doc['created_at'])
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user['user_id'],
        email=current_user['email'],
        created_at=datetime.now(timezone.utc)
    )

# Marker Routes
@api_router.post("/markers", response_model=Marker)
async def create_marker(marker_data: MarkerCreate, current_user: dict = Depends(get_current_user)):
    marker = Marker(
        user_id=current_user['user_id'],
        user_email=current_user['email'],
        **marker_data.model_dump()
    )
    
    marker_dict = marker.model_dump()
    marker_dict['created_at'] = marker_dict['created_at'].isoformat()
    marker_dict['updated_at'] = marker_dict['updated_at'].isoformat()
    
    await db.markers.insert_one(marker_dict)
    
    return marker

@api_router.get("/markers", response_model=List[Marker])
async def get_markers(category: Optional[str] = None):
    query = {}
    if category:
        query['category'] = category
    
    markers = await db.markers.find(query, {"_id": 0}).to_list(1000)
    
    # Convert ISO strings back to datetime
    for marker in markers:
        if isinstance(marker['created_at'], str):
            marker['created_at'] = datetime.fromisoformat(marker['created_at'])
        if isinstance(marker['updated_at'], str):
            marker['updated_at'] = datetime.fromisoformat(marker['updated_at'])
    
    return markers

@api_router.put("/markers/{marker_id}", response_model=Marker)
async def update_marker(
    marker_id: str,
    marker_data: MarkerUpdate,
    current_user: dict = Depends(get_current_user)
):
    # Find marker
    marker = await db.markers.find_one({"id": marker_id})
    if not marker:
        raise HTTPException(status_code=404, detail="Marker not found")
    
    # Check ownership
    if marker['user_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Not authorized to update this marker")
    
    # Update marker
    update_data = {k: v for k, v in marker_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.markers.update_one({"id": marker_id}, {"$set": update_data})
    
    # Fetch updated marker
    updated_marker = await db.markers.find_one({"id": marker_id}, {"_id": 0})
    updated_marker['created_at'] = datetime.fromisoformat(updated_marker['created_at'])
    updated_marker['updated_at'] = datetime.fromisoformat(updated_marker['updated_at'])
    
    return Marker(**updated_marker)

@api_router.delete("/markers/{marker_id}")
async def delete_marker(marker_id: str, current_user: dict = Depends(get_current_user)):
    # Find marker
    marker = await db.markers.find_one({"id": marker_id})
    if not marker:
        raise HTTPException(status_code=404, detail="Marker not found")
    
    # Check ownership
    if marker['user_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Not authorized to delete this marker")
    
    # Delete marker
    await db.markers.delete_one({"id": marker_id})
    
    return {"message": "Marker deleted successfully"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()