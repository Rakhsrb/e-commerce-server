# 🛍️ E-commerce Backend

Это серверная часть для e-commerce платформы, построенная с использованием **Node.js**, **Express.js** и **MongoDB**. Она обеспечивает полный функционал для интернет-магазина: управление товарами, заказами, пользователями и оплатой.

## 🚀 Основные возможности

### 🔐 Аутентификация и авторизация

- Регистрация и вход с использованием JWT
- Роли пользователей: **покупатель**, **администратор**
- Профиль пользователя и история заказов

### 📦 Управление товарами

- CRUD-операции для товаров
- Категории, фильтрация, поиск
- Загрузка изображений (Multer)

### 🛒 Корзина и заказы

- Добавление и удаление товаров из корзины
- Оформление заказов и расчёт итоговой суммы
- Статусы заказов: _новый_, _в обработке_, _доставлен_

### 💳 Оплата и доставка

- Интеграция с платежными системами (Stripe)
- Настройка вариантов доставки

### 🛠️ Админ-панель (API)

- Управление товарами, заказами и пользователями
- Просмотр статистики и отчётов

## 🧰 Технологии

- **Node.js**, **Express.js** — серверная логика и маршруты
- **MongoDB**, **Mongoose** — база данных и работа с моделями
- **JWT** — безопасная аутентификация
- **Multer** — загрузка и хранение изображений
- **Stripe** — обработка платежей

## 📁 Структура проекта (пример)

```
├── controllers/
├── messages/
├── middlewares/
├── models/
├── routes/
├── validators/
└── index.js
```

## 📦 Установка и запуск

```bash
# Клонировать репозиторий
git clone https://github.com/yourname/ecommerce-backend.git
cd ecommerce-backend

# Установить зависимости
npm install

# Настроить переменные окружения
cp .env.example .env

# Запустить сервер
npm run dev
```
