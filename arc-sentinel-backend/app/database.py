from supabase import create_client, Client
from app.config import get_settings


_settings = get_settings()
_supabase_client: Client | None = None


def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            _settings.supabase_url,
            _settings.supabase_service_key,
        )
    return _supabase_client
