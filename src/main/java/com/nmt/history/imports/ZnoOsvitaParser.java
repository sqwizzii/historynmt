package com.nmt.history.imports;

import com.nmt.history.imports.ImportDtos.ImportedOption;
import com.nmt.history.imports.ImportDtos.ImportedQuestion;
import com.nmt.history.imports.ImportDtos.Preview;
import com.nmt.history.model.QuestionType;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.web.util.HtmlUtils;

/**
 * Розбирає сторінку тесту zno.osvita.ua (структура перевірена на сторінках тестів НМТ). Не припускає однакової
 * структури: кожен тип завдання розпізнається за службовим полем q[tip], а все нерозпізнане позначається для
 * перевірки або як непідтримуване. Пояснення з сайту не імпортуються (це платні коментарі). Використовується лише
 * коли імпорт із цього джерела явно ввімкнено адміністратором платформи.
 */
public final class ZnoOsvitaParser {

    private static final String BASE = "https://zno.osvita.ua";
    private static final Pattern TIP = Pattern.compile("name=\"q\\[tip\\]\"\\s+value=\"(\\d+)\"");
    private static final Pattern RESULT = Pattern.compile("name=\"result\"\\s+value=\"([^\"]*)\"");
    private static final Pattern QUESTION = Pattern.compile("<div class=\"question\">(.*?)</div>", Pattern.DOTALL);
    private static final Pattern ANSWER = Pattern.compile("<div class=\"answer\"><span class=\"marker\">(.*?)</span>(.*?)</div>", Pattern.DOTALL);
    private static final Pattern IMG = Pattern.compile("<img[^>]+src=\"([^\"]+)\"", Pattern.CASE_INSENSITIVE);
    private static final Pattern TITLE = Pattern.compile("<title>(.*?)</title>", Pattern.DOTALL);

    private record Item(String marker, String text, String image) {
    }

    private ZnoOsvitaParser() {
    }

    public static Preview parse(String html, String url) {
        List<String> warnings = new ArrayList<>();
        List<ImportedQuestion> questions = new ArrayList<>();
        String[] cards = html.split("<div class=\"task-card");
        for (int i = 1; i < cards.length; i++) {
            questions.add(parseCard(i, cards[i], warnings));
        }
        if (questions.isEmpty()) {
            warnings.add("На сторінці не знайдено завдань у відомому форматі. Можливо, структуру сторінки змінено.");
        }
        return new Preview(title(html), "Джерело: " + url, "zno.osvita.ua",
                "Тести zno.osvita.ua захищені авторським правом сайту. Імпортуйте лише ті матеріали, на використання яких маєте право.",
                questions, warnings);
    }

    private static String title(String html) {
        Matcher m = TITLE.matcher(html);
        if (!m.find()) {
            return "Імпортований тест";
        }
        String t = clean(m.group(1));
        int dash = t.indexOf(" – ");
        return (dash > 0 ? t.substring(0, dash) : t).trim();
    }

    private static ImportedQuestion parseCard(int number, String card, List<String> warnings) {
        String prefix = "Завдання " + number + ": ";
        Matcher tipMatcher = TIP.matcher(card);
        String tip = tipMatcher.find() ? tipMatcher.group(1) : "?";
        Matcher qm = QUESTION.matcher(card);
        String questionHtml = qm.find() ? qm.group(1) : "";
        String text = clean(questionHtml);
        List<String> images = allImages(questionHtml);
        String image = images.isEmpty() ? null : images.get(0);
        List<String> extraImages = images.size() > 1 ? images.subList(1, images.size()) : List.of();
        boolean imagesLost = IMG.matcher(questionHtml).results().count() > images.size();
        List<List<Item>> blocks = answerBlocks(card);
        String result = RESULT.matcher(card).results().map(r -> r.group(1)).findFirst().orElse("");

        if (text.isEmpty()) {
            return unsupported(prefix + "не вдалося визначити текст завдання", text, image);
        }
        try {
            ImportedQuestion parsed = switch (tip) {
                case "1" -> single(text, image, blocks, result, prefix, warnings);
                case "7" -> multiple(text, image, blocks, result, prefix, warnings);
                case "4" -> matching(text, image, blocks, result, prefix, warnings);
                case "5" -> chronology(text, image, blocks, result, prefix);
                default -> unsupported("Тип завдання (код " + tip + ") не підтримується: додайте питання вручну", text, image);
            };
            return new ImportedQuestion(parsed.questionText(), parsed.imageUrl(), parsed.questionType(), parsed.topic(),
                    parsed.explanation(), parsed.options(), imagesLost && ImportDtos.OK.equals(parsed.status()) ? ImportDtos.NEEDS_REVIEW : parsed.status(),
                    imagesLost && parsed.note() == null ? prefix + "частину зображень не вдалося імпортувати (недозволене джерело): перевірте завдання" : parsed.note(),
                    extraImages, parsed.extraMatchChoices());
        } catch (RuntimeException e) {
            return unsupported("Не вдалося розібрати завдання: додайте його вручну", text, image);
        }
    }

