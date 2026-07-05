/**
 * unit（jsdom）プロジェクト用のテストセットアップ。
 *
 * vitest の jsdom 環境では `window.localStorage` が未提供のことがあるため、
 * 決定的に振る舞う最小のインメモリ実装を注入する。
 */
class MemoryStorage implements Storage {
	private store = new Map<string, string>();

	get length(): number {
		return this.store.size;
	}
	clear(): void {
		this.store.clear();
	}
	getItem(key: string): string | null {
		return this.store.has(key) ? (this.store.get(key) ?? null) : null;
	}
	setItem(key: string, value: string): void {
		this.store.set(key, String(value));
	}
	removeItem(key: string): void {
		this.store.delete(key);
	}
	key(index: number): string | null {
		return Array.from(this.store.keys())[index] ?? null;
	}
}

if (typeof window !== "undefined") {
	Object.defineProperty(window, "localStorage", {
		value: new MemoryStorage(),
		configurable: true,
		writable: true,
	});
}
