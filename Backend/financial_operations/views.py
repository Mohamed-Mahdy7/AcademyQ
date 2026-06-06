from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Teachers, Enrollment, Payment
from .serializers import TeachersSerializer, EnrollmentSerializer, PaymentSerializer
# Create your views here.

class TeachersViewSet(viewsets.ModelViewSet):
    serializer_class = TeachersSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Teachers.objects.filter(academy_id=self.request.user.academy_id)


class EnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Enrollment.objects.filter(
            class_id__academy_id=self.request.user.academy_id
        )
        student_id = self.request.query_params.get('student_id')
        class_id = self.request.query_params.get('class_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if class_id:
            queryset = queryset.filter(class_id=class_id)
        return queryset


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Payment.objects.filter(
            enrollment_id__class_id__academy_id=self.request.user.academy_id
        )
        enrollment_id = self.request.query_params.get('enrollment_id')
        if enrollment_id:
            queryset = queryset.filter(enrollment_id=enrollment_id)
        return queryset