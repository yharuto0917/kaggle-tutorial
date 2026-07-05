"use client";

import { useSyncExternalStore } from "react";
import {
	getLessonProgressMap,
	type LessonProgressMap,
	type LessonStatus,
	markVisited,
	subscribeProgress,
	toggleCompleted,
} from "@/lib/progress-store";

/** 進捗マップ全体を購読する（サイドバーや進捗バー用）。SSR では空を返す。 */
export function useProgressMap(): LessonProgressMap {
	return useSyncExternalStore(
		subscribeProgress,
		getLessonProgressMap,
		() => getLessonProgressMap(), // getServerSnapshot: window 不在時は EMPTY を返す
	);
}

/** 1 レッスン分の状態と操作を返すフック。 */
export function useLessonProgress(lessonId: string): {
	status: LessonStatus | null;
	markVisited: () => void;
	toggle: () => void;
} {
	const map = useProgressMap();
	return {
		status: map[lessonId]?.status ?? null,
		markVisited: () => markVisited(lessonId),
		toggle: () => toggleCompleted(lessonId),
	};
}
