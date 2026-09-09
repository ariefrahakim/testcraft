# Enrollment Scenarios

Feature coverage for course discovery, enrollment, payment gate, access control, and unenrollment.

---

Feature: Enrollment

  Background:
    Given the TestCraft LMS is running
    And at least one published course exists

  # ─────────────────────────────────────────
  # COURSE DISCOVERY
  # ─────────────────────────────────────────

  @critical
  Scenario: Student browses the course catalog
    Given I am logged in as a student
    When I navigate to "/courses"
    Then I should see a list of published courses
    And each course card should show the title, instructor name, price, and thumbnail
    And draft or unpublished courses should not appear in the list

  @major
  Scenario: Student searches for a course by keyword
    Given I am on the course catalog page
    When I type "JavaScript" in the search field
    Then the results should only show courses matching "JavaScript"
    And courses with "JavaScript" in the description should also appear

  # ─────────────────────────────────────────
  # FREE COURSE ENROLLMENT
  # ─────────────────────────────────────────

  @blocker
  Scenario: Student enrolls in a free course
    Given a free course "Intro to Testing" exists
    And I am logged in as a student not yet enrolled
    When I navigate to the course page
    And I click "Enroll for Free"
    Then I should be enrolled immediately
    And I should see "You're enrolled!" confirmation
    And I should be redirected to the course player
    And the enrollment should appear in my "My Learning" list

  @critical
  Scenario: Student cannot enroll in the same free course twice
    Given I am already enrolled in "Intro to Testing"
    When I navigate to the course page
    Then the "Enroll for Free" button should not appear
    And I should see a "Continue Learning" button instead

  # ─────────────────────────────────────────
  # PAID COURSE ENROLLMENT
  # ─────────────────────────────────────────

  @blocker
  Scenario: Student enrolls in a paid course with valid payment
    Given a paid course "Advanced QA" exists with price Rp 299.000
    And I am logged in as a student
    When I navigate to the course page and click "Buy Now"
    And I complete the checkout with valid payment details
    Then a payment record should be created with status "PAID"
    And I should be enrolled in the course
    And I should receive a payment confirmation email
    And I should be able to access all course content

  @critical
  Scenario: Student cannot access paid course content without enrolling
    Given a paid course exists
    And I am logged in as a student not enrolled
    When I try to navigate directly to a lesson URL in that course
    Then I should be redirected to the course sales page
    And I should see a "Buy This Course" prompt
    And the lesson content should not be rendered

  @critical
  Scenario: Unauthenticated visitor cannot enroll
    Given I am not logged in
    When I click "Enroll" or "Buy Now" on any course
    Then I should be redirected to the login page
    And after login I should be redirected back to the course page

  @major
  Scenario: Enrollment with an expired coupon shows error and does not process payment
    Given a paid course exists
    And a coupon "SAVE50" with an expiry date in the past exists
    When I apply coupon "SAVE50" at checkout
    Then I should see "This coupon has expired"
    And the discount should not be applied
    And no payment should be initiated

  @major
  Scenario: Enrollment with a valid coupon applies the discount
    Given a paid course "Advanced QA" costs Rp 299.000
    And a valid coupon "EARLY20" gives 20% off
    When I apply "EARLY20" at checkout
    Then the total should update to Rp 239.200
    And after payment, the enrollment record should show the coupon applied
    And the payment amount should reflect the discounted price

  # ─────────────────────────────────────────
  # ACCESS CONTROL
  # ─────────────────────────────────────────

  @security
  Scenario: INSTRUCTOR cannot enroll in their own course as a student
    Given I am logged in as an instructor who owns "Advanced QA"
    When I navigate to the course enrollment page
    Then the enrollment option should not be available
    And I should see "You own this course" message

  @security
  Scenario: Enrollment API cannot be bypassed without payment for a paid course
    Given a paid course exists with ID 42
    When I make a direct POST request to "/api/v1/enrollments" with courseId 42
    And I am not enrolled or have not paid
    Then the API should return 402 Payment Required or 403 Forbidden
    And no enrollment record should be created
