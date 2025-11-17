# 💬 Коментарі та 🔄 Репости - Огляд функціоналу

## ✅ Що вже є на бекенді

### 💬 Коментарі - ПОВНІСТЮ РЕАЛІЗОВАНО

#### 📊 База даних (Prisma Schema)

```prisma
model Comment {
  id        String   @id @default(uuid())
  postId    String
  authorId  String
  text      String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  isDeleted Boolean  @default(false)  // Soft delete

  post      Post     @relation(fields: [postId], references: [id])
  author    User     @relation(fields: [authorId], references: [id])

  @@index([postId, createdAt])
  @@index([authorId])
}
```

**Особливості:**
- ✅ UUID для ID
- ✅ Зв'язок з постом та автором
- ✅ Текст без обмеження довжини
- ✅ Soft delete (isDeleted)
- ✅ Timestamps (createdAt, updatedAt)
- ✅ Індекси для швидкого пошуку

---

#### 🔌 API Endpoints

### 1. **Створити коментар**

**Endpoint:** `POST /posts/:id/comments`

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Текст коментаря"
}
```

**Response (201):**
```json
{
  "comment": {
    "id": "uuid",
    "postId": "uuid",
    "authorId": "uuid",
    "text": "Текст коментаря",
    "createdAt": "2025-11-17T00:00:00.000Z",
    "updatedAt": "2025-11-17T00:00:00.000Z",
    "isDeleted": false,
    "author": {
      "id": "uuid",
      "username": "username",
      "displayName": "Display Name",
      "avatarUrl": "https://..."
    }
  }
}
```

**Що відбувається:**
1. ✅ Перевіряє що пост існує
2. ✅ Створює коментар
3. ✅ Створює сповіщення для автора поста (якщо це не він сам)
4. ✅ Відправляє WebSocket подію `post:comment`

---

### 2. **Отримати коментарі поста**

**Endpoint:** `GET /posts/:id/comments`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
```
limit=50          // Кількість коментарів (default: 50)
cursor=uuid       // Для пагінації (опціонально)
```

**Response (200):**
```json
{
  "comments": [
    {
      "id": "uuid",
      "postId": "uuid",
      "authorId": "uuid",
      "text": "Текст коментаря",
      "createdAt": "2025-11-17T00:00:00.000Z",
      "updatedAt": "2025-11-17T00:00:00.000Z",
      "isDeleted": false,
      "author": {
        "id": "uuid",
        "username": "username",
        "displayName": "Display Name",
        "avatarUrl": "https://..."
      }
    }
  ],
  "nextCursor": "uuid" // або null якщо більше немає
}
```

**Особливості:**
- ✅ Cursor-based пагінація
- ✅ Сортування по даті (новіші зверху)
- ✅ Фільтрує видалені коментарі
- ✅ Включає інформацію про автора

---

### 3. **Видалити коментар**

**Endpoint:** `DELETE /posts/:postId/comments/:commentId`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "ok": true
}
```

**Особливості:**
- ✅ Тільки автор може видалити свій коментар
- ✅ Soft delete (isDeleted = true)
- ✅ Повертає 403 якщо не автор
- ✅ Повертає 404 якщо коментар не знайдено

---

#### 🔔 Сповіщення

При створенні коментаря:
1. Автор поста отримує сповіщення типу `comment`
2. Payload містить:
   ```json
   {
     "postId": "uuid",
     "commentId": "uuid",
     "userId": "uuid"  // автор коментаря
   }
   ```

---

#### 🌐 WebSocket Events

**Подія:** `post:comment`

**Кому:** Автор поста

**Payload:**
```json
{
  "comment": {
    "id": "uuid",
    "postId": "uuid",
    "text": "Текст",
    "author": { ... }
  }
}
```

**Використання на фронтенді:**
```typescript
socket.on('post:comment', ({ comment }) => {
  console.log('Новий коментар:', comment);
  // Оновити UI
});
```

---

#### 📊 Лічильник коментарів

В API `/posts/feed` та `/posts/:id` є лічильник:

```json
{
  "post": {
    "_count": {
      "comments": 5  // Кількість НЕ видалених коментарів
    }
  }
}
```

---

## ❌ Чого НЕМАЄ на бекенді

### 🔄 Репости - НЕ РЕАЛІЗОВАНО

