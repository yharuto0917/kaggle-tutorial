import { competitions, docs } from "@/.source/server";
import { loader } from "fumadocs-core/source";

/**
 * content/learn 配下の学習コンテンツを /learn 以下のページツリーとして提供する loader。
 * ページ取得（getPage）・一覧（getPages）・SSG 用パラメータ（generateParams）を返す。
 */
export const source = loader({
	baseUrl: "/learn",
	source: docs.toFumadocsSource(),
});

/** content/competitions 配下のコンペウォークスルーを /competitions 以下として提供する loader。 */
export const competitionsSource = loader({
	baseUrl: "/competitions",
	source: competitions.toFumadocsSource(),
});
