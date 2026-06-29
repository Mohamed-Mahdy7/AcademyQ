from django.utils.deprecation import MiddlewareMixin

class AutoRefreshJWTMiddleware(MiddlewareMixin):
    def process_request(self, request):
        return None
    
    def process_response(self, request, response):
        if hasattr(request, "_new_access_token"):
            response.set_cookie(
                key="access_token",
                value=request._new_access_token,
                httponly=True,
                secure=True,  
                samesite="None"
            )
        return response