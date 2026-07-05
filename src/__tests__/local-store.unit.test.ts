import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLocalStore } from "@/lib/local-store";

type Item = { value: string };

const KEY = "kt:test-store";
const EVENT = "kt:test-store-event";
const EMPTY: Item = { value: "" };

beforeEach(() => {
	window.localStorage.clear();
});

describe("createLocalStore", () => {
	it("未保存時は empty を返す", () => {
		const store = createLocalStore<Item>(KEY, EVENT, EMPTY);
		expect(store.get()).toBe(EMPTY);
	});

	it("write した内容を get で取得できる", () => {
		const store = createLocalStore<Item>(KEY, EVENT, EMPTY);
		store.write({ value: "a" });
		expect(store.get()).toEqual({ value: "a" });
	});

	it("生文字列が変わらない限り同一参照を返す（安定参照）", () => {
		const store = createLocalStore<Item>(KEY, EVENT, EMPTY);
		store.write({ value: "a" });
		const first = store.get();
		const second = store.get();
		expect(first).toBe(second);
	});

	it("write で detail なしのイベントが発火する（一括置換）", () => {
		const store = createLocalStore<Item>(KEY, EVENT, EMPTY);
		const onChange = vi.fn();
		window.addEventListener(EVENT, onChange);
		store.write({ value: "a" });
		expect(onChange).toHaveBeenCalledTimes(1);
		expect((onChange.mock.calls[0][0] as CustomEvent).detail).toBeNull();
		window.removeEventListener(EVENT, onChange);
	});

	it("write の第 2 引数（detail）付きでイベントが発火する（1 件変更）", () => {
		const store = createLocalStore<Item>(KEY, EVENT, EMPTY);
		const onChange = vi.fn();
		window.addEventListener(EVENT, onChange);
		store.write({ value: "a" }, { id: "x" });
		expect((onChange.mock.calls[0][0] as CustomEvent).detail).toEqual({ id: "x" });
		window.removeEventListener(EVENT, onChange);
	});

	it("subscribe した onChange は storage / カスタムイベントの両方で呼ばれる", () => {
		const store = createLocalStore<Item>(KEY, EVENT, EMPTY);
		const onChange = vi.fn();
		const unsubscribe = store.subscribe(onChange);
		window.dispatchEvent(new CustomEvent(EVENT));
		window.dispatchEvent(new Event("storage"));
		expect(onChange).toHaveBeenCalledTimes(2);
		unsubscribe();
		window.dispatchEvent(new CustomEvent(EVENT));
		expect(onChange).toHaveBeenCalledTimes(2);
	});

	it("壊れた JSON が保存されていれば empty を返す", () => {
		window.localStorage.setItem(KEY, "not-json");
		const store = createLocalStore<Item>(KEY, EVENT, EMPTY);
		expect(store.get()).toBe(EMPTY);
	});
});
