from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import logging

logger = logging.getLogger(__name__)

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        access_token = request.COOKIES.get("access_token")
        refresh_token = request.COOKIES.get("refresh_token")

        if not access_token:
            return None
        try:
            validated_token = self.get_validated_token(access_token)
            return self.get_user(validated_token), validated_token
        
        except (InvalidToken, TokenError) as e:
            
            if refresh_token:
                try:
                    refresh = RefreshToken(refresh_token)
                    new_access = str(refresh.access_token)
                    
                    request._new_access_token = new_access
                    validated_token = AccessToken(new_access)
                    user = self.get_user(validated_token)
                    return user, validated_token
                except Exception as e:
                    logger.debug("Refresh token invalid during transparent refresh: %s", e)
                    return None
                
            return None