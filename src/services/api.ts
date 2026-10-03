// ============================================================================
// src/services/api.ts
//
// 🌐 THE AWS SEAM 🌐
// ---------------------------------------------------------------------------
// Every frontend call to backend data goes through this file. Today it
// reads from src/data/dev/*. Later you swap the internals of each function
// to call Cognito / DynamoDB / S3 / Lambda — and no other file in your app
// needs to change.
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
  AuthErrorCode,
  PasswordResetRequest,
  PasswordResetConfirm,
  SocialProvider,
} from '../types/auth.types';

import type {
  Course,
  CourseContent,
  Enrolment,
  LessonProgress,
} from '../types/course.types';

// ---------------------------------------------------------------------------
// DEV DATA IMPORTS
// ---------------------------------------------------------------------------

import {
  findDevUserByEmail,
  findDevUserById,
  toSafeUser,
  type DevUser,
} from '../data/dev/devUsers';

import {
  devSubjects,
  getSubjectById,
  getModulesForSubject,
  getCompetenciesForSubject,
} from '../data/dev/devSubjects';

import {
  devQuestions,
  getQuestionById,
  filterQuestions,
} from '../data/dev/devQuestions';

import {
  devExams,
  getExamById,
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

import {
  getCourseContent as getCourseContentFromData,
} from '../data/CourseContent';

// ---------------------------------------------------------------------------
// SIMULATED NETWORK DELAY
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

function fromError<T = never>(
  e: unknown,
  fallback = 'An unexpected error occurred.',
): ApiResult<T> {
  if (e instanceof Error) {
    return fail(e.name, e.message || fallback);
  }
  return fail('unknown', fallback);
}

function verifyDevPassword(devUser: DevUser, password: string): boolean {
  return devUser.password === password;
}

function generateDevToken(userId: string): string {
  return `dev-token-${userId}-${Date.now()}`;
}

function generateDevRefreshToken(userId: string): string {
  return `dev-refresh-${userId}-${Date.now()}`;
}

function inMinutes(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function buildSessionFromDevUser(
  devUser: DevUser,
  mfaVerified: boolean,
): AuthSessionWithTokens {
  const safe = toSafeUser(devUser);
  return {
    user: safe,
    token: generateDevToken(safe.id),
    refreshToken: generateDevRefreshToken(safe.id),
    expiresAt: inMinutes(60),
    mfaVerified,
  };
}

// ---------------------------------------------------------------------------
// AUTH — Login, MFA, session
// ---------------------------------------------------------------------------

export async function login(
  credentials: LoginCredentials,
): Promise<
  ApiResult<
    | { kind: 'mfa-required'; challenge: MfaChallenge }
    | { kind: 'authenticated'; session: AuthSessionWithTokens }
  >
> {
  try {
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
      await delay(null);
      return ok({
        kind: 'authenticated',
        session: buildSessionFromDevUser(devUser, false),
      });
    }

    const challenge: MfaChallenge = {
      userId: safe.id,
      method: 'totp',
      destination: safe.email.replace(/^(.{1}).*@/, '$1***@'),
      expiresAt: inMinutes(5),
      attemptsRemaining: 3,
    };
    await delay(null);
    return ok({ kind: 'mfa-required', challenge });
  } catch (e) {
    return fromError(e, 'Could not sign in. Please try again.');
  }
}

export async function verifyMfa(
  response: MfaResponse,
): Promise<ApiResult<AuthSessionWithTokens>> {
  try {
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

    const session = buildSessionFromDevUser(devUser, true);
    session.mfaMethodUsed = response.method;
    return ok(session);
  } catch (e) {
    return fromError(e, 'Could not verify the code.');
  }
}

// ---------------------------------------------------------------------------
// PASSWORD RESET
// ---------------------------------------------------------------------------

export async function requestPasswordReset(
  req: PasswordResetRequest,
): Promise<ApiResult<{ sent: true }>> {
  try {
    await delay(null);

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(
        `%c[DEV] Password reset code for ${req.email}: 123456`,
        'color: #d95300; font-weight: bold;',
      );
    }

    return ok({ sent: true });
  } catch (e) {
    return fromError(e, 'Could not send reset instructions.');
  }
}

