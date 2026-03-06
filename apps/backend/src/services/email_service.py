"""
CARSI Email Service

Synchronous SMTP sender — called from Celery tasks (outside async context).

Dev:  Mailpit at localhost:1025 (no auth, no TLS)
Prod: Resend SMTP at smtp.resend.com:465 (SSL) or port 587 (STARTTLS)

Configure via environment variables:
  SMTP_HOST       — default: localhost
  SMTP_PORT       — default: 1025
  SMTP_FROM       — default: noreply@carsi.com.au
  SMTP_FROM_NAME  — default: CARSI Learning
  SMTP_USER       — default: (empty, no auth)
  SMTP_PASS       — default: (empty, no auth)
  SMTP_USE_TLS    — default: false (set to 'true' for production)
  SMTP_USE_SSL    — default: false (set to 'true' for port 465 implicit SSL)
"""

import logging
import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

logger = logging.getLogger(__name__)


def _parse_bool(value: str | None, default: bool = False) -> bool:
    """Parse a boolean from environment variable string."""
    if value is None:
        return default
    return value.lower() in ("true", "1", "yes", "on")


class EmailService:
    """
    Production-ready SMTP email service.

    Supports:
    - Plain SMTP (dev/Mailpit)
    - STARTTLS (port 587, most providers)
    - Implicit SSL (port 465, Resend/legacy)
    """

    def __init__(
        self,
        host: str | None = None,
        port: int | None = None,
        from_addr: str | None = None,
        from_name: str | None = None,
        username: str | None = None,
        password: str | None = None,
        use_tls: bool | None = None,
        use_ssl: bool | None = None,
    ) -> None:
        self.host = host or os.getenv("SMTP_HOST", "localhost")
        self.port = port or int(os.getenv("SMTP_PORT", "1025"))
        self.from_addr = from_addr or os.getenv("SMTP_FROM", "noreply@carsi.com.au")
        self.from_name = from_name or os.getenv("SMTP_FROM_NAME", "CARSI Learning")
        self.username = username or os.getenv("SMTP_USER", "")
        self.password = password or os.getenv("SMTP_PASS", "")

        # TLS/SSL configuration
        if use_tls is not None:
            self.use_tls = use_tls
        else:
            self.use_tls = _parse_bool(os.getenv("SMTP_USE_TLS"), default=False)

        if use_ssl is not None:
            self.use_ssl = use_ssl
        else:
            self.use_ssl = _parse_bool(os.getenv("SMTP_USE_SSL"), default=False)

        # Log configuration (without password)
        logger.info(
            "EmailService configured: host=%s port=%d tls=%s ssl=%s from=%s",
            self.host,
            self.port,
            self.use_tls,
            self.use_ssl,
            self.from_addr,
        )

    def _get_formatted_from(self) -> str:
        """Return formatted 'From' header with display name."""
        if self.from_name:
            return formataddr((self.from_name, self.from_addr))
        return self.from_addr

    def send_email(self, *, to: str, subject: str, html_body: str) -> None:
        """
        Send an HTML email. Raises smtplib.SMTPException on failure —
        let Celery handle retries via its retry mechanism.

        Automatically selects the correct SMTP connection method:
        - SMTP_SSL for implicit SSL (port 465)
        - SMTP + STARTTLS for explicit TLS (port 587)
        - Plain SMTP for local dev (port 1025)
        """
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = self._get_formatted_from()
        msg["To"] = to
        msg.attach(MIMEText(html_body, "html"))

        # Create SSL context for secure connections
        ssl_context = ssl.create_default_context()

        if self.use_ssl:
            # Implicit SSL (port 465) — connection is encrypted from the start
            with smtplib.SMTP_SSL(
                self.host, self.port, context=ssl_context
            ) as server:
                if self.username and self.password:
                    server.login(self.username, self.password)
                server.sendmail(self.from_addr, to, msg.as_string())
                logger.info("Email sent via SMTP_SSL to %s: %s", to, subject)

        elif self.use_tls:
            # STARTTLS (port 587) — upgrade to TLS after connecting
            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls(context=ssl_context)
                if self.username and self.password:
                    server.login(self.username, self.password)
                server.sendmail(self.from_addr, to, msg.as_string())
                logger.info("Email sent via STARTTLS to %s: %s", to, subject)

        else:
            # Plain SMTP (local dev — Mailpit)
            with smtplib.SMTP(self.host, self.port) as server:
                if self.username and self.password:
                    server.login(self.username, self.password)
                server.sendmail(self.from_addr, to, msg.as_string())
                logger.debug("Email sent via plain SMTP to %s: %s", to, subject)


# Module-level singleton — configured from env vars at import time
email_service = EmailService()
