"""Tests for EmailService — mocks smtplib.SMTP (no live connection needed)."""
from unittest.mock import MagicMock, patch

import pytest

from src.services.email_service import EmailService, _parse_bool


# ---------------------------------------------------------------------------
# Helper function tests
# ---------------------------------------------------------------------------


def test_parse_bool_true_values():
    """_parse_bool recognises various true representations."""
    assert _parse_bool("true") is True
    assert _parse_bool("True") is True
    assert _parse_bool("TRUE") is True
    assert _parse_bool("1") is True
    assert _parse_bool("yes") is True
    assert _parse_bool("on") is True


def test_parse_bool_false_values():
    """_parse_bool returns False for non-true strings."""
    assert _parse_bool("false") is False
    assert _parse_bool("0") is False
    assert _parse_bool("no") is False
    assert _parse_bool("off") is False
    assert _parse_bool("random") is False


def test_parse_bool_none_uses_default():
    """_parse_bool returns the default when value is None."""
    assert _parse_bool(None, default=False) is False
    assert _parse_bool(None, default=True) is True


# ---------------------------------------------------------------------------
# Plain SMTP (local dev / Mailpit)
# ---------------------------------------------------------------------------


def test_send_email_calls_smtp():
    """send_email builds a MIME message and calls SMTP.sendmail (plain mode)."""
    svc = EmailService(host="localhost", port=1025, from_addr="test@carsi.com.au")

    with patch("src.services.email_service.smtplib.SMTP") as MockSMTP:
        mock_server = MagicMock()
        MockSMTP.return_value.__enter__ = MagicMock(return_value=mock_server)
        MockSMTP.return_value.__exit__ = MagicMock(return_value=False)

        svc.send_email(
            to="recipient@example.com",
            subject="Test Subject",
            html_body="<p>Test body</p>",
        )

        MockSMTP.assert_called_once_with("localhost", 1025)
        mock_server.sendmail.assert_called_once()
        args = mock_server.sendmail.call_args[0]
        assert args[0] == "test@carsi.com.au"
        assert args[1] == "recipient@example.com"


def test_send_email_subject_in_message():
    """The MIME message contains the subject line."""
    svc = EmailService(host="localhost", port=1025, from_addr="test@carsi.com.au")

    with patch("src.services.email_service.smtplib.SMTP") as MockSMTP:
        mock_server = MagicMock()
        MockSMTP.return_value.__enter__ = MagicMock(return_value=mock_server)
        MockSMTP.return_value.__exit__ = MagicMock(return_value=False)

        svc.send_email(to="r@example.com", subject="My Subject", html_body="<p>x</p>")

        raw = mock_server.sendmail.call_args[0][2]
        assert "My Subject" in raw


def test_send_email_skips_login_when_no_credentials():
    """No login() call when username/password are empty."""
    svc = EmailService(host="localhost", port=1025, from_addr="test@carsi.com.au")

    with patch("src.services.email_service.smtplib.SMTP") as MockSMTP:
        mock_server = MagicMock()
        MockSMTP.return_value.__enter__ = MagicMock(return_value=mock_server)
        MockSMTP.return_value.__exit__ = MagicMock(return_value=False)

        svc.send_email(to="r@example.com", subject="Test", html_body="<p>x</p>")

        mock_server.login.assert_not_called()


# ---------------------------------------------------------------------------
# From header formatting
# ---------------------------------------------------------------------------


def test_send_email_includes_from_name():
    """From header includes display name when from_name is set."""
    svc = EmailService(
        host="localhost",
        port=1025,
        from_addr="test@carsi.com.au",
        from_name="CARSI Learning",
    )

    with patch("src.services.email_service.smtplib.SMTP") as MockSMTP:
        mock_server = MagicMock()
        MockSMTP.return_value.__enter__ = MagicMock(return_value=mock_server)
        MockSMTP.return_value.__exit__ = MagicMock(return_value=False)

        svc.send_email(to="r@example.com", subject="Test", html_body="<p>x</p>")

        raw = mock_server.sendmail.call_args[0][2]
        assert "CARSI Learning" in raw
        assert "test@carsi.com.au" in raw


# ---------------------------------------------------------------------------
# STARTTLS (port 587)
# ---------------------------------------------------------------------------


def test_send_email_uses_starttls_when_use_tls_true():
    """When use_tls=True, send_email calls starttls() before login."""
    svc = EmailService(
        host="smtp.example.com",
        port=587,
        from_addr="test@carsi.com.au",
        username="user",
        password="pass",
        use_tls=True,
        use_ssl=False,
    )

    with patch("src.services.email_service.smtplib.SMTP") as MockSMTP:
        mock_server = MagicMock()
        MockSMTP.return_value.__enter__ = MagicMock(return_value=mock_server)
        MockSMTP.return_value.__exit__ = MagicMock(return_value=False)

        svc.send_email(to="r@example.com", subject="TLS Test", html_body="<p>x</p>")

        MockSMTP.assert_called_once_with("smtp.example.com", 587)
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("user", "pass")
        mock_server.sendmail.assert_called_once()


# ---------------------------------------------------------------------------
# Implicit SSL (port 465)
# ---------------------------------------------------------------------------


def test_send_email_uses_smtp_ssl_when_use_ssl_true():
    """When use_ssl=True, send_email uses SMTP_SSL instead of plain SMTP."""
    svc = EmailService(
        host="smtp.resend.com",
        port=465,
        from_addr="test@carsi.com.au",
        username="resend",
        password="re_abc123",
        use_tls=False,
        use_ssl=True,
    )

    with patch("src.services.email_service.smtplib.SMTP_SSL") as MockSMTP_SSL:
        mock_server = MagicMock()
        MockSMTP_SSL.return_value.__enter__ = MagicMock(return_value=mock_server)
        MockSMTP_SSL.return_value.__exit__ = MagicMock(return_value=False)

        svc.send_email(to="r@example.com", subject="SSL Test", html_body="<p>x</p>")

        # SMTP_SSL is called with host, port, and context
        MockSMTP_SSL.assert_called_once()
        call_kwargs = MockSMTP_SSL.call_args
        assert call_kwargs[0][0] == "smtp.resend.com"
        assert call_kwargs[0][1] == 465
        mock_server.login.assert_called_once_with("resend", "re_abc123")
        mock_server.sendmail.assert_called_once()


# ---------------------------------------------------------------------------
# Environment variable configuration
# ---------------------------------------------------------------------------


def test_email_service_reads_env_vars(monkeypatch):
    """EmailService reads configuration from environment variables."""
    monkeypatch.setenv("SMTP_HOST", "smtp.test.com")
    monkeypatch.setenv("SMTP_PORT", "587")
    monkeypatch.setenv("SMTP_FROM", "custom@test.com")
    monkeypatch.setenv("SMTP_FROM_NAME", "Test Sender")
    monkeypatch.setenv("SMTP_USER", "testuser")
    monkeypatch.setenv("SMTP_PASS", "testpass")
    monkeypatch.setenv("SMTP_USE_TLS", "true")
    monkeypatch.setenv("SMTP_USE_SSL", "false")

    svc = EmailService()

    assert svc.host == "smtp.test.com"
    assert svc.port == 587
    assert svc.from_addr == "custom@test.com"
    assert svc.from_name == "Test Sender"
    assert svc.username == "testuser"
    assert svc.password == "testpass"
    assert svc.use_tls is True
    assert svc.use_ssl is False