export async function confirmPasswordReset(
  req: PasswordResetConfirm,
): Promise<ApiResult<{ reset: true }>> {
  try {
    await delay(null);

    if (!/^1\d{5}$/.test(req.code)) {
      return fail(
        'mfa-invalid-code',
        'That reset code is not valid. Please check and try again.',
      );
    }

    if (req.newPassword.length < 8) {
      return fail(
        'invalid-credentials',
        'Password must be at least 8 characters.',
      );
    }

    return ok({ reset: true });
  } catch (e) {
    return fromError(e, 'Could not reset your password.');
  }
}

// ---------------------------------------------------------------------------
// SIGNUP
// ---------------------------------------------------------------------------

export async function signup(
  credentials: SignupCredentials,
): Promise<ApiResult<{ verificationSent: true }>> {
  try {
    await delay(null);

    if (!credentials.acceptedTerms) {
      return fail(
        'invalid-credentials',
        'You must accept the terms to continue.',
      );
    }

    if (!credentials.email.includes('@')) {
      return fail('invalid-credentials', 'Please enter a valid email address.');
    }

    if (credentials.password.length < 8) {
      return fail(
        'invalid-credentials',
        'Password must be at least 8 characters.',
      );
    }

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(
        `%c[DEV] Verification code for ${credentials.email}: 123456`,
        'color: #d95300; font-weight: bold;',
      );
    }

    return ok({ verificationSent: true });
  } catch (e) {
    return fromError(e, 'Could not create your account.');
  }
}

export async function confirmSignup(req: {
  email: string;
  code: string;
}): Promise<ApiResult<AuthSessionWithTokens>> {
  try {
    await delay(null);

    if (!/^1\d{5}$/.test(req.code)) {
      return fail(
        'mfa-invalid-code',
        'That code is not valid. Please check and try again.',
      );
    }

    const devUser = findDevUserByEmail(req.email);
    if (devUser) {
      return ok(buildSessionFromDevUser(devUser, false));
    }

    const syntheticUser: User = {
      id: `user-${Date.now()}`,
      email: req.email,
      displayName: req.email.split('@')[0],
      roles: ['candidate'],
      mfaEnabled: false,
      createdAt: new Date().toISOString(),
      subjectScope: [],
    };
    const session: AuthSessionWithTokens = {
      user: syntheticUser,
      token: generateDevToken(syntheticUser.id),
      refreshToken: generateDevRefreshToken(syntheticUser.id),
      expiresAt: inMinutes(60),
      mfaVerified: false,
    };
    return ok(session);
  } catch (e) {
    return fromError(e, 'Could not verify your account.');
  }
}

export async function resendSignupCode(req: {
  email: string;
}): Promise<ApiResult<{ sent: true }>> {
  try {
    await delay(null);

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(
        `%c[DEV] Resent verification code for ${req.email}: 123456`,
        'color: #d95300; font-weight: bold;',
      );
    }

    return ok({ sent: true });
  } catch (e) {
    return fromError(e, 'Could not resend the verification code.');
  }
}

// ---------------------------------------------------------------------------
// SOCIAL LOGIN
// ---------------------------------------------------------------------------

export async function loginWithSocial(
  provider: SocialProvider,
): Promise<ApiResult<AuthSessionWithTokens>> {
  try {
    await delay(null, 1500);

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(
        `%c[DEV] Social login simulated for provider: ${provider}`,
        'color: #d95300; font-weight: bold;',
      );
    }

    const devUser = findDevUserByEmail('candidate@test.com');
    if (!devUser) {
      return fail('user-not-found', 'Dev user not configured.');
    }

    const session = buildSessionFromDevUser(devUser, false);
    return ok(session);
  } catch (e) {
    return fromError(e, 'Could not sign in with that provider.');
  }
}

