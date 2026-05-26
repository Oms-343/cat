"""Pre-approved WhatsApp template metadata (names must match Meta Business Manager)."""

from typing import TypedDict


class WhatsAppTemplateDef(TypedDict):
    id: str
    name: str
    purpose: str
    languages: list[str]
    preview_en: str
    preview_ta: str


WHATSAPP_TEMPLATES: list[WhatsAppTemplateDef] = [
    {
        "id": "profile_completion_invite_v2",
        "name": "Profile completion invite",
        "purpose": "Invite registered MSMEs to complete their platform profile",
        "languages": ["en", "ta"],
        "preview_en": (
            "Dear {{name}}, TIDCO invites you to complete your MSME profile on the "
            "Tamil Nadu MSME Platform. Tap the link to update your details: {{link}}"
        ),
        "preview_ta": (
            "அன்புள்ள {{name}}, தமிழ்நாடு MSME தளத்தில் உங்கள் சுயவிவரத்தை முழுமையாக்க "
            "TIDCO அழைக்கிறது. இணைப்பைத் தட்டவும்: {{link}}"
        ),
    },
    {
        "id": "onboarding_reminder_v1",
        "name": "Onboarding reminder",
        "purpose": "Remind unregistered businesses to sign up via the platform",
        "languages": ["en", "ta"],
        "preview_en": (
            "You are invited to register your MSME on the official Tamil Nadu MSME Platform. "
            "Sign up in minutes with your email: {{link}}"
        ),
        "preview_ta": (
            "உங்கள் MSME-ஐ அதிகாரப்பூர்வ தமிழ்நாடு MSME தளத்தில் பதிவு செய்ய அழைக்கப்படுகிறீர்கள். "
            "மின்னஞ்சலுடன் நிமிடங்களில் பதிவு செய்யுங்கள்: {{link}}"
        ),
    },
    {
        "id": "document_request_v3",
        "name": "Document request",
        "purpose": "Request specific documents or certifications from MSMEs",
        "languages": ["en", "ta"],
        "preview_en": (
            "TIDCO requests the following documents for {{company}}: {{doc_list}}. "
            "Upload securely here: {{link}}"
        ),
        "preview_ta": (
            "TIDCO {{company}} க்கான பின்வரும் ஆவணங்களை கோருகிறது: {{doc_list}}. "
            "பாதுகாப்பாக பதிவேற்றம்: {{link}}"
        ),
    },
]

TEMPLATE_BY_ID = {t["id"]: t for t in WHATSAPP_TEMPLATES}
