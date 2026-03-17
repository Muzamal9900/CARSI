# Current State

> Updated end of session: 17/03/2026 AEST

## Active Task

Stripe 3-tier setup complete. No active task.

## Recently Completed

- Created CARSI Foundation Membership in Stripe: `prod_UACVcQDnef0t4D` / `price_1TBs6jDOMULuvIJbVtU9VrT1` ($44/mo AUD)
- Created CARSI Growth Membership in Stripe: `prod_UACXupfN6GVrO6` / `price_1TBs8ODOMULuvIJbfRvbOqgo` ($99/mo AUD)
- Webhook `customer.subscription.updated` confirmed present on snapshot endpoint
- `.env.local` and Fly.io secrets updated with all 3 price IDs
- Template infra tests skipped (test_memory_integration, test_supabase_rls, test_prd_provider)
- Test suite: 593 passed, 99 skipped, 0 failed

## Test Suite Status

593 passed / 99 skipped / 0 failed — commit 88471b1

## Next Steps

- P0: Replace localStorage auth (`carsi_user_id`) with real JWT email+password login/signup
- Profile fields on signup: full name + optional IICRC number (for certificate PDFs)
- Exam pass chain: quiz ≥80% → PDF certificate → email student → CEC report to IICRC
- Course import: run WP API + Drive DISCOVER pipeline, dedup, LOAD ~91 courses
- IICRC CEC report email address: Phil to provide

## Last Updated

17/03/2026 AEST (end of session)
