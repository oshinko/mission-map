export const DEFAULT_TITLE = 'ミッションマップ';
export const DEFAULT_DESCRIPTION = 'あなただけの地図を作成しましょう。';
export const DEFAULT_MAP_AGE = 10 * 24 * 3600 * 1000;  // 10d

export const title = process.env.TITLE || DEFAULT_TITLE;
export const description = process.env.DESCRIPTION || DEFAULT_DESCRIPTION;
export const mapAge = process.env.DEFAULT_MAP_AGE ?
  Number(process.env.MAP_AGE) * 1000 :
  DEFAULT_MAP_AGE;