// ---------------------------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------------------------

export async function logout(): Promise<ApiResult<{ signedOut: true }>> {
  await delay(null, 100);
  return ok({ signedOut: true });
}

// ---------------------------------------------------------------------------
// SESSION RESTORE
// ---------------------------------------------------------------------------

export async function restoreSession(
  token: string,
): Promise<ApiResult<AuthSessionWithTokens>> {
  try {
    await delay(null, 150);
    const match = token.match(/^dev-token-(.+?)-\d+$/);
    if (!match) {
      return fail(
        'session-expired',
        'Session has expired. Please sign in again.',
      );
    }

    const devUser = findDevUserById(match[1]);
    if (!devUser) {
      return fail(
        'session-expired',
        'Session has expired. Please sign in again.',
      );
    }

    return ok(buildSessionFromDevUser(devUser, true));
  } catch (e) {
    return fromError(e, 'Could not restore session.');
  }
}

// ---------------------------------------------------------------------------
// SUBJECTS
// ---------------------------------------------------------------------------

export async function getSubjects(): Promise<ApiResult<Subject[]>> {
  try {
    await delay(null);
    return ok(devSubjects.filter((s) => s.active));
  } catch (e) {
    return fromError(e, 'Could not load subjects.');
  }
}

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

export async function getModules(
  subjectId: string,
): Promise<ApiResult<Module[]>> {
  try {
    await delay(null, 100);
    return ok(getModulesForSubject(subjectId));
  } catch (e) {
    return fromError(e, 'Could not load modules.');
  }
}

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
    return ok({ items, total: all.length, page, pageSize });
  } catch (e) {
    return fromError(e, 'Could not load questions.');
  }
}

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
  } catch (e) {
    return fromError(e, 'Could not load exams.');
  }
}

export async function getAvailableExamsForUser(
  _userId: string,
): Promise<ApiResult<Exam[]>> {
  try {
    await delay(null);
    return ok(getActiveExams());
  } catch (e) {
    return fromError(e, 'Could not load your exams.');
  }
}

export async function getExam(id: string): Promise<ApiResult<Exam | null>> {
  try {
    await delay(null, 100);
    return ok(getExamById(id) ?? null);
  } catch (e) {
    return fromError(e, 'Could not load exam.');
  }
}

