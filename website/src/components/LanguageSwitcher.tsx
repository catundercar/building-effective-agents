import { useLocale, type Locale } from "../i18n";

const LOCALES: { key: Locale; labelKey: string }[] = [
  { key: "zh-CN", labelKey: "lang.zhCN" },
  { key: "zh-TW", labelKey: "lang.zhTW" },
  { key: "en", labelKey: "lang.en" },
];

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div style={{
      display: "inline-flex",
      gap: 2,
      padding: 2,
      background: "var(--surface)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 6,
    }}>
      {LOCALES.map(({ key, labelKey }) => {
        const isActive = locale === key;
        return (
          <button
            key={key}
            onClick={() => setLocale(key)}
            style={{
              padding: "4px 10px",
              background: isActive ? "var(--surface-hover)" : "transparent",
              border: "1px solid",
              borderColor: isActive ? "var(--tab-active-border)" : "transparent",
              borderRadius: 4,
              color: isActive ? "var(--text)" : "var(--text-dim)",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
              transition: "all 0.2s",
              lineHeight: 1.4,
            }}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}
