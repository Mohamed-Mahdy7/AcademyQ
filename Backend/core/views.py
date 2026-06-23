from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status, generics
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import NotFound, PermissionDenied, AuthenticationFailed, ValidationError
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer

from .mixins import AcademyScopedMixin
from .models import Academy, Students
from .serializers import (AcademySerializer, CustomeTokenObtainPairSerializer,
    AcademyRegistrationSerializer, StaffCreateSerializer, StudentCreateSerializer, 
    StudentListSerializer, StudentProfileUpdateSerializer, UserSerializer)
from .permissions import ActiveSubscriptionRequired, IsOwner

User = get_user_model()

@extend_schema(tags=["Auth"])
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

@extend_schema(tags=["Auth"])
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

@extend_schema(
    tags=["Auth"],
    request=None,
    responses={
        200: inline_serializer(
            "RefreshTokenResponse",
            fields={"access": serializers.CharField()},
        ),
        401: inline_serializer(
            "RefreshTokenError",
            fields={"error": serializers.CharField()},
        ),
    },
)
class RefreshTokenView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")
        
        if not refresh_token:
            raise AuthenticationFailed("No refresh token provided.")
        try:
            refresh = RefreshToken(refresh_token)
            new_access = str(refresh.access_token)
        except Exception:
            raise AuthenticationFailed("Invalid or expired refresh token. Please log in again.")
        
        response = Response({"access": new_access})
        response.set_cookie(
            key="access_token",
            value=new_access,
            httponly=True,
            secure=False,  
            samesite="lax"
            )
        return response

@extend_schema(
    tags=["Auth"],
    request=None,
    responses={200: inline_serializer(
        "LogoutResponse",
        fields={"message": serializers.CharField()},
    )},
)
class LogoutView(APIView):

    def post(self, request):
        response = Response({"message": "Logged out"})
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        return response

@extend_schema(tags=["Academy"])
class AcademyView(generics.RetrieveUpdateAPIView):
    serializer_class = AcademySerializer
    
    def get_object(self):
        academy = self.request.user.academy
        
        if not academy: 
            raise NotFound("No academy associated with this account.")
        return academy

@extend_schema(tags=["Academy"])
class AcademyListView(generics.ListAPIView):
    queryset = Academy.objects.all()
    serializer_class = AcademySerializer

@extend_schema(
    tags=["Academy"],
    request=None,
    responses={200: inline_serializer(
        "CompleteSetupResponse",
        fields={
            "setup_complete": serializers.BooleanField(),
            "refresh": serializers.CharField(),
            "access": serializers.CharField(),
        },
    )},
)
class ComopleteSetupView(APIView):
    def post(self, request):
        academy = request.user.academy
        required_fields = [
            academy.name,
            academy.email,
            academy.phone,
            academy.address
        ]
        
        if not all(required_fields):
            raise ValidationError({"academy": ["Academy profile is incomplete."]})
        if not academy.subjects.exists():
            raise ValidationError({"subjects": ["At least one subject is required."]})
        if not academy.has_active_subscription():
            raise ValidationError({"subscription": ["Subscription is not configured."]})

        
        academy.setup_complete = True
        academy.save(update_fields=["setup_complete"])
        
        refresh = RefreshToken.for_user(request.user)
        
        return Response({
            "setup_complete": True,
            "refresh": str(refresh),
            "access": str(refresh.access_token)
        }, status=status.HTTP_200_OK)

@extend_schema_view(
    list=extend_schema(tags=["Staff"]),
    retrieve=extend_schema(tags=["Staff"]),
    create=extend_schema(tags=["Staff"]),
    me=extend_schema(tags=["Staff"]),
    students=extend_schema(tags=["Students"]),
    
)
class UserViewSet(AcademyScopedMixin, viewsets.ModelViewSet):
    permission_classes = [IsOwner]
    
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return User.objects.none()
        
        return User.objects.filter(
            academy=self.request.user.academy
        ).exclude(role=User.Roles.OWNER)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return StaffCreateSerializer
        if self.action == "students":
            return StudentListSerializer
        return UserSerializer
    
    @action(detail=False,  methods=["GET", "PUT"], permission_classes = [IsAuthenticated])
    def me(self, request):
        serializer_class = (
            StudentProfileUpdateSerializer
            if request.user.role == User.Roles.STUDENT
            else UserSerializer
            
        )
        if request.method == 'GET':
            return Response(serializer_class(request.user).data)
        
        serializer = serializer_class(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        serializer.save()
    
    @action(detail=False, methods=["GET"])
    def students(self, request):
        students = User.objects.filter(
            academy=self.request.user.academy,
            role=User.Roles.STUDENT
        ).select_related("academy", "students")
        serializer = self.get_serializer(students, many=True)
        return Response(serializer.data)

@extend_schema(tags=["Staff"])
class RolesListView(APIView):
    def get(self, request):
        return Response([{
            "value": value,
            "label": label,
        }for value, label in User.Roles.choices])

@extend_schema(
    tags=["Students"],
    responses=inline_serializer(
        "EducationalLevelChoice",
        fields={
            "value": serializers.IntegerField(),
            "label": serializers.CharField(),
        },
        many=True,
    ),
)
class EducationalLevelListView(APIView):
    def get(self, request):
        return Response ([
            {
                "value": value,
                "label": label,
            }
            for value, label in Students.EducationalLevel.choices
        ])

@extend_schema(tags=["Students"])
class StudentRegistrationView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = StudentCreateSerializer

@extend_schema(tags=["Students"])
class StudentProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = StudentProfileUpdateSerializer

    def get_object(self):
        # student_id = self.kwargs["pk"]
        
        # student = get_object_or_404(
        #     Students.objects.select_related("user"),
        #     pk=student_id,
        # )
        user = get_object_or_404(
            User.objects.select_related("students"),
            pk=self.kwargs["pk"],
            role=User.Roles.STUDENT,
        )
        # user = student.user

        if user.academy != self.request.user.academy:
            raise PermissionDenied()

        return user
