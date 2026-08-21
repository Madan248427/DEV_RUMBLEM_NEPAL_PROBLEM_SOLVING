from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from .models import (
    ProblemCategory,
    ProblemReport,
    ProblemVote,
    Notice,
    OrganizationProblemReport,
    ProblemReport,
)

from .serializer import (
    ProblemCategorySerializer,
    ProblemReportSerializer,
    ProblemVoteSerializer,
    NoticeSerializer,
    OrganizationProblemReportSerializer,
)

from accounts.permission import (
    IsUser,
    IsEmployee,
    IsAdminOrEmployee,
    ReadOnly,
)


# =========================================================
# PROBLEM CATEGORY VIEWS
# =========================================================

class ProblemCategoryListView(generics.ListAPIView):
    """
    GET /api/problem/categories/

    Returns all problem categories.
    Authentication required.
    """

    queryset = ProblemCategory.objects.all()
    serializer_class = ProblemCategorySerializer
    permission_classes = [IsAuthenticated]


class ProblemCategoryDetailView(generics.RetrieveAPIView):
    """
    GET /api/problem/categories/<id>/

    Returns a single problem category.
    Authentication required.
    """

    queryset = ProblemCategory.objects.all()
    serializer_class = ProblemCategorySerializer
    permission_classes = [IsAuthenticated]


# =========================================================
# ALL PROBLEM REPORTS
# =========================================================

class ProblemReportListCreateView(generics.ListCreateAPIView):
    """
    GET:
        /api/problem/reports/

        Returns ALL problem reports.

    POST:
        /api/problem/reports/

        Creates a new problem report.

    Authentication required.
    """

    serializer_class = ProblemReportSerializer
    permission_classes = [IsAuthenticated]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def get_queryset(self):
        return ProblemReport.objects.select_related(
            "category",
            "reported_by"
        ).all().order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(
            reported_by=self.request.user
        )


# =========================================================
# MY PROBLEM REPORTS
# =========================================================

class MyProblemReportListView(generics.ListAPIView):
    """
    GET:
        /api/problem/reports/my/

    Returns only reports created by the
    currently authenticated user.
    """

    serializer_class = ProblemReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ProblemReport.objects.select_related(
            "category",
            "reported_by"
        ).filter(
            reported_by=self.request.user
        ).order_by("-created_at")


# =========================================================
# PROBLEM REPORT DETAIL
# =========================================================

class ProblemReportDetailView(generics.RetrieveUpdateAPIView):
    """
    GET:
        /api/problem/reports/<id>/

        Get one problem report.

    PUT/PATCH:
        /api/problem/reports/<id>/

        Update a problem report.

    Authentication required.
    """

    serializer_class = ProblemReportSerializer
    permission_classes = [IsAuthenticated]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def get_queryset(self):
        return ProblemReport.objects.select_related(
            "category",
            "reported_by"
        ).all()


# =========================================================
# PROBLEM VOTE
# =========================================================

