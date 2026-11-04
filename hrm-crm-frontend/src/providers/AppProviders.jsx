import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { Toaster } from 'react-hot-toast'
import { antdTheme } from '@/config/antd-theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 phút
    },
  },
})

/**
 * AppProviders — bọc toàn bộ context/provider cần thiết.
 *
 * Thứ tự provider quan trọng:
 *  1. QueryClientProvider — data fetching global
 *  2. BrowserRouter       — routing
 *  3. ConfigProvider      — AntD theme (phải bọc toàn bộ app, không per-page)
 *  4. Toaster             — notification toast
 */
export default function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ConfigProvider theme={antdTheme}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: antdTheme.token.fontFamily,
                fontSize: 14,
                borderRadius: 10,
              },
              success: { duration: 3000 },
              error:   { duration: 4000 },
            }}
          />
        </ConfigProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
