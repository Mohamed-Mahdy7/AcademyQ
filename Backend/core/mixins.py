class AcademyScopedMixin:
    def get_queryset(self):
        queryset = super().get_queryset()
        if getattr(self, "swagger_fake_view", False):
            return queryset.none()
        return queryset.filter(academy_id=self.request.user.academy_id)