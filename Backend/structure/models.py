import uuid
from django.db import models


class Subject(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    academy = models.ForeignKey(
        "core.Academy",
        on_delete=models.CASCADE,
        related_name="subjects",
    )
    name = models.CharField(max_length=64)
    description = models.TextField()
    session_count = models.PositiveIntegerField()

    class Meta:
        db_table = "subjects"
        verbose_name = "Subject"
        verbose_name_plural = "Subjects"
        ordering = ["name"]

        constraints = [
            models.UniqueConstraint(
                fields=["academy", "name"],
                name="unique_subject_name_per_academy",
            )
        ]

    def __str__(self):
        return self.name


class Class(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    academy = models.ForeignKey(
        "core.Academy",
        on_delete=models.CASCADE,
        related_name="classes",
    )
    subject = models.ForeignKey(
        "Subject",
        on_delete=models.PROTECT,
        related_name="classes",
    )
    teachers = models.ManyToManyField(
        "financial_operations.Teachers",
        through="TeacherClass",
        related_name="classes",
    )
    name = models.CharField(max_length=64)
    session_time = models.TimeField()
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "classes"
        verbose_name = "Class"
        verbose_name_plural = "Classes"
        ordering = ["academy", "subject", "start_date", "session_time"]

        constraints = [
            models.UniqueConstraint(
                fields=["academy", "subject", "name"],
                name="unique_class_name_per_subject_academy",
            )
        ]

    def __str__(self):
        return self.name


class TeacherClass(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assigned_class = models.ForeignKey(
        "Class",
        on_delete=models.CASCADE,
        related_name="teacher_assignments",
    )
    teacher = models.ForeignKey(
        "financial_operations.Teachers",
        on_delete=models.CASCADE,
        related_name="class_assignments",
    )
    assigned_at = models.DateField()

    class Meta:
        db_table = "teacher_classes"
        verbose_name = "Teacher Class"
        verbose_name_plural = "Teacher Classes"
        ordering = ["assigned_class", "teacher", "assigned_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["assigned_class", "teacher"],
                name="unique_teacher_per_class",
            )
        ]

    def __str__(self):
        return f"{self.teacher} - {self.assigned_class.name}"
