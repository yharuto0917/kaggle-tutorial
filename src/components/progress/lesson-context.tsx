"use client";

import { createContext, type ReactNode, useContext } from "react";

/** 現在表示中のレッスン ID（= URL）。レッスン外では null。 */
const LessonContext = createContext<string | null>(null);

/** レッスン本文をラップし、子（Quiz など）へレッスン ID を伝える。 */
export function LessonProvider({ lessonId, children }: { lessonId: string; children: ReactNode }) {
	return <LessonContext.Provider value={lessonId}>{children}</LessonContext.Provider>;
}

/** 直近の LessonProvider のレッスン ID を取得する（無ければ null）。 */
export function useLessonId(): string | null {
	return useContext(LessonContext);
}
