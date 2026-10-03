// ============================================================================
// src/services/api.ts
//
// 🌐 THE AWS SEAM 🌐
// ---------------------------------------------------------------------------
// Every frontend call to backend data goes through this file. Today it
// reads from src/data/dev/*. Later you swap the internals of each function
// to call Cognito / DynamoDB / S3 / Lambda — and no other file in your app
// needs to change.
//
// The pattern is simple:
//
//   component  →  api.something()  →  (mock today | AWS tomorrow)
//
// Every function returns ApiResult<T>, which is either:
//   { ok: true,  data: T }
//   { ok: false, error: { code, message } }
//
// This means callers never need try/catch — they check `result.ok`. It
// also means the same shape works when the backend becomes real.
//
// 🔌 INTEGRATION CHECKLIST (when you're ready to go live):
//
//   1. Install the AWS SDK:
//        npm install aws-amplify @aws-amplify/auth
//      or the lower-level SDK:
//        npm install @aws-sdk/client-cognito-identity-provider \
//                    @aws-sdk/client-dynamodb \
//                    @aws-sdk/lib-dynamodb \
//                    @aws-sdk/client-s3
//
//   2. Create src/services/aws/ and put one file per service:
//        src/services/aws/cognito.ts     ← auth
//        src/services/aws/dynamodb.ts    ← data
//        src/services/aws/s3.ts          ← immutable question snapshots
//
//   3. In THIS file, replace the `MOCK` blocks with calls to those modules.
//      Every function below is marked with a 🔌 comment saying what to swap.
//
//   4. Add your AWS config (region, User Pool ID, etc.) in src/config/aws.ts
//      loaded from environment variables (.env.local, never committed).
//
//   5. Delete src/data/dev/ once all references are gone.
//
// ============================================================================

import type {
  User,
  Subject,
  Module,
  Competency,
  Question,
  QuestionForCandidate,
  Exam,
  Attempt,
  Answer,
  ProctorEvent,
  ProctorEventType,
  AuditEntry,
  ApiResult,
  Paginated,
} from '../types/exam.types';

import type {
  LoginCredentials,
  SignupCredentials,
  MfaChallenge,
  MfaResponse,
  AuthSessionWithTokens,
  AuthError,
  AuthErrorCode,
  PasswordResetRequest,
  PasswordResetConfirm,
} from '../types/auth.types';


// ---------------------------------------------------------------------------
// DEV DATA IMPORTS
// ---------------------------------------------------------------------------
// These imports only exist while you're in dev mode. When you delete
// src/data/dev/, you'll also delete these imports.
// ---------------------------------------------------------------------------

import {
  devUsers,
  findDevUserByEmail,
  findDevUserById,
  toSafeUser,
  type DevUser,
} from '../data/dev/devUsers';

import {
  devSubjects,
  devModules,
  devCompetencies,
  getSubjectById,
  getModulesForSubject,
  getCompetenciesForSubject,
  getModuleById,
  getCompetencyById,
} from '../data/dev/devSubjects';

import {
  devQuestions,
  getQuestionById,
  getQuestionsForSubject,
  getQuestionsForModule,
  filterQuestions,
} from '../data/dev/devQuestions';

import {
  devExams,
  getExamById,
  getExamsForSubject,
  getActiveExams,
} from '../data/dev/devExams';


import {
  devAttempts,
  getAttemptById,
  getAttemptsForUser,
  getAttemptsForExam,
  getLatestAttemptForUserExam,
  persistDevAttempts,
} from '../data/dev/devAttempts';

// ---------------------------------------------------------------------------
// SIMULATED NETWORK DELAY
// ---------------------------------------------------------------------------
// Real API calls take 100–500 ms. Simulating that here means the UI is
// built with real loading states from day one — otherwise you'll ship
// a UI that flashes and then breaks when a real network is involved.
//
// Set to 0 to disable during development if it's annoying.
// 🔌 AWS: Remove this entirely once real network calls are in place.
// ---------------------------------------------------------------------------

const SIMULATED_LATENCY_MS = 350;

