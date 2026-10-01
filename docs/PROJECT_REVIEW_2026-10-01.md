# Независимый обзор — 1 октября 2026

Исходная точка: `main` / `8be5103`, после production-перехода #59 и полировки #60. Обзор основан на исходниках и локальных production-сборках; статус hosted Pages, GitHub Actions и настоящего Yandex SDK отдельно не проверялся.

## Что проверено

Полный путь: пустая Library → Shape → Paint → Mix-ins → Mix → Decor (лицо, наклейки, аксессуары) → Finish → Save → Squeeze → сохранённая Library. Размеры: 320×568, 390×844 (DPR 3), 844×390, 768×1024, 1440×900; языки RU/EN. Собраны 110 исходных и 110 повторных скриншотов. Скриншоты, JSON геометрии, видео движения и галерея находятся в `/workspace/review-artifacts/` и не добавлены в исходники.

Замеры ищут горизонтальное переполнение и видимые кнопки за пределами viewport; они не доказывают отсутствие любого перекрытия, корректность screen reader или производительность настоящего телефона. В исходных кадрах сразу после сохранения видна штатная анимация появления; прозрачность такого промежуточного кадра не является дефектом материала. Повторная съёмка ждёт завершения перехода.

## Исправлено в этом проходе

- `AGENTS.md`, основной README, карта docs и текущая часть PROJECT_DECISIONS теперь описывают production Phaser, lazy maker, изоляцию storage и шесть инвариантов #60. Удалено ошибочное утверждение bootstrap о том, что production никогда не импортирует Phaser.
- Ряды инструментов и действий Paint получили общую ширину, отступы 8px и явные grid-колонки. Узкие RU/EN подписи проверены на отсутствие переполнения.
- Кнопки продолжения Mix/Decor ограничены шириной 188px: их золотая текстура больше не растягивается в длинную полосу на широких панелях.
- Hall/Studio получили маленький слой медленно движущихся светлых частиц. Анимируются только transform/opacity декоративного слоя; игрушки, мебель и игровые canvas не анимируются этим эффектом. Слой не перехватывает input, отключается при reduced motion, приостанавливается в скрытой вкладке и при блокировке shell. Это ненавязчивое оживление, не полноценная анимация персонажей.
- Добавлены пять browser-регрессий для геометрии Paint и reduced motion / pointer-events атмосферы.

## Выводы и приоритеты

| Приоритет | Наблюдение | Что улучшить | Нужно ли решение владельца |
| --- | --- | --- | --- |
| Высокий | Палитра имеет кнопки 30–32px; часть подписей Decor/материалов очень мелкая. На 320px интерфейс помещается, но точность пальца и читаемость остаются слабым местом. | Проверить на телефоне, увеличить hit area/типографику; для самого узкого экрана компактно перераспределить сетку без прокрутки. Называть цвета, а не только «Цвет 1». | Решение владельца получено: никаких прокруток; более крупные touch-зоны при сохранении всех инструментов на экране. |
| Высокий | В tests нет `toHaveScreenshot` / `toMatchSnapshot`; снимки и проверки геометрии не ловят все визуальные сдвиги. | Добавить небольшой набор утверждённых эталонов: Library, Paint, Decor, Finish; RU/EN, телефон и landscape. Фиксировать состояние, шрифты и motion. | Решение владельца получено: добавить визуальную регрессию; 30 UI-эталонов включены в ветку. |
| Средний | Золотые action-кнопки используются и для основного действия, и для навигации/вкладок. Иерархия местами слабая, текст поверх бликов сложнее читать. | Сохранить выразительную главную кнопку, сделать вторичные элементы спокойнее и унифицировать контраст. | Решение владельца получено: более спокойные вторичные кнопки. |
| Средний | Часть production-кода находится в `experiments/phaser`, а main подключает множество исторических CSS-слоёв. | Поэтапно выделить production visual profile и единые токены отступов, размеров кнопок, цвета/focus. Переносить только с регрессиями; не переписывать физику/сохранения. | Новое продуктовое решение не требуется; отдельный небольшой технический проход. |
| Средний | Lazy Phaser chunk около 1.4MB до gzip. Headless Chromium не даёт доказательств плавности на слабом Android. | Измерить холодный вход в maker, декодирование Studio, FPS и память на реальном телефоне; оптимизировать по измерениям. | Нужен целевой слабый телефон/бюджет загрузки. |
| Низкий | Пустая desktop Library оставляет много свободного пространства; некоторые новички могут не связать пьедесталы с сохранёнными игрушками. | Проверить понятность первого входа; при необходимости добавить короткую подсказку возле свободного места. | Только если это подтвердится пользовательским тестом. |

Главный вывод: основная игра уже собрана. Полезнее укреплять читаемость, touch-удобство, визуальную регрессию и сопровождение, чем менять архитектуру или добавлять новые системы прогрессии. Более заметные покачивания растений/моргание игрушек требуют отдельного арт-прохода: некоторые пропсы запечены в общие PNG, а старое движение canvas специально отключали из-за перерисовок.

## Проверки

- `npm run release:check`: passed (strict TypeScript, 2 asset tests, production web/Yandex builds, upload-root audit).
- `npm run qa:browser`: 59 passed, включая 5 новых проверок.
- Дополнительные Pages-проверки Hall responsive/feel, Studio resilience/navigation: 5 passed.
- Реальный touch, Safari/iOS, hosted Yandex, рекламные callbacks и производительность слабого устройства не проверялись в этом проходе.

