# CMS Admin Scenarios

Feature coverage for content management: publishing blocks, managing courses, drag-and-drop curriculum building, and instructor/admin access control.

---

Feature: CMS — Content Management System

  Background:
    Given the TestCraft admin panel is accessible at http://localhost:3000/admin
    And I am logged in as an ADMIN or INSTRUCTOR with CMS access

  # ─────────────────────────────────────────
  # CONTENT BLOCK PUBLISHING
  # ─────────────────────────────────────────

  @critical
  Scenario: Admin publishes a hidden content block
    Given a content block "Welcome Banner" exists with status "DRAFT"
    When I navigate to the CMS and find the block "Welcome Banner"
    And I click "Publish"
    Then the block status should change to "PUBLISHED"
    And the block should be visible on the student-facing page immediately
    And the publish timestamp should be recorded

  @critical
  Scenario: Admin unpublishes a live content block
    Given a content block "Promo Banner" exists with status "PUBLISHED"
    When I click "Unpublish" on the block
    Then the block status should change to "DRAFT"
    And the block should no longer appear on the student-facing page
    And enrolled students should not see it on their next page load

  @major
  Scenario: Admin edits a published block and changes take effect immediately
    Given a content block "Course Introduction" is PUBLISHED
    When I edit the block title to "Updated Course Introduction"
    And I save the changes
    Then the updated title should appear on the student-facing page without republishing
    And the CMS should show the "last edited" timestamp

  # ─────────────────────────────────────────
  # COURSE MANAGEMENT
  # ─────────────────────────────────────────

  @blocker
  Scenario: Instructor creates a new course
    Given I am logged in as an INSTRUCTOR
    When I navigate to "/instructor/courses/new"
    And I fill in the course title "Cypress End-to-End Testing"
    And I fill in the description and set the price
    And I click "Create Course"
    Then the course should be created with status "DRAFT"
    And I should be redirected to the course editor
    And the course should appear in my instructor dashboard

  @critical
  Scenario: Instructor publishes a draft course to make it visible in the catalog
    Given I have a draft course "Cypress E2E Testing" with at least one lesson
    When I click "Publish Course" from the course editor
    Then the course status should change to "PUBLISHED"
    And the course should appear in the public course catalog at "/courses"
    And students should be able to enroll

  @major
  Scenario: Instructor cannot publish a course with no lessons
    Given I have a draft course with zero lessons
    When I try to click "Publish Course"
    Then I should see a warning "Add at least one lesson before publishing"
    And the course should remain in DRAFT status

  # ─────────────────────────────────────────
  # CURRICULUM BUILDER
  # ─────────────────────────────────────────

  @major
  Scenario: Instructor adds a new lesson to a course section
    Given I am in the course editor for "Cypress E2E Testing"
    And a section "Chapter 1: Getting Started" exists
    When I click "Add Lesson" within Chapter 1
    And I fill in the lesson title "Installing Cypress"
    And I save
    Then the lesson "Installing Cypress" should appear under "Chapter 1: Getting Started"
    And enrolled students should see the new lesson in the curriculum

  @major
  Scenario: Instructor reorders lessons by drag and drop
    Given a course section has lessons in order: ["Intro", "Setup", "First Test"]
    When I drag "Setup" above "Intro"
    Then the new order should be ["Setup", "Intro", "First Test"]
    And the position should be persisted after page refresh

  # ─────────────────────────────────────────
  # ACCESS CONTROL
  # ─────────────────────────────────────────

  @security
  Scenario: STUDENT cannot access the admin CMS panel
    Given I am logged in as a student
    When I navigate to "/admin/cms"
    Then I should be redirected to the student dashboard
    And I should see a "403 Forbidden" or access denied message

  @security
  Scenario: INSTRUCTOR can only edit their own courses
    Given I am logged in as Instructor A
    And a course "Python Basics" is owned by Instructor B
    When I try to navigate to "/instructor/courses/<python-basics-id>/edit"
    Then I should see a 403 Forbidden error
    And the course content should not be editable