function delay<T>(value: T, ms = SIMULATED_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// ---------------------------------------------------------------------------
// INTERNAL HELPERS
// ---------------------------------------------------------------------------

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function fail<T = never>(code: string, message: string): ApiResult<T> {
  return { ok: false, error: { code, message } };
}

/**
 * Convert a caught error into an ApiResult failure.
 * Used for consistency at the bottom of every API function.
 */
function fromError<T = never>(e: unknown, fallback = 'An unexpected error occurred.'): ApiResult<T> {
  if (e instanceof Error) {
    return fail(e.name, e.message || fallback);
  }
  return fail('unknown', fallback);
}

/**
 * Dev-only: password check for devUsers.
 * In production, Cognito does this entirely server-side — you never see
 * the password on the client.
 */
function verifyDevPassword(devUser: DevUser, password: string): boolean {
  return devUser.password === password;
}

/**
 * Dev-only: generate a fake token. In production, Cognito issues a real
 * signed JWT.
 */
function generateDevToken(userId: string): string {
  return `dev-token-${userId}-${Date.now()}`;
}

/**
 * Dev-only: generate a fake refresh token.
 */
function generateDevRefreshToken(userId: string): string {
  return `dev-refresh-${userId}-${Date.now()}`;
}

/**
 * Compute an ISO 8601 timestamp `minutes` from now.
 */
function inMinutes(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

// ---------------------------------------------------------------------------
// AUTH — Login, MFA, session
// ---------------------------------------------------------------------------

/**
 * Step 1 of login: submit credentials. In dev, this validates the password
 * and returns either an MFA challenge or a completed session (if the user
 * doesn't have MFA enabled).
 *
 * 🔌 AWS: Replace the MOCK block with:
 *           import { signIn } from 'aws-amplify/auth';
 *           const result = await signIn({ username: email, password });
 *           if (result.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') {
 *             return ok({ challenge: { ... } });
 *           }
 *           return ok({ session: { ... } });
 */
export async function login(
  credentials: LoginCredentials,
): Promise<ApiResult<
  | { kind: 'mfa-required'; challenge: MfaChallenge }
  | { kind: 'authenticated'; session: AuthSessionWithTokens }
>> {
  try {
    // ─────────────────────────────────────────────────────────────────────
    // 🔌 MOCK — replace this block with Cognito's signIn()
    // ─────────────────────────────────────────────────────────────────────
    const devUser = findDevUserByEmail(credentials.email);
    if (!devUser) {
      await delay(null);
      return fail('user-not-found', 'No account found for that email address.');
    }

    if (!verifyDevPassword(devUser, credentials.password)) {
      await delay(null);
      return fail('invalid-credentials', 'Incorrect email or password.');
    }

    const safe = toSafeUser(devUser);

    if (!safe.mfaEnabled) {
      // MFA disabled — log straight in
      const session: AuthSessionWithTokens = {
        user: safe,
        token: generateDevToken(safe.id),
        refreshToken: generateDevRefreshToken(safe.id),
        expiresAt: inMinutes(60),
        mfaVerified: false,
      };
      await delay(null);
      return ok({ kind: 'authenticated', session });
    }

    // MFA required — return a challenge
    const challenge: MfaChallenge = {
      userId: safe.id,
      method: 'totp',
      destination: safe.email.replace(/^(.{1}).*@/, '$1***@'),
      expiresAt: inMinutes(5),
      attemptsRemaining: 3,
    };
    await delay(null);
    return ok({ kind: 'mfa-required', challenge });

    // 🔌 END MOCK
    // ─────────────────────────────────────────────────────────────────────
  } catch (e) {
    return fromError(e, 'Could not sign in. Please try again.');
  }
}

/**
 * Step 2 of login: submit the MFA code.
 *
 * 🔌 AWS: Replace with:
 *           import { confirmSignIn } from 'aws-amplify/auth';
 *           const result = await confirmSignIn({ challengeResponse: code });
 *           if (result.isSignedIn) { ...build session... }
 */
export async function verifyMfa(
  response: MfaResponse,
): Promise<ApiResult<AuthSessionWithTokens>> {
  try {
    // ─────────────────────────────────────────────────────────────────────
    // 🔌 MOCK — any 6-digit code starting with "1" passes for dev.
    //         Real TOTP codes are 6 digits; the "1" prefix is a dev
    //         convention so you can tell instantly whether you typed
    //         something that will pass.
    //         Example dev codes: "123456", "111111", "100000"
    // ─────────────────────────────────────────────────────────────────────
    await delay(null);

    if (!/^1\d{5}$/.test(response.code)) {
      return fail(
        'mfa-invalid-code',
        'That code is not valid. Please check and try again.',
      );
    }

    const devUser = findDevUserById(response.userId);
    if (!devUser) {
      return fail('user-not-found', 'Session expired. Please sign in again.');
    }

    const safe = toSafeUser(devUser);
    const session: AuthSessionWithTokens = {
      user: safe,
      token: generateDevToken(safe.id),
      refreshToken: generateDevRefreshToken(safe.id),
      expiresAt: inMinutes(60),
      mfaVerified: true,
      mfaMethodUsed: response.method,
    };
    return ok(session);
    // 🔌 END MOCK
    // ─────────────────────────────────────────────────────────────────────
  } catch (e) {
    return fromError(e, 'Could not verify the code.');
  }
}

/**
 * Request a password reset email.
 *
 * 🔌 AWS: forgotPassword({ username: email }) from aws-amplify/auth
 */
export async function requestPasswordReset(
  _req: PasswordResetRequest,
): Promise<ApiResult<{ sent: true }>> {
  await delay(null);
  // 🔌 MOCK — always says "sent" to prevent email enumeration.
  //         Real implementation: Cognito silently accepts either way.
  return ok({ sent: true });
}

/**
 * Confirm a password reset with code + new password.
 *
 * 🔌 AWS: confirmForgotPassword({ username, confirmationCode, newPassword })
 */
export async function confirmPasswordReset(
  _req: PasswordResetConfirm,
): Promise<ApiResult<{ reset: true }>> {
  await delay(null);
  return ok({ reset: true });
}

/**
 * Sign out.
 *
 * 🔌 AWS: signOut() from aws-amplify/auth
 */
export async function logout(): Promise<ApiResult<{ signedOut: true }>> {
  await delay(null, 100);
  return ok({ signedOut: true });
}

/**
 * Restore a session from a stored token. Called on app boot.
 *
 * 🔌 AWS: fetchAuthSession() from aws-amplify/auth. If it returns valid
 *         tokens, decode the JWT to get user info. Otherwise the session
 *         is expired and the user must log in again.
 */
export async function restoreSession(
  token: string,
): Promise<ApiResult<AuthSessionWithTokens>> {
  try {
    // ─────────────────────────────────────────────────────────────────────
    // 🔌 MOCK — dev tokens look like "dev-token-{userId}-{timestamp}".
    //         We parse the userId back out and rebuild the session.
    //         Real implementation: validate the JWT and decode claims.
    // ─────────────────────────────────────────────────────────────────────
    await delay(null, 150);
    const match = token.match(/^dev-token-(.+?)-\d+$/);
    if (!match) {
      return fail('session-expired', 'Session has expired. Please sign in again.');
    }

    const devUser = findDevUserById(match[1]);
    if (!devUser) {
      return fail('session-expired', 'Session has expired. Please sign in again.');
    }

    const safe = toSafeUser(devUser);
    return ok({
      user: safe,
      token,
      refreshToken: generateDevRefreshToken(safe.id),
      expiresAt: inMinutes(60),
      mfaVerified: true,
    });
    // 🔌 END MOCK
    // ─────────────────────────────────────────────────────────────────────
  } catch (e) {
    return fromError(e, 'Could not restore session.');
  }
}

/**
 * Sign up a new user.
 *
 * 🔌 AWS: signUp({ username, password, options: { userAttributes } })
 */
export async function signup(
  credentials: SignupCredentials,
): Promise<ApiResult<{ verificationSent: true }>> {
  try {
    await delay(null);
    // 🔌 MOCK — no-op. Real implementation sends a verification email
    //         via Cognito, then the user submits the code to confirm.
    if (!credentials.acceptedTerms) {
      return fail('invalid-credentials', 'You must accept the terms to continue.');
    }
    return ok({ verificationSent: true });
  } catch (e) {
    return fromError(e, 'Could not create your account.');
  }
}

// ---------------------------------------------------------------------------
// SUBJECTS
// ---------------------------------------------------------------------------

/**
 * Get all active subjects.
 *
 * 🔌 AWS: DynamoDB Query on `subjects` filtered by active = true.
 */
export async function getSubjects(): Promise<ApiResult<Subject[]>> {
  try {
    await delay(null);
    return ok(devSubjects.filter((s) => s.active));
    // 🔌 Replace with: await dynamodb.send(new ScanCommand({ TableName: 'subjects' }))
  } catch (e) {
    return fromError(e, 'Could not load subjects.');
  }
}

/**
 * Get a single subject by ID.
 */
export async function getSubject(
  id: string,
): Promise<ApiResult<Subject | null>> {
  try {
    await delay(null, 100);
    return ok(getSubjectById(id) ?? null);
  } catch (e) {
    return fromError(e, 'Could not load subject.');
  }
}

/**
 * Get all modules for a subject.
 */
export async function getModules(
  subjectId: string,
): Promise<ApiResult<Module[]>> {
  try {
    await delay(null, 100);
    return ok(getModulesForSubject(subjectId));
    // 🔌 DynamoDB Query on GSI: subjectId-index
  } catch (e) {
    return fromError(e, 'Could not load modules.');
  }
}

/**
 * Get all competencies for a subject.
 */
export async function getCompetencies(
  subjectId: string,
): Promise<ApiResult<Competency[]>> {
  try {
    await delay(null, 100);
    return ok(getCompetenciesForSubject(subjectId));
  } catch (e) {
    return fromError(e, 'Could not load competencies.');
  }
}

// ---------------------------------------------------------------------------
// QUESTIONS
// ---------------------------------------------------------------------------

/**
 * Get every question in the bank. Used by the admin question bank.
 * Filters optional.
 *
 * 🔌 AWS: DynamoDB Scan with filter expressions, or a GSI query if you
 *         always filter by subjectId. Consider pagination via
 *         ExclusiveStartKey / LastEvaluatedKey.
 */
export async function listQuestions(filters: {
  subjectId?: string;
  moduleId?: string;
  competencyId?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  type?: 'mcq' | 'multi-select' | 'scenario' | 'true-false';
  flag?: string;
  page?: number;
  pageSize?: number;
}): Promise<ApiResult<Paginated<Question>>> {
  try {
    await delay(null);
    const all = filterQuestions(filters);
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);
    return ok({
      items,
      total: all.length,
      page,
      pageSize,
    });
    // 🔌 Paginated DynamoDB Scan/Query
  } catch (e) {
    return fromError(e, 'Could not load questions.');
  }
}

/**
 * Get a single question by ID (admin view — includes the answer key).
 */
export async function getQuestionAdmin(
  id: string,
): Promise<ApiResult<Question | null>> {
  try {
    await delay(null, 100);
    return ok(getQuestionById(id) ?? null);
  } catch (e) {
    return fromError(e, 'Could not load question.');
  }
}

/**
 * Strip the answer key from a Question so it's safe to send to the
 * candidate's browser.
 *
 * ⚠️ THIS IS THE MOST SECURITY-CRITICAL FUNCTION IN THE FILE.
 *    In production, this MUST happen server-side (in a Lambda, before the
 *    data ever leaves the server). If a client ever sees `isCorrect`, the
 *    exam is compromised.
 *
 *    In dev, we do the stripping on the client because there's no server.
 *    When you wire up AWS, this logic moves into the Lambda that serves
 *    questions — see the note in `startAttempt()` below.
 */
function toCandidateQuestion(q: Question): QuestionForCandidate {
  const { options, ...rest } = q;
  return {
    ...rest,
    options: options.map((o) => ({ id: o.id, text: o.text })),
  };
}

// ---------------------------------------------------------------------------
// EXAMS
// ---------------------------------------------------------------------------

/**
 * Get all exams (admin view).
 */
export async function listExams(filters: {
  subjectId?: string;
  activeOnly?: boolean;
}): Promise<ApiResult<Exam[]>> {
  try {
    await delay(null);
    let result = devExams;
    if (filters.subjectId) {
      result = result.filter((e) => e.subjectId === filters.subjectId);
    }
    if (filters.activeOnly) {
      result = result.filter((e) => e.active);
    }
    return ok(result);
    // 🔌 DynamoDB Scan/Query on `exams`
  } catch (e) {
    return fromError(e, 'Could not load exams.');
  }
}

/**
 * Get exams available to a specific candidate. In dev this is just all
 * active exams; in production it would filter by their enrolments.
 */
export async function getAvailableExamsForUser(
  _userId: string,
): Promise<ApiResult<Exam[]>> {
  try {
    await delay(null);
    return ok(getActiveExams());
    // 🔌 Join against an `enrolments` table
  } catch (e) {
    return fromError(e, 'Could not load your exams.');
  }
}

/**
 * Get a single exam by ID.
 */
export async function getExam(id: string): Promise<ApiResult<Exam | null>> {
  try {
    await delay(null, 100);
    return ok(getExamById(id) ?? null);
  } catch (e) {
    return fromError(e, 'Could not load exam.');
  }
}

// ---------------------------------------------------------------------------
// ATTEMPTS — the core exam-session lifecycle
// ---------------------------------------------------------------------------

/**
 * Start a new attempt at an exam.
 *
 * This is the MOST COMPLEX function in the file. It:
 *   1. Creates a new Attempt record with a fresh ID
 *   2. Uses the exam's blueprint to draw random questions from the bank
 *   3. Randomises question order (if the rules say so)
 *   4. Randomises answer order per question (if the rules say so)
 *   5. Stores a random seed so the exact delivery can be reproduced
 *   6. Strips the answer key before returning the questions to the client
 *   7. Computes the server-side deadline (client timer is display-only)
 *
 * 🔌 AWS: This entire function moves to a Lambda. The Lambda:
 *           - Reads the exam from DynamoDB
 *           - Reads candidate questions from DynamoDB (with GSI queries)
 *           - Draws random questions per the blueprint
 *           - Writes the new attempt to DynamoDB
 *           - Writes an immutable snapshot of the served questions to S3
 *             with Object Lock (for regulatory audit)
 *           - Returns the CandidateQuestions (without answers) to the client
 *
 *         The client NEVER sees the full question record with `isCorrect`.
 *         See toCandidateQuestion() above.
 *
 *         The server-side timer is enforced by:
 *           - A CloudWatch Events rule that fires at the deadline
 *           - A Lambda that auto-submits the attempt if it's still
 *             in-progress
 *         The client timer is ONLY a UI affordance. Never trust it.
 */
export async function startAttempt(
  examId: string,
  userId: string,
): Promise<
  ApiResult<{
    attempt: Attempt;
    questions: QuestionForCandidate[];
  }>
> {
  try {
    await delay(null, 500);

    const exam = getExamById(examId);
    if (!exam) return fail('exam-not-found', 'That exam does not exist.');
    if (!exam.active) return fail('exam-inactive', 'That exam is not currently available.');

    // Check for an existing in-progress attempt for this user+exam.
    const existing = getLatestAttemptForUserExam(userId, examId);
    if (existing && existing.status === 'in-progress') {
      // In production: this is a "resume" case. Return the same attempt
      // and the same questions the candidate already saw.
      return fail(
        'attempt-in-progress',
        'You have an attempt in progress. Please resume or finish it first.',
      );
    }

    // Generate a random seed for reproducible delivery
    const randomSeed = `seed-${examId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Draw questions per the blueprint
    const drawnIds: string[] = [];
    for (const [moduleId, byDifficulty] of Object.entries(exam.blueprint.perModule)) {
      for (const [difficulty, count] of Object.entries(byDifficulty)) {
        if (count <= 0) continue;
        const pool = devQuestions.filter(
          (q) =>
            q.moduleId === moduleId &&
            q.difficulty === difficulty &&
            !drawnIds.includes(q.id),
        );
        // Simple shuffle, deterministic with the seed (dev uses Math.random)
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        for (let i = 0; i < count && i < shuffled.length; i++) {
          drawnIds.push(shuffled[i].id);
        }
      }
    }

    // If we couldn't fill the blueprint (not enough questions in the bank),
    // still return what we have, but log a warning.
    if (drawnIds.length < exam.blueprint.totalQuestions) {
      console.warn(
        `[api.startAttempt] Blueprint wanted ${exam.blueprint.totalQuestions} questions but only ${drawnIds.length} were available. ` +
        `Check that src/data/dev/devQuestions.ts has enough questions per module+difficulty.`,
      );
    }

    // Shuffle question order if the rules say so
    const orderedIds = exam.rules.randomiseQuestionOrder
      ? [...drawnIds].sort(() => Math.random() - 0.5)
      : drawnIds;

    // Compute deadline
    const deadlineAt = exam.rules.timeLimitMinutes > 0
      ? inMinutes(exam.rules.timeLimitMinutes)
      : inMinutes(24 * 60); // 24h fallback for untimed exams

    const attempt: Attempt = {
      id: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      examId,
      examVersion: exam.version,
      userId,
      subjectId: exam.subjectId,
      status: 'in-progress',
      questionIds: orderedIds,
      answers: {},
      startedAt: new Date().toISOString(),
      deadlineAt,
      proctorEventCount: 0,
      randomSeed,
    };

    // 🔌 AWS: Instead of pushing to a local array, this is:
    //         await dynamodb.send(new PutCommand({
    //           TableName: 'attempts',
    //           Item: attempt,
    //         }));
    //         and then a separate Lambda writes the immutable S3 snapshot.
    devAttempts.push(attempt);

    // Build the candidate-safe question list (no isCorrect)
    const questions = orderedIds
      .map((id) => getQuestionById(id))
      .filter((q): q is Question => Boolean(q))
      .map(toCandidateQuestion);

    return ok({ attempt, questions });
    // 🔌 END MOCK
  } catch (e) {
    return fromError(e, 'Could not start the exam.');
  }
}

/**
 * Get the candidate-safe questions for an in-progress attempt.
 * Used when resuming.
 */
export async function getAttemptQuestions(
  attemptId: string,
): Promise<ApiResult<QuestionForCandidate[]>> {
  try {
    await delay(null);
    const attempt = getAttemptById(attemptId);
    if (!attempt) return fail('attempt-not-found', 'Attempt not found.');
    const questions = attempt.questionIds
      .map((id) => getQuestionById(id))
      .filter((q): q is Question => Boolean(q))
      .map(toCandidateQuestion);
    return ok(questions);
  } catch (e) {
    return fromError(e, 'Could not load questions.');
  }
}

/**
 * Save a single answer. Called on every question navigation.
 *
 * 🔌 AWS: In production this is a lightweight Lambda that PUTs to
 *         DynamoDB. It should be rate-limited per attempt.
 *
 *         ⚠️ The server checks:
 *           - Is the attempt still in-progress?
 *           - Is the current time before deadlineAt?
 *           - Does this questionId belong to this attempt?
 *         If any check fails, the answer is rejected.
 */
export async function saveAnswer(
  attemptId: string,
  answer: Answer,
): Promise<ApiResult<{ saved: true }>> {
  try {
    await delay(null, 80);
    const attempt = getAttemptById(attemptId);
    if (!attempt) return fail('attempt-not-found', 'Attempt not found.');
    if (attempt.status !== 'in-progress') {
      return fail('attempt-closed', 'This attempt has already been submitted.');
    }
    if (!attempt.questionIds.includes(answer.questionId)) {
      return fail('invalid-question', 'That question is not part of this attempt.');
    }
    attempt.answers[answer.questionId] = answer;
    return ok({ saved: true });
    // 🔌 UpdateCommand on DynamoDB attempts table
  } catch (e) {
    return fromError(e, 'Could not save your answer.');
  }
}

/**
 * Log a proctoring event. Called by the exam room when a rule is broken
 * (tab switch, copy attempt, etc.).
 *
 * 🔌 AWS: Write to DynamoDB `proctor_events` table with attemptId (PK)
 *         and timestamp (SK). Optionally stream to Kinesis for real-time
 *         monitoring, or to CloudWatch Logs for retention.
 *
 *         High-stakes exams should ALSO have server-side detection where
 *         possible (e.g. checking the referrer on every API call).
 */
export async function logProctorEvent(
  attemptId: string,
  type: ProctorEventType,
  metadata?: Record<string, unknown>,
): Promise<ApiResult<{ logged: true }>> {
  try {
    await delay(null, 50);
    const attempt = getAttemptById(attemptId);
    if (!attempt) return fail('attempt-not-found', 'Attempt not found.');

    const event: ProctorEvent = {
      id: `pe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      attemptId,
      type,
      timestamp: new Date().toISOString(),
      metadata,
      severity:
        type === 'tab-switch' || type === 'fullscreen-exit' ? 'warning' : 'info',
    };
    attempt.proctorEventCount += 1;
    // In dev, we just increment the counter. In production, the event
    // itself is stored in a separate DynamoDB table.
    void event;
    return ok({ logged: true });
    // 🔌 PutCommand to `proctor_events` table
  } catch (e) {
    return fromError(e, 'Could not log proctoring event.');
  }
}

