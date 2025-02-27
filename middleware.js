import { NextResponse } from 'next/server';

export function middleware(request) {
  // Проверяем, является ли запрос к админ-панели
  if (request.nextUrl.pathname.startsWith('/admin') && 
      !request.nextUrl.pathname.startsWith('/admin/login')) {
    
    // Получаем токен из cookie
    const token = request.cookies.get('adminToken');
    
    // Если токена нет, перенаправляем на страницу входа
    if (!token) {
      console.log('Middleware: adminToken отсутствует, перенаправление на страницу входа');
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    console.log('Middleware: adminToken найден, длина:', token.value.length);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
}; 