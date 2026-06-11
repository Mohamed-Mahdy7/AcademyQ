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
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    session_count = models.IntegerField(
        null=True,
        blank=True,
        help_text="Total planned sessions for this class delivery",
    )
    session_price = models.PositiveIntegerField(blank=True, null=True)
    session_duration = models.DurationField(blank=True, null=True)

    class Meta:
        db_table = "classes"
        verbose_name = "Class"
        verbose_name_plural = "Classes"
        ordering = ["academy", "subject", "start_date"] 

        constraints = [
            models.UniqueConstraint(
                fields=["academy", "subject", "name"],
                name="unique_class_name_per_subject_academy",
            )
        ]

    def clean(self):
        if self.start_date and self.end_date:
            if self.end_date <= self.start_date:
                raise ValidationError(
                    {"end_date": "End date must be after start date."}
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ClassSchedule(models.Model):
    DAY_CHOICES = [
        (0, "Monday"),
        (1, "Tuesday"),
        (2, "Wednesday"),
        (3, "Thursday"),
        (4, "Friday"),
        (5, "Saturday"),
        (6, "Sunday"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_obj = models.ForeignKey(
        "Class",
        on_delete=models.CASCADE,
        related_name="schedules",
    )
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()

    class Meta:
        db_table = "class_schedules"
        verbose_name = "Class Schedule"
        verbose_name_plural = "Class Schedules"

        constraints = [
            models.UniqueConstraint(
                fields=["class_obj", "day_of_week", "start_time"],
                name="unique_class_slot",
            )
        ]

    def clean(self):
        if self.start_time and self.end_time:
            if self.end_time <= self.start_time:
                raise ValidationError(
                    {"end_time": "End time must be after start time."}
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.class_obj.name} — {self.get_day_of_week_display()} {self.start_time}"


class ClassSessionEnrollment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_obj = models.ForeignKey(
        "Class",
        on_delete=models.CASCADE,
        related_name="session_links",
    )
    session = models.ForeignKey(
        "records.ClassSession",
        on_delete=models.CASCADE,
        related_name="class_links",
    )
    session_num = models.IntegerField(
        help_text="Sequential session number within this class."
    )

    class Meta:
        db_table = "class_session_enrollments"
        verbose_name = "Class Session Enrollment"
        verbose_name_plural = "Class Session Enrollments"
        constraints = [
            models.UniqueConstraint(
                fields=["session", "class_obj"],
                name="unique_session_per_class",
            ),
            models.UniqueConstraint(
                fields=["class_obj", "session_num"],
                name="unique_session_num_per_class",
            ),
        ]

    def clean(self):
        if self.session_num is not None and self.session_num < 1:
            raise ValidationError(
                {"session_num": "Session number must be greater than 0."}
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.class_obj.name} — Session #{self.session_num}"


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

    def clean(self):
        if self.assigned_at and self.assigned_class_id:
            cls = self.assigned_class
            if self.assigned_at < cls.start_date:
                raise ValidationError(
                    {"assigned_at": "Assigned date cannot be before class start date."}
                )
            if self.assigned_at > cls.end_date:
                raise ValidationError(
                    {"assigned_at": "Assigned date cannot be after class end date."}
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.teacher} - {self.assigned_class.name}"