/**
 * Submit an attempt. Called by the candidate or, on timeout, by the server.
 * Once submitted, the attempt is IMMUTABLE. No more answers can be saved.
 *
 * 🔌 AWS: This is a Lambda (invoked by API Gateway on candidate submit,
 *         or by CloudWatch at deadline). It:
 *           1. Reads all answers from DynamoDB
 *           2. Reads the answer key from DynamoDB (server-side only)
 *           3. Computes the score per module
 *           4. Computes the pass/fail
 *           5. Writes the final score, moduleBreakdown, and submittedAt
 *           6. Locks the attempt (status → 'submitted' / 'auto-submitted')
 *           7. Writes an audit entry
 *
 *         The answer key NEVER leaves the server. The client just gets
 *         back a computed score.
 */
export async function submitAttempt(
  attemptId: string,
  submittedBy: 'candidate' | 'server' = 'candidate',
): Promise<ApiResult<Attempt>> {
  try {
    console.log(
      '[api.submitAttempt] called — attempt:', attemptId,
      'by:', submittedBy,
      '\nstack:', new Error().stack,
    );
    await delay(null, 600);
    const attempt = getAttemptById(attemptId);
    if (!attempt) return fail('attempt-not-found', 'Attempt not found.');
    if (attempt.status !== 'in-progress') {
      return fail('attempt-closed', 'This attempt has already been submitted.');
    }

    const exam = getExamById(attempt.examId);
    if (!exam) return fail('exam-not-found', 'Exam not found.');

    // Score
    let correct = 0;
    const moduleStats: Record<string, { correct: number; total: number }> = {};

    for (const qid of attempt.questionIds) {
      const q = getQuestionById(qid);
      if (!q) continue;
      const answer = attempt.answers[qid];
      const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id).sort();
      const selected = (answer?.selectedOptionIds ?? []).slice().sort();
      const isCorrect =
        correctIds.length === selected.length &&
        correctIds.every((id, i) => id === selected[i]);

      if (isCorrect) correct += 1;

      const mod = moduleStats[q.moduleId] ?? { correct: 0, total: 0 };
      mod.total += 1;
      if (isCorrect) mod.correct += 1;
      moduleStats[q.moduleId] = mod;
    }

    const scorePercent = attempt.questionIds.length > 0
      ? Math.round((correct / attempt.questionIds.length) * 100 * 10) / 10
      : 0;

    const passed = scorePercent >= exam.rules.passMarkPercent;

    attempt.status = submittedBy === 'server' ? 'auto-submitted' : 'submitted';
    attempt.submittedAt = new Date().toISOString();
    attempt.scorePercent = scorePercent;
    attempt.passed = passed;
    attempt.moduleBreakdown = moduleStats;

    // 🔌 AWS: UpdateCommand on attempts + PutCommand to audit_log
    return ok(attempt);
  } catch (e) {
    return fromError(e, 'Could not submit the exam.');
  }
}

