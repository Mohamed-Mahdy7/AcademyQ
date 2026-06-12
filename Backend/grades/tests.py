from django.test import TestCase
from .models import Grade


class TestGrade(TestCase):
    queryset = Grade.objects.all()
# Create your tests here.
