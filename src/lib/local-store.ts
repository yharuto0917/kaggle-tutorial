/**
 * localStorage を安定参照つきでキャッシュ・購読する汎用ストア。
 *
 * `useSyncExternalStore` の getSnapshot は安定参照を返す必要があるため、
 * localStorage の生文字列が変わったときだけ再パースしてキャッシュする。
 * SSR（window 不在）時は常に `empty` を返す。
 */
export function createLocalStore<T>(storageKey: string, eventName: string, empty: T) {
	let cachedRaw: string | null = null;
	let cachedParsed: T = empty;

	/** 現在の値を返す（安定参照。生文字列が変わったときだけ再パース）。 */
	function get(): T {
		if (typeof window === "undefined") return empty;
		let raw: string | null = null;
		try {
			raw = window.localStorage.getItem(storageKey);
		} catch {
			raw = null;
		}
		if (raw !== cachedRaw) {
			cachedRaw = raw;
			try {
				cachedParsed = raw ? (JSON.parse(raw) as T) : empty;
			} catch {
				cachedParsed = empty;
			}
		}
		return cachedParsed;
	}

	/** 変更（storage / カスタムイベント）を購読する。 */
	function subscribe(onChange: () => void): () => void {
		if (typeof window === "undefined") return () => {};
		window.addEventListener("storage", onChange);
		window.addEventListener(eventName, onChange);
		return () => {
			window.removeEventListener("storage", onChange);
			window.removeEventListener(eventName, onChange);
		};
	}

	/** 値を書き込み、イベントを発火する。detail を渡すと同期層が拾える1件変更として通知する。 */
	function write(value: T, detail?: unknown): void {
		if (typeof window === "undefined") return;
		try {
			window.localStorage.setItem(storageKey, JSON.stringify(value));
			window.dispatchEvent(
				new CustomEvent(eventName, detail !== undefined ? { detail } : undefined),
			);
		} catch {
			// localStorage 非対応・容量超過時は永続化を諦める。
		}
	}

	return { get, subscribe, write, empty };
}
