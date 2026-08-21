from django.contrib.auth import get_user_model
from django.db.models import Count, Q

from langchain_core.tools import tool

from hemronepal.models import (
    ProblemCategory,
    ProblemReport,
    ProblemVote,
    OrganizationProblemReport,
)


User = get_user_model()


# ============================================================
# ORGANIZATIONS
# ============================================================

def get_organizations():
    """
    Return all registered organizations.
    """

    organizations = User.objects.filter(
        role__iexact="organizer"
    ).order_by("username")

    results = []

    for organization in organizations:

        full_name = ""

        if hasattr(
            organization,
            "get_full_name"
        ):
            full_name = (
                organization.get_full_name()
                or ""
            )

        results.append({
            "id": organization.id,

            "username": organization.username,

            "name": (
                full_name
                or organization.username
            ),

            "email": getattr(
                organization,
                "email",
                ""
            ),
        })

    return {
        "count": len(results),
        "organizations": results,
    }


# ============================================================
# PROBLEM CATEGORIES
# ============================================================

def get_problem_categories():
    """
    Return all problem categories available
    in the system.
    """

    categories = (
        ProblemCategory.objects
        .all()
        .order_by("name")
    )

    results = []

    for category in categories:

        problem_count = (
            ProblemReport.objects
            .filter(
                category=category
            )
            .count()
        )

        results.append({
            "id": category.id,

            "name": category.name,

            "description": (
                category.description
                or ""
            ),

            "problem_count": problem_count,
        })

    return {
        "count": len(results),
        "categories": results,
    }


# ============================================================
# PROBLEMS BY CATEGORY
# ============================================================

def get_problems_by_category(
    category_name
):
    """
    Find reported problems belonging to a
    particular category.

    Example:

        flood
        road
        waste
        water
        landslide
    """

    category = (
        ProblemCategory.objects
        .filter(
            name__icontains=category_name
        )
        .first()
    )

    if not category:

        return {
            "found": False,

            "message": (
                f"No problem category "
                f"matching '{category_name}' "
                f"was found."
            ),

            "problems": [],
        }

    problems = (
        ProblemReport.objects
        .filter(
            category=category
        )
        .select_related(
            "category"
        )
        .order_by(
            "-created_at"
        )
    )

    results = []

    for problem in problems:

        results.append({

            "id": problem.id,

            "title": problem.title,

            "category": (
                problem.category.name
            ),

            "severity": problem.severity,

            "status": problem.status,

            "description": (
                problem.description
            ),

            "location": problem.location,

            "latitude": (
                str(problem.latitude)
                if problem.latitude is not None
                else None
            ),

            "longitude": (
                str(problem.longitude)
                if problem.longitude is not None
                else None
            ),

            "created_at": (
                problem.created_at.isoformat()
            ),
        })

    return {

        "found": True,

        "category": category.name,

        "count": len(results),

        "problems": results,
    }


# ============================================================
# PROBLEM DETAILS
# ============================================================

def get_problem_details(
    problem_id
):
    """
    Return information about one problem.
    """

    try:

        problem = (
            ProblemReport.objects
            .select_related(
                "category"
            )
            .get(
                id=problem_id
            )
        )

    except ProblemReport.DoesNotExist:

        return {
            "found": False,

            "message": (
                "Problem report not found."
            ),
        }

    assignments = (
        OrganizationProblemReport.objects
        .filter(
            problem=problem
        )
        .select_related(
            "organization"
        )
    )

    organization_data = []

    for assignment in assignments:

        organization_data.append({

            "organization_id": (
                assignment.organization.id
            ),

            "organization": (
                assignment.organization.username
            ),

            "status": assignment.status,

            "accepted_at": (
                assignment.accepted_at.isoformat()
            ),

            "deadline": (
                assignment.deadline.isoformat()
            ),

            "completed_at": (
                assignment.completed_at.isoformat()
                if assignment.completed_at
                else None
            ),
        })

    return {

        "found": True,

        "problem": {

            "id": problem.id,

            "title": problem.title,

            "category": (
                problem.category.name
            ),

            "severity": problem.severity,

            "status": problem.status,

            "description": (
                problem.description
            ),

            "location": problem.location,

            "latitude": (
                str(problem.latitude)
                if problem.latitude is not None
                else None
            ),

            "longitude": (
                str(problem.longitude)
                if problem.longitude is not None
                else None
            ),

            "created_at": (
                problem.created_at.isoformat()
            ),

            "updated_at": (
                problem.updated_at.isoformat()
            ),

            "resolved_at": (
                problem.resolved_at.isoformat()
                if problem.resolved_at
                else None
            ),

            "votes": (
                problem.votes.count()
            ),

            "organizations": organization_data,
        },
    }


