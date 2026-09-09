# Authentication Scenarios

Feature coverage for user registration, login, logout, password management, token security, and role-based access.

---

Feature: Authentication

  Background:
    Given the TestCraft LMS is running at http://localhost:3000
    And the API is running at http://localhost:4001/api/v1

  # ─────────────────────────────────────────
  # REGISTRATION
  # ─────────────────────────────────────────

  @critical
  Scenario: Student registers with valid data
    Given I am on the registration page "/register"
    When I fill in "name" with "Test Student"
    And I fill in "email" with a unique email address "student+<timestamp>@testcraft.id"
    And I fill in "password" with "SecurePass#123"
    And I click "Register"
    Then I should be redirected to the dashboard "/dashboard"
    And my account should be created with role "STUDENT"
    And I should receive a welcome email at the registered address

  @critical
  Scenario: Registration fails with already-registered email
    Given a student account exists with email "existing@testcraft.id"
    When I attempt to register with email "existing@testcraft.id"
    Then I should see an error message "Email already in use"
    And no duplicate account should be created in the database
    And the HTTP response should be 409

  @major
  Scenario: Registration fails when password is too weak
    Given I am on the registration page
    When I fill in "password" with "123"
    And I click "Register"
    Then I should see a validation error "Password must be at least 8 characters"
    And the form should not be submitted

  @major
  Scenario: Registration fails with invalid email format
    Given I am on the registration page
    When I fill in "email" with "not-an-email"
    And I click "Register"
    Then I should see a validation error "Please enter a valid email address"
    And no account should be created

  @major
  Scenario: Registration fails when required fields are empty
    Given I am on the registration page
    When I click "Register" without filling any fields
    Then I should see validation errors for "name", "email", and "password"
    And the form should highlight all required fields

  # ─────────────────────────────────────────
  # LOGIN
  # ─────────────────────────────────────────

  @blocker
  Scenario: Student logs in with valid credentials
    Given a student account exists with email "student@testcraft.id" and password "SecurePass#123"
    When I navigate to "/login"
    And I fill in "email" with "student@testcraft.id"
    And I fill in "password" with "SecurePass#123"
    And I click "Sign In"
    Then I should be redirected to the student dashboard
    And a valid JWT access token should be stored in the session
    And a refresh token cookie should be set with httpOnly flag

  @blocker
  Scenario: Login fails with wrong password
    Given a student account exists with email "student@testcraft.id"
    When I attempt to login with password "WrongPassword#999"
    Then I should see the error "Invalid email or password"
    And no session token should be issued
    And the HTTP response should be 401

  @critical
  Scenario: Login fails with non-existent email
    When I attempt to login with email "nobody@testcraft.id" and any password
    Then I should see the error "Invalid email or password"
    And the error should NOT reveal whether the email is registered
    And the HTTP response should be 401

  @major
  Scenario: Admin user logs in and sees admin panel
    Given an admin account exists with role "ADMIN"
    When the admin logs in successfully
    Then they should be redirected to the admin dashboard "/admin"
    And the navigation should show admin-only menu items

  # ─────────────────────────────────────────
  # LOGOUT
  # ─────────────────────────────────────────

  @critical
  Scenario: Logged-in student logs out
    Given I am logged in as a student
    When I click the logout button
    Then I should be redirected to the login page
    And the session token should be invalidated server-side
    And the refresh token cookie should be cleared
    And navigating to "/dashboard" should redirect me back to "/login"

  # ─────────────────────────────────────────
  # PASSWORD RESET
  # ─────────────────────────────────────────

  @critical
  Scenario: Student requests password reset with valid email
    Given a student account exists with email "student@testcraft.id"
    When I navigate to "/forgot-password"
    And I fill in "email" with "student@testcraft.id"
    And I click "Send Reset Link"
    Then I should see the message "Check your email for a reset link"
    And a password reset email should be sent to "student@testcraft.id"
    And the reset token should expire in 1 hour

  @major
  Scenario: Password reset request with unknown email shows no user enumeration
    When I request a password reset for "unknown@testcraft.id"
    Then I should see the same success message "Check your email for a reset link"
    And no error should reveal whether the email exists
    And no email should be sent

  @critical
  Scenario: Student resets password with valid token
    Given I have received a password reset link
    When I navigate to the reset link
    And I fill in "new password" with "NewSecure#456"
    And I confirm the new password
    And I click "Reset Password"
    Then I should see "Password updated successfully"
    And I should be able to log in with my new password "NewSecure#456"
    And the old password "SecurePass#123" should no longer work

  @major
  Scenario: Password reset fails with expired token
    Given I have a password reset token that is 2 hours old
    When I navigate to the reset link
    And I try to submit a new password
    Then I should see "This reset link has expired"
    And the HTTP response should be 400

  # ─────────────────────────────────────────
  # TOKEN SECURITY
  # ─────────────────────────────────────────

  @security
  Scenario: Accessing protected route without token returns 401
    When I make a GET request to "/api/v1/courses" without any Authorization header
    Then the API should respond with 401 Unauthorized
    And the response body should contain "Unauthorized"

  @security
  Scenario: Accessing protected route with tampered JWT returns 401
    Given I have a valid JWT token
    When I modify the payload of the token and send it in the Authorization header
    Then the API should respond with 401 Unauthorized
    And the token should be rejected

  @security
  Scenario: STUDENT role cannot access ADMIN-only endpoints
    Given I am logged in as a student
    When I make a GET request to "/api/v1/admin/users"
    Then the API should respond with 403 Forbidden
    And the response should contain "Forbidden"

  @security
  Scenario: Refresh token rotation — old refresh token is invalidated after use
    Given I am logged in and have a refresh token
    When I use the refresh token to get a new access token
    And I try to use the same original refresh token again
    Then the second attempt should return 401
    And the session should be invalidated (token reuse attack prevention)
