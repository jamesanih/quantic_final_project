from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.application.dtos.auth_dtos import (
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    RefreshResponse,
    RegisterRequest,
    RegisterResponse,
    UserResponse,
)
from app.application.services.auth_service import AuthService
from app.api.deps import CurrentUser, get_auth_service
from app.domain.user.exceptions import (
    EmailAlreadyRegisteredError,
    InvalidCredentialsError,
    TokenError,
    UserNotFoundError,
)

from app.limiter import limiter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/hour")
async def register(
    request: Request,
    body: RegisterRequest,
    auth: AuthService = Depends(get_auth_service),
) -> RegisterResponse:
    """Register a new candidate or recruiter account."""
    try:
        user = await auth.register(
            email=body.email,
            plain_password=body.password,
            full_name=body.full_name,
            role=body.role,
        )
    except EmailAlreadyRegisteredError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered.",
        )
    return RegisterResponse(user_id=user.id, email=user.email.value, role=user.role)


@router.post("/login", response_model=LoginResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    body: LoginRequest,
    auth: AuthService = Depends(get_auth_service),
) -> LoginResponse:
    """Authenticate and receive JWT access + refresh tokens."""
    try:
        user, access, refresh = await auth.login(body.email, body.password)
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return LoginResponse(
        access_token=access,
        refresh_token=refresh,
        user_id=user.id,
        role=user.role,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    current_user: CurrentUser,
    request: Request,
    auth: AuthService = Depends(get_auth_service),
) -> None:
    """Invalidate the current access token."""
    token = request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
    await auth.logout(token)


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(
    body: RefreshRequest,
    auth: AuthService = Depends(get_auth_service),
) -> RefreshResponse:
    """Exchange a valid refresh token for a new token pair."""
    try:
        access, refresh = await auth.refresh(body.refresh_token)
    except (TokenError, UserNotFoundError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        )
    return RefreshResponse(access_token=access, refresh_token=refresh)


@router.get("/me", response_model=UserResponse)
async def me(current_user: CurrentUser) -> UserResponse:
    """Return the currently authenticated user's profile."""
    return UserResponse(
        user_id=current_user.id,
        email=current_user.email.value,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
    )
