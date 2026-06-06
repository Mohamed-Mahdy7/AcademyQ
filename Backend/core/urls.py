from django.urls import path
from . import views

urlpatterns =[
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name='login'),
    path("token/refresh/", views.RefreshTokenView.as_view(), name="refresh"),
    path("logout/", views.LogoutView.as_view(), name='logout'),
    path("academy/", views.AcademyView.as_view(), name='academy'),
    path("academy/complete-setup/", views.ComopleteSetupView.as_view(), name="complete-setup")
]