    private static ImportedQuestion single(String text, String image, List<List<Item>> blocks, String result, String prefix,
                                            List<String> warnings) {
        List<Item> items = blocks.isEmpty() ? List.of() : blocks.get(0);
        List<ImportedOption> options = new ArrayList<>();
        int correct = result.length() == 1 ? result.charAt(0) - 'a' : -1;
        for (int i = 0; i < items.size(); i++) {
            options.add(option(items.get(i), i == correct));
        }
        boolean reliable = items.size() >= 2 && correct >= 0 && correct < items.size();
        return build(text, image, QuestionType.SINGLE_CHOICE, options, reliable,
                reliable ? null : prefix + "правильну відповідь не вдалося визначити надійно");
    }

    private static ImportedQuestion multiple(String text, String image, List<List<Item>> blocks, String result, String prefix,
                                              List<String> warnings) {
        List<Item> items = blocks.isEmpty() ? List.of() : blocks.get(0);
        List<String> chosen = List.of(result.split(";"));
        List<ImportedOption> options = new ArrayList<>();
        int hits = 0;
        for (Item item : items) {
            boolean isCorrect = chosen.contains(item.marker().trim());
            hits += isCorrect ? 1 : 0;
            options.add(option(item, isCorrect));
        }
        boolean reliable = items.size() >= 2 && hits > 0 && hits == chosen.stream().filter(s -> !s.isBlank()).count();
        return build(text, image, QuestionType.MULTIPLE_CHOICE, options, reliable,
                reliable ? null : prefix + "правильні відповіді не вдалося визначити надійно");
    }

    private static ImportedQuestion matching(String text, String image, List<List<Item>> blocks, String result, String prefix,
                                              List<String> warnings) {
        if (blocks.size() < 2) {
            return unsupported("Не вдалося розпізнати колонки завдання на відповідність", text, image);
        }
        List<Item> left = blocks.get(0);
        List<Item> right = blocks.get(1);
        Map<String, String> answer = pairs(result);
        List<ImportedOption> options = new ArrayList<>();
        java.util.Set<Integer> used = new java.util.HashSet<>();
        boolean reliable = left.size() >= 2 && answer.size() == left.size();
        java.util.Set<String> keys = new java.util.HashSet<>();
        for (Item l : left) {
            String letter = answer.get(l.marker().trim());
            int idx = letter == null || letter.length() != 1 ? -1 : letter.charAt(0) - 'a';
            if (idx < 0 || idx >= right.size()) {
                reliable = false;
                options.add(new ImportedOption(label(l), false, null, null, l.image()));
                continue;
            }
            used.add(idx);
            String key = label(right.get(idx));
            reliable &= keys.add(key);
            options.add(new ImportedOption(label(l), false, key, null, l.image()));
        }
        List<String> distractors = new ArrayList<>();
        for (int i = 0; i < right.size(); i++) {
            if (!used.contains(i)) {
                String label = label(right.get(i));
                reliable &= keys.add(label);
                distractors.add(label);
            }
        }
        return new ImportedQuestion(text, image, QuestionType.MATCHING, null, null, options,
                reliable ? ImportDtos.OK : ImportDtos.NEEDS_REVIEW,
                reliable ? null : prefix + "пари не вдалося визначити надійно",
                List.of(), distractors);
    }

