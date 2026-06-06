from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status, generics
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import AllowAny
from .serializers import AcademySerializer, CustomeTokenObtainPairSerializer,\
    AcademyRegistrationSerializer, StaffCreateSerializer, UserSerializer
from .permissions import ActiveSubscriptionRequired, IsOwner

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = AcademyRegistrationSerializer
    
    def perform_create(self, serializer):
        return serializer.save()
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = self.perform_create(serializer)
        
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        
        user_data = {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            'academy_id': user.academy.id if user.academy else None,
            "academy_name": user.academy.name if user.academy else None,
            "setup_complete": user.academy.setup_complete,
        }
        response = Response(user_data, status=status.HTTP_201_CREATED)
        
        response.set_cookie(
            key='access_token',
            value=access,
            httponly=True,
            secure=False,
            samesite='lax'
        )
        response.set_cookie(
            key='refresh_token',
            value=refresh,
            httponly=True,
            secure=False,
            samesite='lax'
        )
        return response


class AcademyView(generics.RetrieveUpdateAPIView):
    serializer_class = AcademySerializer
    
    def get_object(self):
        return self.request.user.academy


class ComopleteSetupView(APIView):
    def post(self, request):
        academy = request.user.academy
        required_fields = [
            academy.name,
            academy.email,
            academy.phone,
            academy.address
        ]
        
        if not all (required_fields):
            return Response({
                "error": "Academy profile is incomplete."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not academy.subjects.exists():
            return Response({
                "error": "At least one subject is required."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not academy.has_active_subscription():
            return Response(
                {"error": "Subscription is not configured."},
                status=400
            )
        
        academy.setup_complete = True
        academy.save(update_fields=["setup_complete"])
        
        refresh = RefreshToken.for_user(request.user)
        
        return Response({
            "setup_complete": True,
            "refresh": str(refresh),
            "access": str(refresh.access_token)
        }, status=status.HTTP_200_OK)

class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomeTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        base_response = super().post(request, *args, **kwargs)
        if base_response.status_code != 200:
            return base_response
        
        data = base_response.data
        refresh = data.get("refresh")
        access = data.get("access")
        
        user_data = {k: v for k, v in data.items()
                if k not in ["refresh", "access"]}
        
        response = Response(user_data)
        if access:
            response.set_cookie(
                key='access_token',
                value=access,
                httponly=True,
                secure=False,
                samesite='lax'
            )
        if refresh:
            response.set_cookie(
                key='refresh_token',
                value=refresh,
                httponly=True,
                secure=False,
                samesite='lax'
            )
        return response


class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsOwner]
    
    def get_queryset(self):
        return User.objects.filter(
            academy=self.request.user.academy
        ).exclude(role=User.Roles.OWNER)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return StaffCreateSerializer
        
        return UserSerializer
    
    def perform_create(self, serializer):
        serializer.save()


class RefreshTokenView(APIView):
    def post(self, request):
        print("REFRESHING THE TOKEN")
        refresh_token = request.COOKIES.get("refresh_token")
        
        if not refresh_token:
            return Response({"error": "No refresh token"},
                            status=status.HTTP_401_UNAUTHORIZED)
        try:
            refresh = RefreshToken(refresh_token)
            new_access = str(refresh.access_token)
            response = Response({"access": new_access})
            response.set_cookie(
                key="access_token",
                value=new_access,
                httponly=True,
                secure=False,  
                samesite="lax"
                )
            return response
        except Exception:
            return Response({"error": "Invalid refresh token"},
                            status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    def post(self, request):
        response = Response({"message": "Logged out"})
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        return response