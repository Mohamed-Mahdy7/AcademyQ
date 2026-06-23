class AcademyScopedMixin:
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return super().get_queryset().none()
        return super().get_queryset()