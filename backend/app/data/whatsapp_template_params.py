"""Template body variable order (must match Meta-approved templates)."""

# Each key is the ordered list of placeholder keys we pass to WhatsApp body component.
TEMPLATE_BODY_PARAM_KEYS: dict[str, list[str]] = {
    "profile_completion_invite_v2": ["name", "link"],
    "onboarding_reminder_v1": ["link"],
    "document_request_v3": ["company", "doc_list", "link"],
}


def resolve_template_params(
    template_id: str,
    *,
    recipient_name: str,
    registration_url: str,
    doc_list: str = "Udyam, GST, and address proof",
) -> list[str]:
    keys = TEMPLATE_BODY_PARAM_KEYS.get(template_id, ["link"])
    values = {
        "name": recipient_name[:100] or "MSME",
        "company": recipient_name[:100] or "your business",
        "link": registration_url,
        "doc_list": doc_list,
    }
    return [values[k] for k in keys]