    private static ImportedQuestion chronology(String text, String image, List<List<Item>> blocks, String result, String prefix) {
        List<Item> items = blocks.isEmpty() ? List.of() : blocks.get(0);
        Map<String, String> positions = pairs(result);
        Integer[] order = new Integer[items.size()];
        boolean reliable = items.size() >= 2 && positions.size() == items.size();
        for (Map.Entry<String, String> e : positions.entrySet()) {
            int idx = e.getValue().length() == 1 ? e.getValue().charAt(0) - 'a' : -1;
            int position;
            try {
                position = Integer.parseInt(e.getKey());
            } catch (NumberFormatException ex) {
                reliable = false;
                continue;
            }
            if (idx < 0 || idx >= items.size() || order[idx] != null) {
                reliable = false;
            } else {
                order[idx] = position;
            }
        }
        List<ImportedOption> options = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            reliable &= order[i] != null;
            options.add(new ImportedOption(label(items.get(i)), false, null, order[i], items.get(i).image()));
        }
        return new ImportedQuestion(text, image, QuestionType.CHRONOLOGY, null, null, options,
                reliable ? ImportDtos.OK : ImportDtos.NEEDS_REVIEW,
                reliable ? null : prefix + "послідовність не вдалося визначити надійно");
    }

    private static Map<String, String> pairs(String result) {
        Map<String, String> map = new LinkedHashMap<>();
        for (String part : result.split(";")) {
            String p = part.trim();
            if (p.length() >= 2) {
                map.put(p.substring(0, p.length() - 1), p.substring(p.length() - 1));
            }
        }
        return map;
    }

    private static ImportedQuestion build(String text, String image, QuestionType type, List<ImportedOption> options,
                                           boolean reliable, String note) {
        return new ImportedQuestion(text, image, type, null, null, options,
                reliable ? ImportDtos.OK : ImportDtos.NEEDS_REVIEW, note);
    }

    private static ImportedQuestion unsupported(String note, String text, String image) {
        return new ImportedQuestion(text, image, null, null, null, List.of(), ImportDtos.UNSUPPORTED, note);
    }

    private static ImportedOption option(Item item, boolean correct) {
        return new ImportedOption(label(item), correct, null, null, item.image());
    }

    private static String label(Item item) {
        return item.text().isBlank() ? "Варіант " + clean(item.marker()) : item.text();
    }

    private static List<List<Item>> answerBlocks(String card) {
        List<List<Item>> blocks = new ArrayList<>();
        Matcher start = Pattern.compile("<div class=\"answers[^\"]*\"[^>]*>").matcher(card);
        List<Integer> starts = new ArrayList<>();
        while (start.find()) {
            starts.add(start.end());
        }
        int endMarker = card.indexOf("<div class=\"clear mb10\"");
        for (int i = 0; i < starts.size(); i++) {
            int end = i + 1 < starts.size() ? card.lastIndexOf("<div class=\"answers", starts.get(i + 1)) : (endMarker > 0 ? endMarker : card.length());
            if (end < starts.get(i)) {
                end = card.length();
            }
            List<Item> items = new ArrayList<>();
            Matcher m = ANSWER.matcher(card.substring(starts.get(i), end));
            while (m.find()) {
                items.add(new Item(clean(m.group(1)), clean(m.group(2)), firstImage(m.group(2))));
            }
            blocks.add(items);
        }
        return blocks;
    }

    private static String firstImage(String html) {
        List<String> all = allImages(html);
        return all.isEmpty() ? null : all.get(0);
    }

    /** Усі дозволені зображення у порядку появи; зображення з інших доменів відкидаються (про це сигналізує викликач). */
    private static List<String> allImages(String html) {
        List<String> result = new ArrayList<>();
        Matcher m = IMG.matcher(html);
        while (m.find()) {
            String src = m.group(1).trim();
            String absolute = src.startsWith("/") ? BASE + src : src;
            if (absolute.startsWith(BASE + "/") && absolute.length() <= 2000 && !absolute.contains(" ")) {
                result.add(absolute);
            }
        }
        return result;
    }

    static String clean(String html) {
        String text = html.replaceAll("(?i)<br\\s*/?>", "\n").replaceAll("(?i)</p>", "\n").replaceAll("<[^>]+>", "");
        text = HtmlUtils.htmlUnescape(text).replace('\u00a0', ' ');
        return text.replaceAll("[ \\t]+", " ").replaceAll("\\s*\\n\\s*", "\n").trim();
    }
}
