package com.nmt.history.imports;

import com.nmt.history.imports.ImportDtos.ImportedOption;
import com.nmt.history.imports.ImportDtos.ImportedQuestion;
import com.nmt.history.imports.ImportDtos.Preview;
import com.nmt.history.model.QuestionType;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Імпорт власного тексту вчителя: легальна альтернатива для матеріалів, на які вчитель має права.
 * Формат: необов'язковий рядок «# Назва», далі питання «1. Текст», варіанти «А) текст», правильні позначені
 * в кінці знаком «+» або «*», необов'язковий рядок «Пояснення: ...». Кілька позначених: питання з кількома відповідями.
 */
public final class TextTestParser {

    private static final Pattern QUESTION = Pattern.compile("^\\s*\\d{1,3}[.)]\\s+(.+)$");
    private static final Pattern OPTION = Pattern.compile("^\\s*([A-Za-zА-ЯІЇЄҐа-яіїєґ])[.)]\\s+(.+)$");
    private static final Pattern EXPLANATION = Pattern.compile("^\\s*Пояснення\\s*:\\s*(.+)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern MARK = Pattern.compile("\\s*[+*]\\s*$");

    private TextTestParser() {
    }

    public static Preview parse(String text) {
        String title = "Імпортований тест";
        List<ImportedQuestion> questions = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        String qText = null;
        String explanation = null;
        List<ImportedOption> options = new ArrayList<>();
        for (String raw : text.replace("\r", "").split("\n")) {
            String line = raw.strip();
            if (line.isEmpty()) {
                continue;
            }
            if (line.startsWith("# ") && questions.isEmpty() && qText == null) {
                title = line.substring(2).trim();
                continue;
            }
            Matcher q = QUESTION.matcher(line);
            Matcher o = OPTION.matcher(line);
            Matcher e = EXPLANATION.matcher(line);
            if (q.matches()) {
                flush(questions, qText, options, explanation);
                qText = q.group(1).trim();
                options = new ArrayList<>();
                explanation = null;
            } else if (qText != null && o.matches()) {
                String body = o.group(2).trim();
                boolean correct = MARK.matcher(body).find();
                options.add(new ImportedOption(MARK.matcher(body).replaceAll("").trim(), correct, null, null, null));
            } else if (qText != null && e.matches()) {
                explanation = e.group(1).trim();
            } else if (qText != null && options.isEmpty()) {
                qText = qText + "\n" + line;
            } else if (qText != null) {
                ImportedOption last = options.get(options.size() - 1);
                String body = line;
                boolean correct = MARK.matcher(body).find() || Boolean.TRUE.equals(last.isCorrect());
                options.set(options.size() - 1, new ImportedOption(
                        last.optionText() + " " + MARK.matcher(body).replaceAll("").trim(), correct, null, null, null));
            }
        }
        flush(questions, qText, options, explanation);
        if (questions.isEmpty()) {
            warnings.add("Не знайдено жодного питання. Пронумеруйте питання («1. ...») і варіанти («А) ...»).");
        }
        return new Preview(title, null, "Власний текст", "Імпортуйте лише ті матеріали, на використання яких ви маєте право.",
                questions, warnings);
    }

    private static void flush(List<ImportedQuestion> out, String text, List<ImportedOption> options, String explanation) {
        if (text == null) {
            return;
        }
        long correct = options.stream().filter(o -> Boolean.TRUE.equals(o.isCorrect())).count();
        if (options.size() < 2) {
            out.add(new ImportedQuestion(text, null, null, null, explanation, options, ImportDtos.UNSUPPORTED,
                    "Потрібно щонайменше 2 варіанти відповіді"));
            return;
        }
        QuestionType type = correct > 1 ? QuestionType.MULTIPLE_CHOICE : QuestionType.SINGLE_CHOICE;
        out.add(new ImportedQuestion(text, null, type, null, explanation, options,
                correct == 0 ? ImportDtos.NEEDS_REVIEW : ImportDtos.OK,
                correct == 0 ? "Не позначено правильну відповідь (додайте «+» в кінці варіанта)" : null));
    }
}