// ---------------------------------------------------------------------------
// ATTEMPTS
// ---------------------------------------------------------------------------

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
    if (!exam.active)
      return fail(
        'exam-inactive',
        'That exam is not currently available.',
      );

    const existing = getLatestAttemptForUserExam(userId, examId);
    if (existing && existing.status === 'in-progress') {
      return fail(
        'attempt-in-progress',
        'You have an attempt in progress. Please resume or finish it first.',
      );
    }

    const randomSeed = `seed-${examId}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const drawnIds: string[] = [];
    for (const [moduleId, byDifficulty] of Object.entries(
      exam.blueprint.perModule,
    )) {
      for (const [difficulty, count] of Object.entries(byDifficulty)) {
        if (count <= 0) continue;
        const pool = devQuestions.filter(
          (q) =>
            q.moduleId === moduleId &&
            q.difficulty === difficulty &&
            !drawnIds.includes(q.id),
        );
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        for (let i = 0; i < count && i < shuffled.length; i++) {
          drawnIds.push(shuffled[i].id);
        }
      }
    }

    if (drawnIds.length < exam.blueprint.totalQuestions) {
      // eslint-disable-next-line no-console
      console.warn(
        `[api.startAttempt] Blueprint wanted ${exam.blueprint.totalQuestions} questions but only ${drawnIds.length} were available.`,
      );
    }

    const orderedIds = exam.rules.randomiseQuestionOrder
      ? [...drawnIds].sort(() => Math.random() - 0.5)
      : drawnIds;

    const deadlineAt =
      exam.rules.timeLimitMinutes > 0
        ? inMinutes(exam.rules.timeLimitMinutes)
        : inMinutes(24 * 60);

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

    devAttempts.push(attempt);
    persistDevAttempts();

    const questions = orderedIds
      .map((id) => getQuestionById(id))
      .filter((q): q is Question => Boolean(q))
      .map(toCandidateQuestion);

    return ok({ attempt, questions });
  } catch (e) {
    return fromError(e, 'Could not start the exam.');
  }
}

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

export async function saveAnswer(
  attemptId: string,
  answer: Answer,
): Promise<ApiResult<{ saved: true }>> {
  try {
    await delay(null, 80);
    const attempt = getAttemptById(attemptId);
    if (!attempt) return fail('attempt-not-found', 'Attempt not found.');
    if (attempt.status !== 'in-progress') {
      return fail(
        'attempt-closed',
        'This attempt has already been submitted.',
      );
    }
    if (!attempt.questionIds.includes(answer.questionId)) {
      return fail(
        'invalid-question',
        'That question is not part of this attempt.',
      );
    }
    attempt.answers[answer.questionId] = answer;
    persistDevAttempts();
    return ok({ saved: true });
  } catch (e) {
    return fromError(e, 'Could not save your answer.');
  }
}

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
        type === 'tab-switch' || type === 'fullscreen-exit'
          ? 'warning'
          : 'info',
    };
    attempt.proctorEventCount += 1;
    void event;
    persistDevAttempts();
    return ok({ logged: true });
  } catch (e) {
    return fromError(e, 'Could not log proctoring event.');
  }
}

export async function submitAttempt(
  attemptId: string,
  submittedBy: 'candidate' | 'server' = 'candidate',
): Promise<ApiResult<Attempt>> {
  try {
    // eslint-disable-next-line no-console
    console.log(
      '[api.submitAttempt] called — attempt:', attemptId,
      'by:', submittedBy,
    );
    await delay(null, 600);
    const attempt = getAttemptById(attemptId);
    if (!attempt) return fail('attempt-not-found', 'Attempt not found.');
    if (attempt.status !== 'in-progress') {
      return fail(
        'attempt-closed',
        'This attempt has already been submitted.',
      );
    }

    const exam = getExamById(attempt.examId);
    if (!exam) return fail('exam-not-found', 'Exam not found.');

    let correct = 0;
    const moduleStats: Record<string, { correct: number; total: number }> = {};

    for (const qid of attempt.questionIds) {
      const q = getQuestionById(qid);
      if (!q) continue;
      const answer = attempt.answers[qid];
      const correctIds = q.options
        .filter((o) => o.isCorrect)
        .map((o) => o.id)
        .sort();
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

    const scorePercent =
      attempt.questionIds.length > 0
        ? Math.round((correct / attempt.questionIds.length) * 100 * 10) / 10
        : 0;

    const maxSwitches = exam.rules.integrity.maxTabSwitches;
    const invalidatedByIntegrity =
      maxSwitches > 0 && attempt.proctorEventCount > maxSwitches;

    const passed =
      !invalidatedByIntegrity &&
      scorePercent >= exam.rules.passMarkPercent;

    if (invalidatedByIntegrity) {
      attempt.status = 'invalidated';
    } else {
      attempt.status =
        submittedBy === 'server' ? 'auto-submitted' : 'submitted';
    }
    attempt.submittedAt = new Date().toISOString();
    attempt.scorePercent = scorePercent;
    attempt.passed = passed;
    attempt.moduleBreakdown = moduleStats;

    persistDevAttempts();
    return ok(attempt);
  } catch (e) {
    return fromError(e, 'Could not submit the exam.');
  }
}

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

export async function getUserAttempts(
  userId: string,
): Promise<ApiResult<Attempt[]>> {
  try {
    await delay(null);
    return ok(getAttemptsForUser(userId));
  } catch (e) {
    return fromError(e, 'Could not load your attempts.');
  }
}

export async function getExamAttempts(
  examId: string,
): Promise<ApiResult<Attempt[]>> {
  try {
    await delay(null);
    return ok(getAttemptsForExam(examId));
  } catch (e) {
    return fromError(e, 'Could not load attempts for this exam.');
  }
}

// ---------------------------------------------------------------------------
// AUDIT LOG
// ---------------------------------------------------------------------------

export async function writeAudit(
  entry: Omit<AuditEntry, 'id' | 'timestamp'>,
): Promise<ApiResult<{ written: true }>> {
  try {
    await delay(null, 30);
    const full: AuditEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    };

    persistAuditEntry(full);
    return ok({ written: true });
  } catch (e) {
    return fromError(e, 'Could not write audit entry.');
  }
}

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

    let items = readPersistedAuditEntries();

    if (filters.actorId) {
      items = items.filter((e) => e.actorId === filters.actorId);
    }
    if (filters.entityType) {
      items = items.filter((e) => e.entityType === filters.entityType);
    }
    if (filters.entityId) {
      items = items.filter((e) => e.entityId === filters.entityId);
    }
    if (filters.fromDate) {
      const from = new Date(filters.fromDate).getTime();
      items = items.filter((e) => new Date(e.timestamp).getTime() >= from);
    }
    if (filters.toDate) {
      const to = new Date(filters.toDate).getTime();
      items = items.filter((e) => new Date(e.timestamp).getTime() <= to);
    }

    items.sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1));

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 100;
    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    return ok({
      items: paged,
      total: items.length,
      page,
      pageSize,
    });
  } catch (e) {
    return fromError(e, 'Could not load audit entries.');
  }
}

const DEV_AUDIT_STORAGE_KEY = 'flitedux_dev_audit_v1';

function readPersistedAuditEntries(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(DEV_AUDIT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AuditEntry[];
  } catch {
    return [];
  }
}

function persistAuditEntry(entry: AuditEntry): void {
  try {
    const existing = readPersistedAuditEntries();
    const capped = [entry, ...existing].slice(0, 5000);
    localStorage.setItem(DEV_AUDIT_STORAGE_KEY, JSON.stringify(capped));
  } catch {
    /* ignore */
  }
}

export function resetDevAuditLog(): void {
  try {
    localStorage.removeItem(DEV_AUDIT_STORAGE_KEY);
    // eslint-disable-next-line no-console
    console.log('[DEV] Audit log cleared. Reload to see the change.');
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// AUTH ERROR MAPPING
// ---------------------------------------------------------------------------

export function authErrorMessage(code: AuthErrorCode): string {
  const map: Record<AuthErrorCode, string> = {
    'invalid-credentials': 'Incorrect email or password.',
    'user-not-found': 'No account found for that email.',
    'user-not-confirmed':
      'Please check your inbox to confirm your email first.',
    'mfa-required': 'A verification code is required.',
    'mfa-invalid-code': 'That verification code is not valid.',
    'mfa-expired':
      'Your verification code has expired. Please request a new one.',
    'too-many-attempts': 'Too many attempts. Please try again later.',
    'password-reset-required':
      'You must reset your password before signing in.',
    'session-expired': 'Your session has expired. Please sign in again.',
    'network-error':
      'Network error. Please check your connection and try again.',
    unknown: 'Something went wrong. Please try again.',
  };
  return map[code] ?? 'Something went wrong. Please try again.';
}

// ---------------------------------------------------------------------------
// ENROLMENTS — course purchases
// ---------------------------------------------------------------------------

export async function createEnrolments(params: {
  userId: string;
  items: Array<{
    courseSlug: string;
    courseTitle: string;
    price: number;
    accessDurationDays?: number;
  }>;
  orderId?: string;
}): Promise<ApiResult<Enrolment[]>> {
  try {
    await delay(null, 300);

    const now = new Date();
    const orderId = params.orderId ?? `order-${Date.now()}`;

    const enrolments: Enrolment[] = params.items.map((item) => {
      let expiresAt: string | undefined;
      if (item.accessDurationDays && item.accessDurationDays > 0) {
        const expiry = new Date(now);
        expiry.setDate(expiry.getDate() + item.accessDurationDays);
        expiresAt = expiry.toISOString();
      }

      return {
        id: `enrol-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: params.userId,
        courseSlug: item.courseSlug,
        courseTitle: item.courseTitle,
        price: item.price,
        purchasedAt: now.toISOString(),
        expiresAt,
        status: 'active',
        orderId,
      };
    });

    persistEnrolments(enrolments);
    return ok(enrolments);
  } catch (e) {
    return fromError(e, 'Could not save your purchase.');
  }
}