Повторный геометрический проход: 110 кадров, 0 случаев горизонтального переполнения, 0 кадров с кнопками за границами, 0 кадров с ошибками JavaScript.

Изменения подготовлены в `review/visual-polish-docs`; этот обзор не утверждает их публикацию или merge.

## Результат согласованного прохода без прокруток

Владелец согласовал улучшения, явно запретив любые прокрутки. Реализованы:

- Paint hit area 44×44px для всех 18 цветов; видимый кружок сохранён небольшим. Инструменты, размеры кисти и навигация получили touch-высоту 44px.
- Светлые вторичные кнопки и вкладки с тёмным текстом; золотая текстура сохранена у основных действий.
- Названия цветов и размеров кисти для accessibility; читаемые подписи вариантов Decor и наполнителей.
- Компактная сетка Studio исправлена для 568×320 и 667×375. Увеличен фиксированный лоток, чтобы новые controls не обрезались; небольшая мебель на коротком portrait ограничена высотой playfield и не перекрывает заголовок.
- Общие theme, typography, controls и room-motion вынесены в `src/app/styles`. Старые jelly entrypoints сохранены как совместимые CSS-импорты.
- `qa:visual` и CI-шаг сравнивают 30 Linux Chromium UI-эталонов: пять экранов, два языка, три размера. Canvas скрывается исключительно stylesheet-ом во время снимка, чтобы большой Finish render-buffer не маскировал сам интерфейс. Renderer/physics по-прежнему проверяют функциональные тесты.

Финальная матрица maker: 154 кадра (RU/EN, семь размеров), 0 ошибок JavaScript, 0 горизонтального/вертикального переполнения страницы, 0 видимых кнопок вне viewport. Отдельные проверки каталога/модальных окон выполняются дополнительно. Первоначальный параллельный прогон на 4 CPU дал timeout одного production-теста и одного screenshot capture; тяжёлые проверки после этого выполняются последовательно. Порог/ассерты ради прохождения не ослаблялись. Первый CI-прогон на GitHub и реальный телефон остаются отдельной проверкой.

Дополнительно устранены старые прокрутки в каталоге Ideas и окне замены: четыре карточки на страницу, все 24 идеи и все слоты доступны через pager. Смена страниц сама по себе не записывает Save V3. Добавлены регрессии доступности всех идей и замены последнего слота без потери остальных игрушек. Delete-dialog получил компактное оформление для короткого landscape.

Найден и исправлен фактический input-дефект полной Library на 568×320: прозрачная область thumbnail перекрывала «Новый сквиш» и перехватывала нажатие. Декоративный canvas больше не владеет input; header поднят над карточками, размеры короткого Hall скорректированы.


Финальные проверки после исправления Hall и добавления страниц:

- `npm run release:check`: passed (strict TS, 2 asset tests, web/Yandex builds, upload-root audit).
- `npm run qa:browser`: **69 passed**, полный последовательный прогон финальной сборки; повторных попыток нет.
- `npm run qa:visual`: **6 passed**, сравнение всех 30 UI-эталонов.
- Дополнительные Pages Hall/Studio: **5 passed**.
- Отдельный повтор новых pagination/replacement сценариев: **6 passed**, в том числе сохранность первых семи слотов после замены восьмого.

Галерея итогового интерфейса: `/workspace/review-artifacts/gallery.html`; снимки Ideas, полной Library и выбора слота — `/workspace/review-artifacts/card-pages-gallery.html`. Сборки и browser suites проверены локально. GitHub CI, hosted Yandex и настоящий телефон здесь не объявляются проверенными.

## Recovery of PR #61 and CI blockers

The recovered branch had advanced from `19e62de7` to `435e7940`. Pages run `36896993173` failed only because its localization assertion still expected «Цвет 1» while the reviewed UI used «Орхидея». Commit `435e7940` aligns that assertion and adds checks for the last color and the small brush; no input, rendering or storage behavior changes.

Release Browser QA run `36896993345` passed all 69 functional tests but rejected four Ideas snapshots (RU/EN at 320×568 and 844×390). Expected/actual/diff images from artifact `11179039859` were inspected in full, including enlarged text crops. The observed differences are text rasterization and small text-metric shifts on the Ubuntu 24.04 Chromium runner; card arrangement, content, pagination, viewport containment and button hierarchy are intact. The other 26 reviewed UI baselines are retained.

Disabling LCD text reduced the mismatch but did not resolve it (`36908717289`); disabling font hinting additionally changed previously passing Library snapshots (`36909584139`). Both experimental flags were removed. Only the four individually reviewed Ideas baselines were aligned to the original, unmodified CI Chromium captures. No screenshot masks, comparison threshold, retries or assertions were relaxed. Future intentional baseline updates must still inspect actual/diff images.

Release Browser QA now builds and audits both production targets, compares UI snapshots, then runs the same functional browser suite. This exposes visual failures earlier while retaining every PR gate. Local `release:check` and staged `pages:build` passed in the recovery workspace. Local browser installation was blocked by the download environment; browser/visual acceptance is performed on GitHub runners. Merge and live Pages acceptance remain conditional on the final head's successful checks and actual deployment.