/**
 * Get a single attempt (for the results screen or admin view).
 */
export async function getAttempt(
  attemptId: string,
): Promise<ApiResult<Attempt | null>> {
  try {
    await delay(null, 100);
    return ok(getAttemptById(attemptId) ?? null);
  } catch (e) {
    return fromError(e, 'Could not load attempt.');
  }
}

/**
 * Get all attempts for the current user. Used by the dashboard.
 */
export async function getUserAttempts(
  userId: string,
): Promise<ApiResult<Attempt[]>> {
  try {
    await delay(null);
    return ok(getAttemptsForUser(userId));
    // 🔌 Query on GSI userId-index
  } catch (e) {
    return fromError(e, 'Could not load your attempts.');
  }
}

/**
 * Get all attempts for an exam (admin view). Used by analytics.
 */
export async function getExamAttempts(
  examId: string,
): Promise<ApiResult<Attempt[]>> {
  try {
    await delay(null);
    return ok(getAttemptsForExam(examId));
    // 🔌 Query on GSI examId-index
  } catch (e) {
    return fromError(e, 'Could not load attempts for this exam.');
  }
}

// ---------------------------------------------------------------------------
// AUDIT LOG
// ---------------------------------------------------------------------------

/**
 * Write an audit entry. Called by every state-changing operation.
 *
 * 🔌 AWS: In production this is not called from the client — the Lambda
 *         writes audit entries as a side effect of the operation. The
 *         table has an IAM policy that forbids UpdateItem and DeleteItem,
 *         so entries are append-only. Optionally replicate to S3 with
 *         Object Lock for compliance.
 */
