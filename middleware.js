import { NextResponse } from 'next/server';

export function middleware(request) {
  // Проверяем, является ли запрос к админ-панели
  if (request.nextUrl.pathname.startsWith('/admin') && 
      !request.nextUrl.pathname.startsWith('/admin/login')) {
    
    // Получаем токен из cookie
    const token = request.cookies.get('admin_token');
    
    // Если токена нет, перенаправляем на страницу входа
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
}; 