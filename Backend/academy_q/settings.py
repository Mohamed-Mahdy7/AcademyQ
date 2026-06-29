
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
from django.utils.translation import gettext_lazy as _
import os

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_EMBEDDING_MODEL = "gemini-embedding-001"

# LANGUAGES CONFIG

LANGUAGE_CODE = "ar"  # Arabic-first default

LANGUAGES = [
    ("ar", _("Arabic")),
    ("en", _("English")),
]

LOCALE_PATHS = [BASE_DIR / "locale",]
USE_I18N = True

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'djoser',
    'django_extensions',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'core',
    'grades',
    'structure',
    'records',
    'financial_operations',
    'ai.notifications',
    'ai.reports',
    'ai.agent',
    'ai',
]

MIDDLEWARE = [
    'core.middleware.AutoRefreshJWTMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    "django.middleware.locale.LocaleMiddleware", 
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'academy_q.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'academy_q.wsgi.application'


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

import dj_database_url
database_url = os.getenv("DATABASE_URL")

print(type(database_url))
print(repr(database_url))

DATABASES = {
    'default': dj_database_url.parse(
        os.getenv("DATABASE_URL")
    )
}


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = 'static/'

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ['core.authentication.CookieJWTAuthentication',],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    # 'DEFAULT_PAGINATION_CLASS': [
    #     'rest_framework.pagination.PageNumberPagination',
    #     'PAGE_SIZE': 10,
    # ]
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'AUTH_HEADER_TYPES': ('JWT',),
}


DJOSER = {
    "USER_CREATE_PASSWORD_RETYPE": True,
    "SET_PASSWORD_RETYPE": True,
    "PASSWORD_RESET_CONFIRM_RETYPE": True,
    "PASSWORD_RESET_CONFIRM_URL": "password/reset/confirm/{uid}/{token}",
    'SERIALIZERS': {
        'user_create': 'core.serializers.UserCreateSerializer',
        'current_user': 'core.serializers.UserSerializer',
    },
    'EMAIL': {
        "password_reset": ".email.PasswordResetEmail",
        "password_changed_confirmation":
            ".email.PasswordChangedConfirmationEmail",
    },
}

import json

CORS_ALLOWED_ORIGINS = json.loads(
    os.getenv(
        "CORS_ALLOWED_ORIGINS",
        '["http://localhost:5173"]'
    )
)

ALLOWED_HOSTS = json.loads(
    os.getenv(
        "ALLOWED_HOSTS",
        '["localhost", "127.0.0.1"]'
    )
)

CSRF_TRUSTED_ORIGINS = json.loads(
    os.getenv(
        "CSRF_TRUSTED_ORIGINS",
        '["http://localhost:5173"]'
    )
)

CORS_ALLOW_CREDENTIALS = (
    os.getenv("CORS_ALLOW_CREDENTIALS", "False").lower()
    == "true"
)

SESSION_COOKIE_SECURE = (
    os.getenv("SESSION_COOKIE_SECURE", "False").lower()
    == "true"
)

CSRF_COOKIE_SECURE = (
    os.getenv("CSRF_COOKIE_SECURE", "False").lower()
    == "true"
)

AUTH_USER_MODEL='core.User'

AUTHENTICATION_BACKENDS = [
    'core.serializers.EmailBackend',
    'django.contrib.auth.backends.ModelBackend',
]


EMAIL_BACKEND = os.getenv("EMAIL_BACKEND")
EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
EMAIL_PORT = os.getenv("EMAIL_PORT")
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER


# celery
CELERY_RESULT_BACKEND = os.getenv("REDIS_URL")
CELERY_BROKER_URL= os.getenv("REDIS_URL")

CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"

CELERY_BEAT_SCHEDULE = {
    "test-every-30-sec": {
        "task": "ai.tasks.send_email",
        "schedule": 30.0,
    }
}

from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    "weekly-student-scan": {
        "task": "ai.agent.tasks.weekly_student_scan",
        "schedule": crontab(
            minute=0,
            hour=4,        # 04:00 UTC = 07:00 Cairo (UTC+3, no DST)
            day_of_week=0, # Sunday
        ),
    },
    
    "weekly-management-report": {
    "task": "ai.tasks.send_weekly_management_report",
    "schedule": crontab(hour=7, minute=0, day_of_week="sunday"),
    "options": {"timezone": "Africa/Cairo"},
    },
}

#     "daily-payment-reminders": {
#         "task": "ai.notifications.reminder_tasks.send_payment_reminders",
#         "schedule": crontab(
#             minute=0,
#             hour=9,
#         ),
#     },
# }


CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.getenv("REDIS_URL"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
    }
}

AI_CACHE_TTL = 60 * 60 * 24 * 7  # 7 days

SPECTACULAR_SETTINGS = {
    "TITLE": "AcademiQ API",
    "DESCRIPTION": "Academy management SaaS — multi-tenant, AI-enhanced retention layer.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "TAGS": [
        {"name": "Auth"}, {"name": "Academy"}, {"name": "Staff"}, {"name": "Students"},
        {"name": "Structure"}, {"name": "Attendance"}, {"name": "Grades"},
        {"name": "AI Reports"}, {"name": "AI Agent"}, {"name": "AI Notifications"}, {"name": "AI Infra"},
    ],
}