export async function writeAudit(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<ApiResult<{ written: true }>> {
  try {
    await delay(null, 30);
    const full: AuditEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    };
    void full;
    return ok({ written: true });
  } catch (e) {
    return fromError(e, 'Could not write audit entry.');
  }
}

/**
 * Query the audit log. Used by the audit screen (admin/auditor only).
 *
 * 🔌 AWS: Query `audit_log` with optional filters. The IAM policy on this
 *         table grants read to admin/auditor Cognito groups only.
 */
export async function listAuditEntries(filters: {
  actorId?: string;
  entityType?: string;
  entityId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}): Promise<ApiResult<Paginated<AuditEntry>>> {
  try {
    await delay(null);
    // 🔌 MOCK — returns empty. Populate as you build the audit screen.
    const items: AuditEntry[] = [];
    return ok({
      items,
      total: 0,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 50,
    });
  } catch (e) {
    return fromError(e, 'Could not load audit entries.');
  }
}

// ---------------------------------------------------------------------------
// AUTH ERROR MAPPING (utility)
// ---------------------------------------------------------------------------

/**
 * Map an AuthErrorCode to a user-friendly message.
 * Used by the login screen so we don't hardcode strings in JSX.
 */
export function authErrorMessage(code: AuthErrorCode): string {
  const map: Record<AuthErrorCode, string> = {
    'invalid-credentials': 'Incorrect email or password.',
    'user-not-found': 'No account found for that email.',
    'user-not-confirmed': 'Please check your inbox to confirm your email first.',
    'mfa-required': 'A verification code is required.',
    'mfa-invalid-code': 'That verification code is not valid.',
    'mfa-expired': 'Your verification code has expired. Please request a new one.',
    'too-many-attempts': 'Too many attempts. Please try again later.',
    'password-reset-required': 'You must reset your password before signing in.',
    'session-expired': 'Your session has expired. Please sign in again.',
    'network-error': 'Network error. Please check your connection and try again.',
    'unknown': 'Something went wrong. Please try again.',
  };
  return map[code] ?? 'Something went wrong. Please try again.';
}