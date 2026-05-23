# Security Spec for Computer Based Test (CBT)

## 1. Data Invariants
1. Students must have a valid, unique NISN as their document ID.
2. Questions must have a valid identifier (`id`), associated subject, text, and at least 2 options.
3. Sesi Ujian (Exam Sessions) must have a unique identifier (`id`), non-empty token, duration greater than 0, and non-empty subject.
4. Student Attempts must belong to an existing session and correct, non-empty student details.
5. All IDs must conform to alphanumeric characters and must not contain malicious injections.

## 2. The Dirty Dozen Payloads
We define 12 payloads representing malicious attempts to bypass identity or poison our database schema:

1. **Malicious NISN (Resource Poisoning)**: Setting a NISN Document ID that contains 1MB of garbage data instead of an alphanumeric string.
2. **Missing Password (Schema Break)**: Adding a student without a password field.
3. **Empty Text Question (Data Integrity)**: Creating a question that doesn't have the question text.
4. **Invalid MCQ Option Count (Schema Break)**: Creating a multiple choice question with 0 options.
5. **Session Duration Negative (Boundary Violation)**: Creating an exam session with -60 minutes duration.
6. **Session Token Empty (Null Key)**: Creating an exam session without an access token.
7. **Attempt Without Session (Orphan Record)**: Creating an attempt with no session ID mapping.
8. **Attempt Score Escalation (Identity Hack)**: Setting attempt score directly to 100 on creation.
9. **Negative Warnings (Boundaries Violation)**: Initializing anti-cheat warnings count to a negative integer like -50.
10. **Duplicate Student ID (Uniqueness Bypass)**: Overwriting an existing database entry with empty parameters.
11. **Session Terminal Bypass (State Shortcutting)**: Reopening a locked/closed session with invalid parameters.
12. **Malicious Question Key Injection (Ghost Field)**: Adding extra secret fields (`isAdmin: true`) in questions collection.

## 3. The Test Runner Spec
A standard test suite using `@firebase/rules-unit-testing` or basic mock queries will ensure:
- Unauthenticated requests without valid document IDs are completely blocked.
- Document creations with invalid alphanumeric formats on any document id are restricted.
- Successfully verified schemas pass all integrity gates.
