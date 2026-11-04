import AppProviders from '@/providers/AppProviders'
import AppRouter from '@/router/AppRouter'

/**
 * App — entry point của ứng dụng.
 * Chỉ ghép Providers + Router, không chứa bất kỳ logic nào khác.
 */
export default function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}
