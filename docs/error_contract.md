# AcademiQ API Error Contract

Every error response, regardless of source, has this shape:

{
  "detail": "Human-readable message, safe to show the user.",
  "code": "validation_error | not_found | permission_denied | rate_limited | upstream_error | server_error",
  "fields": { "field_name": ["message"] }   // only present for validation_error
}

`upstream_error` is reserved for views that explicitly catch a failure from
an external dependency (LLM call, Celery, Redis) and choose to report it —
the global handler does not assign this code automatically. Views using it
should set it explicitly via DRF's `exception.status_code` + a manually
constructed Response, not by raising a generic exception.