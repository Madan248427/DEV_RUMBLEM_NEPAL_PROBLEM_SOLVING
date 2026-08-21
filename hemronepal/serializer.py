from rest_framework import serializers
from .models import ProblemCategory, ProblemReport,Notice,OrganizationProblemReport


class ProblemCategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = ProblemCategory
        fields = [
            "id",
            "name",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]



class ProblemReportSerializer(serializers.ModelSerializer):

    reported_by = serializers.SerializerMethodField()

    category_name = serializers.CharField(
        source="category.name",
        read_only=True
    )

    total_votes = serializers.SerializerMethodField()

    class Meta:
        model = ProblemReport

        fields = [
            "id",
            "reported_by",
            "title",
            "category",
            "category_name",
            "severity",
            "description",
            "location",
            "latitude",
            "longitude",
            "image",
            "status",
            "total_votes",
            "created_at",
            "updated_at",
            "resolved_at",
        ]

        read_only_fields = [
            "id",
            "reported_by",
            "category_name",
            "total_votes",
            "status",
            "created_at",
            "updated_at",
            "resolved_at",
        ]

    def get_reported_by(self, obj):
        return {
            "id": obj.reported_by.id,
            "username": obj.reported_by.username,
            "email": obj.reported_by.email,
        }

    def get_total_votes(self, obj):
        return obj.votes.count()
    
from rest_framework import serializers
from .models import ProblemVote


class ProblemVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProblemVote
        fields = ["id", "problem", "user", "created_at"]
        read_only_fields = ["id", "user", "created_at"]    

class NoticeSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Notice
        fields = [
            "id",
            "title",
            "description",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "created_at",
            "updated_at",
        ]        




class OrganizationProblemReportSerializer(
    serializers.ModelSerializer
):

    # Organization information
    organization_name = serializers.CharField(
        source="organization.username",
        read_only=True
    )

    organization_full_name = serializers.SerializerMethodField(
        read_only=True
    )

    # Problem information
    problem_title = serializers.CharField(
        source="problem.title",
        read_only=True
    )

    problem_category = serializers.CharField(
        source="problem.category.name",
        read_only=True
    )

    problem_severity = serializers.CharField(
        source="problem.severity",
        read_only=True
    )

    problem_status = serializers.CharField(
        source="problem.status",
        read_only=True
    )

    problem_location = serializers.CharField(
        source="problem.location",
        read_only=True
    )

    class Meta:
        model = OrganizationProblemReport

        fields = [
            "id",

            # Organization
            "organization",
            "organization_name",
            "organization_full_name",

            # Problem
            "problem",
            "problem_title",
            "problem_category",
            "problem_severity",
            "problem_status",
            "problem_location",

            # Assignment
            "status",
            "deadline",
            "accepted_at",
            "completed_at",

            # Timestamps
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "organization_name",
            "organization_full_name",

            "problem_title",
            "problem_category",
            "problem_severity",
            "problem_status",
            "problem_location",

            "accepted_at",
            "completed_at",

            "created_at",
            "updated_at",
        ]

    def get_organization_full_name(self, obj):

        user = obj.organization

        full_name = user.get_full_name()

        return full_name or user.username