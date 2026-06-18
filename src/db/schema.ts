import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

/**
 * アプリのデータモデル（D1 / SQLite）。
 *
 * - localStorage（#15/#16）のクイズ結果・レッスン進捗と構造をそろえ、#25 の同期を容易にする。
 * - OpenNext の tag-cache（`tags` 等）と名前が衝突しないテーブル名を使う。
 * - マイグレーションは drizzle-kit で生成し、wrangler で適用する（drizzle-kit push は禁止）。
 */

/** ユーザー（Better Auth 導入時 #24 に id を共有する想定の最小テーブル）。 */
export const users = sqliteTable("users", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	name: text("name"),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

/** レッスン進捗（ユーザー×レッスンで一意）。localStorage の lesson-progress に対応。 */
export const lessonProgress = sqliteTable(
	"lesson_progress",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		/** レッスン URL（例: /learn/ml-basics/01-what-is-ml） */
		lessonId: text("lesson_id").notNull(),
		status: text("status", { enum: ["in-progress", "completed"] }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
	},
	(t) => [unique("uq_lesson_progress_user_lesson").on(t.userId, t.lessonId)],
);

/** クイズ結果（ユーザー×クイズで一意）。localStorage の quiz-results に対応。 */
export const quizResults = sqliteTable(
	"quiz_results",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		quizId: text("quiz_id").notNull(),
		correct: integer("correct", { mode: "boolean" }).notNull(),
		/** 選んだ選択肢インデックスの配列を JSON 文字列で保持 */
		selected: text("selected").notNull(),
		answeredAt: integer("answered_at", { mode: "timestamp_ms" }).notNull(),
	},
	(t) => [unique("uq_quiz_results_user_quiz").on(t.userId, t.quizId)],
);

export type User = typeof users.$inferSelect;
export type LessonProgressRow = typeof lessonProgress.$inferSelect;
export type QuizResultRow = typeof quizResults.$inferSelect;
