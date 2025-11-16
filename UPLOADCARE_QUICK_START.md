# 🚀 Uploadcare - Швидкий старт

## Що потрібно зробити:

### 1️⃣ Додай ключі в `.env`

```env
UPLOADCARE_PUBLIC_KEY=твій_public_key
UPLOADCARE_SECRET_KEY=твій_secret_key
```

### 2️⃣ Перезапусти сервер

```bash
npm run dev
```

### 3️⃣ Готово! 🎉

Тепер всі зображення (пости та аватари) завантажуються в Uploadcare CDN.

---

## Перевірка:

**Створи пост з зображенням:**
```bash
POST /posts
Content-Type: multipart/form-data

text: "Тестовий пост"
image: <File>
```

**Відповідь:**
```json
{
  "post": {
    "imageUrl": "https://ucarecdn.com/{uuid}/"
  }
}
```

✅ Якщо URL починається з `https://ucarecdn.com/` - все працює!

❌ Якщо URL починається з `http://localhost:3000/uploads/` - перевір ключі в `.env`

---

## Де взяти ключі?

1. Зайди на [uploadcare.com/dashboard](https://uploadcare.com/dashboard/)
2. Вибери свій проект
3. Settings → API Keys
4. Скопіюй Public Key та Secret Key

---

## Що далі?

Читай повну документацію: [UPLOADCARE_SETUP.md](./UPLOADCARE_SETUP.md)