export async function getUserEnrolments(
  userId: string,
): Promise<ApiResult<Enrolment[]>> {
  try {
    await delay(null, 150);
    const all = readPersistedEnrolments();
    const now = Date.now();

    let changed = false;
    const updated = all.map((e) => {
      if (
        e.status === 'active' &&
        e.expiresAt &&
        new Date(e.expiresAt).getTime() < now
      ) {
        changed = true;
        return { ...e, status: 'expired' as const };
      }
      return e;
    });

    if (changed) {
      try {
        localStorage.setItem(
          DEV_ENROLMENTS_STORAGE_KEY,
          JSON.stringify(updated),
        );
      } catch {
        /* ignore */
      }
    }

    return ok(updated.filter((e) => e.userId === userId));
  } catch (e) {
    return fromError(e, 'Could not load your courses.');
  }
}

export async function getUserEnrolmentForCourse(
  userId: string,
  courseSlug: string,
): Promise<ApiResult<Enrolment | null>> {
  try {
    await delay(null, 80);
    const all = readPersistedEnrolments();
    const now = Date.now();

    const enrolment = all.find(
      (e) => e.userId === userId && e.courseSlug === courseSlug,
    );

    if (!enrolment) return ok(null);

    if (
      enrolment.status === 'active' &&
      enrolment.expiresAt &&
      new Date(enrolment.expiresAt).getTime() < now
    ) {
      return ok({ ...enrolment, status: 'expired' });
    }

    return ok(enrolment);
  } catch (e) {
    return fromError(e, 'Could not check enrolment.');
  }
}

