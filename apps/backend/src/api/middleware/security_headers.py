"""Security headers middleware.

Adds standard security headers to all responses to protect
against common web vulnerabilities.
"""

from collections.abc import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Paths that serve Swagger UI / ReDoc — need relaxed CSP for CDN assets
_DOCS_PATHS = {"/docs", "/redoc", "/openapi.json"}

# CSP for API docs: allow CDN resources required by Swagger UI and ReDoc
_DOCS_CSP = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; "
    "style-src 'self' 'unsafe-inline' cdn.jsdelivr.net fonts.googleapis.com; "
    "font-src fonts.gstatic.com; "
    "img-src 'self' data: fastapi.tiangolo.com; "
    "frame-ancestors 'none'"
)

# Strict CSP for all other API responses
_API_CSP = "default-src 'none'; frame-ancestors 'none'"


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to every response."""

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Response],
    ) -> Response:
        """Add security headers to the response."""
        response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )

        # Relax CSP for Swagger UI / ReDoc so CDN assets load correctly
        csp = _DOCS_CSP if request.url.path in _DOCS_PATHS else _API_CSP
        response.headers["Content-Security-Policy"] = csp

        # HSTS — only enforce over HTTPS
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

        return response
