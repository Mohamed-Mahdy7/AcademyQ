import logging
import uuid
from django.conf import settings
from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.db import IntegrityError
from django.db.models.deletion import ProtectedError
from django.http import Http404
from rest_framework import exceptions as drf_exceptions
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_default_handler
from rest_framework.exceptions import APIException


logger = logging.getLogger(__name__)

class UpstreamError(APIException):
    status_code = 502
    default_detail = "An upstream service failed. Please try again."
    default_code = "upstream_error"

class RateLimitedError(APIException):
    status_code = 429
    default_detail = "Too many requests. Try again later."
    default_code = "rate_limited"

def _shape(detail, code, fields=None):
    payload = {"detail": detail, "code": code}
    if fields:
        payload["fields"] = fields
    return payload

def _extract_fields(exc_detail):
    """
    DRF's ValidationError.detail can be a dict (field -> [messages]),
    a list (non-field errors), or a plain string. Normalize all three
    into the contract's `fields` shape, or return None if there's
    nothing field-specific to report.
    """
    if isinstance(exc_detail, dict):
        return {
            key: [str(v) for v in value] if isinstance(value, list) else [str(value)]
            for key, value in exc_detail.items()
        }
    return None

def custom_exception_handler(exc, context):
    # Let DRF build its normal response first (status code, basic detail)
    # We only reshape the body, not reinvent status-code logic.
    response = drf_default_handler(exc, context)
    
    if response is not None:
        if isinstance(exc, drf_exceptions.ValidationError):
            fields = _extract_fields(exc.detail)
            detail = (
                "Please fix the highlighted fields."
                if fields else str(response.data.get("detail", "Invalid request."))
            )
            response.data = _shape(detail, "validation_error", fields)
        
        elif isinstance(exc, (drf_exceptions.NotFound, Http404)):
            response.data = _shape("Not found.", "not_found")
        
        elif isinstance(exc, (
            drf_exceptions.PermissionDenied, 
            DjangoPermissionDenied, 
            drf_exceptions.NotAuthenticated,
            drf_exceptions.AuthenticationFailed)):
            
            response.data = _shape(
                str(response.data.get("detail", "You don't have permission to do this.")),
                "permission_denied",
            )
        
        elif isinstance(exc, drf_exceptions.Throttled):
            response.data = _shape(
                str(response.data.get("detail", "Too many requests. Try again later.")),
                "rate_limited",
            )
        
        elif isinstance(exc, UpstreamError):
            response.data = _shape(str(response.data.get("detail")), "upstream_error")

        elif isinstance(exc, RateLimitedError):
            response.data = _shape(str(response.data.get("detail")), "rate_limited")
        
        else:
            # Any other DRF-recognized exception we haven't special-cased --
            # keep its message but still wrap it in the contract.
            response.data = _shape(
                str(response.data.get("detail", "Something went wrong.")),
                "server_error",
            )
            
        return response 
    
    # DRF's default handler returned None -- this is an exception DRF doesn't
    # know how to translate to a response at all (IntegrityError, bare
    # AttributeError, etc.). This is the path that used to leak a traceback
    # or 500 with no body. Log it with a reference ID, never show the real
    # exception text to the client.
    
    error_id = uuid.uuid4().hex[:8]
    logger.exception("Unhandled exception [ref=%s]", error_id)

    # ProtectedError must come before IntegrityError since it's a subclass —
    # deleting a record that is referenced by a PROTECT foreign key.
    if isinstance(exc, ProtectedError):
        detail = "Cannot delete this item because it is still referenced by other records."
        return Response(
            _shape(f"{detail} [ref: {error_id}]", "server_error"),
            status=409,
        )
    elif isinstance(exc, IntegrityError):
        detail = "This action conflicts with existing data."
    else:
        detail = "An unexpected error occurred. Please try again."
        
    if settings.DEBUG:
        detail = f"{detail} (DEBUG: {exc})"
    
    return Response(
        _shape(f"{detail} [ref: {error_id}]", "server_error"),
        status=500,
    )