class ProblemVoteView(APIView):
    """
    GET:
        /api/problem/reports/<problem_id>/vote/

        Returns vote information for the problem.

    POST:
        /api/problem/reports/<problem_id>/vote/

        First request:
            Adds vote.

        Second request:
            Removes vote.

    Authentication required.
    """

    permission_classes = [IsAuthenticated]

    # =====================================================
    # GET VOTE INFORMATION
    # =====================================================

    def get(self, request, problem_id):

        try:
            problem = ProblemReport.objects.get(
                id=problem_id
            )

        except ProblemReport.DoesNotExist:
            return Response(
                {
                    "detail": "Problem not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Check whether current user has voted
        user_vote = ProblemVote.objects.filter(
            problem=problem,
            user=request.user
        ).first()

        return Response(
            {
                "problem": problem.id,
                "vote_count": problem.votes.count(),
                "voted": user_vote is not None,
                "vote": (
                    ProblemVoteSerializer(user_vote).data
                    if user_vote
                    else None
                )
            },
            status=status.HTTP_200_OK
        )

    # =====================================================
    # POST - ADD / REMOVE VOTE
    # =====================================================

    def post(self, request, problem_id):

        try:
            problem = ProblemReport.objects.get(
                id=problem_id
            )

        except ProblemReport.DoesNotExist:
            return Response(
                {
                    "detail": "Problem not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        vote, created = ProblemVote.objects.get_or_create(
            problem=problem,
            user=request.user
        )

        # =================================================
        # ADD VOTE
        # =================================================

        if created:
            return Response(
                {
                    "message": "Vote added.",
                    "voted": True,
                    "vote_count": problem.votes.count(),
                    "vote": ProblemVoteSerializer(
                        vote
                    ).data
                },
                status=status.HTTP_201_CREATED
            )

        # =================================================
        # REMOVE VOTE
        # =================================================

        vote.delete()

        return Response(
            {
                "message": "Vote removed.",
                "voted": False,
                "vote_count": problem.votes.count(),
                "vote": None
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# NOTICE VIEWS
# =========================================================

class NoticeView(APIView):
    """
    GET:
        /api/notices/

        Any authenticated user can view notices.

    POST:
        /api/notices/

        Only admin/employee can create notices.
    """

    def get_permissions(self):

        if self.request.method == "GET":
            return [IsAuthenticated()]

        if self.request.method == "POST":
            return [IsAdminOrEmployee()]

        return [IsAuthenticated()]

    # =====================================================
    # GET NOTICES
    # =====================================================

    def get(self, request):

        notices = Notice.objects.select_related(
            "created_by"
        ).all().order_by("-created_at")

        serializer = NoticeSerializer(
            notices,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # =====================================================
    # CREATE NOTICE
    # =====================================================

    def post(self, request):

        serializer = NoticeSerializer(
            data=request.data
        )

        if serializer.is_valid():

            notice = serializer.save(
                created_by=request.user
            )

            return Response(
                NoticeSerializer(notice).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    



# =========================================================
# 1. MY ORGANIZATION REPORTS
# =========================================================

class MyOrganizationProblemReportView(generics.ListAPIView):
    """
    GET:
        /api/organization/my-problem-reports/

    Organization sees only the reports accepted by itself.

    Optional status filter:

        ?status=accepted
        ?status=in_progress
        ?status=completed
        ?status=overdue
    """

    serializer_class = OrganizationProblemReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        queryset = OrganizationProblemReport.objects.select_related(
            "organization",
            "problem",
        ).filter(
            organization=self.request.user
        ).order_by("-accepted_at")

        # Get status from query parameter
        status_filter = self.request.query_params.get("status")

        if status_filter:
            valid_statuses = [
                choice[0]
                for choice in OrganizationProblemReport.STATUS_CHOICES
            ]

            if status_filter not in valid_statuses:
                raise ValidationError({
                    "status": (
                        f"Invalid status. Choose from: "
                        f"{', '.join(valid_statuses)}"
                    )
                })

            queryset = queryset.filter(
                status=status_filter
            )

        return queryset


# =========================================================
# 2. ALL ORGANIZATION REPORTS
# =========================================================

class AllOrganizationProblemReportView(generics.ListAPIView):
    """
    GET:
        /api/organization/all-problem-reports/

    Admin/Employee can see all reports accepted
    by all organizations.
    """

    serializer_class = OrganizationProblemReportSerializer
    permission_classes = [IsAdminOrEmployee]

    def get_queryset(self):

        queryset = OrganizationProblemReport.objects.select_related(
            "organization",
            "problem",
        ).all().order_by("-accepted_at")

        # Optional status filter
        status_filter = self.request.query_params.get("status")

        if status_filter:
            valid_statuses = [
                choice[0]
                for choice in OrganizationProblemReport.STATUS_CHOICES
            ]

            if status_filter not in valid_statuses:
                raise ValidationError({
                    "status": (
                        f"Invalid status. Choose from: "
                        f"{', '.join(valid_statuses)}"
                    )
                })

            queryset = queryset.filter(
                status=status_filter
            )

        return queryset


# =========================================================
# 3. ORGANIZATION ACCEPT REPORT
# =========================================================

class OrganizationProblemReportView(
    generics.ListCreateAPIView
):
    """
    POST:
        /api/organization/problem-reports/

    Organization accepts a problem report.

    GET:
        This endpoint can also return the organization's
        own accepted reports.
    """

    serializer_class = OrganizationProblemReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return OrganizationProblemReport.objects.select_related(
            "organization",
            "problem",
        ).filter(
            organization=self.request.user
        ).order_by("-accepted_at")

    def perform_create(self, serializer):

        problem_id = self.request.data.get("problem")

        if not problem_id:
            raise ValidationError({
                "problem": "Problem report ID is required."
            })

        try:
            problem = ProblemReport.objects.get(
                id=problem_id
            )

        except ProblemReport.DoesNotExist:
            raise ValidationError({
                "problem": "Problem report not found."
            })

        # Only pending reports can be accepted
        if problem.status != "pending":
            raise ValidationError({
                "problem": (
                    "This problem has already been "
                    "accepted or processed."
                )
            })

        # Check if already accepted
        if OrganizationProblemReport.objects.filter(
            problem=problem
        ).exists():

            raise ValidationError({
                "problem": (
                    "This problem has already been "
                    "accepted by an organization."
                )
            })

        # Create assignment
        serializer.save(
            organization=self.request.user,
            problem=problem,
            status="accepted"
        )

        # Change problem status
        problem.status = "in_progress"

        problem.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )    