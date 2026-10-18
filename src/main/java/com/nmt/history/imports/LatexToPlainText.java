package com.nmt.history.imports;

import java.util.function.Function;
import java.util.regex.MatchResult;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Перетворює поширені LaTeX-фрагменти з zno.osvita.ua на читабельний текст без MathJax.
 * Складні конструкції спрощуються; якщо лишаються зворотні слеші — викликач може позначити NEEDS_REVIEW.
 * <p>
 * Важливо: {@link Matcher#replaceAll(Function)} у JDK 21+ не екранує {@code \} у результаті функції,
 * тому всі заміни з можливими зворотними слешами йдуть через {@link #replaceQuoted}.
 */
final class LatexToPlainText {

    private static final Pattern INLINE = Pattern.compile("\\\\[(\\[](.+?)\\\\[)\\]]", Pattern.DOTALL);
    private static final Pattern DOLLAR_BLOCK = Pattern.compile("\\$\\$(.+?)\\$\\$", Pattern.DOTALL);
    private static final Pattern DOLLAR_INLINE = Pattern.compile("(?<!\\\\)\\$(?!\\$)(.+?)(?<!\\\\)\\$");
    private static final Pattern ENV = Pattern.compile("\\\\begin\\{[^}]+\\}(.+?)\\\\end\\{[^}]+\\}", Pattern.DOTALL);
    private static final Pattern FRAC = Pattern.compile("(-?)\\\\(?:d|t)?frac\\s*\\{([^{}]+)\\}\\s*\\{([^{}]+)\\}");
    /** Скорочений запис на кшталт \\dfrac 12 або \\frac12; мінус перед дробом входить у чисельник. */
    private static final Pattern FRAC_SHORT = Pattern.compile("(-?)\\\\(?:d|t)?frac\\s*(\\d+)\\s*(\\d+)");
    private static final Pattern SQRT_N = Pattern.compile("\\\\sqrt\\s*\\[([^\\]]+)\\]\\s*\\{([^{}]+)\\}");
    private static final Pattern SQRT = Pattern.compile("\\\\sqrt\\s*\\{([^{}]+)\\}");
    private static final Pattern TEXT = Pattern.compile("\\\\text\\s*\\{([^{}]*)\\}");
    private static final Pattern MATHRM = Pattern.compile("\\\\(?:mathrm|mathbf|mathit|mathrm)\\s*\\{([^{}]*)\\}");

    private LatexToPlainText() {
    }

    static String convert(String latex) {
        if (latex == null || latex.isBlank()) {
            return "";
        }
        String s = latex.trim();
        s = replaceQuoted(ENV, s, m -> " " + m.group(1).trim() + " ");
        s = replaceQuoted(DOLLAR_BLOCK, s, m -> unwrap(m.group(1)));
        s = replaceQuoted(INLINE, s, m -> unwrap(m.group(1)));
        s = replaceQuoted(DOLLAR_INLINE, s, m -> unwrap(m.group(1)));
        s = unwrap(s);
        // кілька проходів для вкладених frac/sqrt
        for (int i = 0; i < 4; i++) {
            String next = transformOnce(s);
            if (next.equals(s)) {
                break;
            }
            s = next;
        }
        s = s.replace("{,}", ",")
                .replace("\\,", " ")
                .replace("\\;", " ")
                .replace("\\!", "")
                .replace("\\ ", " ")
                .replace("~", " ")
                .replace("\\\\", " ")
                .replace("\\{", "{")
                .replace("\\}", "}")
                .replace("\\%", "%")
                .replace("\\_", "_")
                .replace("\\&", "&")
                .replace("\\#", "#");
        s = stripLeftoverCommands(s);
        s = s.replaceAll("[{}]", "");
        s = s.replaceAll("[ \\t]+", " ").replaceAll("\\s*\\n\\s*", "\n").trim();
        return s;
    }

    /** Чи лишилися нерозпізнані LaTeX-команди (для попередження). */
    static boolean hasUnresolvedLatex(String text) {
        return text != null && text.contains("\\");
    }

    private static String unwrap(String body) {
        return body == null ? "" : body.trim();
    }

    /**
     * Заміна з обов'язковим {@link Matcher#quoteReplacement(String)}, щоб зворотні слеші
     * у LaTeX не губилися (JDK 21+ {@code replaceAll(Function)} їх не екранує).
     */
    private static String replaceQuoted(Pattern pattern, String input, Function<MatchResult, String> replacer) {
        Matcher m = pattern.matcher(input);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            m.appendReplacement(sb, Matcher.quoteReplacement(replacer.apply(m)));
        }
        m.appendTail(sb);
        return sb.toString();
    }

    private static String transformOnce(String s) {
        s = replaceQuoted(TEXT, s, m -> m.group(1));
        s = replaceQuoted(MATHRM, s, m -> m.group(1));
        s = replaceQuoted(FRAC, s, m -> "(" + m.group(1) + m.group(2).trim() + ")/(" + m.group(3).trim() + ")");
        s = replaceQuoted(FRAC_SHORT, s, m -> "(" + m.group(1) + m.group(2) + ")/(" + m.group(3) + ")");
        s = replaceQuoted(SQRT_N, s, m -> "√[" + m.group(1).trim() + "](" + m.group(2).trim() + ")");
        s = replaceQuoted(SQRT, s, m -> "√(" + m.group(1).trim() + ")");
        // ^\circ / ^{\circ} до заміни одиночного \circ, інакше лишається ^°
        s = s.replace("^{\\circ}", "°").replace("^\\circ", "°");
        // команди зі пробілом після себе в джерелі → символ без зайвого пробілу
        // довші імена перед коротшими (\notin перед \in, \rightarrow перед \to, …)
        s = s.replaceAll("\\\\leqslant\\s*", "≤")
                .replaceAll("\\\\geqslant\\s*", "≥")
                .replaceAll("\\\\leq\\s*", "≤")
                .replaceAll("\\\\geq\\s*", "≥")
                .replaceAll("\\\\le\\s*", "≤")
                .replaceAll("\\\\ge\\s*", "≥")
                .replaceAll("\\\\neq\\s*", "≠")
                .replaceAll("\\\\ne\\s*", "≠")
                .replaceAll("\\\\approx\\s*", "≈")
                .replaceAll("\\\\angle\\s*", "∠")
                .replaceAll("\\\\degree\\s*", "°")
                .replaceAll("\\\\circ\\s*", "°")
                .replaceAll("\\\\infty\\s*", "∞")
                .replaceAll("\\\\cdot\\s*", "·")
                .replaceAll("\\\\times\\s*", "×")
                .replaceAll("\\\\pm\\s*", "±")
                .replaceAll("\\\\mp\\s*", "∓")
                .replaceAll("\\\\alpha\\s*", "α")
                .replaceAll("\\\\beta\\s*", "β")
                .replaceAll("\\\\gamma\\s*", "γ")
                .replaceAll("\\\\delta\\s*", "δ")
                .replaceAll("\\\\theta\\s*", "θ")
                .replaceAll("\\\\lambda\\s*", "λ")
                .replaceAll("\\\\sigma\\s*", "σ")
                .replaceAll("\\\\mu\\s*", "μ")
                .replaceAll("\\\\pi\\s*", "π")
                .replaceAll("\\\\notin\\s*", "∉")
                .replaceAll("\\\\subset\\s*", "⊂")
                .replaceAll("\\\\in\\s*", "∈")
                .replaceAll("\\\\cup\\s*", "∪")
                .replaceAll("\\\\cap\\s*", "∩")
                .replaceAll("\\\\rightarrow\\s*", "→")
                .replaceAll("\\\\Rightarrow\\s*", "⇒")
                .replaceAll("\\\\leftarrow\\s*", "←")
                .replaceAll("\\\\to\\s*", "→")
                .replaceAll("\\\\ldots\\s*", "…")
                .replaceAll("\\\\dots\\s*", "…")
                .replaceAll("\\\\qquad\\s*", " ")
                .replaceAll("\\\\quad\\s*", " ")
                .replaceAll("\\\\left\\s*", "")
                .replaceAll("\\\\right\\s*", "")
                .replaceAll("\\\\big\\s*", "")
                .replaceAll("\\\\Big\\s*", "")
                .replace("\\;", " ")
                .replace("\\:", " ");
        s = s.replaceAll("\\\\scriptstyle\\s*", "");
        s = s.replaceAll("\\\\displaystyle\\s*", "");
        s = simpleSuperscripts(s);
        return s;
    }

    private static String simpleSuperscripts(String s) {
        s = s.replace("^°", "°");
        Matcher m = Pattern.compile("\\^\\{([0-9+\\-n]+)\\}|\\^([0-9])").matcher(s);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            String digits = m.group(1) != null ? m.group(1) : m.group(2);
            m.appendReplacement(sb, Matcher.quoteReplacement(toSuperscript(digits)));
        }
        m.appendTail(sb);
        return sb.toString();
    }

    private static String toSuperscript(String digits) {
        StringBuilder out = new StringBuilder();
        for (char c : digits.toCharArray()) {
            out.append(switch (c) {
                case '0' -> '⁰';
                case '1' -> '¹';
                case '2' -> '²';
                case '3' -> '³';
                case '4' -> '⁴';
                case '5' -> '⁵';
                case '6' -> '⁶';
                case '7' -> '⁷';
                case '8' -> '⁸';
                case '9' -> '⁹';
                case '+' -> '⁺';
                case '-' -> '⁻';
                case 'n' -> 'ⁿ';
                default -> c;
            });
        }
        return out.toString();
    }

    private static String stripLeftoverCommands(String s) {
        // прибрати прості команди без аргументів: \something
        return s.replaceAll("\\\\[a-zA-Z]+\\*?", "");
    }
}