# ============================================================
# CURRENT USER'S PROBLEMS
# ============================================================

def get_my_problems(
    user_id
):
    """
    Return problem reports belonging to
    the currently authenticated user.
    """

    problems = (
        ProblemReport.objects
        .filter(
            reported_by_id=user_id
        )
        .select_related(
            "category"
        )
        .order_by(
            "-created_at"
        )
    )

    results = []

    for problem in problems:

        results.append({

            "id": problem.id,

            "title": problem.title,

            "category": (
                problem.category.name
            ),

            "severity": problem.severity,

            "status": problem.status,

            "description": (
                problem.description
            ),

            "location": problem.location,

            "created_at": (
                problem.created_at.isoformat()
            ),
        })

    return {

        "authenticated": True,

        "count": len(results),

        "problems": results,
    }


# ============================================================
# CURRENT USER SUMMARY
# ============================================================

def get_my_problem_summary(
    user_id
):
    """
    Return a summary of the authenticated
    user's reports.
    """

    queryset = (
        ProblemReport.objects
        .filter(
            reported_by_id=user_id
        )
    )

    return {

        "authenticated": True,

        "total": queryset.count(),

        "pending": queryset.filter(
            status="pending"
        ).count(),

        "in_progress": queryset.filter(
            status="in_progress"
        ).count(),

        "resolved": queryset.filter(
            status="resolved"
        ).count(),

        "rejected": queryset.filter(
            status="rejected"
        ).count(),
    }


# ============================================================
# ORGANIZATION ASSIGNMENTS
# ============================================================

def get_organization_problems(
    user_id
):
    """
    Return problems assigned to the
    currently authenticated organization.
    """

    assignments = (
        OrganizationProblemReport.objects
        .filter(
            organization_id=user_id
        )
        .select_related(
            "problem",
            "problem__category",
        )
        .order_by(
            "-accepted_at"
        )
    )

    results = []

    for assignment in assignments:

        problem = assignment.problem

        results.append({

            "assignment_id": (
                assignment.id
            ),

            "problem_id": (
                problem.id
            ),

            "title": (
                problem.title
            ),

            "category": (
                problem.category.name
            ),

            "severity": (
                problem.severity
            ),

            "problem_status": (
                problem.status
            ),

            "organization_status": (
                assignment.status
            ),

            "location": (
                problem.location
            ),

            "deadline": (
                assignment.deadline.isoformat()
            ),

            "accepted_at": (
                assignment.accepted_at.isoformat()
            ),

            "completed_at": (
                assignment.completed_at.isoformat()
                if assignment.completed_at
                else None
            ),
        })

    return {

        "count": len(results),

        "problems": results,
    }


# ============================================================
# ORGANIZATION DETAILS
# ============================================================

def get_organization_details(
    organization_id
):
    """
    Return information about one organization.
    """

    try:

        organization = (
            User.objects
            .get(
                id=organization_id,
                role__iexact="organizer",
            )
        )

    except User.DoesNotExist:

        return {

            "found": False,

            "message": (
                "Organization not found."
            ),
        }

    assignments = (
        OrganizationProblemReport.objects
        .filter(
            organization=organization
        )
    )

    full_name = ""

    if hasattr(
        organization,
        "get_full_name"
    ):
        full_name = (
            organization.get_full_name()
            or ""
        )

    return {

        "found": True,

        "organization": {

            "id": organization.id,

            "username": (
                organization.username
            ),

            "name": (
                full_name
                or organization.username
            ),

            "email": getattr(
                organization,
                "email",
                ""
            ),

            "total_assigned": (
                assignments.count()
            ),

            "accepted": assignments.filter(
                status="accepted"
            ).count(),

            "in_progress": assignments.filter(
                status="in_progress"
            ).count(),

            "completed": assignments.filter(
                status="completed"
            ).count(),

            "overdue": assignments.filter(
                status="overdue"
            ).count(),
        },
    }


# ============================================================
# PROBLEM STATISTICS
# ============================================================