// ---------------------------------------------------------------------------
// ENROLMENT PERSISTENCE (dev-only)
// ---------------------------------------------------------------------------

const DEV_ENROLMENTS_STORAGE_KEY = 'flitedux_dev_enrolments_v1';

function readPersistedEnrolments(): Enrolment[] {
  try {
    const raw = localStorage.getItem(DEV_ENROLMENTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Enrolment[];
  } catch {
    return [];
  }
}

function persistEnrolments(newOnes: Enrolment[]): void {
  try {
    const existing = readPersistedEnrolments();
    const merged = [...existing, ...newOnes];
    localStorage.setItem(
      DEV_ENROLMENTS_STORAGE_KEY,
      JSON.stringify(merged),
    );
  } catch {
    /* ignore */
  }
}

export function resetDevEnrolments(): void {
  try {
    localStorage.removeItem(DEV_ENROLMENTS_STORAGE_KEY);
    // eslint-disable-next-line no-console
    console.log('[DEV] All enrolments cleared. Reload to see the change.');
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// COURSE CATALOGUE HELPERS
// ---------------------------------------------------------------------------

/**
 * Get a single course from the catalogue by slug.
 * Wraps the static `courses` array so consumers can look up a course
 * without importing the data file directly.
 */
export async function getCourseBySlug(
  slug: string,
): Promise<ApiResult<Course | null>> {
  try {
    await delay(null, 80);
    const mod = await import('../data/courses');
    const found = mod.courses.find((c) => c.slug === slug) ?? null;
    return ok(found);
  } catch (e) {
    return fromError(e, 'Could not load course.');
  }
}

// ---------------------------------------------------------------------------
// COURSE LEARNING — content, progress
// ---------------------------------------------------------------------------

/**
 * Get the learning content tree for a course.
 * Returns null if the course has no content yet.
 */
export async function getCourseContent(
  slug: string,
): Promise<ApiResult<CourseContent | null>> {
  try {
    await delay(null, 120);
    const content = getCourseContentFromData(slug);
    return ok(content);
  } catch (e) {
    return fromError(e, 'Could not load course content.');
  }
}

/**
 * Get all lesson progress for a user in a specific course.
 */
export async function getUserCourseProgress(
  userId: string,
  courseSlug: string,
): Promise<ApiResult<LessonProgress[]>> {
  try {
    await delay(null, 100);
    const all = readPersistedLessonProgress();
    const filtered = all.filter(
      (p) => p.userId === userId && p.courseSlug === courseSlug,
    );
    return ok(filtered);
  } catch (e) {
    return fromError(e, 'Could not load your progress.');
  }
}

/**
 * Save progress on a single lesson. Upserts — if a record already exists
 * for this user + course + lesson, it's replaced.
 */
export async function updateLessonProgress(params: {
  userId: string;
  courseSlug: string;
  lessonId: string;
  status: LessonProgress['status'];
  score?: number;
}): Promise<ApiResult<LessonProgress>> {
  try {
    await delay(null, 80);

    const now = new Date().toISOString();
    const all = readPersistedLessonProgress();

    const existingIndex = all.findIndex(
      (p) =>
        p.userId === params.userId &&
        p.courseSlug === params.courseSlug &&
        p.lessonId === params.lessonId,
    );

    const existing = existingIndex >= 0 ? all[existingIndex] : null;

    const updated: LessonProgress = {
      userId: params.userId,
      courseSlug: params.courseSlug,
      lessonId: params.lessonId,
      status: params.status,
      // Preserve startedAt if we had one, otherwise set it now
      startedAt: existing?.startedAt ?? now,
      // Only set completedAt when the status is 'completed'
      completedAt:
        params.status === 'completed'
          ? existing?.completedAt ?? now
          : undefined,
      // Preserve score if we don't have a new one
      score: params.score ?? existing?.score,
    };

    if (existingIndex >= 0) {
      all[existingIndex] = updated;
    } else {
      all.push(updated);
    }

    persistLessonProgress(all);
    return ok(updated);
  } catch (e) {
    return fromError(e, 'Could not save your progress.');
  }
}

/**
 * Mark every lesson in a course as not-started.
 * Used for testing — resets the user's progress.
 */
export async function resetUserCourseProgress(
  userId: string,
  courseSlug: string,
): Promise<ApiResult<{ reset: true }>> {
  try {
    await delay(null, 100);
    const all = readPersistedLessonProgress();
    const filtered = all.filter(
      (p) => !(p.userId === userId && p.courseSlug === courseSlug),
    );
    persistLessonProgress(filtered);
    return ok({ reset: true });
  } catch (e) {
    return fromError(e, 'Could not reset progress.');
  }
}

// ---------------------------------------------------------------------------
// LESSON PROGRESS PERSISTENCE (dev-only)
// ---------------------------------------------------------------------------

const DEV_LESSON_PROGRESS_STORAGE_KEY = 'flitedux_dev_lesson_progress_v1';

function readPersistedLessonProgress(): LessonProgress[] {
  try {
    const raw = localStorage.getItem(DEV_LESSON_PROGRESS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LessonProgress[];
  } catch {
    return [];
  }
}

function persistLessonProgress(records: LessonProgress[]): void {
  try {
    localStorage.setItem(
      DEV_LESSON_PROGRESS_STORAGE_KEY,
      JSON.stringify(records),
    );
  } catch {
    /* ignore */
  }
}

/**
 * Dev-only: wipe all lesson progress for all users.
 * Call from the browser console:
 *   import('/src/services/api.ts').then(m => m.resetDevLessonProgress())
 */
export function resetDevLessonProgress(): void {
  try {
    localStorage.removeItem(DEV_LESSON_PROGRESS_STORAGE_KEY);
    // eslint-disable-next-line no-console
    console.log('[DEV] Lesson progress cleared. Reload to see the change.');
  } catch {
    /* ignore */
  }
}