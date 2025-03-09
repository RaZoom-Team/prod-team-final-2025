# Swagger UI: Описание работы и примеры использования

## Общее описание

Swagger UI представляет собой интерактивный интерфейс для взаимодействия с API. Данный инструмент позволяет:

- Просматривать доступные эндпоинты и их описание
- Изучать требуемые параметры и схемы запросов
- Анализировать возможные ответы и коды статусов
- Выполнять тестовые запросы непосредственно из браузера

## Аутентификация

Аутентификация в API реализована через JWT-токен, который передаётся в заголовке запроса `Authorization`. Процесс
аутентификации выполняется следующим образом:

1. Отправка запроса на эндпоинт `/auth/login` с учетными данными:

```json
{
  "email": "admin@gmail.com",
  "password": "123"
}
```

2. Получение токена в ответе:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJleHAiOjQxMDI0MzMwNjB9.x-inHRS-YoBmlXTGYr_3GdBXcdwiQ3qQqmPpNQgX5TY"
}
```

3. Использование полученного токена в заголовке для последующих запросов:

```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJleHAiOjQxMDI0MzMwNjB9.x-inHRS-YoBmlXTGYr_3GdBXcdwiQ3qQqmPpNQgX5TY
```

## Моковые данные для тестирования API

### 1. Управление коворкингами

#### Создание нового коворкинга

**Endpoint:** `POST /buildings`

```json
{
  "name": "Коворкинг Центральный",
  "description": "Современный коворкинг в центре города с панорамным видом",
  "open_from": 8,
  "open_till": 22,
  "address": "ул. Ленина, 42",
  "x": 55.7558,
  "y": 37.6176,
  "images_id": [
    "7de9728a-9a03-4af7-8431-8ac3710b2d56.jpeg",
    "1104129b-3564-4dcc-be59-b6a511b37a83.jpeg",
    "57ad95e0-c1a5-49fe-88f7-48b98a8008c2.jpeg"
  ]
}
```

#### Получение списка коворкингов

**Endpoint:** `GET /buildings`

Параметры запроса:

```
limit: 10
offset: 0
```

Пример ответа:

```json
[
  {
    "id": 1,
    "name": "Коворкинг Центральный",
    "description": "Современный коворкинг в центре города с панорамным видом",
    "open_from": 8,
    "open_till": 22,
    "address": "ул. Ленина, 42",
    "x": 55.7558,
    "y": 37.6176,
    "images_id": [
      "7de9728a-9a03-4af7-8431-8ac3710b2d56.jpeg",
      "1104129b-3564-4dcc-be59-b6a511b37a83.jpeg",
      "57ad95e0-c1a5-49fe-88f7-48b98a8008c2.jpeg"
    ],
    "image_urls": [
      "https://prod-team-39-c4d6ne1t.final.prodcontest.ru/api/files/7de9728a-9a03-4af7-8431-8ac3710b2d56.jpeg",
      "https://prod-team-39-c4d6ne1t.final.prodcontest.ru/api/files/1104129b-3564-4dcc-be59-b6a511b37a83.jpeg",
      "https://prod-team-39-c4d6ne1t.final.prodcontest.ru/api/files/57ad95e0-c1a5-49fe-88f7-48b98a8008c2.jpeg"
    ]
  },
  {
    "id": 2,
    "name": "Коворкинг Технопарк",
    "description": "Инновационное пространство для IT-специалистов",
    "open_from": 9,
    "open_till": 21,
    "address": "пр. Инноваций, 15",
    "x": 55.8123,
    "y": 37.5214,
    "images_id": [
      "7de9728a-9a03-4af7-8431-8ac3710b2d56.jpeg",
      "1104129b-3564-4dcc-be59-b6a511b37a83.jpeg"
    ],
    "image_urls": [
      "https://prod-team-39-c4d6ne1t.final.prodcontest.ru/api/files/7de9728a-9a03-4af7-8431-8ac3710b2d56.jpeg",
      "https://prod-team-39-c4d6ne1t.final.prodcontest.ru/api/files/1104129b-3564-4dcc-be59-b6a511b37a83.jpeg"
    ]
  }
]
```

#### Обновление информации о коворкинге

**Endpoint:** `PATCH /buildings/{building_id}`

```json
{
  "name": "Коворкинг Центральный Premium",
  "open_from": 7,
  "open_till": 23
}
```

### 2. Управление схемами и этажами

#### Создание нового этажа в коворкинге

**Endpoint:** `POST /buildings/{building_id}/schemes`

```json
{
  "floor": 1,
  "image_id": "7de9728a-9a03-4af7-8431-8ac3710b2d56.jpeg"
}
```

#### Получение схемы этажа

**Endpoint:** `GET /buildings/{building_id}/schemes/{floor}`

Пример ответа:

```json
{
  "floor": 1,
  "image_id": "7de9728a-9a03-4af7-8431-8ac3710b2d56.jpeg",
  "image_url": "https://prod-team-39-c4d6ne1t.final.prodcontest.ru/api/files/7de9728a-9a03-4af7-8431-8ac3710b2d56.jpeg",
  "places": [
    {
      "id": 1,
      "name": "Место A1",
      "features": [
        "розетка",
        "стол",
        "окно"
      ],
      "size": 1,
      "rotate": 0,
      "x": 10,
      "y": 20,
      "image_id": "7de9728a-9a03-4af7-8431-8ac3710b2d56.jpeg",
      "image_url": "https://prod-team-39-c4d6ne1t.final.prodcontest.ru/api/files/7de9728a-9a03-4af7-8431-8ac3710b2d56.jpeg"
    }
  ]
}
```

### 3. Управление местами

#### Создание нового места на этаже

**Endpoint:** `POST /buildings/{building_id}/schemes/{floor}`

```json
{
  "name": "Место A2",
  "features": [
    "розетка",
    "стол",
    "большое окно",
    "тихая зона"
  ],
  "size": 2,
  "rotate": 90,
  "x": 30,
  "y": 40,
  "image_id": "7de9728a-9a03-4af7-8431-8ac3710b2d56.jpeg"
}
```

#### Бронирование места

**Endpoint:** `POST /buildings/{building_id}/places/{place_id}/visits`

```json
{
  "visit_from": "2025-05-31T09:00:00",
  "visit_till": "2025-05-31T18:00:00"
}
```

Пример ответа:

```json
{
  "id": 123,
  "visit_from": "2025-05-31T09:00:00",
  "visit_till": "2025-05-31T18:00:00",
  "place": {
    "name": "string",
    "features": [],
    "size": 1,
    "rotate": 0,
    "x": 0,
    "y": 0,
    "image_id": "7de9728a-9a03-4af7-8431-8ac3710b2d56.jpeg",
    "id": 1,
    "building_id": 1,
    "floor": 11,
    "image_url": "https://prod-team-39-c4d6ne1t.final.prodcontest.ru/api/files/7de9728a-9a03-4af7-8431-8ac3710b2d56.jpeg"
  },
  "is_visited": false,
  "is_feedbacked": false,
  "is_ended": false
}
```

#### Оставление отзыва о месте

**Endpoint:** `POST /buildings/{building_id}/places/{place_id}/visits/{visit_id}/feedback`

```json
{
  "rating": 5,
  "text": "Отличное место для работы! Удобное расположение, хорошее освещение, тихо."
}
```

### 4. Управление клиентами

#### Получение информации о клиенте

**Endpoint:** `GET /clients/{client_id}`

Для получения информации о текущем авторизованном пользователе можно использовать `client_id = @me`.

Пример ответа:

```json
{
  "id": 42,
  "name": "Иван Иванов",
  "email": "test@mail.ru",
  "access_level": 2
}
```

#### Обновление информации о клиенте

**Endpoint:** `PATCH /clients/{client_id}`

```json
{
  "name": "Иван Петров"
}
```

## Обработка ошибок

Swagger UI также отображает возможные ошибки и их коды:

| HTTP-код | Описание                                            | Пример ответа                                                                                                                |
|----------|-----------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| 400      | Bad Request: Неверный формат запроса                | `{"error_code": 400, "message": "Неверный формат данных", "details": "Поле 'open_from' должно быть в диапазоне от 0 до 23"}` |
| 401      | Unauthorized: Отсутствие или недействительный токен | `{"error_code": 401, "message": "Требуется авторизация"}`                                                                    |
| 403      | Forbidden: Недостаточно прав                        | `{"error_code": 403, "message": "Недостаточно прав для выполнения операции"}`                                                |
| 404      | Not Found: Ресурс не найден                         | `{"error_code": 404, "message": "Коворкинг с ID 999 не найден"}`                                                             |
| 409      | Conflict: Конфликт данных                           | `{"error_code": 409, "message": "Место на это время уже забронировано"}`                                                     |
| 500      | Internal Server Error: Внутренняя ошибка сервера    | `{"error_code": 500, "message": "Внутренняя ошибка сервера"}`                                                                |

## Дополнительная информация

1. **Пагинация**: Для эндпоинтов, возвращающих списки, поддерживается пагинация через параметры `limit` и `offset`
2. **Фильтрация**: Для некоторых эндпоинтов доступна фильтрация результатов (например,
   `/buildings?features=розетка,окно`)
3. **Сортировка**: Доступна сортировка результатов через параметр `sort` (например, `/buildings?sort=name,asc`)
4. **Кэширование**: API поддерживает кэширование через заголовки `ETag` и `If-None-Match`