from django.contrib import admin
from .models import (
    ProblemCategory,
    ProblemReport,
    ProblemVote,
    Notice,
    OrganizationProblemReport,
)


# =========================================================
# PROBLEM CATEGORY
# =========================================================

@admin.register(ProblemCategory)
class ProblemCategoryAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "created_at",
        "updated_at",
    )

    search_fields = (
        "name",
        "description",
    )

    ordering = ("name",)


# =========================================================
# PROBLEM REPORT
# =========================================================

@admin.register(ProblemReport)
class ProblemReportAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "category",
        "severity",
        "status",
        "reported_by",
        "vote_count",
        "created_at",
        "resolved_at",
    )

    list_filter = (
        "category",
        "severity",
        "status",
        "created_at",
    )

    search_fields = (
        "title",
        "description",
        "location",
        "reported_by__username",
        "reported_by__email",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
        "resolved_at",
        "vote_count",
    )

    autocomplete_fields = (
        "reported_by",
        "category",
    )

    ordering = ("-created_at",)

    def vote_count(self, obj):
        return obj.votes.count()

    vote_count.short_description = "Votes"


# =========================================================
# PROBLEM VOTE
# =========================================================

@admin.register(ProblemVote)
class ProblemVoteAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "problem",
        "user",
        "created_at",
    )

    list_filter = (
        "created_at",
    )

    search_fields = (
        "problem__title",
        "user__username",
        "user__email",
    )

    readonly_fields = (
        "created_at",
    )

    autocomplete_fields = (
        "problem",
        "user",
    )

    ordering = ("-created_at",)


# =========================================================
# NOTICE
# =========================================================


@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):

    list_display = (
        "title",
        "created_by",
        "created_at",
        "updated_at",
    )

    readonly_fields = (
        "created_by",
        "created_at",
        "updated_at",
    )

    def save_model(self, request, obj, form, change):
        if not obj.created_by:
            obj.created_by = request.user

        super().save_model(
            request,
            obj,
            form,
            change,
        )

@admin.register(OrganizationProblemReport)
class OrganizationProblemReportAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "organization",
        "problem",
        "status",
        "accepted_at",
        "deadline",
        "completed_at",
        "created_at",
        "updated_at",
    )

    list_filter = (
        "status",
        "created_at",
        "accepted_at",
        "completed_at",
    )

    search_fields = (
        "organization__username",
        "organization__email",
        "problem__title",
        "problem__description",
    )

    readonly_fields = (
        "accepted_at",
        "completed_at",
        "created_at",
        "updated_at",
    )

    autocomplete_fields = (
        "organization",
        "problem",
    )

    ordering = (
        "-created_at",
    )

    fieldsets = (
        (
            "Assignment",
            {
                "fields": (
                    "organization",
                    "problem",
                    "status",
                )
            },
        ),
        (
            "Acceptance",
            {
                "fields": (
                    "accepted_at",
                    "deadline",
                )
            },
        ),
        (
            "Completion",
            {
                "fields": (
                    "completed_at",
                )
            },
        ),
        (
            "Timestamps",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )        