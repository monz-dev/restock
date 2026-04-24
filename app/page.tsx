import { redirect } from 'next/navigation';

/**
 * Root page - redirects to dashboard for MVP
 * Later: could show list of clients or login
 */

export default function RootPage() {
  // For MVP, redirect to dashboard
  redirect('/dashboard');
}