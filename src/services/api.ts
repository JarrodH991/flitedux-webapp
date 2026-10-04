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

import type {
  AssignmentProgress,
  AssignmentWithProgress,
  CalendarEvent,
} from '../types/assignment.types';

import type { Certificate } from '../types/certificate.types';

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

import {
  getVisibleAssignmentsForUser as getVisibleAssignmentsForUserFromData,
  readPersistedAssignmentProgress as readPersistedAssignmentProgressFromData,
  persistAssignmentProgress as persistAssignmentProgressToStorage,
} from '../data/dev/devAssignments';

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
      startedAt: existing?.startedAt ?? now,
      completedAt:
        params.status === 'completed'
          ? existing?.completedAt ?? now
          : undefined,
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

export function resetDevLessonProgress(): void {
  try {
    localStorage.removeItem(DEV_LESSON_PROGRESS_STORAGE_KEY);
    // eslint-disable-next-line no-console
    console.log('[DEV] Lesson progress cleared. Reload to see the change.');
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// ASSIGNMENTS — teacher-assigned work
// ---------------------------------------------------------------------------
// An "assignment" is something a teacher wants a student to complete by a
// specific date. It can point at a lesson, quiz, exam, or be a free-form task.
//
// 🔌 AWS: Assignments live in DynamoDB `assignments` table.
//         Progress lives in `assignment_progress` (PK: userId, SK: assignmentId).
// ---------------------------------------------------------------------------

/**
 * Get every assignment visible to a specific user, enriched with the
 * user's progress and a computed status.
 */
export async function getAssignmentsForUser(
  userId: string,
): Promise<ApiResult<AssignmentWithProgress[]>> {
  try {
    await delay(null, 150);

    const assignments = getVisibleAssignmentsForUserFromData(userId);
    const progressList = readPersistedAssignmentProgressFromData();

    const now = new Date().getTime();

    const enriched: AssignmentWithProgress[] = assignments.map((a) => {
      const progress = progressList.find(
        (p) => p.userId === userId && p.assignmentId === a.id,
      );

      const dueMs = new Date(a.dueAt).getTime();
      const msUntilDue = dueMs - now;
      const daysUntilDue = Math.floor(msUntilDue / (1000 * 60 * 60 * 24));

      let status: AssignmentWithProgress['status'];
      if (progress?.status === 'completed') {
        const completedMs = progress.completedAt
          ? new Date(progress.completedAt).getTime()
          : now;
        status = completedMs > dueMs ? 'late' : 'completed';
      } else if (msUntilDue < 0) {
        status = 'overdue';
      } else if (msUntilDue < 1000 * 60 * 60 * 48) {
        status = 'due-soon';
      } else {
        status = 'upcoming';
      }

      return {
        assignment: a,
        progress,
        daysUntilDue,
        status,
      };
    });

    enriched.sort(
      (a, b) =>
        new Date(a.assignment.dueAt).getTime() -
        new Date(b.assignment.dueAt).getTime(),
    );

    return ok(enriched);
  } catch (e) {
    return fromError(e, 'Could not load your assignments.');
  }
}

/**
 * Upsert progress on an assignment.
 */
export async function markAssignmentProgress(params: {
  userId: string;
  assignmentId: string;
  status: AssignmentProgress['status'];
  score?: number;
}): Promise<ApiResult<AssignmentProgress>> {
  try {
    await delay(null, 80);

    const now = new Date().toISOString();
    const all = readPersistedAssignmentProgressFromData();

    const existingIndex = all.findIndex(
      (p) =>
        p.userId === params.userId &&
        p.assignmentId === params.assignmentId,
    );

    const existing = existingIndex >= 0 ? all[existingIndex] : null;

    const updated: AssignmentProgress = {
      userId: params.userId,
      assignmentId: params.assignmentId,
      status: params.status,
      startedAt: existing?.startedAt ?? now,
      completedAt:
        params.status === 'completed'
          ? existing?.completedAt ?? now
          : undefined,
      score: params.score ?? existing?.score,
    };

    if (existingIndex >= 0) {
      all[existingIndex] = updated;
    } else {
      all.push(updated);
    }

    persistAssignmentProgressToStorage(all);
    return ok(updated);
  } catch (e) {
    return fromError(e, 'Could not save assignment progress.');
  }
}

// ---------------------------------------------------------------------------
// CALENDAR — aggregated events
// ---------------------------------------------------------------------------

/**
 * Get every dated thing a user should see on their calendar:
 *   - Assignments
 *   - Course access expiries
 *
 * All normalised into CalendarEvent[] so the calendar page and mini widget
 * can render them uniformly.
 */
export async function getCalendarEvents(
  userId: string,
): Promise<ApiResult<CalendarEvent[]>> {
  try {
    await delay(null, 200);

    const events: CalendarEvent[] = [];

    // ---------------------------------------------------------------
    // 1. Assignments → CalendarEvents
    // ---------------------------------------------------------------
    const assignments = getVisibleAssignmentsForUserFromData(userId);
    const progressList = readPersistedAssignmentProgressFromData();

    for (const a of assignments) {
      const progress = progressList.find(
        (p) => p.userId === userId && p.assignmentId === a.id,
      );
      const completed = progress?.status === 'completed';

      let href = '/dashboard';
      if (a.type === 'lesson' || a.type === 'quiz') {
        href = `/courses/${a.courseSlug}/learn${
          a.lessonId ? `?lesson=${a.lessonId}` : ''
        }`;
      } else if (a.type === 'exam' && a.examId) {
        href = `/exam/exam/${a.examId}`;
      }

      events.push({
        id: `cal-${a.id}`,
        kind: 'assignment',
        title: a.title,
        description: a.description,
        date: a.dueAt,
        courseSlug: a.courseSlug,
        href,
        priority: a.priority,
        completed,
      });
    }

    // ---------------------------------------------------------------
    // 2. Enrolment expiries → CalendarEvents
    // ---------------------------------------------------------------
    const enrolments = readPersistedEnrolments();
    for (const e of enrolments) {
      if (e.userId !== userId) continue;
      if (!e.expiresAt) continue;
      if (e.status !== 'active') continue;

      events.push({
        id: `cal-expiry-${e.id}`,
        kind: 'course-access-expiry',
        title: `Access ends: ${e.courseTitle}`,
        description: 'Your access to this course expires on this date.',
        date: e.expiresAt,
        courseSlug: e.courseSlug,
        href: `/courses/${e.courseSlug}`,
        priority: 'normal',
        completed: false,
      });
    }

    events.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return ok(events);
  } catch (e) {
    return fromError(e, 'Could not load calendar events.');
  }
}

/**
 * Get a quick count of assignments due soon (within 7 days) or overdue.
 * Used by the "To Do" badge in the dashboard menu.
 */
export async function getTodoCount(
  userId: string,
): Promise<ApiResult<number>> {
  try {
    await delay(null, 60);

    const assignments = getVisibleAssignmentsForUserFromData(userId);
    const progressList = readPersistedAssignmentProgressFromData();
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    let count = 0;
    for (const a of assignments) {
      const progress = progressList.find(
        (p) => p.userId === userId && p.assignmentId === a.id,
      );
      if (progress?.status === 'completed') continue;

      const dueMs = new Date(a.dueAt).getTime();
      const msUntilDue = dueMs - now;

      if (msUntilDue <= sevenDaysMs) {
        count += 1;
      }
    }

    return ok(count);
  } catch (e) {
    return fromError(e, 'Could not load to-do count.');
  }
}

/**
 * Dev-only: reset all assignment progress.
 */
export function resetDevAssignments(): void {
  try {
    localStorage.removeItem('flitedux_dev_assignment_progress_v1');
    // eslint-disable-next-line no-console
    console.log('[DEV] Assignment progress cleared. Reload to see the change.');
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// CERTIFICATES — derived from passed attempts
// ---------------------------------------------------------------------------
// A certificate is a view onto an attempt where passed === true. There is no
// separate storage — every function here reads from the attempts table and
// projects it into the Certificate shape.
//
// 🔌 AWS: In production, this could either:
//           (a) stay derived from the attempts table, OR
//           (b) be materialised into a `certificates` table by a Lambda
//               triggered on exam pass — recommended if you need revocation
//               or re-issue tracking.
// ---------------------------------------------------------------------------

/**
 * Generate a deterministic certificate number from an attempt ID.
 * Format: FLX-{SUBJECT_CODE}-{YEAR}-{SERIAL}
 *
 * Both the subject code and serial are derived from the attempt so the same
 * attempt always produces the same certificate number.
 */
function makeCertificateNumber(
  attemptId: string,
  subjectId: string,
  issuedAt: string,
): string {
  // Subject code — last segment of "subj-dg" → "DG"
  const subjectCode = (subjectId.split('-').pop() ?? 'GEN').toUpperCase();

  // Year from the issued date
  const year = new Date(issuedAt).getFullYear();

  // Deterministic serial from the attempt ID.
  // We hash the ID and take the first 4 hex-ish digits, then pad.
  let hash = 0;
  for (let i = 0; i < attemptId.length; i++) {
    hash = (hash * 31 + attemptId.charCodeAt(i)) >>> 0;
  }
  const serial = String(hash % 10000).padStart(4, '0');

  return `FLX-${subjectCode}-${year}-${serial}`;
}

/**
 * Generate a short verification code from an attempt ID.
 * Format: 6 uppercase alphanumeric characters, e.g. "A7F3K9".
 */
function makeVerificationCode(attemptId: string): string {
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
  let hash = 0;
  for (let i = 0; i < attemptId.length; i++) {
    hash = (hash * 33 + attemptId.charCodeAt(i)) >>> 0;
  }
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[hash % ALPHABET.length];
    hash = Math.floor(hash / ALPHABET.length) + (hash % 7);
  }
  return code;
}

/**
 * Project a passed attempt + user + exam into a Certificate.
 * Returns null if any piece of data is missing.
 */
async function buildCertificate(
  attempt: Attempt,
): Promise<Certificate | null> {
  // Only passed attempts get certificates
  if (attempt.passed !== true) return null;
  if (attempt.status === 'invalidated') return null;

  // Look up the user, exam, and subject
  const user = findDevUserById(attempt.userId);
  const exam = getExamById(attempt.examId);
  const subject = exam ? getSubjectById(exam.subjectId) : null;

  if (!user || !exam) return null;

  const issuedAt = attempt.submittedAt ?? attempt.startedAt;

  return {
    id: attempt.id,
    userId: attempt.userId,
    recipientName: user.displayName,
    courseSlug: subject
      ? subject.name.toLowerCase().replace(/\s+/g, '-')
      : exam.subjectId,
    courseTitle: subject?.name ?? exam.title,
    examId: exam.id,
    examTitle: exam.title,
    attemptId: attempt.id,
    scorePercent: attempt.scorePercent ?? 0,
    issuedAt,
    certificateNumber: makeCertificateNumber(
      attempt.id,
      exam.subjectId,
      issuedAt,
    ),
    verificationCode: makeVerificationCode(attempt.id),
  };
}

/**
 * Get every certificate a user has earned.
 * Derived by projecting all of their passed attempts.
 *
 * Returns newest-first.
 */
export async function getCertificatesForUser(
  userId: string,
): Promise<ApiResult<Certificate[]>> {
  try {
    await delay(null, 200);

    const attempts = getAttemptsForUser(userId);
    const passed = attempts.filter(
      (a) => a.passed === true && a.status !== 'invalidated',
    );

    const certificates: Certificate[] = [];
    for (const attempt of passed) {
      const cert = await buildCertificate(attempt);
      if (cert) certificates.push(cert);
    }

    // Newest first
    certificates.sort(
      (a, b) =>
        new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
    );

    return ok(certificates);
  } catch (e) {
    return fromError(e, 'Could not load your certificates.');
  }
}

/**
 * Get a single certificate by its ID (which is the attempt ID it was derived
 * from). Returns null if the attempt doesn't exist or wasn't passed.
 */
export async function getCertificateById(
  id: string,
): Promise<ApiResult<Certificate | null>> {
  try {
    await delay(null, 120);

    const attempt = getAttemptById(id);
    if (!attempt) return ok(null);

    const cert = await buildCertificate(attempt);
    return ok(cert);
  } catch (e) {
    return fromError(e, 'Could not load certificate.');
  }
}