/**
 * Генерує повний URL для файлів uploads
 * Використовується для правильної роздачі статичних файлів коли фронт і бек на різних доменах
 */
export function getFullUploadUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null;
  
  // Якщо вже повний URL - повертаємо як є
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  // Отримуємо базовий URL бекенду з env або використовуємо localhost для розробки
  const backendUrl = process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';
  
  // Видаляємо початковий слеш якщо є
  const path = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  
  return `${backendUrl}/${path}`;
}

