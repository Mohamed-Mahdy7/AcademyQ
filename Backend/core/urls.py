from django.urls import path
from . import views

urlpatterns =[
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name='login'),
    path("refresh/", views.RefreshTokenView.as_view(), name='refresh'),
    path("logout/", views.LogoutView.as_view(), name='logout'),
    path("academy/", views.AcademyView.as_view(), name='academy'),
    path("academies/", views.AcademyListView.as_view(), name="academy-list"),
    path("academy/complete-setup/", views.ComopleteSetupView.as_view(), name="complete_setup"),
    path("users/register/student/", views.StudentRegistrationView.as_view(), name="register_student"),
    path("users/students/profile/<uuid:pk>/", views.StudentProfileView.as_view(),name="student_profile_update"),
    path("educational_levels/", views.EducationalLevelListView.as_view(), name="educational_levels"),
]