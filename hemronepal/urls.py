from django.urls import path

from .views import (
    ProblemCategoryListView,
    ProblemCategoryDetailView,

    ProblemReportListCreateView,
    MyProblemReportListView,
    ProblemReportDetailView,

    ProblemVoteView,

    NoticeView,
    OrganizationProblemReportView,
    MyOrganizationProblemReportView,
    AllOrganizationProblemReportView,
)


urlpatterns = [

    # =====================================================
    # PROBLEM CATEGORIES
    # =====================================================

    path(
        "problem/categories/",
        ProblemCategoryListView.as_view(),
        name="problem-category-list",
    ),

    path(
        "problem/categories/<int:pk>/",
        ProblemCategoryDetailView.as_view(),
        name="problem-category-detail",
    ),


    # =====================================================
    # ALL PROBLEM REPORTS
    # =====================================================

    path(
        "problem/reports/",
        ProblemReportListCreateView.as_view(),
        name="problem-report-list-create",
    ),


    # =====================================================
    # MY PROBLEM REPORTS
    # =====================================================

    path(
        "problem/reports/my/",
        MyProblemReportListView.as_view(),
        name="my-problem-reports",
    ),


    # =====================================================
    # SINGLE PROBLEM REPORT
    # =====================================================

    path(
        "problem/reports/<int:pk>/",
        ProblemReportDetailView.as_view(),
        name="problem-report-detail",
    ),


    # =====================================================
    # PROBLEM VOTE
    # =====================================================

    path(
        "problem/reports/<int:problem_id>/vote/",
        ProblemVoteView.as_view(),
        name="problem-vote",
    ),


    # =====================================================
    # NOTICES
    # =====================================================

    path(
        "notices/",
        NoticeView.as_view(),
        name="notice-list-create",
    ),
        path(
        "organization/problem-reports/",
        OrganizationProblemReportView.as_view(),
        name="organization-problem-reports",
    ),

    # =====================================================
    # MY ORGANIZATION REPORTS
    # =====================================================

    path(
        "organization/my-problem-reports/",
        MyOrganizationProblemReportView.as_view(),
        name="my-organization-problem-reports",
    ),

    # =====================================================
    # ALL ORGANIZATION REPORTS
    # =====================================================

    path(
        "organization/all-problem-reports/",
        AllOrganizationProblemReportView.as_view(),
        name="all-organization-problem-reports",
    ),
]