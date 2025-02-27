import { NextResponse } from 'next/server';

export function middleware(request) {
  // Проверяем, является ли запрос к админ-панели
  if (request.nextUrl.pathname.startsWith('/admin') && 
      !request.nextUrl.pathname.startsWith('/admin/login')) {
    
    console.log('Middleware: проверка доступа к админ-панели, путь:', request.nextUrl.pathname);
    
    // Получаем токен из cookie
    const token = request.cookies.get('adminToken');
    const nextAuthToken = request.cookies.get('__Secure-next-auth.session-token') || 
                          request.cookies.get('next-auth.session-token');
    
    // Проверяем наличие токенов
    if (!token && !nextAuthToken) {
      console.log('Middleware: токены отсутствуют, перенаправление на страницу входа');
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    if (token) {
      console.log('Middleware: adminToken найден, длина:', token.value.length);
    }
    
    if (nextAuthToken) {
      console.log('Middleware: nextAuthToken найден');
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
}; 