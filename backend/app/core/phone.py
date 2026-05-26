"""Phone number normalization for WhatsApp (E.164)."""


def normalize_phone(phone: str | None) -> str | None:
    if not phone or not str(phone).strip():
        return None
    digits = "".join(c for c in phone if c.isdigit())
    if len(digits) < 10:
        return None
    if len(digits) == 10:
        return f"+91{digits}"
    if digits.startswith("91") and len(digits) == 12:
        return f"+{digits}"
    if phone.strip().startswith("+"):
        return phone.strip()
    return f"+{digits}"


def phone_digits_key(phone: str) -> str:
    """Match key for Meta `from` / `recipient_id` (digits only, no +)."""
    return "".join(c for c in phone if c.isdigit())
