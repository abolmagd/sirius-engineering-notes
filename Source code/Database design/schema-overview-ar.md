# مخطط منطقي منقّى لقاعدة البيانات

ده مخطط تعليمي للعلاقات، وليس نسخة من قاعدة بيانات الإنتاج. الهدف منه توضيح فصل محتوى الأسئلة عن حالة الجلسات وعن العروض التجميعية، بحيث بنك كبير من الأسئلة لا يحتاج إلى joins ضخمة أو تحميل تاريخ المستخدم كاملًا في كل شاشة.

```mermaid
erDiagram
    QUESTION_CATALOG ||--o{ QUESTION_STIMULUS : "يربط"
    STIMULUS_GROUPS ||--o{ QUESTION_STIMULUS : "يحتوي"
    QUESTION_CATALOG ||--o{ QUESTION_SOURCES : "له مصادر"
    STUDY_SESSIONS ||--o{ SESSION_QUESTIONS : "تحتوي"
    QUESTION_CATALOG ||--o{ SESSION_QUESTIONS : "مختار داخل"
    SESSION_QUESTIONS ||--o| STUDY_ANSWERS : "يسجل"
    QUESTION_CATALOG ||--o| QUESTION_ENGAGEMENT_ROLLUPS : "ملخص"

    QUESTION_CATALOG {
        string question_id PK
        string year_key
        string module_key
        string subject_key
        string chapter_key
        string image_ref
    }
    STIMULUS_GROUPS {
        string stimulus_id PK
        string media_ref
        int position_count
    }
    QUESTION_STIMULUS {
        string question_id PK
        string stimulus_id PK
        int display_position
    }
    QUESTION_SOURCES {
        string question_id PK
        string source_key PK
    }
    STUDY_SESSIONS {
        string session_key PK
        string mode
        string filter_fingerprint
        string ordering_seed
        datetime updated_at
    }
    SESSION_QUESTIONS {
        string session_key PK
        string question_id PK
        int display_position
    }
    STUDY_ANSWERS {
        string session_key PK
        string question_id PK
        int attempt_count
        int correct_count
        int active_ms
        datetime updated_at
    }
    QUESTION_ENGAGEMENT_ROLLUPS {
        string question_id PK
        int bookmark_count
        int report_count
        datetime updated_at
    }
```

## تقسيمة المجالات

### ١. المحتوى الثابت

`question_catalog` يحتفظ بالبيانات الصغيرة اللازمة للفلترة والتعرف على السؤال. `stimulus_groups` يحتفظ ببيانات الحالة أو الوسائط المشتركة. جداول الربط تمنع تكرار صورة أو حالة كبيرة داخل كل سجل سؤال.

### ٢. حالة المذاكرة

`study_sessions` يحدد سياق جلسة المذاكرة المحفوظة. `session_questions` يحتفظ بمجموعة الأسئلة وترتيبها داخل هذا السياق. `study_answers` يستخدم المفتاح المركب `(session_key, question_id)`، وبالتالي إجابة السؤال نفسه في جلستين مختلفتين لا تكتب فوق بعضها.

### ٣. النماذج التجميعية للقراءة

`question_engagement_rollups` هو ملخص صغير لعدادات البوك مارك والبلاغات على مستوى السؤال. ويمكن فصل ملخص الليدر بورد حسب الفترة الزمنية. النماذج دي تمنع صفحات الليدر بورد أو السؤال من عمل join مع تاريخ خاص كامل.

## إرشادات تقسيم توضيحية

- **مجال المحتوى:** يتم تنظيم بيانات المنهج وجداول الربط حسب نطاق المنهج والإصدار، مع عمل indexes على أعمدة الفلترة والـIDs الثابتة، ومنع تكرار ملفات الصور الكبيرة داخل صف السؤال.
- **مجال حالة المذاكرة:** القراءات يتم تجميعها حول `session_key` غير المكشوف، مع مفاتيح مركبة تبدأ به. ده يحافظ على حجم نافذة الجلسة ويمنع تصادم نفس question ID عندما يظهر في جلستين.
- **المجال التجميعي:** يتم تقسيم أو تلخيص البيانات حسب الفترة والنطاق، حتى تقرأ صفحات الليدر بورد والتفاعل projection صغيرًا بدل تاريخ الأحداث الكامل.
- **حد الوسائط:** يتم حفظ مرجع الصورة وأبعادها بعد التحقق داخل بيانات الوصف، بينما يظل الملف نفسه ودورة الكاش منفصلين.

دي إرشادات تنظيم وأداء وليست تعليمات لنسخ layout الإنتاج. السيرفر الفعلي يحتاج أيضًا سياسات للصلاحيات والاحتفاظ والنسخ الاحتياطي والمعاملات.

## قواعد الربط

- ربط المحتوى بالـstimulus يتم من خلال `question_stimulus` بدل نسخ صورة الحالة في كل صف.
- ربط الجلسة بالأسئلة يتم من خلال `session_questions` للحفاظ على ترتيب كل جلسة.
- ربط الإجابات يتم باستخدام `session_key` و`question_id` معًا؛ استخدام أي عمود وحده غير كافٍ.
- الصفحات العامة تقرأ العدادات من الـrollups، ولا تربط تاريخ الحسابات الخاص بها.
- يتم عمل indexes على أعمدة فلاتر المنهج، ومفاتيح الجلسات المركبة، والـquestion IDs، والتقسيم حسب الوقت أو الفترة.

أمثلة الجافاسكريبت المصاحبة تشرح النموذج بدون اتصال بقاعدة بيانات: [`data-model.js`](data-model.js) و[`relationship-graph.js`](relationship-graph.js) و[`query-plans.js`](query-plans.js).
