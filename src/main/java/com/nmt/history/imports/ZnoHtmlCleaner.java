package com.nmt.history.imports;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.web.util.HtmlUtils;

/**
 * Очищення HTML завдань zno.osvita.ua: сутності, &lt;latex&gt;, зайві теги, пробіли — без втрати математики.
 */
final class ZnoHtmlCleaner {

    private static final Pattern LATEX_TAG = Pattern.compile("(?is)<latex\\b[^>]*>(.*?)</latex>");
    private static final Pattern MATH_SCRIPT = Pattern.compile(
            "(?is)<script[^>]*type\\s*=\\s*[\"']math/tex[\"'][^>]*>(.*?)</script>");
    private static final Pattern MATHML = Pattern.compile("(?is)<math\\b[^>]*>(.*?)</math>");
    private static final Pattern ANNOTATION = Pattern.compile("(?is)<annotation\\b[^>]*encoding=[\"']application/x-tex[\"'][^>]*>(.*?)</annotation>");

    private ZnoHtmlCleaner() {
    }

    static String clean(String html) {
        if (html == null || html.isBlank()) {
            return "";
        }
        String s = html;
        // Спочатку витягуємо формули, щоб їхній вміст не загубився під час зняття тегів.
        s = replaceBlocks(s, ANNOTATION);
        s = replaceBlocks(s, MATH_SCRIPT);
        s = replaceBlocks(s, LATEX_TAG);
        s = replaceBlocks(s, MATHML);
        s = s.replaceAll("(?i)<br\\s*/?>", "\n");
        s = s.replaceAll("(?i)</p>", "\n");
        s = s.replaceAll("(?i)</div>", "\n");
        s = s.replaceAll("(?i)</li>", "\n");
        s = s.replaceAll("<[^>]+>", "");
        s = HtmlUtils.htmlUnescape(s);
        s = s.replace('\u00a0', ' ').replace('\u202f', ' ').replace('\u2009', ' ');
        // Прибрати артефакти подвійного екранування
        if (s.contains("&lt;") || s.contains("&#")) {
            s = HtmlUtils.htmlUnescape(s);
        }
        s = s.replaceAll("[ \\t\\x0B\\f\\r]+", " ");
        s = s.replaceAll(" *\\n *", "\n");
        s = s.replaceAll("\\n{3,}", "\n\n");
        return s.trim();
    }

    private static String replaceBlocks(String html, Pattern pattern) {
        Matcher m = pattern.matcher(html);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            String plain = LatexToPlainText.convert(m.group(1));
            m.appendReplacement(sb, Matcher.quoteReplacement(plain));
        }
        m.appendTail(sb);
        return sb.toString();
    }
}
