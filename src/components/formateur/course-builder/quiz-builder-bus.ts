type QuizBuilderRequest = {
  chapterId?: string;
  testId?: string;
  title?: string;
  sectionId?: string;
  blockId?: string;
};

type Listener = (detail: QuizBuilderRequest) => void;

const listeners = new Set<Listener>();

export function requestQuizBuilder(detail: QuizBuilderRequest = {}) {
  listeners.forEach((listener) => listener(detail));
}

export function subscribeQuizBuilder(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