def get_problem_statistics_by_category():
    """
    Return problem statistics grouped by category.
    """

    categories = (
        ProblemCategory.objects
        .annotate(

            total=Count(
                "problem_reports"
            ),

            pending=Count(
                "problem_reports",
                filter=Q(
                    problem_reports__status="pending"
                ),
            ),

            in_progress=Count(
                "problem_reports",
                filter=Q(
                    problem_reports__status="in_progress"
                ),
            ),

            resolved=Count(
                "problem_reports",
                filter=Q(
                    problem_reports__status="resolved"
                ),
            ),

            rejected=Count(
                "problem_reports",
                filter=Q(
                    problem_reports__status="rejected"
                ),
            ),
        )
        .order_by(
            "-total"
        )
    )

    return {

        "count": categories.count(),

        "categories": [

            {

                "id": category.id,

                "name": category.name,

                "description": (
                    category.description
                    or ""
                ),

                "total": category.total,

                "pending": category.pending,

                "in_progress": category.in_progress,

                "resolved": category.resolved,

                "rejected": category.rejected,
            }

            for category in categories
        ],
    }


# ============================================================
# LANGCHAIN TOOLS
# ============================================================

def create_tools(user):
    """
    Create tools for the current authenticated user.

    Public tools:
        - list organizations
        - list categories
        - search problems
        - problem details
        - statistics

    Private tools:
        - my reports
        - my summary
        - organization assignments
    """

    # --------------------------------------------------------
    # CURRENT USER
    # --------------------------------------------------------

    if (
        user
        and user.is_authenticated
    ):

        user_id = user.id

        user_role = getattr(
            user,
            "role",
            "user"
        )

    else:

        user_id = None
        user_role = "guest"

    # ========================================================
    # LIST ORGANIZATIONS
    # ========================================================

    @tool
    def list_organizations():
        """
        List all registered organizations.

        Use when the user asks about:
        organizations,
        government organizations,
        registered organizations,
        available organizations,
        or who can handle problems.
        """

        return get_organizations()

    # ========================================================
    # LIST CATEGORIES
    # ========================================================

    @tool
    def list_problem_categories():
        """
        List all problem categories in the system.

        Use when the user asks what kinds of problems
        can be reported.
        """

        return get_problem_categories()

    # ========================================================
    # SEARCH CATEGORY
    # ========================================================

    @tool
    def find_problems_by_category(
        category_name: str
    ):
        """
        Find reported problems belonging to a category.

        Examples:
            flood
            road
            water
            waste
            landslide
            electricity
        """

        return get_problems_by_category(
            category_name
        )

    # ========================================================
    # PROBLEM DETAILS
    # ========================================================

    @tool
    def problem_details(
        problem_id: int
    ):
        """
        Get details about a specific problem report.
        """

        return get_problem_details(
            problem_id
        )

    # ========================================================
    # MY REPORTS
    # ========================================================

    @tool
    def my_problem_reports():
        """
        Get the current authenticated user's
        problem reports.

        Never ask the user for their user ID.
        """

        if not user_id:

            return {

                "authenticated": False,

                "message": (
                    "You must be logged in "
                    "to view your reports."
                ),
            }

        return get_my_problems(
            user_id
        )

    # ========================================================
    # MY SUMMARY
    # ========================================================

    @tool
    def my_problem_summary():
        """
        Get a summary of the current user's
        problem reports.
        """

        if not user_id:

            return {

                "authenticated": False,

                "message": (
                    "You must be logged in "
                    "to view your summary."
                ),
            }

        return get_my_problem_summary(
            user_id
        )

    # ========================================================
    # ORGANIZATION ASSIGNMENTS
    # ========================================================

    @tool
    def my_organization_assignments():
        """
        Get problems assigned to the current
        organization.

        Only organization users should use this.
        """

        if not user_id:

            return {

                "authenticated": False,

                "message": (
                    "You must be logged in "
                    "to use organization features."
                ),
            }

        if str(user_role).lower() != "organizer":

            return {

                "authorized": False,

                "message": (
                    "This feature is only "
                    "available to organizations."
                ),
            }

        return get_organization_problems(
            user_id
        )

    # ========================================================
    # STATISTICS
    # ========================================================

    @tool
    def problem_statistics():
        """
        Get statistics about reported problems
        grouped by category.
        """

        return get_problem_statistics_by_category()

    # ========================================================
    # RETURN TOOLS
    # ========================================================

    return [

        list_organizations,

        list_problem_categories,

        find_problems_by_category,

        problem_details,

        my_problem_reports,

        my_problem_summary,

        my_organization_assignments,

        problem_statistics,

    ]