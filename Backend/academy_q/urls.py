from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/auth/', include('core.urls')),
    path('api/', include('records.urls')),
    path('api/ai/', include('ai.urls')),
    path("api/", include("ai.agent.urls")),
]
