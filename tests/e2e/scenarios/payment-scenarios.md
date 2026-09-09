# Payment & Checkout Scenarios

Feature coverage for the full purchase flow including checkout initiation, payment processing, coupon handling, refunds, webhooks, and payment failure paths.

---

Feature: Payment and Checkout

  Background:
    Given the TestCraft LMS is running
    And a paid course "Professional QA Engineer" exists at Rp 499.000
    And I am logged in as a student not yet enrolled

  # ─────────────────────────────────────────
  # CHECKOUT INITIATION
  # ─────────────────────────────────────────

  @blocker
  Scenario: Student initiates checkout for a paid course
    Given I am on the course page for "Professional QA Engineer"
    When I click "Buy Now"
    Then I should be taken to the checkout page
    And the order summary should show the correct course title
    And the price should show Rp 499.000
    And a pending payment record should be created in the database

  @critical
  Scenario: Checkout page shows correct price breakdown
    Given I am on the checkout page
    Then I should see the subtotal
    And I should see any applicable taxes
    And I should see the total amount to pay
    And all amounts should match the course's configured price

  # ─────────────────────────────────────────
  # COUPON / PROMO CODE
  # ─────────────────────────────────────────

  @critical
  Scenario: Student applies a valid percentage-off coupon
    Given a coupon "QA2024" gives 25% off and is active
    When I enter "QA2024" in the promo code field and click "Apply"
    Then the discount of Rp 124.750 should appear in the order summary
    And the new total should be Rp 374.250
    And the coupon should show as "Applied: QA2024 — 25% off"

  @major
  Scenario: Student applies a valid fixed-amount coupon
    Given a coupon "SAVE100K" gives Rp 100.000 off and is active
    When I apply "SAVE100K" at checkout
    Then the new total should be Rp 399.000
    And the discount line should show "- Rp 100.000"

  @major
  Scenario: Applying an expired coupon shows an error and does not apply discount
    Given a coupon "OLDPROMO" expired last month
    When I enter "OLDPROMO" and click "Apply"
    Then I should see "This coupon has expired"
    And the order total should remain at Rp 499.000
    And no discount should be applied

  @major
  Scenario: Applying a non-existent coupon shows an error
    When I enter "FAKECODE99" and click "Apply"
    Then I should see "Invalid promo code"
    And the total should not change

  @minor
  Scenario: Coupon code is case-insensitive
    Given a coupon "QA2024" is active
    When I enter "qa2024" (lowercase) and click "Apply"
    Then the discount should be applied successfully
    And the behavior should be the same as entering "QA2024"

  # ─────────────────────────────────────────
  # SUCCESSFUL PAYMENT
  # ─────────────────────────────────────────

  @blocker
  Scenario: Student completes payment successfully via Midtrans
    Given I am on the checkout page
    When I click "Proceed to Payment"
    And I am redirected to the Midtrans payment page
    And I complete the payment with a test credit card
    Then I should be redirected back to a success page
    And the payment status should be "PAID" in the database
    And I should be automatically enrolled in the course
    And I should receive a payment receipt email
    And I should be able to access all course lessons

  @critical
  Scenario: Payment webhook updates enrollment even if browser redirect fails
    Given a payment has been completed on Midtrans
    When Midtrans sends a payment notification webhook to "/api/v1/payments/webhook"
    Then the payment status should be updated to "PAID"
    And the enrollment should be created
    And the webhook should return HTTP 200
    Even if the student never returned to the success page

  # ─────────────────────────────────────────
  # PAYMENT FAILURE
  # ─────────────────────────────────────────

  @critical
  Scenario: Student's payment is declined
    Given I am on the Midtrans payment page
    When I use a test card configured to decline
    Then I should be redirected back to the checkout with a failure message
    And the payment status should be "FAILED" in the database
    And I should NOT be enrolled in the course
    And I should see a "Try Again" button to retry checkout

  @major
  Scenario: Payment times out and student is not enrolled
    Given a pending payment was created
    When the payment is not completed within the configured timeout (e.g., 24 hours)
    Then the payment status should be updated to "EXPIRED"
    And the student should not be enrolled
    And the pending payment record should not block future purchase attempts for the same course

  # ─────────────────────────────────────────
  # DOUBLE PURCHASE PREVENTION
  # ─────────────────────────────────────────

  @critical
  Scenario: Student cannot purchase the same course twice
    Given I have already paid for and enrolled in "Professional QA Engineer"
    When I navigate to the course page
    Then I should not see a "Buy Now" button
    And I should see "Continue Learning" instead
    And attempting to POST to the payment initiation API should return 409 Conflict

  # ─────────────────────────────────────────
  # SECURITY
  # ─────────────────────────────────────────

  @security
  Scenario: Payment webhook with invalid signature is rejected
    When a POST request is made to "/api/v1/payments/webhook" with a tampered or missing Midtrans signature
    Then the API should return 400 Bad Request
    And no payment record should be updated
    And the event should be logged as a security warning

  @security
  Scenario: Unauthenticated user cannot initiate a checkout
    Given I am not logged in
    When I make a POST request to "/api/v1/payments/initiate" with a valid courseId
    Then the API should return 401 Unauthorized
    And no payment record should be created
