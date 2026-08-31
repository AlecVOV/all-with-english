import { useCallback, useMemo, useState } from 'react';
import ExamShell from './components/ExamShell';
import ReviewScreen from './components/ReviewScreen';
import TestPicker from './components/TestPicker';
import { grade } from './lib/grading';
import type { SessionState } from './lib/storage';
import { clearSession, loadPrefs, loadSession, savePrefs, saveSession } from './lib/storage';
import type { LoadedTest } from './lib/tests';
import { tests } from './lib/tests';

type Screen = 'pick' | 'exam' | 'review';

export default function App(): JSX.Element {
  const [screen, setScreen] = useState<Screen>('pick');
  const [test, setTest] = useState<LoadedTest | null>(null);
  const [session, setSessionState] = useState<SessionState | null>(null);
  const [prefs, setPrefs] = useState(loadPrefs);

  const setSession = useCallback((s: SessionState) => setSessionState(s), []);

  const start = useCallback(
    (t: LoadedTest, mode: 'exam' | 'practice', minutes: number, candidate: string) => {
      const s: SessionState = {
        testId: t.id,
        mode,
        candidate,
        answers: {},
        flagged: [],
        highlights: [],
        seconds: mode === 'exam' ? minutes * 60 : 0,
        ...(mode === 'exam' ? { limitSeconds: minutes * 60 } : {}),
        submitted: false,
        updatedAt: Date.now(),
      };
      clearSession(t.id);
      saveSession(s);
      setTest(t);
      setSessionState(s);
      setScreen('exam');
    },
    []
  );

  const resume = useCallback((t: LoadedTest) => {
    const s = loadSession(t.id);
    if (!s) return;
    setTest(t);
    setSessionState(s);
    setScreen(s.submitted ? 'review' : 'exam');
  }, []);

  const submit = useCallback(() => {
    if (!session) return;
    const s = { ...session, submitted: true };
    saveSession(s);
    setSessionState(s);
    setScreen('review');
  }, [session]);

  const score = useMemo(
    () => (test && session ? grade(test, session.answers) : null),
    [test, session]
  );

  /** Làm lại chỉ những dạng sai — giữ nguyên đánh số câu (CLAUDE.md §6.3.7). */
  const retryTypes = useCallback(
    (typeIndexes: number[]) => {
      if (!test || !session) return;
      const s: SessionState = {
        ...session,
        answers: {},
        flagged: [],
        seconds: session.mode === 'exam' ? (session.limitSeconds ?? 3600) : 0,
        onlyTypes: typeIndexes,
        submitted: false,
        updatedAt: Date.now(),
      };
      saveSession(s);
      setSessionState(s);
      setScreen('exam');
    },
    [test, session]
  );

  const exit = useCallback(() => {
    setScreen('pick');
    setTest(null);
    setSessionState(null);
  }, []);

  const updatePrefs = useCallback((p: Partial<typeof prefs>) => {
    setPrefs((old) => {
      const next = { ...old, ...p };
      savePrefs(next);
      return next;
    });
  }, []);

  if (screen === 'exam' && test && session) {
    return (
      <ExamShell
        test={test}
        session={session}
        setSession={setSession}
        onSubmit={submit}
        onExit={exit}
        fontSize={prefs.fontSize}
        setFontSize={(n) => updatePrefs({ fontSize: n })}
        paper={prefs.paper}
        setPaper={(p) => updatePrefs({ paper: p })}
      />
    );
  }

  if (screen === 'review' && test && score) {
    return <ReviewScreen test={test} score={score} onRetryTypes={retryTypes} onExit={exit} />;
  }

  return <TestPicker tests={tests} onStart={start} onResume={resume} />;
}
