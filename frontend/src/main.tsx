import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router'
import { router } from './routes/__root'
import * as RadixToast from '@radix-ui/react-toast';
import { ToastProvider } from './components/toast/ToastProvider';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Suspense fallback={<div>Loading...</div>}>
            <QueryClientProvider client={queryClient}>
                <RadixToast.Provider swipeDirection="right">
                    <ToastProvider>
                        <RouterProvider router={router} />
                    </ToastProvider>
                    <RadixToast.Viewport className="fixed top-20 right-6 z-40 flex flex-col gap-2" />
                </RadixToast.Provider>
            </QueryClientProvider>
        </Suspense>
    </StrictMode>,
)
