from django.db import models
from django.conf import settings


class ProblemCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Problem Category"
        verbose_name_plural = "Problem Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class ProblemReport(models.Model):

    SEVERITY_CHOICES = (
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    )

    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("resolved", "Resolved"),
        ("rejected", "Rejected"),
    )

    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="problem_reports"
    )

    title = models.CharField(max_length=255)

    category = models.ForeignKey(
        ProblemCategory,
        on_delete=models.PROTECT,
        related_name="problem_reports"
    )

    severity = models.CharField(
        max_length=10,
        choices=SEVERITY_CHOICES,
        default="medium"
    )

    description = models.TextField()

    location = models.CharField(max_length=500)

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )

    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )

    image = models.ImageField(
        upload_to="problem_reports/%Y/%m/%d/",
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    resolved_at = models.DateTimeField(
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.title} - {self.category.name}"


class ProblemVote(models.Model):

    problem = models.ForeignKey(
        ProblemReport,
        on_delete=models.CASCADE,
        related_name="votes"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="problem_votes"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["problem", "user"],
                name="unique_problem_vote"
            )
        ]

    def __str__(self):
        return f"{self.user} voted for {self.problem}"


class Notice(models.Model):

    title = models.CharField(max_length=255)

    description = models.TextField()

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_notices"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
    




from django.db import models
from django.conf import settings
from django.utils import timezone


class OrganizationProblemReport(models.Model):

    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("overdue", "Overdue"),
        ("rejected", "Rejected"),
    )

    organization = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organization_problem_reports",
        limit_choices_to={"Role": "organizer"},
    )

    problem = models.ForeignKey(
        "ProblemReport",
        on_delete=models.CASCADE,
        related_name="organization_assignments",
    )

    # Empty until organization accepts
    accepted_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    # Empty until organization accepts
    deadline = models.DateTimeField(
        null=True,
        blank=True,
    )

    # Empty until problem is completed
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.organization.username} - "
            f"{self.problem.title}"
        )

    def accept(self):
        """
        Organization accepts the assigned problem.
        """

        self.status = "accepted"
        self.accepted_at = timezone.now()

        self.save(
            update_fields=[
                "status",
                "accepted_at",
                "updated_at",
            ]
        )