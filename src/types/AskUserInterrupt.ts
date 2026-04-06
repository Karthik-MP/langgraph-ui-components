export interface QuestionOption {
  label: string;
  description?: string;
}

export interface Question {
  header: string;
  question: string;
  options?: QuestionOption[];
  allowFreeformInput?: boolean;
  multiSelect?: boolean;
}

export interface QuestionAnswer {
  selected: string[];
  freeText: string | null;
  skipped: boolean;
}

export interface AskUserResponse {
  answers: Record<string, QuestionAnswer>;
}

export interface AskUserInterruptProps {
  questions: Question[];
  onSubmit: (response: AskUserResponse) => void;
}