**Що потрібно додати:**

#### 1. Модель Repost в Prisma

```prisma
model Repost {
  id        String   @id @default(uuid())
  userId    String   // Хто зробив репост
  postId    String   // Який пост
  comment   String?  @db.Text // Опціональний коментар до репосту
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
  post      Post     @relation(fields: [postId], references: [id])

  @@unique([userId, postId])
  @@index([userId])
  @@index([postId])
  @@index([createdAt])
}
```

#### 2. API Endpoints

**Створити репост:**
```
POST /posts/:id/repost
Body: { "comment": "Опціональний коментар" }
```

**Видалити репост:**
```
DELETE /posts/:id/repost
```

**Отримати репости користувача:**
```
GET /users/:username/reposts
```

#### 3. Оновити модель Post

Додати зв'язок:
```prisma
model Post {
  // ... існуючі поля
  reposts   Repost[]
}
```

#### 4. Оновити модель User

Додати зв'язок:
```prisma
model User {
  // ... існуючі поля
  reposts   Repost[]
}
```

#### 5. Додати в стрічку

Змінити логіку `/posts/feed` щоб показувати:
- Пости від користувачів
- Репости від користувачів

---

## 🎯 Рекомендації для фронтенду

### Коментарі

#### 1. Компонент CommentsList

```typescript
function CommentsList({ postId }: { postId: string }) {
  const [comments, setComments] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadComments = async () => {
    setLoading(true);
    const response = await fetch(
      `/posts/${postId}/comments?limit=20${cursor ? `&cursor=${cursor}` : ''}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    const data = await response.json();
    setComments(prev => [...prev, ...data.comments]);
    setCursor(data.nextCursor);
    setLoading(false);
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  return (
    <div>
      {comments.map(comment => (
        <Comment key={comment.id} comment={comment} />
      ))}
      {cursor && (
        <button onClick={loadComments} disabled={loading}>
          Завантажити більше
        </button>
      )}
    </div>
  );
}
```

#### 2. Створення коментаря

```typescript
async function createComment(postId: string, text: string) {
  const response = await fetch(`/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });
  
  const data = await response.json();
  return data.comment;
}
```

#### 3. Real-time оновлення

```typescript
useEffect(() => {
  socket.on('post:comment', ({ comment }) => {
    if (comment.postId === currentPostId) {
      setComments(prev => [comment, ...prev]);
      // Оновити лічильник
      updateCommentCount(prev => prev + 1);
    }
  });

  return () => {
    socket.off('post:comment');
  };
}, [currentPostId]);
```

---

## 📝 Приклади використання

### Створити коментар

```bash
curl -X POST https://twitter-bny4.onrender.com/posts/POST_ID/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Чудовий пост!"}'
```

### Отримати коментарі

```bash
curl https://twitter-bny4.onrender.com/posts/POST_ID/comments?limit=20 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Видалити коментар

```bash
curl -X DELETE https://twitter-bny4.onrender.com/posts/POST_ID/comments/COMMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🚀 Що можна покращити

### Коментарі

1. **Редагування коментарів**
   - Додати endpoint `PATCH /posts/:postId/comments/:commentId`
   - Зберігати історію редагувань

2. **Вкладені коментарі (replies)**
   - Додати поле `parentCommentId` в модель Comment
   - Дозволити відповідати на коментарі

3. **Лайки на коментарі**
   - Додати модель CommentLike
   - API для лайків коментарів

4. **Згадування (@mentions)**
   - Парсити текст коментаря
   - Створювати сповіщення для згаданих користувачів

5. **Медіа в коментарях**
   - Дозволити додавати зображення/GIF
   - Додати поле `imageUrl` в Comment

---

## ✅ Висновок

### Коментарі: ГОТОВО ✅
- ✅ Повна реалізація CRUD
- ✅ Пагінація
- ✅ Сповіщення
- ✅ WebSocket real-time
- ✅ Soft delete
- ✅ Лічильник коментарів

### Репости: НЕ РЕАЛІЗОВАНО ❌
- ❌ Немає моделі в БД
- ❌ Немає API endpoints
- ❌ Немає в стрічці
- ❌ Немає сповіщень

**Якщо потрібні репости - можу додати повну реалізацію!** 🚀
