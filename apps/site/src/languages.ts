export interface SiteLanguage {
  /** Game language code, the name of the `lang/<code>.json` file. */
  readonly code: string;
  /** Native name, like `language.name` + `language.region` in the game's language files. */
  readonly name: string;
}

export const BASE_LANGUAGE = 'en_us';

/** A selection of the game's languages. `en_us` is the built-in base and needs no download. */
export const LANGUAGES: readonly SiteLanguage[] = [
  { code: 'en_us', name: 'English (US)' },
  { code: 'en_gb', name: 'English (UK)' },
  { code: 'af_za', name: 'Afrikaans' },
  { code: 'ar_sa', name: 'العربية' },
  { code: 'bg_bg', name: 'Български' },
  { code: 'ca_es', name: 'Català' },
  { code: 'cs_cz', name: 'Čeština' },
  { code: 'cy_gb', name: 'Cymraeg' },
  { code: 'da_dk', name: 'Dansk' },
  { code: 'de_de', name: 'Deutsch' },
  { code: 'el_gr', name: 'Ελληνικά' },
  { code: 'es_es', name: 'Español (España)' },
  { code: 'es_mx', name: 'Español (México)' },
  { code: 'et_ee', name: 'Eesti' },
  { code: 'eu_es', name: 'Euskara' },
  { code: 'fa_ir', name: 'فارسی' },
  { code: 'fi_fi', name: 'Suomi' },
  { code: 'fil_ph', name: 'Filipino' },
  { code: 'fr_ca', name: 'Français (Canada)' },
  { code: 'fr_fr', name: 'Français (France)' },
  { code: 'ga_ie', name: 'Gaeilge' },
  { code: 'gl_es', name: 'Galego' },
  { code: 'he_il', name: 'עברית' },
  { code: 'hi_in', name: 'हिन्दी' },
  { code: 'hr_hr', name: 'Hrvatski' },
  { code: 'hu_hu', name: 'Magyar' },
  { code: 'id_id', name: 'Bahasa Indonesia' },
  { code: 'is_is', name: 'Íslenska' },
  { code: 'it_it', name: 'Italiano' },
  { code: 'ja_jp', name: '日本語' },
  { code: 'ko_kr', name: '한국어' },
  { code: 'lt_lt', name: 'Lietuvių' },
  { code: 'lv_lv', name: 'Latviešu' },
  { code: 'ms_my', name: 'Bahasa Melayu' },
  { code: 'nl_nl', name: 'Nederlands' },
  { code: 'no_no', name: 'Norsk' },
  { code: 'pl_pl', name: 'Polski' },
  { code: 'pt_br', name: 'Português (Brasil)' },
  { code: 'pt_pt', name: 'Português (Portugal)' },
  { code: 'ro_ro', name: 'Română' },
  { code: 'ru_ru', name: 'Русский' },
  { code: 'sk_sk', name: 'Slovenčina' },
  { code: 'sr_sp', name: 'Српски' },
  { code: 'sv_se', name: 'Svenska' },
  { code: 'th_th', name: 'ไทย' },
  { code: 'tr_tr', name: 'Türkçe' },
  { code: 'uk_ua', name: 'Українська' },
  { code: 'vi_vn', name: 'Tiếng Việt' },
  { code: 'zh_cn', name: '简体中文' },
  { code: 'zh_tw', name: '繁體中文' },
];
